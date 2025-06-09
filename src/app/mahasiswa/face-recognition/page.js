"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import Webcam from "react-webcam";
import NavbarMahasiswaCourse from "@/components/NavbarMahasiswaCourse";
import SidebarMahasiswa from "@/components/SidebarMahasiswa";
import HeaderMahasiswaCourse from "@/components/HeaderMahasiswaCourse";
import Footer from "@/components/Footer";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes } from "firebase/storage";

// Komponen utama yang menggunakan useSearchParams
const FaceRecognitionContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const webcamRef = useRef(null);

  // Mengambil query params
  const matkul = searchParams.get("matkul");
  const pertemuan = searchParams.get("pertemuan");
  const absensi = searchParams.get("absensi");
  const metodePresensi = searchParams.get("metode") || "langsung";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userNIM, setUserNIM] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [resultLabel, setResultLabel] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [isMatch, setIsMatch] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState("Lokasi tidak tersedia");
  const [attempts, setAttempts] = useState(0);

  // Mengambil data user dari cookies
  useEffect(() => {
    const cookie = Cookies.get("session_mahasiswa");
    if (cookie) {
      const parsed = JSON.parse(cookie);
      setUserNIM(parsed.nim || null);
      setUserName(parsed.name || null);
      setUserEmail(parsed.email || null);
    }
  }, []);

  // Fungsi untuk mengirim email notifikasi
  const sendEmailNotification = useCallback(async () => {
    const emailData = {
      email: userEmail,
      name: userName,
      matkul: matkul,
      pertemuan: pertemuan,
    };

    try {
      const res = await fetch("/api/send-presence-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      });

      if (!res.ok) {
        console.log("Gagal mengirim notifikasi email.");
      }
    } catch (error) {
      console.error("Error mengirim email:", error);
    }
  }, [userEmail, userName, matkul, pertemuan]);

  // Fungsi untuk mengenali wajah
  const recognizeFace = useCallback(async () => {
    if (
      !webcamRef.current ||
      !webcamRef.current.video ||
      webcamRef.current.video.readyState !== 4
    ) {
      return;
    }

    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return;

    try {
      const blob = await (await fetch(screenshot)).blob();
      const formData = new FormData();
      formData.append("image", blob, "capture.jpg");
      formData.append("nim", userNIM);

      const response = await fetch(
        "https://exciting-thankfully-bluegill.ngrok-free.app/recognize-face",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      const predicted = data?.predicted_label || "Tidak dikenali";
      const conf = data?.confidence
        ? (data.confidence * 100).toFixed(2)
        : "0.00";
      const confidenceNum = parseFloat(conf);
      const match = data?.match || false;
      const isActuallyMatch =
        match && predicted === userNIM && confidenceNum >= 70;

      setResultLabel(predicted);
      setConfidence(conf);
      setIsMatch(isActuallyMatch);
      setHasScanned(true);
      setError(null);

      if (isActuallyMatch && !hasSubmitted) {
        await handleSuccessfulRecognition(blob);
      } else if (!isActuallyMatch) {
        handleFailedRecognition();
      }
    } catch (err) {
      console.error("Gagal memproses prediksi:", err);
      setError("Terjadi kesalahan saat memproses wajah.");
      setResultLabel(null);
      setConfidence(0);
      setIsMatch(false);
      setHasScanned(true);
    }
  }, [
    userNIM,
    hasSubmitted,
    matkul,
    pertemuan,
    absensi,
    attempts,
    metodePresensi,
    router,
  ]);

  const handleSuccessfulRecognition = async (blob) => {
    setHasSubmitted(true);
    const timestamp = Date.now();
    const studentRef = doc(
      db,
      "mataKuliah",
      matkul,
      "Pertemuan",
      pertemuan,
      "Absensi",
      absensi,
      "Mahasiswa",
      userNIM
    );

    let finalLocation = "Lokasi tidak tersedia";
    let roomUploaded = false;

    // Upload foto wajah
    const faceRef = ref(
      storage,
      `faces/${matkul}/${pertemuan}/${userNIM}/${userNIM}.jpg`
    );
    await uploadBytes(faceRef, blob);

    // Upload foto ruangan jika ada
    const roomImage = sessionStorage.getItem("ruanganImage");
    if (roomImage) {
      try {
        const roomBlob = await (await fetch(roomImage)).blob();
        const roomRef = ref(
          storage,
          `faces/${matkul}/${pertemuan}/${userNIM}/ruangan/${userNIM}_ruangan.jpg`
        );
        await uploadBytes(roomRef, roomBlob);
        roomUploaded = true;
        sessionStorage.removeItem("ruanganImage");
      } catch (err) {
        console.error("Gagal upload foto ruangan:", err);
      }
    }

    // Dapatkan lokasi
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        try {
          const geoRes = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${process.env.NEXT_PUBLIC_GEOCODING_API_KEY}`
          );
          const geoData = await geoRes.json();
          finalLocation = geoData.results?.[0]?.formatted || finalLocation;
          setLocation(finalLocation);
        } catch (geoErr) {
          console.error("Gagal deteksi alamat:", geoErr);
        }

        // Simpan data presensi
        await setDoc(studentRef, {
          status: "hadir",
          time: new Date().toISOString(),
          location: finalLocation,
          faceFilename: `${timestamp}.jpg`,
          roomFilename: roomUploaded ? `${timestamp}.jpg` : null,
          presensiMethod:
            metodePresensi === "wifi"
              ? "presensi menggunakan wifi kampus"
              : metodePresensi === "lokasi"
              ? "presensi menggunakan lokasi"
              : "presensi langsung",
        });

        // Log response
        const responseLog = {
          status: "Presensi berhasil disimpan",
          student: {
            nim: userNIM,
            faceFilename: `${timestamp}.jpg`,
            roomFilename: roomUploaded ? `${timestamp}.jpg` : null,
            location: finalLocation,
            presensiMethod: metodePresensi, // Menambahkan metode presensi yang sudah didefinisikan
          },
          time: new Date().toISOString(),
        };

        // Log keberhasilan presensi
        console.log("Presensi Log:", JSON.stringify(responseLog, null, 2)); // Log in JSON format

        // Kirim notifikasi email
        await sendEmailNotification();
        alert("Presensi berhasil. Foto tersimpan.");
        router.push(
          `/mahasiswa/absensi/${encodeURIComponent(
            matkul
          )}/${encodeURIComponent(pertemuan)}/${encodeURIComponent(absensi)}`
        );
      },
      (geoError) => {
        console.error("Geolocation gagal:", geoError);
        setLocation("Lokasi tidak tersedia");
      }
    );
  };

  const handleFailedRecognition = () => {
    const newAttempt = attempts + 1;
    setAttempts(newAttempt);

    if (newAttempt < 5) {
      setHasScanned(false);
      setError(`Percobaan ${newAttempt}/5 gagal. Coba lagi!`);
    } else {
      alert("Gagal mencocokan wajah, kembali ke halaman presensi");
      router.push(
        `/mahasiswa/absensi/${encodeURIComponent(matkul)}/${encodeURIComponent(
          pertemuan
        )}/${encodeURIComponent(absensi)}`
      );
    }
  };

  useEffect(() => {
    if (!userNIM || hasScanned || hasSubmitted || attempts >= 5) return;

    const timer = setTimeout(() => {
      recognizeFace();
    }, 3000);

    return () => clearTimeout(timer);
  }, [userNIM, hasScanned, hasSubmitted, attempts, recognizeFace]);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SidebarMahasiswa
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div
        className={`transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-80" : "ml-0"
        }`}
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        <NavbarMahasiswaCourse
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <HeaderMahasiswaCourse
          title="2024 GANJIL | FACE RECOGNITION"
          path={[
            "Dashboard",
            "Courses",
            "2024/2025 Ganjil",
            matkul || "Mata Kuliah",
            "Face Recognition",
          ]}
        />
        <main className="flex-1 p-8 bg-gray-50">
          <section className="container mx-auto bg-white rounded-lg shadow-md p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Scan Wajah Anda
            </h2>
            <div className="relative flex flex-col items-center justify-center mb-6">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                width={400}
                height={300}
                className="rounded-lg border border-gray-300"
              />
              {hasScanned && (
                <p className="text-sm text-gray-700 mt-4">
                  <strong>
                    {isMatch ? `${userNIM} - ${userName}` : "Tidak dikenali"}
                  </strong>{" "}
                  ({confidence}%)
                </p>
              )}
            </div>

            {!hasScanned && (
              <p className="text-gray-500 text-sm">
                Sistem akan membaca wajah Anda secara otomatis...
              </p>
            )}

            {error ? (
              <p className="text-red-500 mt-4">{error}</p>
            ) : hasScanned ? (
              isMatch ? (
                <>
                  <p className="text-green-600 mt-4">
                    ✅ Wajah cocok dengan NIM Anda!
                  </p>
                  <p className="text-sm mt-2 text-gray-600">
                    Lokasi terdeteksi: {location}
                  </p>
                  {parseFloat(confidence) < 80 && (
                    <p className="text-yellow-600 mt-2">
                      ⚠ Confidence rendah, harap pastikan pencahayaan dan posisi
                      wajah optimal.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-red-600 mt-4">
                  ❌ Wajah tidak cocok dengan model!
                </p>
              )
            ) : null}
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
};

// Komponen wrapper dengan Suspense
const FaceRecognitionPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          Memuat...
        </div>
      }
    >
      <FaceRecognitionContent />
    </Suspense>
  );
};

export default FaceRecognitionPage;
