"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, setDoc, doc } from "firebase/firestore";
import Cookies from "js-cookie";
import NavbarDosen from "@/components/NavbarDosen";

const DosenHomePage = () => {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dosenName, setDosenName] = useState("");
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Untuk form tambah mata kuliah
  const [newCourseName, setNewCourseName] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const dosenInfo = Cookies.get("dosen_info");

    if (!dosenInfo) {
      router.push("/dosen/login");
    } else {
      const parsed = JSON.parse(dosenInfo);
      setDosenName(parsed.nama);
      setIsAuthorized(true);
    }
  }, [router]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const coursesCollection = collection(db, "mataKuliah");
      const courseDocs = await getDocs(coursesCollection);
      const courseList = courseDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        progress: Math.floor(Math.random() * 100),
      }));
      setCourses(courseList);
    } catch (error) {
      console.error("Error fetching courses: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchCourses();
    }
  }, [isAuthorized]);

  const handleAddCourse = async () => {
    if (!newCourseName) {
      alert("Nama mata kuliah tidak boleh kosong.");
      return;
    }

    try {
      await setDoc(doc(db, "mataKuliah", newCourseName), {
        dosenPengampu: dosenName, // ✅ ganti field di sini
      });

      alert("Mata kuliah berhasil ditambahkan!");
      setShowForm(false);
      setNewCourseName("");
      await fetchCourses(); // Refresh list
    } catch (error) {
      console.error("Gagal menambahkan mata kuliah:", error);
      alert("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavbarDosen />

      <main className="flex-1 p-6">
        <div className="mt-12 max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-zinc-500 mb-2">
            Halo, selamat datang {dosenName} 👋
          </h1>

          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Mata Kuliah yang Diakses
          </h2>

          {/* 🔘 Tambah Mata Kuliah */}
          <div className="mb-6">
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "Batal" : "Tambah Mata Kuliah"}
            </button>
          </div>

          {showForm && (
            <div className="bg-white p-4 rounded shadow-md mb-6">
              <input
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Nama Mata Kuliah"
                className="w-full px-4 py-2 border border-gray-300 rounded mb-3"
              />
              <button
                onClick={handleAddCourse}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
              >
                Simpan
              </button>
            </div>
          )}

          {/* Daftar Mata Kuliah */}
          {loading ? (
            <div>Loading courses...</div>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 mb-4"
              >
                <h3 className="text-lg font-semibold text-purple-700">
                  2024 Ganjil | {course.id}
                </h3>
                <p className="text-gray-500 text-sm mb-4">
                  Mata Kuliah {course.id} Kurikulum 511.2024
                </p>
                <ProgressBar progress={course.progress} />
                <button
                  className="mt-4 bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-6 rounded"
                  onClick={() =>
                    router.push(
                      `/dosen/mataKuliah/${encodeURIComponent(course.id)}`
                    )
                  }
                >
                  Go to Course Details
                </button>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

const ProgressBar = ({ progress }) => (
  <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
    <div
      className="absolute top-0 left-0 h-full bg-purple-500 rounded-full transition-all duration-500"
      style={{ width: `${progress}%` }}
    ></div>
    <span className="absolute right-2 top-0 text-xs text-gray-700 font-semibold">
      {progress}% complete
    </span>
  </div>
);

export default DosenHomePage;
