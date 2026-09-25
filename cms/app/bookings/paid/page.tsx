import Link from "next/link";
import s from "../../components/ui/ui.module.css";
import { getStripe } from "@/lib/stripe";
import { formatUsd } from "@/lib/payments";
import { recordPaidSession } from "@/lib/recordPayment";
import { requireUser } from "@/lib/session";

/**
 * Where Stripe returns the traveller after a successful payment.
 *
 * The session id in the URL is not believed on its own: the session is fetched
 * from Stripe, and only Stripe's own "paid" counts. With that in hand this
 * records the payment, through the same function the webhook uses.
 *
 * Both paths exist because each covers the other's gap. The webhook is the
 * dependable one — it arrives even if the traveller closes the tab — but it
 * needs a signing secret, which a local machine lacks until someone runs the
 * Stripe CLI. This page needs no secret but needs the traveller to come back.
 * Whichever happens first does the write; the second finds it done.
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

      // Writes it onto the booking unless the webhook has already done so.
      if (paid) await recordPaidSession(session);
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
