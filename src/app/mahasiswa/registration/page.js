"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "@/lib/firebase";
import dynamic from "next/dynamic";
import PageLoadingWrapper from "@/components/PageLoadingWrapper";

const NavbarHome = dynamic(() => import("@/components/NavbarHome"));
const Footer = dynamic(() => import("@/components/Footer"));

export default function MahasiswaRegisterPage() {
  const router = useRouter();
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [nim, setNim] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nimTaken, setNimTaken] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [nimWarning, setNimWarning] = useState(""); // Validasi input NIM
  const [isLoading, setIsLoading] = useState(false);

  const handleNimChange = (e) => {
    const input = e.target.value;

    if (!/^\d*$/.test(input)) return; // hanya angka

    if (input.length > 10) {
      setNimWarning("Maksimal NIM adalah 10 angka.");

      // Hapus warning setelah 1 detik
      setTimeout(() => {
        setNimWarning("");
      }, 1000);

      return;
    }

    setNim(input);
    setNimWarning("");
  };

  useEffect(() => {
    const checkNim = async () => {
      if (nim.length === 10) {
        try {
          const ref = doc(db, "mahasiswa", nim);
          const snap = await getDoc(ref);
          setNimTaken(snap.exists());
        } catch (err) {
          console.error("Gagal cek NIM:", err);
        }
      } else {
        setNimTaken(false);
      }
    };

    const delay = setTimeout(checkNim, 300);
    return () => clearTimeout(delay);
  }, [nim, db]);

  const generateEmail = useCallback(() => {
    if (nim.length < 10) {
      setNimWarning("NIM Anda belum lengkap.");
      return;
    }
    setEmail(`${nim}@mahasiswa.upnvj.ac.id`);
  }, [nim]);

  const handleNext = useCallback(
    (e) => {
      e.preventDefault();
      setIsLoading(true); // ✅ mulai loading
      setSubmitError(""); // reset error

      if (!nim || !name || !password) {
        setSubmitError("Semua field wajib diisi.");
        setIsLoading(false);
        return;
      }

      if (nimTaken) {
        setSubmitError("NIM sudah terdaftar. Silakan login.");
        setIsLoading(false);
        return;
      }

      const emailGenerated = `${nim}@mahasiswa.upnvj.ac.id`;

      localStorage.setItem(
        "pending_register",
        JSON.stringify({ nim, name, email: emailGenerated, password })
      );

      router.push("/mahasiswa/face-registration");
    },
    [nim, name, password, nimTaken, router]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <NavbarHome
        isLoggedIn={false}
        handleLogout={() => {}}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        userData={{}}
      />

      <div className="h-[38vh] bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 pt-20 sm:pt-28 flex flex-col justify-center items-center">
        <h1 className="text-white text-3xl sm:text-4xl font-bold mt-12 text-center">
          LeADS UPN Veteran Jakarta
        </h1>
        <p className="text-white text-sm sm:text-lg font-light mt-2 text-center">
          Beranda / Daftar Mahasiswa
        </p>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center pb-10 px-4 sm:px-6 bg-white">
        <form
          onSubmit={handleNext}
          className="bg-white px-6 py-10 sm:p-10 rounded-lg w-full max-w-md sm:max-w-xl mt-10 sm:mt-16 shadow-md"
        >
          <h2 className="text-center text-2xl font-bold mb-8">Register</h2>

          {/* NIM */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="NIM (10 digit)"
              value={nim}
              onChange={handleNimChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-black"
            />
          </div>
          {nimWarning && (
            <p className="text-sm text-red-500 mb-2">{nimWarning}</p>
          )}
          {nimTaken && (
            <p className="text-sm text-red-600 mb-4">
              NIM sudah terdaftar.{" "}
              <a
                href="/mahasiswa/login"
                className="text-blue-600 hover:underline font-medium"
              >
                Silakan login
              </a>
              .
            </p>
          )}

          {/* Nama */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Nama Lengkap"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={nimTaken}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-black"
            />
          </div>

          {/* Email */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <input
              type="text"
              placeholder="Klik Button untuk Generate Email"
              value={email}
              readOnly
              disabled={nimTaken}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-black mb-2 sm:mb-0"
            />
            <button
              type="button"
              onClick={generateEmail}
              disabled={nimTaken}
              className="px-4 py-2 text-sm rounded-md text-white bg-blue-500 hover:bg-blue-600"
            >
              Generate Email
            </button>
          </div>

          {/* Password */}
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password (minimal 6 digit angka)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={nimTaken}
              pattern="[0-9]{6,}"
              title="Password harus angka minimal 6 digit"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-50 text-black"
            />
          </div>

          {/* Submit Error */}
          {submitError && (
            <p className="text-red-600 text-sm text-center mb-4">
              {submitError}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md text-lg font-semibold transition flex items-center justify-center ${
              isLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                ></path>
              </svg>
            ) : (
              "Next"
            )}
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
