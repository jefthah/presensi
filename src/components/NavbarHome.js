"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Image from "next/image";
import Cookies from "js-cookie";
import LoginModal from "./LoginModal";
const Sidebar = dynamic(() => import("@/components/Sidebar/index"), {
  ssr: false,
});

// Dynamic icon imports
const FaEyeSlash = dynamic(() =>
  import("react-icons/fa").then((m) => m.FaEyeSlash)
);
const FaChartBar = dynamic(() =>
  import("react-icons/fa").then((m) => m.FaChartBar)
);
const FaComments = dynamic(() =>
  import("react-icons/fa").then((m) => m.FaComments)
);
const FaCog = dynamic(() => import("react-icons/fa").then((m) => m.FaCog));
const FaUserCircle = dynamic(() =>
  import("react-icons/fa").then((m) => m.FaUserCircle)
);

function NavbarHome({ sidebarOpen, setSidebarOpen }) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Cek login dari cookies
  useEffect(() => {
    const sessionData = Cookies.get("session_mahasiswa");
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      setLoggedIn(parsed?.isLoggedIn && parsed?.role === "mahasiswa");
    } else {
      setLoggedIn(false);
    }
  }, []);

  // Scroll efek untuk navbar
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = useCallback(
    (path) => {
      router.push(path);
      setSidebarOpen(false);
      setDropdownOpen(false);
    },
    [router, setSidebarOpen]
  );

  const handleLogout = useCallback(() => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    sessionStorage.clear();
    Cookies.remove("session_mahasiswa");
    router.push("/mahasiswa/login");
  }, [router]);

  const handleSidebarClick = useCallback(
    (e) => {
      if (sidebarOpen && !e.target.closest(".sidebar")) {
        setSidebarOpen(false);
      }
    },
    [sidebarOpen, setSidebarOpen]
  );

  return (
    <>
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleNavigation={handleNavigation}
        isLoggedIn={loggedIn}
        handleLogout={handleLogout}
      />

      <div
        className="flex transition-all duration-300"
        onClick={handleSidebarClick}
      >
        <div className="flex-1">
          <header
            className={`fixed w-full top-0 z-30 transition-all duration-500 ${
              isScrolled
                ? "bg-white shadow-md"
                : "bg-transparent border-b border-white/30"
            } ${isScrolled ? "animate-slideDown" : ""}`}
          >
            <div className="flex justify-between items-center px-4 md:px-8 py-4 relative">
              {/* Logo & Menu */}
              <div className="flex items-center space-x-4 md:space-x-16">
                <Image
                  src={
                    isScrolled
                      ? "/images/logo/leadspoppins_dark.png"
                      : "/images/logo/leads_poppins.png"
                  }
                  alt="LeADS Logo"
                  width={280}
                  height={60}
                  loading="lazy"
                />
                <nav
                  className={`hidden lg:flex space-x-4 text-[16px] transition-colors duration-300 ${
                    isScrolled ? "text-black" : "text-white"
                  }`}
                >
                  {[
                    "/",
                    "/galat",
                    "/announcements",
                    "/helpdesk",
                    "/language",
                  ].map((path, i) => (
                    <button
                      key={path}
                      onClick={() => handleNavigation(path)}
                      className="hover:underline py-2 px-4"
                    >
                      {
                        [
                          "Beranda",
                          "Fakultas",
                          "Pengumuman",
                          "Bantuan",
                        ][i]
                      }
                    </button>
                  ))}
                </nav>
              </div>

              {/* Kanan: menu atau tombol */}
              <div className="flex items-center space-x-4 ml-auto relative">
                {/* Mobile hamburger */}
                <button
                  className={`lg:hidden text-3xl ${
                    isScrolled ? "text-black" : "text-white"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSidebarOpen(!sidebarOpen);
                  }}
                >
                  ☰
                </button>

                {loggedIn ? (
                  <div className="hidden md:flex items-center space-x-3 text-white relative">
                    <IconButton icon={<FaEyeSlash size={18} />} />
                    <NotificationIcon
                      icon={<FaChartBar size={18} />}
                      count={384}
                    />
                    <IconButton icon={<FaComments size={18} />} />
                    <IconButton icon={<FaCog size={18} />} />

                    {/* Avatar + dropdown */}
                    <IconButton
                      icon={<FaUserCircle size={22} />}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                    />
                    {dropdownOpen && (
                      <DropdownMenu
                        onNavigate={handleNavigation}
                        onLogout={handleLogout}
                      />
                    )}
                  </div>
                ) : (
                  <button
                    className={`hidden lg:block font-semibold ${
                      isScrolled ? "text-black" : "text-white"
                    } hover:underline transition`}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Masuk/Daftar
                  </button>
                )}
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* Animasi Global */}
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 1s ease forwards;
        }
      `}</style>
    </>
  );
}

const IconButton = ({ icon, onClick }) => (
  <div
    className="bg-white/20 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/30 cursor-pointer"
    onClick={onClick}
  >
    {icon}
  </div>
);

const NotificationIcon = ({ icon, count }) => (
  <div className="relative">
    <IconButton icon={icon} />
    <span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full px-1">
      {count}
    </span>
  </div>
);

const DropdownMenu = ({ onNavigate, onLogout }) => (
  <div className="absolute right-0 top-14 w-64 bg-white rounded-lg shadow-lg p-4 z-50">
    <div className="flex flex-col items-center mb-4">
      <FaUserCircle size={50} className="text-gray-500 mb-2" />
      <p className="text-center font-semibold text-gray-800">
        2110511131 JEFTA SUPRAJA
      </p>
      <p className="text-center text-sm text-gray-500">
        jefta.supraja@gmail.com
      </p>
    </div>
    <div className="border-t border-gray-200 my-2"></div>
    <div className="flex flex-col space-y-2">
      {[
        { icon: FaChartBar, label: "Dashboard", path: "/mahasiswa/home" },
        { icon: FaUserCircle, label: "Profile", path: "/profile" },
        { icon: FaComments, label: "Grades", path: "/grades" },
        { icon: FaComments, label: "Messages", path: "/messages" },
        { icon: FaCog, label: "Preferences", path: "/preferences" },
      ].map((item) => (
        <button
          key={item.label}
          onClick={() => onNavigate(item.path)}
          className="flex items-center space-x-3 hover:bg-gray-100 p-2 rounded transition"
        >
          <item.icon className="text-gray-600" />
          <span className="text-gray-800 font-medium">{item.label}</span>
        </button>
      ))}
      <div className="border-t border-gray-200 my-2"></div>
      <button
        onClick={onLogout}
        className="flex items-center space-x-3 text-red-600 hover:bg-red-100 p-2 rounded transition"
      >
        <FaEyeSlash className="text-red-500" />
        <span className="font-medium">Log out</span>
      </button>
    </div>
  </div>
);

export default memo(NavbarHome);
