"use client";

import {
  FaTachometerAlt,
  FaUserCircle,
  FaGraduationCap,
  FaEnvelope,
  FaCogs,
  FaSignOutAlt,
  FaSpinner,
} from "react-icons/fa";

export default function MenuProfile({ handleNavigation, handleLogout, loading }) {
  const menuItems = [
    { label: "Dashboard", icon: FaTachometerAlt, path: "/dashboard" },
    { label: "Profile", icon: FaUserCircle, path: "/profile" },
    { label: "Grades", icon: FaGraduationCap, path: "/grades" },
    { label: "Messages", icon: FaEnvelope, path: "/messages" },
    { label: "Preferences", icon: FaCogs, path: "/preferences" },
  ];

  return (
    <ul className="w-80 mt-2 overflow-y-auto">
      {menuItems.map((item, i) => (
        <li key={i}>
          <button
            onClick={() => handleNavigation(item.path)}
            className="flex items-center gap-2 w-full py-3 px-6 text-sm border-b border-gray-700 hover:bg-gray-800 uppercase"
          >
            <item.icon /> {item.label}
          </button>
        </li>
      ))}
      <li>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="flex items-center gap-2 w-full py-3 px-6 text-sm text-red-400 border-b border-gray-700 hover:bg-gray-800 uppercase"
        >
          {loading ? (
            <>
              <FaSpinner className="animate-spin" /> Logging Out...
            </>
          ) : (
            <>
              <FaSignOutAlt /> Log Out
            </>
          )}
        </button>
      </li>
    </ul>
  );
}
