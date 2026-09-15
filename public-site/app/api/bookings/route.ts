import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { destinations } from "@/app/content/destinations";
import { publish } from "@/lib/realtime";

/**
 * Booking requests. Writes to the `bookings` collection, which is what the
 * public /book form posts to, what /my-trips shows the traveller, and what
 * the CMS app reads back.
 */

// GET - list bookings, newest first.
//
// An admin sees every booking; a signed-in traveller sees only their own; a
// guest sees nothing. Scoping here rather than in the page means the API can't
// leak the whole table to a curious visitor.
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sign in to view bookings" },
        { status: 401 }
      );
    }

    const db = await getDb();

    const filter =
      session.role === "admin" ? {} : { email: session.email.toLowerCase() };

    const bookings = await db
      .collection("bookings")
      .find(filter)
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

// POST - create a booking request. Open to guests: making someone register
// before they can enquire is the fastest way to lose the enquiry.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, destinationId, departDate, travellers, notes } =
      body;

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

    // Attach the session when there is one, so /my-trips can find this later.
    const session = await getSession();

    const doc = {
      ref: `RMA-${seq}`,
      name,
      email: String(email).trim().toLowerCase(),
      phone: phone ?? "",
      userId: session?.id ?? null,
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

    // After the write, never before: the CMS feed should only ever announce
    // enquiries that actually exist. Failures here are swallowed — see
    // lib/realtime.ts.
    await publish({
      type: "booking.created",
      ref: doc.ref,
      trip: doc.trip,
      name: doc.name,
      travellers: doc.travellers,
      source: "public-site",
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
