"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "@/lib/firebase";
import dynamic from "next/dynamic";

// Dynamic imports (code splitting untuk performa)
const NavbarHome = dynamic(() => import("@/components/NavbarHome"), { ssr: false });
const Slider = dynamic(() => import("@/components/Slider"), { ssr: false });
const Sidebar = dynamic(() => import("@/components/Sidebar/index"), { ssr: false });
// atau cukup:


export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState({ nim: "", name: "", email: "" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const db = getFirestore(app);

  // Bersihkan atribut ekstensi Chrome tertentu (opsional)
  useEffect(() => {
    if (document.body.hasAttribute("cz-shortcut-listen")) {
      document.body.removeAttribute("cz-shortcut-listen");
    }
  }, []);

  // Ambil data pengguna dari Firestore
  const fetchUserDetails = useCallback(async (nim) => {
    try {
      const userDoc = await getDoc(doc(db, "mahasiswa", nim));
      if (userDoc.exists()) {
        setUser({
          nim,
          name: userDoc.data().nama,
          email: userDoc.data().email,
        });
      }
    } catch (error) {
      console.error("Error fetching user data: ", error);
    }
  }, [db]);

  // Ambil session dari sessionStorage saat pertama kali load
  useEffect(() => {
    const sessionData = JSON.parse(sessionStorage.getItem("session_mahasiswa"));
    if (sessionData?.isLoggedIn && sessionData.nimOrNip) {
      setIsLoggedIn(true);
      fetchUserDetails(sessionData.nimOrNip);
    }
  }, [fetchUserDetails]);

  // Logout
  const handleLogout = useCallback(() => {
    sessionStorage.removeItem("session_mahasiswa");
    setIsLoggedIn(false);
    setUser({ nim: "", name: "", email: "" });
    router.push("/");
  }, [router]);

  // Navigasi dan tutup sidebar
  const handleNavigation = useCallback((path) => {
    setSidebarOpen(false);
    router.push(path);
  }, [router]);

  // Tutup sidebar jika lebar layar besar (desktop)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        handleNavigation={handleNavigation}
        isLoggedIn={isLoggedIn}
        handleLogout={handleLogout}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Overlay saat sidebar aktif */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Konten utama */}
      <div className="relative z-30 flex flex-col min-h-screen">
        <NavbarHome
          isLoggedIn={isLoggedIn}
          handleLogout={handleLogout}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />
        <main className="flex-1">
          <Slider />
        </main>
      </div>
    </div>
  );
}
