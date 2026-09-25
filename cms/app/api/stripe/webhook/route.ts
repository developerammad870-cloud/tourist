import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { verifyWebhook } from "@/lib/stripe";
import { recordPaidSession } from "@/lib/recordPayment";

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

  try {
    // Shared with the return page — see lib/recordPayment.ts. It ignores
    // sessions Stripe has not marked paid (a bank transfer awaiting funds) and
    // bookings already recorded, which is what makes Stripe's retries harmless.
    const recorded = await recordPaidSession(session);

    return NextResponse.json({
      received: true,
      ...(recorded ? {} : { ignored: session.payment_status }),
    });
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
