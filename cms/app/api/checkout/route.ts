import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { guardApi } from "@/lib/session";
import { getStripe } from "@/lib/stripe";
import { CURRENCY, DEPOSIT_RATE, depositUsdCents } from "@/lib/payments";

/**
 * Starts a Stripe Checkout session for a booking's deposit.
 *
 * The booking is already in MongoDB by the time this runs — /api/bookings saves
 * it first — so an abandoned payment costs nothing: the enquiry is still there,
 * marked unpaid, and the traveller can be sent back to pay later.
 *
 * The amount is never taken from the request. The body carries a booking id and
 * nothing else; the total comes from the stored booking and the deposit from
 * lib/payments. Otherwise anyone could post a one-cent trip.
 */
export async function POST(request: Request) {
  // Any signed-in account may pay for its own booking; the ownership check
  // below is what stops one traveller paying against another's record.
  const guard = await guardApi("user");
  if (guard.denied) return guard.denied;

  try {
    const { bookingId } = await request.json();

    if (typeof bookingId !== "string" || !ObjectId.isValid(bookingId)) {
      return NextResponse.json(
        { success: false, message: "A valid booking id is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const bookings = db.collection("bookings");
    const booking = await bookings.findOne({ _id: new ObjectId(bookingId) });

    if (!booking) {
      return NextResponse.json(
        { success: false, message: "That booking no longer exists" },
        { status: 404 }
      );
    }

    // An admin can take payment for anyone; everyone else only for their own.
    const own =
      booking.email === guard.user.email.toLowerCase() ||
      String(booking.userId ?? "") === guard.user.id;

    if (guard.user.role !== "admin" && !own) {
      return NextResponse.json(
        { success: false, message: "That booking belongs to someone else" },
        { status: 403 }
      );
    }

    if (booking.payment?.status === "paid") {
      return NextResponse.json(
        { success: false, message: "This booking is already paid" },
        { status: 409 }
      );
    }

    const amount = depositUsdCents(booking.total ?? 0);
    const percent = Math.round(DEPOSIT_RATE * 100);
    const people = Number(booking.travellers ?? 1);

    // Built from the request rather than a constant, so a browser that opened
    // the CMS on this machine's Wi-Fi address comes back to that same address
    // instead of a localhost that means a different computer.
    const origin = new URL(request.url).origin;

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      customer_email: booking.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: amount,
            product_data: {
              name: `${booking.trip} — ${percent}% deposit`,
              description: `${people} traveller${people === 1 ? "" : "s"}, departing ${booking.departDate}. Booking ${booking.ref}.`,
            },
          },
        },
      ],
      // What the webhook reads to find this booking again. Stripe sends the
      // metadata back on the event, so nothing has to be looked up by email.
      metadata: {
        bookingId: String(booking._id),
        ref: String(booking.ref),
        trip: String(booking.trip ?? ""),
      },
      success_url: `${origin}/bookings/paid?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/bookings?payment=cancelled&ref=${encodeURIComponent(String(booking.ref))}`,
    });

    // "pending" only means a session was opened. Nothing here marks a booking
    // paid: that is the webhook's job, on Stripe's word rather than the
    // browser's, because the traveller can close the tab mid-payment.
    await bookings.updateOne(
      { _id: booking._id },
      {
        $set: {
          payment: {
            status: "pending",
            provider: "stripe",
            sessionId: session.id,
            amountUsdCents: amount,
            currency: CURRENCY,
            updatedAt: new Date(),
          },
        },
      }
    );

    return NextResponse.json({ success: true, url: session.url });
  } catch (error) {
    console.error(error);

    // A missing key is a setup problem, not a server fault: say so plainly, so
    // the fix is obvious the first time anyone runs this.
    const message =
      error instanceof Error && error.message.includes("STRIPE_SECRET_KEY")
        ? error.message
        : "Could not start the payment";

    return NextResponse.json({ success: false, message }, { status: 503 });
  }
}
