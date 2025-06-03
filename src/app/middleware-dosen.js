import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Hanya jalan untuk halaman dosen
  if (!pathname.startsWith("/dosen")) {
    return NextResponse.next();
  }

  // Cek cookies dosen
  const dosenLoggedIn = request.cookies.get("dosen_logged_in")?.value === "true";

  // Kalau belum login dan bukan halaman login, redirect ke /dosen/login
  if (!dosenLoggedIn && pathname !== "/dosen/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dosen/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dosen/:path*"],
};
