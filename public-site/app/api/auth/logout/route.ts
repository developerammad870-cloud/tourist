import { NextResponse } from "next/server";
import { sessionCookie } from "@/lib/auth";

/**
 * Sign out by expiring the session cookie.
 *
 * POST rather than GET so a stray <img> or prefetch can't log somebody out.
 */
export async function POST() {
  const response = NextResponse.json({ success: true, message: "Signed out" });

  response.cookies.set(sessionCookie.name, "", {
    ...sessionCookie.options,
    maxAge: 0,
  });

  return response;
}
