"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import PageLoader from "@/components/PageLoader";

// Dynamic import bagian menu
const MenuMain = dynamic(() => import("./MenuMain"));
const MenuProfile = dynamic(() => import("./MenuProfile"));
const MenuFaculty = dynamic(() => import("./MenuFaculty"));

export default function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const [mode, setMode] = useState("main");
  const [userData, setUserData] = useState({ nim: "" });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    sessionStorage.clear();
    Cookies.remove("session_mahasiswa");
    toast.success("Logout sukses!");
    setTimeout(() => {
      router.push("/mahasiswa/login");
    }, 1500);
  }, [router]);

  const handleNavigation = useCallback(
    (path) => {
      if (window.location.pathname === path) return;
      router.push(path);
      setSidebarOpen(false);
    },
    [router, setSidebarOpen]
  );

  useEffect(() => {
    const sessionData = Cookies.get("session_mahasiswa");
    if (sessionData) {
      try {
        const parsed = JSON.parse(sessionData);
        if (parsed?.isLoggedIn && parsed?.nim) {
          setUserData({ nim: parsed.nim });
        }
      } catch (error) {
        console.error("Gagal parsing session_mahasiswa:", error);
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && typeof setSidebarOpen === "function") {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize, { passive: true });
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  const transitionX = useMemo(() => {
    if (mode === "main") return "translate-x-0";
    if (mode === "faculty") return "-translate-x-[320px]";
    return "-translate-x-[640px]";
  }, [mode]);

  return (
    <>
      {loading && <PageLoader />}
      <Toaster position="top-center" reverseOrder={false} />

      <div
        className={`sidebar fixed top-0 left-0 h-full w-80 bg-black text-white border-r border-gray-700 transition-transform duration-300 z-50 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ willChange: "transform", contain: "paint" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-center text-base font-bold py-4 border-b border-gray-700 uppercase bg-gray-800 relative">
          {mode !== "main" && (
            <button
              onClick={() => setMode("main")}
              className="absolute left-4 text-white"
            >
              ←
            </button>
          )}
          {mode === "main"
            ? "Menu"
            : mode === "faculty"
            ? "Fakultas"
            : userData.nim}
        </div>

        {/* Body */}
        <div className="flex flex-col h-full">
          <div className="relative w-full flex-1 overflow-hidden">
            <div
              className={`flex transition-transform duration-300 ${transitionX}`}
              style={{ width: "960px", willChange: "transform" }}
            >
              <MenuMain
                handleNavigation={handleNavigation}
                setMode={setMode}
                userData={userData}
              />
              <MenuFaculty handleNavigation={handleNavigation} />

              <MenuProfile
                handleNavigation={handleNavigation}
                handleLogout={handleLogout}
                loading={loading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-700 flex items-center gap-2 text-xs text-gray-400">
            ✉ leads@upnvj.ac.id
          </div>
        </div>
      </div>
    </>
  );
}
