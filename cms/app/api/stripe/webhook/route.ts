import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import type Stripe from "stripe";
import { getDb } from "@/lib/mongodb";
import { verifyWebhook } from "@/lib/stripe";
import { publish } from "@/lib/realtime";
import { formatUsd } from "@/lib/payments";

/**
 * Stripe's callback: the only thing that marks a booking paid.
 *
 * Why not the success page? Because the browser can be closed the moment after
 * the card is accepted, and a redirect can be forged by anyone who can read the
 * URL. Stripe signs this request, so it is the one report that can be trusted.
 *
 * It has to be reachable without a session — Stripe cannot log in — which is
 * why the path is in PUBLIC_API. The signature is what authenticates it: a
 * request without a matching one is rejected before anything is read.
 *
 * Stripe retries on any non-2xx, so an event that arrives twice must do no
 * harm. The update only ever writes the same fields, and the "not already paid"
 * filter stops a retry re-announcing the payment on the live feed.
 */
export async function POST(request: Request) {
  // The raw text, not request.json(): the signature is over these exact bytes,
  // and parsing first would change them.
  const body = await request.text();
  const event = verifyWebhook(body, request.headers.get("stripe-signature"));

  if (!event) {
    return NextResponse.json({ received: false, message: "Bad signature" }, { status: 400 });
  }

  // Card payments settle on the first; slower methods land on the second.
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // completed fires for unpaid sessions too (bank transfers awaiting funds).
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true, ignored: session.payment_status });
  }

  const bookingId = session.metadata?.bookingId;

  if (!bookingId || !ObjectId.isValid(bookingId)) {
    // Nothing to attach it to. 200 on purpose: retrying will not help.
    console.warn("[stripe] paid session with no usable bookingId", session.id);
    return NextResponse.json({ received: true, ignored: "no bookingId" });
  }

  try {
    const db = await getDb();

    const booking = await db.collection("bookings").findOneAndUpdate(
      { _id: new ObjectId(bookingId), "payment.status": { $ne: "paid" } },
      {
        $set: {
          payment: {
            status: "paid",
            provider: "stripe",
            sessionId: session.id,
            paymentIntentId:
              typeof session.payment_intent === "string" ? session.payment_intent : null,
            amountUsdCents: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
            paidAt: new Date(),
            updatedAt: new Date(),
          },
        },
      },
      { returnDocument: "after" }
    );

    // Already paid, or already deleted: a retry of an event we handled.
    if (!booking) {
      return NextResponse.json({ received: true, ignored: "already paid" });
    }

    await publish({
      type: "booking.paid",
      ref: String(booking.ref ?? "—"),
      trip: String(booking.trip ?? "Trip"),
      name: String(booking.name ?? "Someone"),
      amount: formatUsd(session.amount_total ?? 0),
    });

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(error);

    // 500 so Stripe retries: the payment happened, and the booking must catch
    // up with it even if the database was briefly unreachable.
    return NextResponse.json(
      { received: false, message: "Could not record the payment" },
      { status: 500 }
    );
  }
}
