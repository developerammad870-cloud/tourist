import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/** Who am I? Used by client components that need the session after hydration. */
export async function GET() {
  const user = await getSession();
  return NextResponse.json({ success: true, user });
}
