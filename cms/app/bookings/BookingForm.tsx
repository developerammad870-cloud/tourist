"use client";

import { useState } from "react";
import s from "../components/ui/ui.module.css";
import { destinations } from "../components/home/destinations";

/**
 * Booking request form. Posts to /api/bookings, which writes to the
 * `bookings` collection in MongoDB — the same collection /orders reads back,
 * and the same one the public website writes to.
 *
 * The trip list comes from the same `destinations` array the home page uses,
 * so the two can't drift apart. The price is NOT sent from here: the API
 * resolves it from the destination id server-side.
 */
export default function BookingForm({ preselect }: { preselect: string }) {
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
      setMessage(`Booking saved. Your reference is ${data.ref}.`);
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
          Tell us where and when. We&rsquo;ll confirm availability and hold your
          place for 48 hours.
        </p>
      </div>

      <div className={s.panel}>
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
                min={1} max={20} defaultValue={2} required />
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

          <div className={s.actions}>
            <button className={`${s.btn} ${s.btnPrimary}`} type="submit" disabled={busy}>
              {busy ? "Saving…" : "Confirm booking"}
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
