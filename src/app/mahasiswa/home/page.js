"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import NavbarMahasiswa from "@/components/NavbarMahasiswa";
import SidebarMahasiswa from "@/components/SidebarMahasiswa";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Cookies from "js-cookie";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaStar,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

const colors = [
  "bg-pink-500",
  "bg-green-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-purple-500",
];

const MahasiswaDashboard = () => {
  const router = useRouter();
  const pathname = usePathname();
  const nim = pathname.split("/")[2];

  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [recentAccessed, setRecentAccessed] = useState(null);

  const recentDisplayed = recentAccessed;

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const lastCourse = localStorage.getItem("recent_course");
        if (lastCourse) {
          const parsed = JSON.parse(lastCourse);
          if (parsed?.mataKuliah) setRecentAccessed(parsed);
        }
      } catch (err) {
        console.error("Invalid recent_course data:", err);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return router.push("/mahasiswa/login");

      const sessionData = Cookies.get("session_mahasiswa");
      if (!sessionData) return router.push("/mahasiswa/login");

      const parsedSession = JSON.parse(sessionData);
      if (!parsedSession?.isLoggedIn || parsedSession.role !== "mahasiswa") {
        return router.push("/mahasiswa/login");
      }

      setRole("mahasiswa");
      setIsAuthChecked(true);

      try {
        const snapshot = await getDocs(collection(db, "mataKuliah"));
        const list = snapshot.docs.map((doc, i) => ({
          id: doc.id,
          mataKuliah: doc.id,
          progress: 0,
          color: colors[i % colors.length],
        }));

        setCourses(list);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleLogout = () => {
    Cookies.remove("session_mahasiswa");
    router.push("/mahasiswa/login");
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return isAuthChecked && role === "mahasiswa" ? (
    <div className="relative min-h-screen overflow-x-hidden">
      <SidebarMahasiswa
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        userData={{ name: "Nama Mahasiswa", email: "email@domain.com" }}
      />

      <div
        onClick={() => sidebarOpen && setSidebarOpen(false)}
        className="transition-all duration-300 ease-in-out"
      >
        <NavbarMahasiswa
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <div className="flex flex-1 pt-20">
          <aside className="hidden lg:flex flex-col w-64 p-4 bg-white shadow-md border-r">
            <h2 className="text-lg font-bold mb-6 text-gray-700">Start</h2>
            <nav className="flex flex-col space-y-4">
              {[
                {
                  icon: FaTachometerAlt,
                  label: "Dashboard",
                  path: "/mahasiswa/home",
                },
                { icon: FaUserGraduate, label: "Profile" },
                { icon: FaStar, label: "Grades" },
                { icon: FaEnvelope, label: "Messages" },
                { icon: FaCog, label: "Preferences" },
              ].map(({ icon: Icon, label, path }) => (
                <button
                  key={label}
                  onClick={path ? () => router.push(path) : undefined}
                  className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded text-gray-700"
                >
                  <Icon />
                  <span>{label}</span>
                </button>
              ))}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded text-red-500"
              >
                <FaSignOutAlt />
                <span>Log out</span>
              </button>
            </nav>
          </aside>

          <main className="flex-1 bg-gray-50 p-6">
            <div className="text-2xl font-bold text-gray-800 mb-6">
              LeADS: Dashboard
            </div>

            {/* Section 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[
                {
                  title: "Your Profile",
                  subtitle: "Profile",
                  color: "bg-pink-500",
                  icon: <FaUserGraduate />,
                },
                {
                  title: "Preferences",
                  subtitle: "Settings",
                  color: "bg-green-600",
                  icon: <FaCog />,
                },
              ].map(({ title, subtitle, color, icon }) => (
                <div
                  key={title}
                  className="bg-white p-4 rounded-lg shadow flex items-center space-x-6 min-h-[130px]"
                >
                  <div
                    className={`${color} text-white p-8 text-5xl rounded-md`}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-gray-800">
                      {title}
                    </p>
                    <p className="text-base text-gray-500">{subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Section 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Courses */}
              <div className="md:col-span-2 bg-white p-8 rounded-lg shadow">
                <h2 className="text-2xl font-bold mb-6">Courses</h2>
                <div className="space-y-6">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="bg-gray-100 p-5 rounded-lg shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:space-x-5 space-y-4 sm:space-y-0"
                    >
                      <div
                        className={`group relative w-56 h-44 ${course.color} rounded-lg overflow-hidden flex items-center justify-center`}
                      >
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                        <button
                          className="absolute px-4 py-1 rounded-full border-2 border-white text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition"
                          onClick={() => {
                            localStorage.setItem(
                              "recent_course",
                              JSON.stringify(course)
                            );
                            router.push(
                              `/mahasiswa/mataKuliah/${encodeURIComponent(
                                course.mataKuliah
                              )}`
                            );
                          }}
                        >
                          View
                        </button>
                      </div>

                      {/* Konten */}
                      <div className="flex-1 space-y-2">
                        <div className="text-sm text-gray-600">
                          S1 Informatika
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">
                          2024 Ganjil | {course.mataKuliah}
                        </h3>

                        {/* Progress */}
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4">
                          <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full w-fit">
                            Published
                          </span>
                          <div className="flex-1 min-w-[100px] bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${course.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-700 font-medium whitespace-nowrap">
                            {course.progress || 0}% complete
                          </span>
                        </div>

                        <p className="text-sm text-gray-600">
                          Mata Kuliah {course.mataKuliah} Kurikulum 511.2024
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recently Accessed */}
              <div className="bg-white p-6 rounded-lg shadow flex flex-col space-y-4">
                <h2 className="text-xl font-bold mb-4">
                  Recently accessed courses
                </h2>
                {recentDisplayed && (
                  <div className="bg-gray-100 p-6 rounded-lg shadow-sm hover:shadow-md transition flex flex-col gap-4">
                    <div
                      className={`group relative w-full sm:w-56 h-44 ${
                        recentDisplayed.color || "bg-pink-500"
                      } rounded-lg overflow-hidden flex items-center justify-center`}
                    >
                      <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
                      <button
                        className="absolute px-4 py-1 rounded-full border-2 border-white text-white text-sm font-semibold opacity-0 group-hover:opacity-100 transition"
                        onClick={() =>
                          router.push(
                            `/mahasiswa/mataKuliah/${encodeURIComponent(
                              recentDisplayed.mataKuliah
                            )}`
                          )
                        }
                      >
                        View
                      </button>
                    </div>

                    <div className="flex-1 space-y-2 min-w-0">
                      <div className="text-sm text-gray-600 truncate">
                        S1 Informatika
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 break-words leading-tight">
                        2024 Ganjil | {recentDisplayed.mataKuliah}
                      </h3>
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-4 w-full">
                        <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full w-fit">
                          Published
                        </span>
                        <div className="flex-1 min-w-0 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{
                              width: `${recentDisplayed.progress || 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-700 font-medium whitespace-nowrap">
                          {recentDisplayed.progress || 0}% complete
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 break-words leading-tight">
                        Mata Kuliah {recentDisplayed.mataKuliah} Kurikulum
                        511.2024
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  ) : null;
};

export default MahasiswaDashboard;
