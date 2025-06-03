"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase"; // ✅ <- ini perbaikan penting
import Cookies from "js-cookie";

export default function DosenLoginPage() {
  const router = useRouter();
  const [nim, setNim] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    const email = `${nim}@dosen.upnvj.ac.id`;

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Fetch data dosen dari Firestore
      const dosenDocRef = doc(db, "dosen", nim);
      const dosenDocSnap = await getDoc(dosenDocRef);

      if (dosenDocSnap.exists()) {
        const dosenData = dosenDocSnap.data();

        // Simpan data dosen ke cookies (disimpan sebagai JSON string)
        Cookies.set("dosen_info", JSON.stringify(dosenData), { expires: 1 }); // Expire 1 hari
      } else {
        console.error("Data dosen tidak ditemukan.");
        alert("Data dosen tidak ditemukan.");
        return;
      }

      router.push("/dosen/home");
    } catch (error) {
      console.error("Login error:", error);
      alert("Login gagal. Silakan coba lagi.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-green-500 via-blue-600 to-purple-500 flex flex-col">
      <main className="flex flex-col items-center justify-center flex-grow">
        <h2 className="text-4xl font-bold text-white mb-8">Login Dosen</h2>
        <form
          onSubmit={handleLogin}
          className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md md:max-w-xl space-y-6"
        >
          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-2">NIM</label>
            <input
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              className="border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
              required
              placeholder="Masukkan NIM"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 font-semibold mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500"
              required
              placeholder="Masukkan Password"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
          >
            Login
          </button>
        </form>
        <div className="text-white mt-6 text-center">
          <p>
            Belum punya akun?{" "}
            <span
              onClick={() => router.push("/dosen/register")}
              className="underline cursor-pointer font-semibold"
            >
              Daftar di sini
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
