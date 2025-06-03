"use client";

import { useEffect, useRef, useState } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString } from "firebase/storage";
import NavbarMahasiswaCourse from "@/components/NavbarMahasiswaCourse";
import SidebarMahasiswa from "@/components/SidebarMahasiswa";
import HeaderMahasiswaCourse from "@/components/HeaderMahasiswaCourse";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Webcam from "react-webcam";

const allowedZones = [
  {
    name: "Gedung Dewi Sartika UPNVJ",
    lat: -6.31628,
    lng: 106.79463,
    radius: 70,
  },
  {
    name: "Fakultas Ilmu Komputer UPNVJ",
    lat: -6.31605,
    lng: 106.79496,
    radius: 70,
  },
];

const AbsensiDetail = ({ params }) => {
  const router = useRouter();
  const webcamRef = useRef(null);

  const namaMataKuliah = decodeURIComponent(params.namaMataKuliah || "");
  const pertemuanId = decodeURIComponent(params.pertemuanId || "");
  const idAbsensi = decodeURIComponent(params.idAbsensi || "");

  const [absensi, setAbsensi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusPresensi, setStatusPresensi] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userNIM, setUserNIM] = useState(null);
  const [isInCampus, setIsInCampus] = useState(false);
  const [lokasiStatus, setLokasiStatus] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const allowAllLocations = false;
  const [userLocation, setUserLocation] = useState({
    lat: null,
    lng: null,
    address: "",
  });
  const [isExpired, setIsExpired] = useState(false);
  const [checkingIP, setCheckingIP] = useState(false);
  const [wifiStatus, setWifiStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [address, setAddress] = useState("");
  const [useCampusWifi, setUseCampusWifi] = useState(false);
  const [metodePresensi, setMetodePresensi] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUseWifi = () => {
    setUseCampusWifi(true);
    handleCheckWifi();
  };

  useEffect(() => {
    const cookie = Cookies.get("session_mahasiswa");
    if (cookie) {
      try {
        const parsed = JSON.parse(cookie);
        setUserNIM(parsed.nim);
      } catch {}
    }
  }, []);

  const handleCheckWifi = async () => {
    setCheckingIP(true);
    setWifiStatus(null);
    try {
      const res = await fetch("/api/get-client-ip");
      const data = await res.json();
      const userIP = data.ip;

      const ipValid = ipInSubnet(userIP, "111.95.16.0", 24);

      if (ipValid) {
        setIsInCampus(true);
        setWifiStatus(
          `📍 Terdeteksi IP WiFi kampus (${userIP}). Anda terhubung WiFi kampus.`
        );
      } else {
        setWifiStatus(`❌ IP publik Anda (${userIP}) bukan IP WiFi kampus.`);
      }
    } catch {
      setWifiStatus("❌ Gagal memeriksa IP publik WiFi kampus.");
    } finally {
      setCheckingIP(false);
    }
  };

  const ipInSubnet = (ip, subnet, mask) => {
    const ipToNum = (ip) =>
      ip.split(".").reduce((acc, oct) => (acc << 8) + parseInt(oct, 10), 0) >>>
      0;
    const ipNum = ipToNum(ip);
    const subnetNum = ipToNum(subnet);
    const maskNum = ~((1 << (32 - mask)) - 1) >>> 0;

    return (ipNum & maskNum) === (subnetNum & maskNum);
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLokasiStatus("❌ Geolocation tidak tersedia di perangkat ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setUserLocation({ lat: userLat, lng: userLng, address: "" });
        console.log("📍 Lokasi pengguna:", {
          latitude: userLat,
          longitude: userLng,
        });

        const toRad = (deg) => (deg * Math.PI) / 180;
        const R = 6371e3;
        let foundZone = null;

        for (let zone of allowedZones) {
          const dLat = toRad(userLat - zone.lat);
          const dLng = toRad(userLng - zone.lng);
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(zone.lat)) *
              Math.cos(toRad(userLat)) *
              Math.sin(dLng / 2) ** 2;
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = R * c;

          if (distance <= zone.radius) {
            foundZone = zone.name;
            break;
          }
        }

        const apiKey = process.env.NEXT_PUBLIC_GEOCODING_API_KEY;
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${userLat}+${userLng}&key=${apiKey}`
          );
          const data = await response.json();
          const formattedAddress = data.results?.[0]?.formatted || "";
          setAddress(formattedAddress);

          if (allowAllLocations) {
            setIsInCampus(true);
            setLokasiStatus(
              "📍 Mode bebas lokasi diaktifkan. Anda diizinkan presensi dari manapun."
            );
          } else if (foundZone) {
            setIsInCampus(true);
            setLokasiStatus(`📍 Anda berada di area ${foundZone}`);
          } else {
            setIsInCampus(false);
            setLokasiStatus("❌ Anda tidak berada di area kampus.");
          }
        } catch (error) {
          setIsInCampus(!!foundZone);
          setLokasiStatus(
            foundZone
              ? `📍 Anda berada di area ${foundZone}`
              : "❌ Anda tidak berada di area kampus."
          );
        }
      },
      () => {
        setLokasiStatus("❌ Gagal membaca lokasi.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [allowAllLocations]);

  useEffect(() => {
    const fetchAbsensi = async () => {
      try {
        const absensiRef = doc(
          db,
          "mataKuliah",
          namaMataKuliah,
          "Pertemuan",
          pertemuanId,
          "Absensi",
          idAbsensi
        );
        const absensiDoc = await getDoc(absensiRef);
        if (absensiDoc.exists()) {
          const absensiData = absensiDoc.data();
          setAbsensi(absensiData);

          // Timer
          const now = new Date();

          if (!absensiData.expiredAt) {
            // Tidak ada waktu kadaluarsa
            setIsExpired(false);
            setTimeLeft(null); // atau set text khusus
          } else {
            const expired = new Date(absensiData.expiredAt);
            const remaining = expired - now;

            if (remaining <= 0) {
              setIsExpired(true);
            } else {
              setTimeLeft(remaining);
              const interval = setInterval(() => {
                const diff = new Date(absensiData.expiredAt) - new Date();
                if (diff <= 0) {
                  clearInterval(interval);
                  setIsExpired(true);
                  setTimeLeft(0);
                } else {
                  setTimeLeft(diff);
                }
              }, 1000);
              return () => clearInterval(interval);
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data absensi:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userNIM) fetchAbsensi();
  }, [userNIM, namaMataKuliah, pertemuanId, idAbsensi]);

  useEffect(() => {
    const fetchMahasiswaStatus = async () => {
      if (!userNIM || !absensi) return;

      try {
        const studentRef = doc(
          db,
          "mataKuliah",
          namaMataKuliah,
          "Pertemuan",
          pertemuanId,
          "Absensi",
          idAbsensi,
          "Mahasiswa",
          userNIM
        );
        const studentDoc = await getDoc(studentRef);
        if (studentDoc.exists()) {
          const data = studentDoc.data();
          setStatusPresensi(data.status === "hadir" ? "Hadir" : "Tidak Hadir");
          setMetodePresensi(data.presensiMethod || "-");
        }
      } catch (error) {
        console.error("Gagal mengambil status mahasiswa:", error);
      }
    };

    fetchMahasiswaStatus();
  }, [userNIM, absensi, namaMataKuliah, pertemuanId, idAbsensi]);

  const saveAttendance = () => {
    setShowCamera(true);
  };

  const handleCapture = async () => {
  if (!webcamRef.current || statusPresensi) {
    alert("Anda sudah melakukan presensi.");
    return;
  }

  const imageSrc = webcamRef.current.getScreenshot();
  if (!imageSrc) return;

  setIsUploading(true);

  try {
    const timestamp = Date.now();
    sessionStorage.setItem("ruanganImage", imageSrc);
    sessionStorage.setItem("useCampusWifi", useCampusWifi ? "true" : "false");

    // Pindah TANPA simpan apapun ke Firebase
    router.push(
      `/mahasiswa/face-recognition?matkul=${encodeURIComponent(
        namaMataKuliah
      )}&pertemuan=${encodeURIComponent(pertemuanId)}&absensi=${encodeURIComponent(
        idAbsensi
      )}&metode=${useCampusWifi ? "wifi" : isInCampus ? "lokasi" : "langsung"}`
    );
  } catch (error) {
    alert("❌ Gagal memproses.");
    console.error("❌ Error:", error);
    setIsUploading(false);
  }
};


  if (loading) return <div className="p-8">Loading...</div>;

  if (isUploading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white text-blue-600">
        <svg
          className="animate-spin h-10 w-10 mb-4 text-blue-600"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
        <p className="text-lg font-semibold">
          Menyimpan dan mengarahkan ke halaman Face Recognition...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <SidebarMahasiswa
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      <div
        className="transition-all duration-300 ease-in-out"
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        <NavbarMahasiswaCourse
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <HeaderMahasiswaCourse
          title={`2024 GANJIL | ${namaMataKuliah.toUpperCase()}`}
          path={[
            "Dashboard",
            "Courses",
            "2024/2025 Ganjil",
            namaMataKuliah,
            "Detail Absensi",
          ]}
        />

        <main className="flex-1 p-8 bg-gray-50">
          <section className="container mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Detail Absensi
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="py-3 px-6 text-left">Tanggal</th>
                    <th className="py-3 px-6 text-left">Mata Kuliah</th>
                    <th className="py-3 px-6 text-left">Status</th>
                    <th className="py-3 px-6 text-left">Poin</th>
                    <th className="py-3 px-6 text-left">Keterangan</th>
                    <th className="py-3 px-6 text-left">Metode</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  <tr className="border-t">
                    <td className="py-4 px-6">{absensi?.date || "-"}</td>
                    <td className="py-4 px-6">{namaMataKuliah}</td>
                    <td className="py-4 px-6 font-semibold">
                      {statusPresensi || "-"}
                    </td>
                    <td className="py-4 px-6">
                      {statusPresensi === "Hadir" ? "100" : "0"}
                    </td>
                    <td className="py-4 px-6">
                      {statusPresensi === "Hadir"
                        ? "Presensi Berhasil"
                        : statusPresensi === "Tidak Hadir"
                        ? "Tidak Hadir"
                        : "-"}
                    </td>
                    <td className="py-4 px-6 capitalize">
                      {metodePresensi || "-"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {timeLeft !== null && !isExpired && (
              <div className="text-blue-600 font-medium mb-2">
                ⏳ Waktu tersisa: {Math.floor(timeLeft / 60000)} menit{" "}
                {Math.floor((timeLeft % 60000) / 1000)} detik
              </div>
            )}

            {isExpired && (
              <div className="text-red-600 font-medium mb-2">
                ❌ Tidak bisa presensi. Waktu telah habis.
              </div>
            )}

            {!absensi?.expiredAt && (
              <div className="text-blue-600 font-medium mb-2">
                ⏳ Presensi tidak memiliki batas waktu.
              </div>
            )}

            {!statusPresensi && !isExpired ? (
              <div className="flex flex-col items-center mt-6 gap-2">
                {!showCamera ? (
                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        if (useCampusWifi) {
                          // nanti flag ini dipakai saat simpan setelah face recognition
                        }
                        saveAttendance();
                      }}
                      disabled={!isInCampus}
                      className={`px-6 py-2 rounded-md font-semibold ${
                        isInCampus
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      Hadir
                    </button>
                    <button
                      onClick={async () => {
                        const studentRef = doc(
                          db,
                          "mataKuliah",
                          namaMataKuliah,
                          "Pertemuan",
                          pertemuanId,
                          "Absensi",
                          idAbsensi,
                          "Mahasiswa",
                          userNIM
                        );
                        await setDoc(studentRef, {
                          status: "tidak hadir",
                          time: new Date().toISOString(),
                        });

                        setStatusPresensi("Tidak Hadir"); // mengunci UI
                      }}
                      className="px-6 py-2 bg-red-500 text-white rounded-md font-semibold"
                    >
                      Tidak Hadir
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-lg font-semibold mb-2 text-center">
                      📷 Arahkan kamera ke ruangan kelas Anda
                    </p>

                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      width={400}
                      height={300}
                      className="rounded-lg border border-gray-400"
                    />

                    {isUploading ? (
                      <div className="flex items-center gap-2 mt-4 text-blue-600 font-medium">
                        <svg
                          className="animate-spin h-5 w-5 text-blue-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Mengirim foto dan menyimpan data presensi...
                      </div>
                    ) : (
                      <button
                        onClick={handleCapture}
                        className="px-6 py-2 bg-green-500 text-white rounded-md mt-3"
                      >
                        Simpan & Kirim
                      </button>
                    )}
                  </div>
                )}
                {lokasiStatus && (
                  <div
                    className={`text-center font-medium ${
                      isInCampus ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {lokasiStatus}
                  </div>
                )}
                {address && (
                  <div className="text-center font-medium text-gray-700">
                    📍 Alamat lengkap: {address}
                  </div>
                )}

                {/* Tombol cek WiFi kampus, tampil jika di luar area kampus dan tidak sedang cek IP */}
                {!isInCampus && !checkingIP && (
                  <button
                    onClick={handleUseWifi}
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Saya menggunakan WiFi kampus
                  </button>
                )}

                {/* Status cek WiFi */}
                {checkingIP && (
                  <div className="text-blue-600 font-medium mt-2">
                    🔄 Memeriksa koneksi WiFi kampus...
                  </div>
                )}
                {wifiStatus && (
                  <div
                    className={`mt-2 font-medium ${
                      wifiStatus.startsWith("📍")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {wifiStatus}
                  </div>
                )}
              </div>
            ) : (
              statusPresensi && (
                <div className="text-center text-green-600 font-medium mt-6">
                  ✅ Anda sudah melakukan presensi.
                </div>
              )
            )}
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default AbsensiDetail;