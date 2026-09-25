"use client";

import { useState } from "react";
import s from "../components/ui/ui.module.css";
import { destinations } from "../components/home/destinations";
import {
  DEPOSIT_RATE,
  depositUsdCents,
  formatPkr,
  formatUsd,
  totalPkr,
} from "@/lib/payments";

/** 20, as a whole number, for the wording on this screen. */
const DEPOSIT_PERCENT = Math.round(DEPOSIT_RATE * 100);

/**
 * Booking request form. Posts to /api/bookings, which writes to the
 * `bookings` collection in MongoDB — the same collection /orders reads back,
 * and the same one the public website writes to.
 *
 * The trip list comes from the same `destinations` array the home page uses,
 * so the two can't drift apart. The price is NOT sent from here: the API
 * resolves it from the destination id server-side.
 */
export default function BookingForm({
  preselect,
  cancelledRef = "",
}: {
  preselect: string;
  /** Booking reference the traveller backed out of paying, from Stripe's cancel URL. */
  cancelledRef?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [message, setMessage] = useState("");
  /*
   * The destination select is controlled so a trip card on the home page can
   * link here as /bookings?trip=<id> and have it arrive already chosen. The id
   * is resolved and validated on the server (see page.tsx) and handed down as
   * a prop, so the first render is already correct — no effect, no flash of an
   * empty select after hydration.
   */
  const [tripId, setTripId] = useState(preselect);

  // Controlled so the deposit line below can quote a real figure before anyone
  // commits to paying it.
  const [people, setPeople] = useState(2);

  const trip = destinations.find((d) => d.id === tripId);
  const total = trip ? totalPkr(trip.priceFrom, people) : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          destinationId: form.get("destinationId"),
          departDate: form.get("departDate"),
          travellers: form.get("travellers"),
          notes: form.get("notes"),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOk(false);
        setMessage(data.message ?? "Couldn't save that booking.");
        return;
      }

      setOk(true);
      setMessage(`Booking ${data.ref} saved. Taking you to the payment page…`);

      /*
       * Straight on to Stripe for the deposit. The booking is already stored,
       * so a failure here — no key configured, Stripe unreachable, the
       * traveller closing the tab — costs the enquiry nothing: it sits unpaid
       * on /orders and can be paid later.
       */
      const pay = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: data.bookingId }),
      });

      const payment = await pay.json();

      if (pay.ok && payment.success && payment.url) {
        // A full navigation, not router.push: Stripe Checkout is its own site.
        window.location.href = payment.url;
        return;
      }

      setMessage(
        `Booking ${data.ref} saved, but the payment page could not be opened. ${
          payment.message ?? ""
        }`
      );

      formEl.reset();
      // reset() clears the DOM, but the destination select is controlled by
      // React — without this it would keep showing the trip just booked while
      // every other field emptied.
      setTripId("");
    } catch {
      setOk(false);
      setMessage("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.head}>
        <p className={s.eyebrow}>Reserve</p>
        <h1 className={s.title}>Book your travel</h1>
        <p className={s.lede}>
          Tell us where and when. A {DEPOSIT_PERCENT}% deposit holds the place;
          the rest is settled before departure.
        </p>
      </div>

      <div className={s.panel}>
        {/* Stripe sends the traveller back here when they close the payment
            page. The booking is saved either way, so this says where it went
            rather than treating it as an error. */}
        {cancelledRef && !message && (
          <p className={`${s.notice} ${s.noticeBad}`} role="status">
            Payment cancelled. Booking {cancelledRef} is saved and unpaid — an
            admin can take the deposit from Orders.
          </p>
        )}

        <form className={s.form} onSubmit={handleSubmit}>
          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="b-name">Full name</label>
              <input id="b-name" name="name" className={s.input} type="text"
                placeholder="Your full name" autoComplete="name" required />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="b-email">Email</label>
              <input id="b-email" name="email" className={s.input} type="email"
                placeholder="you@example.com" autoComplete="email" required />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="b-place">Destination</label>
              <select
                id="b-place"
                name="destinationId"
                className={s.input}
                required
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
              >
                <option value="" disabled>Choose a trip</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.region}
                  </option>
                ))}
              </select>
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="b-date">Departure date</label>
              <input id="b-date" name="departDate" className={s.input}
                type="date" required />
            </div>
          </div>

          <div className={s.row}>
            <div className={s.field}>
              <label className={s.label} htmlFor="b-people">Travellers</label>
              <input id="b-people" name="travellers" className={s.input} type="number"
                min={1} max={20} required
                value={people}
                onChange={(e) => setPeople(Number(e.target.value) || 1)} />
            </div>
            <div className={s.field}>
              <label className={s.label} htmlFor="b-phone">Phone</label>
              <input id="b-phone" name="phone" className={s.input} type="tel"
                placeholder="03xx-xxxxxxx" autoComplete="tel" />
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="b-notes">Anything we should know?</label>
            <textarea id="b-notes" name="notes" className={s.input} rows={3}
              placeholder="Dietary needs, accessibility, preferred pace…" />
          </div>

          {/* What the card will actually be charged, worked out with the same
              functions the server uses — see lib/payments.ts. */}
          {trip && (
            <p className={s.notice} role="status">
              {trip.name} · {people} traveller{people === 1 ? "" : "s"} ·{" "}
              {formatPkr(total)} total. Due now: {formatUsd(depositUsdCents(total))}{" "}
              ({DEPOSIT_PERCENT}% deposit, charged in USD).
            </p>
          )}

          <div className={s.actions}>
            <button className={`${s.btn} ${s.btnPrimary}`} type="submit" disabled={busy}>
              {busy ? "Saving…" : "Book and pay deposit"}
            </button>
          </div>

          {message && (
            <p className={`${s.notice} ${ok ? s.noticeOk : s.noticeBad}`} role="status">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
