import { ObjectId } from "mongodb";
import type Stripe from "stripe";
import { getDb } from "./mongodb";
import { publish } from "./realtime";
import { formatUsd } from "./payments";

/**
 * Writes a paid Stripe session onto its booking, once.
 *
 * Two callers, one rule. The webhook is the reliable one — Stripe reports even
 * when the browser is gone — but it needs a signing secret, which a local setup
 * does not have until someone runs the Stripe CLI. The return page therefore
 * does the same thing from the other side: it asks Stripe about the session id
 * it was handed and, if Stripe says paid, records it.
 *
 * That is safe precisely because the answer comes from Stripe. Neither caller
 * trusts a browser: the page fetches the session, the webhook verifies a
 * signature. A guessed session id can only ever mark a booking paid that Stripe
 * already considers paid.
 *
 * Idempotent by query: the update only matches a booking not already paid, so a
 * webhook retry, a page refresh, or both racing leave one write and one
 * announcement.
 */
export async function recordPaidSession(session: Stripe.Checkout.Session): Promise<boolean> {
  if (session.payment_status !== "paid") return false;

  const bookingId = session.metadata?.bookingId;

  if (!bookingId || !ObjectId.isValid(bookingId)) {
    console.warn("[stripe] paid session with no usable bookingId", session.id);
    return false;
  }

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

  // Already recorded by whichever caller got there first.
  if (!booking) return false;

  await publish({
    type: "booking.paid",
    ref: String(booking.ref ?? "—"),
    trip: String(booking.trip ?? "Trip"),
    name: String(booking.name ?? "Someone"),
    amount: formatUsd(session.amount_total ?? 0),
  });

  return true;
}
