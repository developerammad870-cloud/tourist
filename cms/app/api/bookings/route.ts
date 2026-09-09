import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { destinations } from "@/app/components/home/destinations";
import { publish } from "@/lib/realtime";

/**
 * Booking requests. Writes to the `bookings` collection — the same one the
 * public website writes to and the one /orders reads back.
 *
 * No session check: this app has no sign-in. See the README's "Security" note.
 */

// GET - list bookings, newest first
export async function GET() {
  try {
    const db = await getDb();
    const bookings = await db
      .collection("bookings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, bookings });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

// POST - create a booking request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, destinationId, departDate, travellers, notes } = body;

    if (!name || !email || !destinationId || !departDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, destination and departure date are required",
        },
        { status: 400 }
      );
    }

    // Resolve the trip server-side rather than trusting a price from the
    // client — otherwise the total is whatever the browser says it is.
    const trip = destinations.find((d) => d.id === destinationId);

    if (!trip) {
      return NextResponse.json(
        { success: false, message: "Unknown destination" },
        { status: 400 }
      );
    }

    const people = Math.min(20, Math.max(1, Number(travellers) || 1));

    const db = await getDb();

    // Human-readable reference; the count is only used to make it readable,
    // uniqueness still comes from _id.
    const seq = (await db.collection("bookings").countDocuments()) + 2401;

    const doc = {
      ref: `RMA-${seq}`,
      name,
      // Lowercased to match how the public site scopes a traveller's own
      // bookings — otherwise a booking made here wouldn't show up there.
      email: String(email).trim().toLowerCase(),
      phone: phone ?? "",
      userId: null,
      destinationId: trip.id,
      trip: trip.name,
      region: trip.region,
      departDate,
      travellers: people,
      nights: trip.nights,
      total: trip.priceFrom * people,
      notes: notes ?? "",
      status: "pending" as const,
      createdAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(doc);

    // After the write, never before: the feed should only ever announce
    // enquiries that actually exist. Not awaited for its result — see
    // lib/realtime.ts.
    await publish({
      type: "booking.created",
      ref: doc.ref,
      trip: doc.trip,
      name: doc.name,
      travellers: doc.travellers,
      source: "cms",
    });

    return NextResponse.json({
      success: true,
      message: "Booking request received",
      ref: doc.ref,
      bookingId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to create booking" },
      { status: 500 }
    );
  }
}
