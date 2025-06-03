"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function DosenRegisterPage() {
  const router = useRouter();
  const [nip, setNip] = useState("");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const generateEmail = () => {
    if (nip) {
      setEmail(`${nip}@dosen.upnvj.ac.id`);
    } else {
      alert("Isi NIP terlebih dahulu.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!nip || !nama || !email || !password) {
      alert("Semua data harus diisi.");
      return;
    }

    try {
      // Daftarkan user ke Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);

      // Simpan data ke Firestore
      await setDoc(doc(db, "dosen", nip), {
        nip,
        nama,
        email,
        role: "dosen",
      });

      alert("Registrasi berhasil! Silakan login.");
      router.push("/dosen/login");
    } catch (error) {
      console.error("Gagal daftar:", error);

      // ✅ Penanganan error ditempatkan di sini, di dalam catch
      if (error.code === "auth/email-already-in-use") {
        alert("Email sudah terdaftar. Silakan gunakan NIP lain.");
      } else {
        alert("Registrasi gagal: " + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-blue-600 to-purple-600 px-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-lg space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-gray-800">
          Daftar Akun Dosen
        </h2>

        {/* NIP */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">NIP</label>
          <input
            type="text"
            value={nip}
            onChange={(e) => setNip(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan NIP"
            required
          />
        </div>

        {/* Nama */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Nama</label>
          <input
            type="text"
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan Nama"
            required
          />
        </div>

        {/* Generate Email */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={generateEmail}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition w-1/3"
          >
            Generate Email
          </button>
          <input
            type="text"
            value={email}
            disabled
            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
            placeholder="Email akan dibuat otomatis"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Masukkan Password"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition"
        >
          Daftar
        </button>
      </form>
    </div>
  );
}
