// src/app/api/daftar-mahasiswa/route.js
import { NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Inisialisasi Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const db = getFirestore();

export async function POST(req) {
  try {
    const { nim, name, email, password } = await req.json();

    if (!nim || !name || !email || !password) {
      console.warn("[API] ❌ Data tidak lengkap");
      return NextResponse.json(
        { error: "Semua data wajib diisi." },
        { status: 400 }
      );
    }

    // Buat user di Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Simpan data ke Firestore
    await setDoc(doc(db, "mahasiswa", nim), {
      nim,
      name,
      email,
      role: "mahasiswa",
    });

    // ✅ LOG KE TERMINAL
    console.log("\n📥 Mahasiswa berhasil didaftarkan:");
    console.log(
      JSON.stringify(
        {
          nim,
          name,
          email,
        },
        null,
        2
      )
    );

    return NextResponse.json(
      { message: "Registrasi berhasil." },
      { status: 200 }
    );
  } catch (error) {
    console.error("🔥 ERROR API:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
