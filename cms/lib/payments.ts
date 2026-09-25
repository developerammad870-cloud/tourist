/**
 * What a booking has to pay, and how that number is reached.
 *
 * Pure arithmetic and constants only — no Stripe, no database — because the
 * booking form (a Client Component) shows the figure before anyone is charged,
 * while the checkout route and the webhook recompute it on the server. Both
 * sides must agree, and the only way to guarantee that is one module.
 *
 * Nothing here ever trusts a number from the browser: callers pass a trip id,
 * the trip is looked up server-side, and the total is derived from it.
 */

/** Share of the trip total taken up front to hold the booking. */
export const DEPOSIT_RATE = 0.2;

/**
 * Rupees to one US dollar.
 *
 * Trips are priced in PKR but charged in USD, so this is the conversion. It is
 * a fixed figure rather than a live rate on purpose: a booking's deposit must
 * not change between the form showing it and Stripe charging it. Review it when
 * the real rate moves far enough to matter.
 */
export const PKR_PER_USD = 280;

/** Currency Stripe charges in. Lowercase is what the Stripe API expects. */
export const CURRENCY = "usd";

/** Trip total in rupees: the per-person price times the number of travellers. */
export function totalPkr(pricePerPerson: number, travellers: number): number {
  return pricePerPerson * travellers;
}

/**
 * The deposit in US cents, which is the unit Stripe charges in.
 *
 * Rounded up to the whole cent so the deposit is never a fraction short, and
 * floored at Stripe's 50-cent minimum — below that Stripe rejects the session,
 * which would otherwise show the traveller an error at the worst moment.
 */
export function depositUsdCents(totalInPkr: number): number {
  const cents = Math.ceil((totalInPkr * DEPOSIT_RATE * 100) / PKR_PER_USD);
  return Math.max(50, cents);
}

/** "$123.45" — for the form, the success page and the orders list. */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/** "Rs 145,000" — trips are quoted in rupees everywhere else in the CMS. */
export function formatPkr(amount: number): string {
  return `Rs ${amount.toLocaleString("en-PK")}`;
}

/** How a booking's payment stands. Absent on bookings made before payments. */
export type PaymentStatus = "unpaid" | "pending" | "paid";
