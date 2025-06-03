"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import NavbarHome from "@/components/NavbarHome";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { app } from "@/lib/firebase";

export default function FaceRegistrationPage() {
  const [captured, setCaptured] = useState(false);
  const [loadingStage, setLoadingStage] = useState("");
  const [message, setMessage] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const router = useRouter();
  const [user, setUser] = useState({ nim: "" });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const pending = JSON.parse(localStorage.getItem("pending_register"));
    if (pending) {
      setUser(pending);
    } else {
      setMessage("❌ Tidak ditemukan data pendaftaran.");
    }
  }, []);

  useEffect(() => {
  const loadCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("❌ Gagal memuat kamera:", error);
      setMessage("❌ Gagal memuat kamera.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  // ⛔ Stop kamera jika user klik tombol BACK (tanpa delay!)
  const handlePopState = () => {
    stopCamera();
  };

  // ⛔ Stop kamera jika user pindah tab
  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopCamera();
    }
  };

  loadCamera();

  // ✅ Pasang listener
  window.addEventListener("popstate", handlePopState);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", stopCamera);

  return () => {
    stopCamera(); // ⛔ Pastikan stop saat unmount juga
    window.removeEventListener("popstate", handlePopState);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", stopCamera);
  };
}, []);


  const handleCaptureFrontPose = async () => {
    if (!videoRef.current || !user.nim) return;

    const MAX_IMAGES = 20; // ❗ Sesuaikan dengan limit backend

    setLoadingStage("capture");
    setMessage(`📸 Mengambil ${MAX_IMAGES} gambar wajah dengan pose FRONT...`);

    const formData = new FormData();
    formData.append("nim", user.nim);

    for (let i = 0; i < MAX_IMAGES; i++) {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 160;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, 160, 160);

      await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            formData.append("images", blob, `front_${i + 1}.jpg`);
          }
          resolve();
        }, "image/jpeg");
      });

      await new Promise((res) => setTimeout(res, 200)); // Delay antara capture
    }

    try {
      const response = await fetch(
        "https://exciting-thankfully-bluegill.ngrok-free.app/register-face",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage(`✅ ${result.uploaded_count} gambar berhasil diunggah.`);
        setCaptured(true);
      } else {
        setMessage(`❌ Gagal upload: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Upload error:", error);
      setMessage("❌ Gagal mengunggah ke server.");
    } finally {
      setLoadingStage("");
    }

    setLoadingStage("training");
    setMessage("🧠 Melatih model...");
    //
    try {
      const response = await fetch(
        "https://exciting-thankfully-bluegill.ngrok-free.app/train-model",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `nim=${encodeURIComponent(user.nim)}`,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Training failed");
      }

      const result = await response.json();
      setMessage(result.message || "✅ Model selesai dilatih.");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const pending = JSON.parse(localStorage.getItem("pending_register"));
      if (pending) {
        const auth = getAuth(app);
        const db = getFirestore(app);

        const daftarRes = await fetch("/api/daftar-mahasiswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nim: pending.nim,
            name: pending.name,
            email: pending.email,
            password: pending.password,
          }),
        });

        const daftarResult = await daftarRes.json();

        if (!daftarRes.ok) {
          setMessage(`❌ Gagal simpan data: ${daftarResult.error}`);
        } else {
          setMessage(
            "✅ Pendaftaran berhasil. Mengarahkan ke halaman login..."
          );
        }

        Cookies.set(
          "session_mahasiswa",
          JSON.stringify({
            isLoggedIn: true,
            nim: pending.nim,
            name: pending.name,
            email: pending.email,
          })
        );

        localStorage.removeItem("pending_register");
      }

      setTimeout(() => {
        // Clear all storage and cookies
        localStorage.clear();
        sessionStorage.clear();
        Object.keys(Cookies.get()).forEach(function (cookieName) {
          Cookies.remove(cookieName);
        });

        // Redirect
        router.push("/mahasiswa/login");
      }, 3000);
    } catch (error) {
      console.error("Training error:", error);
      setMessage(`❌ Gagal training: ${error.message}`);
    } finally {
      setLoadingStage("");
    }
  };

  const renderLoading = () => {
    if (!loadingStage) return null;

    const text =
      loadingStage === "capture"
        ? "📸 Mengambil gambar wajah..."
        : "🧠 Sedang melatih model...";

    return (
      <div className="text-center mt-4 flex flex-col items-center gap-2 text-blue-600 font-medium">
        <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p>{text}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <NavbarHome
        isLoggedIn={true}
        userData={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="h-[40vh] bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 pt-24 flex flex-col justify-center items-center text-white">
        <h1 className="text-3xl sm:text-4xl font-bold">Pendaftaran Wajah</h1>
      </div>

      <main className="flex flex-col items-center justify-center py-12 px-6 bg-white">
        <div className="max-w-xl w-full bg-gray-50 border border-gray-200 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Kamera Langsung
          </h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-[400px] object-cover bg-black rounded"
          />

          {!captured && (
            <div className="text-center mt-4 space-y-2">
              <p className="font-medium text-gray-600">
                Pose yang diminta: <strong>FRONT</strong> (menghadap depan)
              </p>
              <button
                onClick={handleCaptureFrontPose}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
              >
                Ambil 20 Gambar Wajah
              </button>
            </div>
          )}

          {renderLoading()}

          {message && (
            <p
              className={`text-center mt-4 font-medium ${
                message.startsWith("❌") ? "text-red-600" : "text-green-600"
              }`}
            >
              {/* {message} */}
              <p
                className={`text-center mt-4 font-medium ${
                  message.startsWith("❌") ? "text-red-600" : "text-green-600"
                }`}
              >
                {message}
              </p>
            </p>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
