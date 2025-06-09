import os
import json
import numpy as np
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS
from mtcnn import MTCNN
import mediapipe as mp
import cv2
import traceback
from sklearn.neighbors import KNeighborsClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from scipy.spatial.distance import cosine, euclidean
from collections import defaultdict
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime
from deepface import DeepFace

from flask_cors import CORS, cross_origin

import firebase_admin
from firebase_admin import credentials, storage
from io import BytesIO
import tempfile

# Flask setup
app = Flask(__name__)
# Aktivasi CORS secara global untuk semua route
CORS(app, resources={r"/*": {"origins": "*"}})

# Path setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
MODEL_DIR = os.path.join(BASE_DIR, "models")
EMBEDDING_DIR = os.path.join(BASE_DIR, "embeddings")
TRAINING_LOGS_DIR = os.path.join(BASE_DIR, "training_logs")

os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(EMBEDDING_DIR, exist_ok=True)
os.makedirs(TRAINING_LOGS_DIR, exist_ok=True)

cred = credentials.Certificate(os.path.join(BASE_DIR, "lib", "serviceAccountKey.json"))
firebase_admin.initialize_app(cred, {
    'storageBucket': 'tugas-akhir-c22c5.appspot.com'
})

bucket = storage.bucket()

TMP_DIR = os.path.join(BASE_DIR, "tmp")
os.makedirs(TMP_DIR, exist_ok=True)

# Load face detectors
detector = MTCNN()
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5
)

# Landmark indices for specific facial features
LANDMARK_INDICES = {
    'eyebrows': [70, 63, 105, 66, 107, 336, 296, 334, 293, 300],  # 5 per eyebrow
    'eyes': [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],  # 8 per eye
    'nose': [6, 197, 195, 5, 4, 45, 220, 115],  # 4 for length, 4 for bottom
    'lips': [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317],
    'chin': [200, 199, 175, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21]
}

# Threshold configuration
DEFAULT_THRESHOLD = 0.85
UNKNOWN_THRESHOLD_MULTIPLIER = 1.2  # Multiplier for unknown detection

def save_training_logs(metrics, class_names, confusion_mat, timestamp):
    """Save training logs and visualizations to files"""
    try:
        # Create directory for this training session
        log_dir = os.path.join(TRAINING_LOGS_DIR, timestamp)
        os.makedirs(log_dir, exist_ok=True)
        
        # Save metrics to JSON
        metrics_path = os.path.join(log_dir, "metrics.json")
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        # Save confusion matrix visualization
        plt.figure(figsize=(15, 15))
        sns.heatmap(confusion_mat, annot=True, fmt='d', cmap='Blues', 
                    xticklabels=class_names, yticklabels=class_names)
        plt.title('Confusion Matrix')
        plt.ylabel('True Label')
        plt.xlabel('Predicted Label')
        plt.xticks(rotation=90)
        plt.yticks(rotation=0)
        plt.tight_layout()
        confusion_matrix_path = os.path.join(log_dir, "confusion_matrix.png")
        plt.savefig(confusion_matrix_path)
        plt.close()
        
        # Save precision-recall curve
        plt.figure(figsize=(10, 8))
        plt.plot(metrics['recall_list'], metrics['precision_list'], marker='.')
        plt.xlabel('Recall')
        plt.ylabel('Precision')
        plt.title('Precision-Recall Curve')
        plt.grid(True)
        pr_curve_path = os.path.join(log_dir, "precision_recall_curve.png")
        plt.savefig(pr_curve_path)
        plt.close()
        
        # Save confidence distributions
        plt.figure(figsize=(12, 6))
        plt.subplot(1, 2, 1)
        plt.hist(metrics['confidence_scores'], bins=20, alpha=0.7)
        plt.title('Confidence Score Distribution')
        plt.xlabel('Confidence')
        plt.ylabel('Count')
        
        plt.subplot(1, 2, 2)
        plt.scatter(metrics['confidence_scores'], metrics['precision_list'], alpha=0.5)
        plt.title('Precision vs Confidence')
        plt.xlabel('Confidence')
        plt.ylabel('Precision')
        plt.tight_layout()
        confidence_path = os.path.join(log_dir, "confidence_distributions.png")
        plt.savefig(confidence_path)
        plt.close()
        
        # Save metrics summary
        summary_path = os.path.join(log_dir, "summary.txt")
        with open(summary_path, 'w') as f:
            f.write(f"Training Summary - {timestamp}\n")
            f.write("="*50 + "\n")
            f.write(f"Number of classes: {metrics['num_classes']}\n")
            f.write(f"Optimal K value: {metrics['optimal_k']}\n")
            f.write(f"Accuracy: {metrics['accuracy']:.4f}\n")
            f.write(f"Precision (macro): {metrics['precision']:.4f}\n")
            f.write(f"Recall (macro): {metrics['recall']:.4f}\n")
            f.write(f"F1 Score (macro): {metrics['f1_score']:.4f}\n")
            f.write("\nClass-wise metrics:\n")
            for i, class_name in enumerate(class_names):
                f.write(f"{class_name}:\n")
                f.write(f"  Precision: {metrics['class_precision'][i]:.4f}\n")
                f.write(f"  Recall: {metrics['class_recall'][i]:.4f}\n")
                f.write(f"  F1: {metrics['class_f1'][i]:.4f}\n")
        
        print(f"[TRAINING] Saved training logs to {log_dir}")
    except Exception as e:
        print(f"[ERROR] Failed to save training logs: {str(e)}")

def normalize_face(face_img):
    face_img = cv2.cvtColor(face_img, cv2.COLOR_RGB2GRAY)
    face_img = cv2.equalizeHist(face_img)
    face_img = cv2.normalize(face_img, None, 0, 255, cv2.NORM_MINMAX)
    return cv2.cvtColor(face_img, cv2.COLOR_GRAY2RGB)

def extract_face_embedding(face_img):
    """
    Menggunakan FaceNet sebagai extractor.
    Input: numpy array RGB gambar wajah.
    Output: vektor embedding (128-dim) atau None jika gagal.
    """
    try:
        # Gunakan FaceNet sebagai model
        result = DeepFace.represent(
            img_path=face_img,
            model_name="Facenet",
            detector_backend="skip",  # Skip deteksi ulang karena sudah pakai MTCNN
            enforce_detection=False,
            align=True
        )
        
        # Pastikan result adalah list dan ambil embedding pertama
        if isinstance(result, list):
            embedding = result[0]['embedding']
        else:
            embedding = result['embedding']
            
        return np.array(embedding)
    except Exception as e:
        print(f"[ERROR] Failed to extract face embedding: {e}")
        return None

def calculate_dynamic_threshold(embeddings):
    """Calculate dynamic threshold based on average distances between embeddings"""
    if len(embeddings) < 2:
        return DEFAULT_THRESHOLD
    
    distances = []
    for i in range(len(embeddings)):
        for j in range(i+1, len(embeddings)):
            # Pastikan embeddings[i] dan embeddings[j] adalah numpy array 1D
            emb1 = np.array(embeddings[i]).flatten()
            emb2 = np.array(embeddings[j]).flatten()
            dist = cosine(emb1, emb2)
            distances.append(dist)
    
    if not distances:
        return DEFAULT_THRESHOLD
    
    mean_dist = np.mean(distances)
    std_dist = np.std(distances)
    
    # Dynamic threshold formula
    threshold = mean_dist + (std_dist * 1.5)
    return max(threshold, DEFAULT_THRESHOLD)

def save_embeddings(nim, embeddings):
    # Simpan embeddings array
    emb_buffer = BytesIO()
    np.save(emb_buffer, embeddings)
    emb_buffer.seek(0)
    blob = bucket.blob(f"embeddings/{nim}.npy")
    blob.upload_from_file(emb_buffer, content_type='application/octet-stream')

    # Simpan threshold
    threshold = calculate_dynamic_threshold(embeddings)
    th_buffer = BytesIO()
    np.save(th_buffer, threshold)
    th_buffer.seek(0)
    threshold_blob = bucket.blob(f"embeddings/threshold_{nim}.npy")
    threshold_blob.upload_from_file(th_buffer, content_type='application/octet-stream')

    # Simpan rata-rata embedding
    avg_embedding = np.mean(embeddings, axis=0)
    avg_buffer = BytesIO()
    np.save(avg_buffer, avg_embedding)
    avg_buffer.seek(0)
    avg_blob = bucket.blob(f"embeddings/avg_{nim}.npy")
    avg_blob.upload_from_file(avg_buffer, content_type='application/octet-stream')




def load_user_data():
    user_data = {}
    for blob in bucket.list_blobs(prefix="embeddings/"):
        if blob.name.startswith("embeddings/avg_") and blob.name.endswith(".npy"):
            nim = blob.name.split("/")[-1][4:-4]
            avg_blob = bucket.blob(f"embeddings/avg_{nim}.npy")
            threshold_blob = bucket.blob(f"embeddings/threshold_{nim}.npy")
            avg_embedding = np.load(BytesIO(avg_blob.download_as_bytes()))
            threshold = np.load(BytesIO(threshold_blob.download_as_bytes()))
            user_data[nim] = {
                "avg_embedding": avg_embedding,
                "threshold": threshold
            }
    return user_data  # <-- PENTING!



def get_optimal_k(n_classes):
    """
    Menghitung nilai k optimal berdasarkan jumlah label (kelas)
    """
    if n_classes <= 4:
        return 4
    elif n_classes <= 10:
        return 6
    elif n_classes <= 20:
        return 8
    elif n_classes <= 25:
        return 10
    else:
        # Untuk >25 label, gunakan rumus fleksibel
        return min(12, int(n_classes * 0.4))
    
@app.route("/register-face", methods=["POST"])
@cross_origin(origins="*", methods=["POST", "OPTIONS"], allow_headers="*")
def register_face():
    images = request.files.getlist("images")
    nim = request.form.get("nim")
    pose = request.form.get("pose", "front")

    if not images or not nim:
        return jsonify({"error": "Images or NIM missing"}), 400

    path = os.path.join(DATASET_DIR, nim)
    os.makedirs(path, exist_ok=True)

    success_count = 0
    failed_count = 0
    feedback = []
    embeddings = []

    for i, image in enumerate(images):
        try:
            if success_count >= 20:  # Limit to 20 images
                feedback.append({"index": i+1, "filename": image.filename, "status": "skipped_max_reached"})
                continue

            img = Image.open(image.stream)
            img_array = np.array(img)
            
            # Detect face with MTCNN
            results = detector.detect_faces(img_array)
            if not results:
                failed_count += 1
                feedback.append({"index": i+1, "filename": image.filename, "status": "face_not_detected"})
                continue
                
            # Get largest face
            largest_face = max(results, key=lambda x: x['box'][2] * x['box'][3])
            x, y, w, h = largest_face['box']
            
            # Add margin
            margin = 0.2
            x = max(0, x - int(w * margin))
            y = max(0, y - int(h * margin))
            w = min(img_array.shape[1] - x, w + int(w * margin * 2))
            h = min(img_array.shape[0] - y, h + int(h * margin * 2))
            
            # Crop face
            face_img = img_array[y:y+h, x:x+w]
            face_img = normalize_face(face_img) 
            
            # Process with MediaPipe for landmarks
            features = extract_face_embedding(face_img)
            if features is None:
                failed_count += 1
                feedback.append({"index": i+1, "filename": image.filename, "status": "landmarks_not_detected"})
                continue
            
            # Save the cropped face
            filename = f"{pose}_{success_count+1}.jpg"
            full_path = os.path.join(path, filename)
            img_bytes = BytesIO()
            Image.fromarray(face_img).save(img_bytes, format='JPEG')
            blob = bucket.blob(f"dataset/{nim}/{filename}")
            blob.upload_from_string(img_bytes.getvalue(), content_type='image/jpeg')
            
            # Store features
            embeddings.append(features)
            success_count += 1
            feedback.append({"index": i+1, "filename": filename, "status": "success"})
            
        except Exception as e:
            failed_count += 1
            feedback.append({"index": i+1, "filename": image.filename, "status": f"error: {str(e)}"})

    if success_count < 10:  # Minimum 10 images required
        return jsonify({
            "error": f"Minimum 10 images required (got {success_count})",
            "details": feedback
        }), 400

    # Save embeddings and calculate thresholds
    save_embeddings(nim, embeddings)

    return jsonify({
        "message": f"Registered {success_count} images for {nim}",
        "uploaded_count": success_count,
        "skipped_count": failed_count,
        "details": feedback
    }), 200

@app.route("/train-model", methods=["POST"])
@cross_origin(origins="*", methods=["POST", "OPTIONS"], allow_headers="*")
def train_model():
    try:
        # Collect all user embeddings
        user_data = load_user_data()
        if not user_data:
            return jsonify({"error": "No registered users found"}), 400
            
        # Prepare data for KNN
        X = []
        y = []
        
        for nim, data in user_data.items():
            try:
                blob = bucket.blob(f"embeddings/{nim}.npy")
                if not blob.exists():
                    print(f"[WARNING] embeddings/{nim}.npy not found in Firebase — skipping")
                    continue

                embedding_data = np.load(BytesIO(blob.download_as_bytes()))
                X.extend(embedding_data)
                y.extend([nim] * len(embedding_data))
            except Exception as e:
                print(f"[ERROR] Failed to load embedding for {nim}: {e}")


        if len(X) < 10:  # At least 10 samples total
            return jsonify({"error": "Not enough training data"}), 400
            
        # Encode labels
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        class_names = le.classes_
        
        # Train KNN model
        X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)

        # Dapatkan nilai k berdasarkan jumlah label
        n_classes = len(le.classes_)
        optimal_k = get_optimal_k(n_classes)
        
        knn = KNeighborsClassifier(n_neighbors=optimal_k, weights='distance', metric='cosine')
        knn.fit(X_train, y_train)
        
        # Evaluate
        y_pred = knn.predict(X_test)
        y_proba = knn.predict_proba(X_test)
        confidence_scores = np.max(y_proba, axis=1)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, average='macro')
        recall = recall_score(y_test, y_pred, average='macro')
        f1 = f1_score(y_test, y_pred, average='macro')
        
        # Class-wise metrics
        class_precision = precision_score(y_test, y_pred, average=None)
        class_recall = recall_score(y_test, y_pred, average=None)
        class_f1 = f1_score(y_test, y_pred, average=None)
        
        # Confusion matrix
        confusion_mat = confusion_matrix(y_test, y_pred)
        
        # Precision-recall values for curve
        precision_list = []
        recall_list = []
        thresholds = np.linspace(0, 1, 20)
        for threshold in thresholds:
            y_pred_thresh = np.where(y_proba.max(axis=1) >= threshold, y_proba.argmax(axis=1), -1)
            mask = y_pred_thresh != -1
            if sum(mask) > 0:
                precision_list.append(precision_score(y_test[mask], y_pred_thresh[mask], average='macro'))
                recall_list.append(recall_score(y_test[mask], y_pred_thresh[mask], average='macro'))
            else:
                precision_list.append(0)
                recall_list.append(0)
        
        # Prepare metrics dictionary
        metrics = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'class_precision': class_precision.tolist(),
            'class_recall': class_recall.tolist(),
            'class_f1': class_f1.tolist(),
            'num_classes': n_classes,
            'optimal_k': optimal_k,
            'confidence_scores': confidence_scores.tolist(),
            'precision_list': precision_list,
            'recall_list': recall_list,
            'thresholds': thresholds.tolist()
        }
        
        # Save model and label encoder
        model_path = os.path.join(MODEL_DIR, "knn_model.pkl")
        le_path = os.path.join(MODEL_DIR, "label_encoder.pkl")
        
        def upload_model_to_firebase(obj, path):
            with tempfile.NamedTemporaryFile(delete=False) as temp_file:
                joblib.dump(obj, temp_file.name)
                blob = bucket.blob(path)
                blob.upload_from_filename(temp_file.name)

        upload_model_to_firebase(knn, "models/knn_model.pkl")
        upload_model_to_firebase(le, "models/label_encoder.pkl")
        upload_model_to_firebase(user_data, "models/user_data.pkl")

        
        # Save user data (averages and thresholds)
        user_data_path = os.path.join(MODEL_DIR, "user_data.pkl")

        
        # Save training logs with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_training_logs(metrics, class_names, confusion_mat, timestamp)
        
        return jsonify({
            "message": "KNN model trained successfully",
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "num_classes": n_classes,
            "class_names": class_names.tolist(),
            "optimal_k": optimal_k,
            "log_timestamp": timestamp
        }), 200
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "error": "Model training failed",
            "details": str(e),
            "traceback": traceback.format_exc()
        }), 500

@app.route("/recognize-face", methods=["POST"])
@cross_origin(origins="*", methods=["POST", "OPTIONS"], allow_headers="*")
def recognize_face():
    if 'image' not in request.files:
        return jsonify({"error": "Image missing"}), 400
    
    image = request.files['image']
    
    try:
        print("[DEBUG] Starting face recognition process")
        
        # Load image
        img = Image.open(image.stream)
        img_array = np.array(img)
        print("[DEBUG] Image loaded successfully")
        
        # Detect face with MTCNN
        print("[DEBUG] Detecting face with MTCNN")
        results = detector.detect_faces(img_array)
        if not results:
            print("[DEBUG] No faces detected")
            return jsonify({"error": "No face detected"}), 400
            
        # Get largest face
        largest_face = max(results, key=lambda x: x['box'][2] * x['box'][3])
        x, y, w, h = largest_face['box']
        print(f"[DEBUG] Face detected at ({x},{y}) with size {w}x{h}")
        
        # Add margin
        margin = 0.2
        x = max(0, x - int(w * margin))
        y = max(0, y - int(h * margin))
        w = min(img_array.shape[1] - x, w + int(w * margin * 2))
        h = min(img_array.shape[0] - y, h + int(h * margin * 2))
        print(f"[DEBUG] After margin - Position: ({x},{y}), Size: {w}x{h}")
        
        # Crop face
        face_img = img_array[y:y+h, x:x+w]
        face_img = normalize_face(face_img)
        print("[DEBUG] Face cropped successfully")
        
        # Extract features
        print("[DEBUG] Extracting facial landmarks")
        features = extract_face_embedding(face_img)
        if features is None:
            print("[DEBUG] Failed to extract facial landmarks")
            return jsonify({"error": "Could not extract facial landmarks"}), 400
        print(f"[DEBUG] Landmarks extracted - Feature vector length: {len(features)}")
            
        # Load model and user data
        print("[DEBUG] Loading recognition models")
        model_path = os.path.join(MODEL_DIR, "knn_model.pkl")
        le_path = os.path.join(MODEL_DIR, "label_encoder.pkl")
        user_data_path = os.path.join(MODEL_DIR, "user_data.pkl")
        
        if not os.path.exists(model_path):
            print(f"[ERROR] Model not found at {model_path}")
            return jsonify({"error": "Model not trained yet"}), 404
        if not os.path.exists(le_path):
            print(f"[ERROR] Label encoder not found at {le_path}")
            return jsonify({"error": "Label encoder missing"}), 404
        if not os.path.exists(user_data_path):
            print(f"[ERROR] User data not found at {user_data_path}")
            return jsonify({"error": "User data missing"}), 404
            
        def load_model_from_firebase(path):
            blob = bucket.blob(path)
            return joblib.load(BytesIO(blob.download_as_bytes()))

        knn = load_model_from_firebase("models/knn_model.pkl")
        le = load_model_from_firebase("models/label_encoder.pkl")
        user_data = load_model_from_firebase("models/user_data.pkl")

        print("[DEBUG] Models loaded successfully")
        
        # Get KNN prediction
        print("[DEBUG] Making KNN prediction")
        try:
            distances, indices = knn.kneighbors([features], n_neighbors=5)
            proba = knn.predict_proba([features])[0]
            pred_class_idx = np.argmax(proba)
            confidence = float(proba[pred_class_idx])  # Convert to Python float
            pred_label = le.inverse_transform([pred_class_idx])[0]
            print(f"[DEBUG] KNN prediction: {pred_label} with confidence {confidence:.2f}")
        except Exception as e:
            print(f"[ERROR] KNN prediction failed: {str(e)}")
            return jsonify({"error": "Prediction failed", "details": str(e)}), 500
        
        # Verify against user data
        print("[DEBUG] Verifying against user data")
        try:
            if pred_label not in user_data:
                print(f"[ERROR] Predicted user {pred_label} not in user data")
                return jsonify({
                    "success": True,  # Changed to True since this is a valid result
                    "match": False,
                    "message": "Unknown user predicted"
                }), 200
                
            user_threshold = float(user_data[pred_label]['threshold'])  # Convert to Python float
            avg_embedding = user_data[pred_label]['avg_embedding']
            
            # Calculate distances
            cosine_dist = float(cosine(features, avg_embedding))  # Convert to Python float
            euclidean_dist = float(euclidean(features, avg_embedding))  # Convert to Python float
            print(f"[DEBUG] Distances - Cosine: {cosine_dist:.2f}, Euclidean: {euclidean_dist:.2f}, Threshold: {user_threshold:.2f}")
            
            # Dynamic verification with stricter conditions
            is_verified = bool(cosine_dist < (user_threshold * 0.8))  # Stricter threshold (80% of original)
            
            # Additional check - confidence must be > 0.7 and distance < threshold
            is_verified = is_verified and (confidence > 0.85)
            
            print(f"[DEBUG] Verification result: {'MATCH' if is_verified else 'NO MATCH'}")
            
            response = {
                "success": True,
                "match": bool(is_verified),  # Convert to Python bool
                "predicted_label": pred_label if is_verified else None,
                "confidence": confidence,
                "cosine_distance": cosine_dist,
                "euclidean_distance": euclidean_dist,
                "user_threshold": user_threshold,
                "message": "Face recognized successfully" if is_verified else "Face not recognized"
            }
            
            return jsonify(response), 200
            
        except Exception as e:
            print(f"[ERROR] Verification failed: {str(e)}")
            return jsonify({
                "success": False,
                "error": "Verification failed",
                "details": str(e)
            }), 500
            
    except Exception as e:
        print(f"[CRITICAL] Unhandled exception: {str(e)}")
        traceback.print_exc()
        return jsonify({
            "success": False,
            "error": "Face recognition failed",
            "details": str(e),
            "traceback": traceback.format_exc()
        }), 500

if __name__ == "__main__":
    app.run(debug=False, use_reloader=False, port=8000)