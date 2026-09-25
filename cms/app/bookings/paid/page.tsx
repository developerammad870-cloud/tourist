import Link from "next/link";
import s from "../../components/ui/ui.module.css";
import { getStripe } from "@/lib/stripe";
import { formatUsd } from "@/lib/payments";
import { requireUser } from "@/lib/session";

/**
 * Where Stripe returns the traveller after a successful payment.
 *
 * This screen only *reports*. What marks the booking paid is the webhook — see
 * app/api/stripe/webhook/route.ts — because anyone can type this URL, and a
 * traveller who closes the tab at the wrong moment never reaches it at all.
 *
 * So the session is read back from Stripe rather than trusted from the query
 * string: the id in the URL is only useful to someone who just paid, and asking
 * Stripe is what turns it into a fact. If the webhook has not landed yet, the
 * booking simply shows as paid here a moment before /orders catches up.
 */
export const dynamic = "force-dynamic";

export default async function PaidPage(props: PageProps<"/bookings/paid">) {
  await requireUser("/bookings/paid");

  const { session_id: sessionId } = await props.searchParams;

  let paid = false;
  let amount = "";
  let ref = "";
  let trip = "";

  if (typeof sessionId === "string" && sessionId.startsWith("cs_")) {
    try {
      const session = await getStripe().checkout.sessions.retrieve(sessionId);
      paid = session.payment_status === "paid";
      amount = formatUsd(session.amount_total ?? 0);
      ref = String(session.metadata?.ref ?? "");
      trip = String(session.metadata?.trip ?? "");
    } catch (error) {
      // An unknown id, or Stripe unreachable. Nothing here changes the
      // booking, so the honest thing is to say we could not confirm it.
      console.error(error);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.head}>
        <p className={s.eyebrow}>Payment</p>
        <h1 className={s.title}>{paid ? "Deposit received" : "Payment not confirmed"}</h1>
        <p className={s.lede}>
          {paid
            ? `Thank you${ref ? ` — booking ${ref}` : ""}. We have your ${amount} deposit${
                trip ? ` for ${trip}` : ""
              }, and the place is held. The balance is settled before departure.`
            : "We could not confirm this payment. If money has left your account it will still be recorded — check Orders in a moment, or contact us with your booking reference."}
        </p>
      </div>

      <div className={s.actions}>
        <Link className={`${s.btn} ${s.btnPrimary}`} href="/bookings">
          Book another trip
        </Link>
        <Link className={`${s.btn} ${s.btnGhost}`} href="/">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
