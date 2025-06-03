"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import Image from "next/image";
import NavbarDosen from "@/components/NavbarDosen";

const CourseDetailPage = ({ params }) => {
  const { namaMataKuliah } = params;
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTopicMap, setNewTopicMap] = useState({});
  const [durasiPresensi, setDurasiPresensi] = useState(1);
  const [attendanceData, setAttendanceData] = useState({});

  const decodedNamaMataKuliah = decodeURIComponent(namaMataKuliah);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setIsAuthChecked(true);
      else router.push("/dosen/login");
    });
    return () => unsubscribe();
  }, [router]);

  const fetchCourseData = useCallback(async () => {
    setLoading(true);
    try {
      const courseRef = doc(db, "mataKuliah", decodedNamaMataKuliah);
      const courseDoc = await getDoc(courseRef);

      if (courseDoc.exists()) {
        setCourseData(courseDoc.data());
        const pertemuanRef = collection(courseRef, "Pertemuan");
        const snapshot = await getDocs(pertemuanRef);
        const topicList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTopics(topicList);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
    setLoading(false);
  }, [decodedNamaMataKuliah]);

  const handleCreatePertemuan = async () => {
    try {
      const pertemuanRef = collection(
        db,
        "mataKuliah",
        decodedNamaMataKuliah,
        "Pertemuan"
      );
      const id = `Pertemuan ${topics.length + 1}`;
      await setDoc(doc(pertemuanRef, id), { topic: "" });
      await fetchCourseData();
    } catch (err) {
      console.error("Gagal tambah pertemuan:", err);
    }
  };

  const handleAddTopic = async (id, value) => {
    try {
      const refPertemuan = doc(
        db,
        "mataKuliah",
        decodedNamaMataKuliah,
        "Pertemuan",
        id
      );
      await setDoc(refPertemuan, { topic: value }, { merge: true });

      setTopics((prev) =>
        prev.map((t) => (t.id === id ? { ...t, topic: value } : t))
      );
      setNewTopicMap((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      console.error("Gagal tambah topik:", err);
    }
  };

  const handleCreateAttendance = async (id) => {
    const pertemuan = topics.find((t) => t.id === id);
    if (pertemuan?.idAbsensi) {
      alert("Presensi sudah dibuat: " + pertemuan.idAbsensi);
      return;
    }

    try {
      const now = new Date();
      let expiredAt = null;
      if (durasiPresensi !== "none") {
        expiredAt = new Date(now.getTime() + Number(durasiPresensi) * 60000);
      }

      const waktu = new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(now);

      const absensiId = `absensi-${Date.now()}`;
      const absensiDocRef = doc(
        db,
        "mataKuliah",
        decodedNamaMataKuliah,
        "Pertemuan",
        id,
        "Absensi",
        absensiId
      );

      await setDoc(absensiDocRef, {
        idAbsensi: absensiId,
        isAvailable: true,
        date: waktu,
        createdAt: now.toISOString(),
        expiredAt: expiredAt ? expiredAt.toISOString() : null,
      });

      await setDoc(
        doc(db, "mataKuliah", decodedNamaMataKuliah, "Pertemuan", id),
        { idAbsensi: absensiId },
        { merge: true }
      );

      alert(`Presensi berhasil dibuat!\nID: ${absensiId}`);
      await fetchCourseData();
    } catch (err) {
      console.error("Gagal tambah presensi:", err);
      alert("Gagal membuat presensi.");
    }
  };

  const fetchAttendanceData = useCallback(
    async (pertemuanId, idAbsensi) => {
      try {
        const mahasiswaRef = collection(
          db,
          "mataKuliah",
          decodedNamaMataKuliah,
          "Pertemuan",
          pertemuanId,
          "Absensi",
          idAbsensi,
          "Mahasiswa"
        );
        const snapshot = await getDocs(mahasiswaRef);
        const storage = getStorage();

        const data = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const nim = doc.id;
            const mhsData = doc.data();

            let faceUrl = "/default-face.png";
            let roomUrl = null;

            try {
              const faceRef = ref(
                storage,
                `faces/${decodedNamaMataKuliah}/${pertemuanId}/${nim}/${nim}.jpg`
              );
              faceUrl = await getDownloadURL(faceRef);
            } catch (e) {
              console.warn(`⚠ Foto wajah tidak ditemukan untuk ${nim}`);
            }

            try {
              const roomRef = ref(
                storage,
                `faces/${decodedNamaMataKuliah}/${pertemuanId}/${nim}/ruangan/${nim}_ruangan.jpg`
              );
              roomUrl = await getDownloadURL(roomRef);
            } catch (e) {
              console.warn(`⚠ Foto ruangan tidak ditemukan untuk ${nim}`);
            }

            return { nim, ...mhsData, faceUrl, roomUrl };
          })
        );

        setAttendanceData((prev) => ({ ...prev, [pertemuanId]: data }));
      } catch (err) {
        console.error("❌ Fetch presensi gagal:", err);
      }
    },
    [decodedNamaMataKuliah]
  );

  useEffect(() => {
    if (isAuthChecked) fetchCourseData();
  }, [isAuthChecked, fetchCourseData]);

  useEffect(() => {
    topics.forEach((t) => {
      if (t.idAbsensi) fetchAttendanceData(t.id, t.idAbsensi);
    });
  }, [topics, fetchAttendanceData]);

  if (!isAuthChecked) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavbarDosen />

      <main className="flex-1 p-8">
        {loading ? (
          <p>Loading...</p>
        ) : courseData ? (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-center">
              {decodedNamaMataKuliah.toUpperCase()}
            </h2>

            <section className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-end mb-4">
                <button
                  onClick={handleCreatePertemuan}
                  className="bg-purple-600 text-white px-4 py-2 rounded"
                >
                  + Tambah Pertemuan
                </button>
              </div>

              {topics.map((t) => (
                <div
                  key={t.id}
                  className="mb-6 p-4 bg-gray-100 rounded-lg shadow"
                >
                  <div className="flex justify-between">
                    <h4 className="font-semibold">
                      {t.id} {t.topic && `| ${t.topic}`}
                    </h4>
                  </div>

                  {!t.topic && (
                    <div className="mt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Masukkan topik"
                        className="border rounded p-2"
                        value={newTopicMap[t.id] || ""}
                        onChange={(e) =>
                          setNewTopicMap((prev) => ({
                            ...prev,
                            [t.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        onClick={() => handleAddTopic(t.id, newTopicMap[t.id])}
                        className="bg-green-500 text-white px-4 py-2 rounded"
                      >
                        Tambah Topik
                      </button>
                    </div>
                  )}

                  {t.topic && (
                    <div className="mt-3">
                      {t.idAbsensi ? (
                        <p className="text-sm text-gray-600">
                          🆔 ID Presensi:{" "}
                          <span className="font-mono text-blue-700">
                            {t.idAbsensi}
                          </span>
                        </p>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            value={durasiPresensi}
                            onChange={(e) => setDurasiPresensi(e.target.value)}
                            className="border px-2 py-1 rounded"
                          >
                            <option value={1}>1 Menit (Testing)</option>
                            <option value={60}>1 Jam</option>
                            <option value={120}>2 Jam</option>
                            <option value={180}>3 Jam</option>
                            <option value="none">Tidak Ada Waktu</option>
                          </select>
                          <button
                            onClick={() => handleCreateAttendance(t.id)}
                            className="bg-blue-500 text-white px-4 py-2 rounded"
                          >
                            + Tambah Presensi
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Absensi Mahasiswa (jika ada) */}
                  {attendanceData[t.id] && attendanceData[t.id].length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-md font-semibold mb-2">
                        Mahasiswa Hadir (termasuk metode presensi):
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {attendanceData[t.id].map((mhs) => (
                          <div
                            key={mhs.nim}
                            className="flex flex-col items-center bg-white p-4 rounded-xl shadow-md border border-gray-200 text-center"
                          >
                            <a
                              href={mhs.faceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Image
                                src={mhs.faceUrl}
                                alt={`Foto ${mhs.nim}`}
                                width={240}
                                height={240}
                                className="rounded-lg object-cover mb-4 border border-gray-300 cursor-zoom-in"
                              />
                            </a>

                            <div className="text-base w-full text-left">
                              <p className="font-bold text-gray-800">
                                NIM: {mhs.nim}
                              </p>
                              <p className="text-gray-700">
                                Status:{" "}
                                <span className="capitalize">{mhs.status}</span>
                              </p>
                              <p className="text-gray-600">
                                Waktu:{" "}
                                {new Date(mhs.time).toLocaleString("id-ID", {
                                  weekday: "long",
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </p>
                              {mhs.presensiMethod && (
                                <p className="text-gray-500 text-sm">
                                  Metode:{" "}
                                  {mhs.presensiMethod
                                    .toLowerCase()
                                    .includes("langsung")
                                    ? "Langsung"
                                    : mhs.presensiMethod}
                                </p>
                              )}

                              {mhs.location && (
                                <p className="text-gray-500 text-sm">
                                  Lokasi: {mhs.location}
                                </p>
                              )}

                              {mhs.roomUrl && (
                                <p className="text-sm text-blue-600 mt-2 underline">
                                  <a
                                    href={mhs.roomUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    📎 Lihat Foto Ruangan
                                  </a>
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </section>
          </div>
        ) : (
          <p>Course tidak ditemukan.</p>
        )}
      </main>
    </div>
  );
};

export default CourseDetailPage;
