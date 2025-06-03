"use client";

import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth"; // Import signOut
import { auth } from "@/lib/firebase"; // Import firebase auth
import Cookies from "js-cookie"; // Import js-cookie

const NavbarDosen = () => {
  const router = useRouter();

  // Fungsi untuk logout
  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Remove cookies related to user session
      Cookies.remove("dosen_info");

      // Redirect to login page
      router.push("/dosen/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Gagal logout. Silakan coba lagi.");
    }
  };

  return (
    <header className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 shadow text-white">
      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <h1
          className="text-2xl font-bold cursor-pointer"
          onClick={() => router.push("/dosen/home")}
        >
          LeADS: Dashboard Dosen
        </h1>
        <div className="space-x-4">
          <button
            onClick={handleLogout} // Menambahkan fungsi logout saat klik button
            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default NavbarDosen;
