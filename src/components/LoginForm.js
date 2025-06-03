"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginForm({
  nim,
  setNim,
  password,
  setPassword,
  handleLogin,
  error,
  nimExists,
  isLoading,
}) {
  const router = useRouter();
  const [nimWarning, setNimWarning] = useState("");

  const handleNimChange = (e) => {
    const input = e.target.value;

    // Cegah input selain angka
    if (!/^\d*$/.test(input)) return;

    // Jika lebih dari 10 angka, tahan dan beri peringatan
    if (input.length > 10) {
      setNimWarning("Maksimal 10 digit angka.");
      return;
    }

    setNim(input);
    setNimWarning(""); // Reset jika sudah benar
  };

  return (
    <form
      onSubmit={handleLogin}
      className="bg-white p-10 rounded-lg w-full max-w-xl mx-auto mt-16"
    >
      <h2 className="text-center text-2xl font-bold mb-8">
        Login to your account
      </h2>

      {/* Input NIM */}
      <div className="mb-1">
        <input
          type="text"
          placeholder="NIM"
          value={nim}
          onChange={handleNimChange}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-gray-50 text-black text-lg"
          required
        />
      </div>

      {/* Peringatan NIM lebih dari 10 angka */}
      {nimWarning && <p className="text-sm text-red-500 mb-1">{nimWarning}</p>}

      {/* Jika NIM tidak ditemukan */}
      {nimExists === false && (
        <p className="text-sm text-red-600 mb-2">
          NIM tidak ditemukan.{" "}
          <button
            type="button"
            onClick={() => router.push("/mahasiswa/registration")}
            className="text-blue-600 hover:underline font-semibold"
          >
            Daftar sekarang
          </button>
        </p>
      )}

      {/* Input Password */}
      <div className="mb-6 mt-4">
        <input
          type="password"
          placeholder="Kata sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-6 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-gray-50 text-black text-lg"
          required
        />
      </div>

      {/* Checkbox dan forgot */}
      <div className="flex items-center justify-between mb-8">
        <label className="flex items-center text-sm text-gray-600">
          <input type="checkbox" className="mr-2" />
          Ingat username
        </label>
        <a href="#" className="text-sm text-blue-500 hover:underline">
          Forgot Password?
        </a>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
      )}

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
          "Login"
        )}
      </button>

      <div className="mt-8 text-center text-xs text-gray-500">
        Kuki harus diaktifkan pada peramban Anda
      </div>
    </form>
  );
}
