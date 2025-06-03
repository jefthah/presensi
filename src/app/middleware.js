// middleware.js

import { NextResponse } from 'next/server';

export function middleware(request) {
  const url = request.nextUrl.clone();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/mahasiswa')) {
    const sessionCookie = request.cookies.get('session_mahasiswa');

    if (!sessionCookie) {
      url.pathname = '/mahasiswa/login';
      return NextResponse.redirect(url);
    }

    try {
      const sessionData = JSON.parse(sessionCookie.value);

      if (!sessionData.isLoggedIn || sessionData.role !== "mahasiswa") {
        url.pathname = '/mahasiswa/login';
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Error parsing session_mahasiswa:", error);
      url.pathname = '/mahasiswa/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/mahasiswa/:path*'],
};
