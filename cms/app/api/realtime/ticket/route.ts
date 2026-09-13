import { NextResponse } from "next/server";
import { createSocketTicket } from "@/lib/auth";
import { guardApi } from "@/lib/session";

/**
 * A sixty-second pass for the WebSocket, for admins only.
 *
 * The socket carries every new enquiry — customers' names and trips — and the
 * commands that confirm, cancel and delete bookings. That is back-office data
 * and back-office power, so a normal account never gets a ticket and never
 * opens the socket at all.
 */
export async function GET() {
  const guard = await guardApi("admin");
  if (guard.denied) return guard.denied;

  return NextResponse.json({
    success: true,
    ticket: await createSocketTicket(guard.user),
  });
}
