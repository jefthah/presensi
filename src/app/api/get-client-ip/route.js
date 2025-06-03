// src/app/api/get-client-ip/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  // Dapatkan IP dari request headers
  const xForwardedFor = request.headers.get("x-forwarded-for");
  const ip = xForwardedFor
    ? xForwardedFor.split(",")[0].trim()
    : request.ip || "unknown";

  return NextResponse.json({ ip });
}
