"use client";

import Link from "next/link";
import { useState } from "react";
import { destinations } from "@/app/content/destinations";
import u from "@/app/components/ui/ui.module.css";
import n from "@/app/components/public/public.module.css";
import s from "@/app/components/public/pages.module.css";

/**
 * Booking request form. Posts to /api/bookings, which writes to the `bookings`
 * collection — the same one /my-trips reads back,
 * and the one the CMS app reads.
 *
 * The trip list comes from the same `destinations` array the rest of the site
 * uses, so the two can't drift apart. No price is shown or sent: the public
 * site quotes nothing now, and the API resolves whatever it needs from the
 * destination id server-side.
 */
export default function BookingForm({
  preselect,
  defaultName,
  defaultEmail,
}: {
  preselect: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [message, setMessage] = useState("");
  const [ref, setRef] = useState("");

  // Tracked so the summary line under the form can name the trip.
  const [tripId, setTripId] = useState(preselect);
  const [people, setPeople] = useState(2);

  const trip = destinations.find((d) => d.id === tripId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setRef("");

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
      setRef(data.ref);
      setMessage(`Booking saved. Your reference is ${data.ref}.`);
      formEl.reset();
      setTripId("");
      setPeople(2);
    } catch {
      setOk(false);
      setMessage("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  // Can't depart in the past.
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className={u.panel}>
      <form className={u.form} onSubmit={handleSubmit}>
        <div className={u.row}>
          <div className={u.field}>
            <label className={u.label} htmlFor="b-name">
              Full name
            </label>
            <input
              id="b-name"
              name="name"
              className={u.input}
              type="text"
              defaultValue={defaultName}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className={u.field}>
            <label className={u.label} htmlFor="b-email">
              Email
            </label>
            <input
              id="b-email"
              name="email"
              className={u.input}
              type="email"
              defaultValue={defaultEmail}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className={u.row}>
          <div className={u.field}>
            <label className={u.label} htmlFor="b-place">
              Destination
            </label>
            <select
              id="b-place"
              name="destinationId"
              className={u.input}
              required
              value={tripId}
              onChange={(e) => setTripId(e.target.value)}
            >
              <option value="" disabled>
                Choose a trip
              </option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.region}
                </option>
              ))}
            </select>
          </div>

          <div className={u.field}>
            <label className={u.label} htmlFor="b-date">
              Departure date
            </label>
            <input
              id="b-date"
              name="departDate"
              className={u.input}
              type="date"
              min={today}
              required
            />
          </div>
        </div>

        <div className={u.row}>
          <div className={u.field}>
            <label className={u.label} htmlFor="b-people">
              Travellers
            </label>
            <input
              id="b-people"
              name="travellers"
              className={u.input}
              type="number"
              min={1}
              max={20}
              value={people}
              onChange={(e) => setPeople(Number(e.target.value) || 1)}
              required
            />
          </div>

          <div className={u.field}>
            <label className={u.label} htmlFor="b-phone">
              Phone
            </label>
            <input
              id="b-phone"
              name="phone"
              className={u.input}
              type="tel"
              placeholder="03xx-xxxxxxx"
              autoComplete="tel"
            />
          </div>
        </div>

        <div className={u.field}>
          <label className={u.label} htmlFor="b-notes">
            Anything we should know?
          </label>
          <textarea
            id="b-notes"
            name="notes"
            className={u.input}
            rows={3}
            placeholder="Dietary needs, accessibility, preferred pace…"
          />
        </div>

        {trip && (
          <ul className={s.facts}>
            <li className={s.fact}>
              <span className={s.factLabel}>
                {trip.nights} nights &middot; {people} traveller
                {people === 1 ? "" : "s"}
              </span>
              {/* No estimate. The public site quotes nothing now — we come
                  back with a figure once we have the dates and the group. */}
              <span className={s.factValue}>We&rsquo;ll quote you back</span>
            </li>
          </ul>
        )}

        <div className={u.actions}>
          <button
            className={`${n.btn} ${n.btnPrimary}`}
            type="submit"
            disabled={busy}
          >
            {busy ? "Saving…" : "Confirm booking"}
          </button>
        </div>

        {message && (
          <p
            className={`${u.notice} ${ok ? u.noticeOk : u.noticeBad}`}
            role="status"
          >
            {message}{" "}
            {ok && ref && <Link href="/my-trips">See it in My trips →</Link>}
          </p>
        )}
      </form>
    </div>
  );
}
