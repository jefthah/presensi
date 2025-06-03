"use client";

import { FaUser, FaChevronRight } from "react-icons/fa";

export default function MenuMain({ handleNavigation, setMode, userData }) {
  return (
    <ul className="w-80 mt-2 overflow-y-auto">
      {[
        { label: "Beranda", path: "/" },
        { label: "Fakultas", action: () => setMode("faculty"), icon: true },
        { label: "Pengumuman", path: "/galat" },
        { label: "Bantuan", path: "/helpdesk", icon: true },
      ].map((item, i) => (
        <li key={i}>
          <button
            onClick={() => (item.path ? handleNavigation(item.path) : item.action())}
            className="flex justify-between items-center w-full py-3 px-6 text-sm bg-black border-b border-gray-700 hover:bg-gray-800 uppercase"
          >
            {item.label}
            {item.icon && <FaChevronRight size={14} />}
          </button>
        </li>
      ))}
      {!userData.nim ? (
        <li>
          <button
            onClick={() => handleNavigation("/mahasiswa/login")}
            className="flex items-center gap-2 w-full py-3 px-6 text-sm bg-black border-b border-gray-700 hover:bg-gray-800 uppercase"
          >
            <FaUser size={14} /> Login
          </button>
        </li>
      ) : (
        <li>
          <button
            onClick={() => setMode("profileMenu")}
            className="flex justify-between items-center w-full py-3 px-6 text-sm bg-black border-b border-gray-700 hover:bg-gray-800 uppercase"
          >
            <span>{userData.nim}</span>
            <FaChevronRight size={14} />
          </button>
        </li>
      )}
    </ul>
  );
}
