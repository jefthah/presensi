"use client";

import { useRouter } from "next/navigation";
import { FaChevronRight, FaUserCircle, FaArrowLeft } from "react-icons/fa";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

export default function SidebarMahasiswa({
  sidebarOpen,
  setSidebarOpen,
  userData: propUserData,
}) {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [activeMenu, setActiveMenu] = useState("main");

  // Ambil data pengguna dari prop atau cookie
  useEffect(() => {
    if (propUserData && propUserData.nim) {
      setUserData(propUserData);
    } else {
      const session = Cookies.get("session_mahasiswa");
      if (session) {
        const parsed = JSON.parse(session);
        setUserData({
          nim: parsed.nim,
          name: parsed.name,
          email: parsed.email,
        });
      }
    }
  }, [propUserData]);

  // Auto close sidebar di desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setSidebarOpen]);

  // Lock scroll saat sidebar terbuka
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const navigate = (path) => {
    if (window.location.pathname === path) {
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(false);
    setTimeout(() => {
      router.push(path);
    }, 300);
  };

  const handleOpenSubmenu = (menu) => setActiveMenu(menu);
  const handleBackToMain = () => setActiveMenu("main");

  const clearAllBrowserData = () => {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    localStorage.clear();
    sessionStorage.clear();
  };

  const performLogout = () => {
    clearAllBrowserData();
    Cookies.remove("session_mahasiswa");
    router.push("/mahasiswa/login");
  };

  const renderSubmenu = (key, items) => (
    <div
      key={key}
      className={`absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out ${
        activeMenu === key ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <nav className="flex flex-col divide-y divide-gray-800">
        {items.map((item, index) => (
          <button
            key={index}
            className="px-4 py-3 text-sm text-left hover:bg-gray-700"
          >
            {item}
          </button>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-black text-white z-[9999] transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 bg-[#2c2c2c] border-b border-gray-700 text-center flex items-center justify-center relative">
            {activeMenu !== "main" && (
              <button onClick={handleBackToMain} className="absolute left-4">
                <FaArrowLeft />
              </button>
            )}
            <p className="font-bold text-white text-base">
              {activeMenu === "main" ? "MENU" : activeMenu.toUpperCase()}
            </p>
          </div>

          {/* Menu */}
          <div className="relative overflow-hidden flex-1">
            <div className="relative w-full h-full">
              {/* Main menu */}
              <div
                className={`absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out ${
                  activeMenu === "main" ? "translate-x-0" : "-translate-x-full"
                }`}
              >
                <nav className="flex flex-col divide-y divide-gray-800">
                  <SidebarItem
                    label="HOME"
                    onClick={() => navigate("/mahasiswa/home")}
                  />
                  <SidebarItem
                    label="FACULTY"
                    hasArrow
                    onClick={() => handleOpenSubmenu("faculty")}
                  />
                  <SidebarItem
                    label="ANNOUNCEMENTS"
                    onClick={() => navigate("/announcements")}
                  />
                  <SidebarItem
                    label="HELPDESK"
                    hasArrow
                    onClick={() => handleOpenSubmenu("helpdesk")}
                  />
                  <SidebarItem
                    label="ENGLISH (EN)"
                    hasArrow
                    onClick={() => handleOpenSubmenu("language")}
                  />
                  <SidebarItem
                    label="NAVIGATION"
                    onClick={() => navigate("/navigation")}
                  />
                  <SidebarItem
                    label={userData?.nim || "NIM Tidak Ditemukan"}
                    icon={<FaUserCircle size={20} />}
                    hasArrow
                    onClick={() => handleOpenSubmenu("profile")}
                  />
                </nav>
              </div>

              {/* Submenus */}
              {renderSubmenu("faculty", [
                "ECONOMICS AND BUSINESS",
                "MEDICINE",
                "ENGINEERING",
                "SOCIAL SCIENCE",
                "COMPUTER SCIENCE",
                "LAW",
                "HEALTH SCIENCE",
                "UNIVERSITY COURSES",
                "ALL COURSE",
              ])}

              {renderSubmenu("helpdesk", ["FAQ", "CONTACT SUPPORT"])}
              {renderSubmenu("language", ["ENGLISH (EN)", "INDONESIAN (ID)"])}

              {/* Profile submenu */}
              <div
                className={`absolute top-0 left-0 w-full h-full transition-transform duration-300 ease-in-out ${
                  activeMenu === "profile"
                    ? "translate-x-0"
                    : "translate-x-full"
                }`}
              >
                <nav className="flex flex-col divide-y divide-gray-800">
                  <SidebarItem
                    label="My Profile"
                    onClick={() => navigate("/mahasiswa/profile")}
                  />
                  <SidebarItem
                    label="Grades"
                    onClick={() => navigate("/mahasiswa/grades")}
                  />
                  <SidebarItem
                    label="Messages"
                    onClick={() => navigate("/mahasiswa/messages")}
                  />
                  <SidebarItem
                    label="Preferences"
                    onClick={() => navigate("/mahasiswa/preferences")}
                  />
                  <SidebarItem
                    label="Log Out"
                    onClick={performLogout}
                    textColor="text-red-400"
                  />
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Komponen untuk setiap item menu
function SidebarItem({
  label,
  icon,
  onClick,
  hasArrow,
  textColor = "text-white",
}) {
  return (
    <button
      onClick={onClick}
      className={`flex justify-between items-center w-full text-left px-4 py-3 text-sm hover:bg-gray-700 ${textColor}`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span>{label}</span>
      </div>
      {hasArrow && <FaChevronRight size={14} />}
    </button>
  );
}
