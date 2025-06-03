"use client";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import NavbarMahasiswaCourse from "@/components/NavbarMahasiswaCourse";
import SidebarMahasiswa from "@/components/SidebarMahasiswa";
import HeaderMahasiswaCourse from "@/components/HeaderMahasiswaCourse";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Footer from "@/components/Footer";
import Link from "next/link";

const CourseDetail = ({ params }) => {
  const { namaMataKuliah } = params;
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  const decodedNamaMataKuliah = decodeURIComponent(namaMataKuliah);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (decodedNamaMataKuliah) {
        const courseRef = doc(db, "mataKuliah", decodedNamaMataKuliah);
        try {
          const courseDoc = await getDoc(courseRef);
          if (courseDoc.exists()) {
            setCourse(courseDoc.data());

            const pertemuanRef = collection(courseRef, "Pertemuan");
            const pertemuanSnapshot = await getDocs(pertemuanRef);
            const topicsList = await Promise.all(
              pertemuanSnapshot.docs.map(async (pertemuanDoc) => {
                const absensiRef = collection(pertemuanDoc.ref, "Absensi");
                const absensiSnapshot = await getDocs(absensiRef);
                const absensiList = absensiSnapshot.docs.map((absenDoc) => ({
                  id: absenDoc.id,
                  ...absenDoc.data(),
                }));
                return {
                  id: pertemuanDoc.id,
                  ...pertemuanDoc.data(),
                  absensi: absensiList,
                };
              })
            );
            setTopics(topicsList);
          } else {
            console.error("Course tidak ditemukan:", courseRef.path);
          }
        } catch (error) {
          console.error("Error fetching course:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCourseData();
  }, [decodedNamaMataKuliah]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!course) return <div className="p-8">Course tidak ditemukan</div>;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Sidebar */}
      <SidebarMahasiswa
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={() => {}}
        userData={{ name: "Nama Mahasiswa", email: "email@domain.com" }}
      />

      {/* Konten */}
      <div
        className="transition-all duration-300 ease-in-out"
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      >
        {/* Navbar */}
        <NavbarMahasiswaCourse
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        {/* Header menggunakan komponen */}
        <HeaderMahasiswaCourse
          title={`2024 GANJIL | ${decodedNamaMataKuliah.toUpperCase()}`}
          path={[
            "Dashboard",
            "Courses",
            "2024/2025 Ganjil",
            "Fakultas Ilmu Komputer",
            "S1 Informatika",
            decodedNamaMataKuliah,
          ]}
        />

        {/* Main Content */}
        <main className="flex-1 p-8 bg-gray-50">
          <section className="container mx-auto bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Course Content
            </h2>

            <div className="space-y-4">
              {/* General Section */}
              <details className="rounded-lg">
                <summary className="font-semibold text-gray-800 cursor-pointer bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
                  General
                </summary>
                <div className="mt-4 text-gray-600 p-4 bg-white">
                  <p>{course.description || "Deskripsi tidak tersedia."}</p>
                </div>
              </details>

              {/* List Pertemuan */}
              {topics.map((topic, index) => (
                <details key={index} className="rounded-lg">
                  <summary className="font-semibold text-gray-800 cursor-pointer bg-gray-100 px-4 py-2 rounded-lg border border-gray-300">
                    Pertemuan {index + 1}: {topic.topic || "No Topic Available"}
                  </summary>
                  <div className="mt-4 text-gray-600 p-4 bg-white">
                    {topic.absensi.length > 0 ? (
                      topic.absensi.map((absen, idx) => (
                        <div key={idx} className="flex items-center mt-2">
                          <Image
                            src="/images/icon/iconPresensi.png"
                            alt="Presence Icon"
                            width={20}
                            height={20}
                            className="mr-2"
                          />
                          <Link
                            href={`/mahasiswa/absensi/${encodeURIComponent(
                              decodedNamaMataKuliah
                            )}/${topic.id}/${absen.id}`}
                            className="font-semibold text-blue-500 hover:underline"
                          >
                            Presensi
                          </Link>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">
                        Belum ada presensi untuk pertemuan ini.
                      </p>
                    )}
                  </div>
                </details>
              ))}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default CourseDetail;
