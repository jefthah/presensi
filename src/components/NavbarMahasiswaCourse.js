"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FaBars,
  FaEyeSlash,
  FaChartBar,
  FaComments,
  FaCog,
  FaUserCircle,
} from "react-icons/fa";
import Cookies from "js-cookie";

export default function NavbarMahasiswaCourse({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sessionData = Cookies.get("session_mahasiswa");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (parsed?.isLoggedIn && parsed?.role === "mahasiswa") {
        setIsLoggedIn(true);
        setUserData({
          name: parsed.name || "",
          email: parsed.email || "",
        });
      }
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    Cookies.remove("session_mahasiswa");
    router.push("/mahasiswa/login");
  };

  return (
    <>
      {/* Navbar */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-700 ${
          scrolled
            ? "bg-white text-black shadow-md border-b border-gray-200 translate-y-0 opacity-100"
            : "bg-transparent text-white border-b border-white/50 -translate-y-2 opacity-100"
        }`}
        style={{
          backdropFilter: "blur(12px)",
          transitionTimingFunction: "ease-in-out",
        }}
      >
        <div className="flex items-center justify-between px-4 md:px-8 py-5">
          {/* Logo + Menu */}
          <div className="flex items-center space-x-10">
            <Image
              src={
                scrolled
                  ? "/images/logo/leadspoppins_dark.png" // Logo saat navbar putih
                  : "/images/logo/leads_poppins.png" // Logo saat navbar transparan
              }
              alt="LeADS Logo"
              width={260}
              height={40}
              priority
            />
            {/* Menu */}
            <nav
              className={`hidden xl:flex space-x-10 font-light text-[18px] ml-6 ${
                scrolled ? "text-black" : "text-white"
              }`}
            >
              <button
                onClick={() => router.push("/")}
                className="hover:underline"
              >
                Home
              </button>
              <button
                onClick={() => router.push("/faculty")}
                className="hover:underline"
              >
                Faculty
              </button>
              <button
                onClick={() => router.push("/announcements")}
                className="hover:underline"
              >
                Announcements
              </button>
              <button
                onClick={() => router.push("/helpdesk")}
                className="hover:underline"
              >
                Helpdesk
              </button>
            </nav>
          </div>

          {/* Icons and Profile */}
          <div className="flex items-center space-x-4">
            {isLoggedIn && (
              <div className="hidden xl:flex items-center space-x-4 relative">
                <div className="p-2 rounded-full hover:bg-white/30 cursor-pointer">
                  <FaEyeSlash size={18} />
                </div>
                <div className="relative">
                  <div className="p-2 rounded-full hover:bg-white/30 cursor-pointer">
                    <FaChartBar size={18} />
                  </div>
                  <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1">
                    384
                  </span>
                </div>
                <div className="p-2 rounded-full hover:bg-white/30 cursor-pointer">
                  <FaComments size={18} />
                </div>
                <div className="p-2 rounded-full hover:bg-white/30 cursor-pointer">
                  <FaCog size={18} />
                </div>
                <div
                  className="p-2 rounded-full hover:bg-white/30 cursor-pointer"
                  onClick={() => {
                    setProfileDropdownOpen(!profileDropdownOpen);
                    setLanguageDropdownOpen(false);
                  }}
                >
                  <FaUserCircle size={24} />
                </div>

                {/* Profile Dropdown */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-14 w-64 bg-white rounded-lg shadow-lg p-4 z-50 text-gray-800">
                    <div className="flex flex-col items-center mb-4">
                      <FaUserCircle size={50} className="text-gray-500 mb-2" />
                      <p className="font-semibold">
                        {userData.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-center text-gray-500">
                        {userData.email || "unknown@email.com"}
                      </p>
                    </div>
                    <div className="border-t my-2"></div>
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => router.push("/mahasiswa/home")}
                        className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded"
                      >
                        <FaChartBar className="text-gray-600" />
                        <span>Dashboard</span>
                      </button>
                      <button
                        onClick={() => router.push("/profile")}
                        className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded"
                      >
                        <FaUserCircle className="text-gray-600" />
                        <span>Profile</span>
                      </button>
                      <button
                        onClick={() => router.push("/grades")}
                        className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded"
                      >
                        <FaComments className="text-gray-600" />
                        <span>Grades</span>
                      </button>
                      <button
                        onClick={() => router.push("/messages")}
                        className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded"
                      >
                        <FaComments className="text-gray-600" />
                        <span>Messages</span>
                      </button>
                      <button
                        onClick={() => router.push("/preferences")}
                        className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded"
                      >
                        <FaCog className="text-gray-600" />
                        <span>Preferences</span>
                      </button>
                      <div className="border-t my-2"></div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-3 text-red-500 hover:bg-red-100 p-2 rounded"
                      >
                        <FaEyeSlash className="text-red-500" />
                        <span>Log out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              className="xl:hidden text-3xl"
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(true);
              }}
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
