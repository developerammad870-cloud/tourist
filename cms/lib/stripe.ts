import Stripe from "stripe";

/**
 * The Stripe client, built from the secret key.
 *
 * Server-only: STRIPE_SECRET_KEY has no NEXT_PUBLIC_ prefix, so it can never be
 * inlined into a browser bundle. Importing this file from a Client Component is
 * a build error, which is the intended guard.
 *
 * Created lazily rather than at module load. A missing key should fail the one
 * request that needs Stripe, with a message saying what to do, instead of
 * taking down every page that happens to import something from here.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;

  const key = process.env.STRIPE_SECRET_KEY;

  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your test key (sk_test_...) from https://dashboard.stripe.com/test/apikeys to cms/.env.local and restart the dev server."
    );
  }

  // No apiVersion pinned: the account's default is used, so the SDK and the
  // dashboard always agree about what a session looks like.
  client = new Stripe(key);
  return client;
}

/** Verified Stripe webhook event, or null when the signature does not match. */
export function verifyWebhook(body: string, signature: string | null): Stripe.Event | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret || !signature) return null;

  try {
    return getStripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    // Anything unsigned, replayed or tampered with is simply not an event.
    return null;
  }
}
