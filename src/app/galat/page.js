"use client"; // Menandai komponen ini sebagai Client Component

import { useState } from "react"; // Import useState untuk mengatur sidebar
import NavbarHome from "@/components/NavbarHome"; // Import NavbarHome
import Footer from "@/components/Footer"; // Import Footer

export default function GalatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false); // Menambahkan state untuk sidebar

  // Fungsi untuk menutup sidebar ketika mengklik di luar sidebar
  const handlePageClick = (event) => {
    if (sidebarOpen && !event.target.closest(".sidebar") && !event.target.closest(".sidebar-button")) {
      setSidebarOpen(false); // Menutup sidebar jika area di luar sidebar diklik
    }
  };

  return (
    <div className="min-h-screen flex flex-col" onClick={handlePageClick}>
      {/* Navbar */}
      <NavbarHome
        sidebarOpen={sidebarOpen} // Meneruskan sidebarOpen ke NavbarHome
        setSidebarOpen={setSidebarOpen} // Meneruskan setSidebarOpen ke NavbarHome
      />

      {/* Main content */}
      <div className="flex-1 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 pt-0 sm:pt-28 flex flex-col justify-center items-center min-h-[50vh]">
        <div className="text-white text-3xl sm:text-4xl font-bold mt-12 text-center">
          LEADS UPN VETERAN JAKARTA
        </div>
        <div className="text-white text-sm sm:text-lg font-light mt-2 text-center">
          Beranda / Kategori tidak diketahui
        </div>
      </div>

      {/* Galat message in white background */}
      <div className="bg-white text-center py-12">
        <div className="max-w-lg mx-auto bg-red-100 text-red-700 p-6 rounded-md shadow-md">
          <p className="font-medium text-lg">Halaman belum dibuat developer, cape!</p>
          <p className="text-sm mt-2">Informasi selanjutnya mengenai galat ini akan kami berikan secepatnya.</p>
        </div>

        {/* Pesan donasi */}
        {/* <div className="mt-8 text-center">
          <p className="text-gray-700 text-lg font-medium">
            Karena developernya gak dibayar, kalian bisa support developer dengan donasi ke link di bawah
          </p>
          <a
            href="https://saweria.co/sometimeslikeu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-semibold mt-4 block"
          >
            Donasi ke Developer
          </a>
        </div> */}

        {/* Lanjutkan Button */}
        <div className="mt-8">
          <a href="/" className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition duration-200">
            Lanjutkan
          </a>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
