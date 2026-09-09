"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "./RealtimeProvider";
import s from "./live.module.css";

/**
 * The cross in the top-right corner of an order card: removes the booking from
 * the database entirely.
 *
 * It only exists once the booking has been dealt with — confirmed or cancelled.
 * While one is still pending there is nothing to tidy away, and a delete button
 * sitting next to Confirm/Cancel on an undecided enquiry is an accident waiting
 * to happen.
 *
 * Deleting is the one thing here that cannot be undone, so it asks twice: the
 * first click arms it ("Remove?"), the second does it. The armed state clears
 * itself after a few seconds so a stray click never leaves a live trap on the
 * screen.
 *
 * Like everything else on this page the command goes up the WebSocket; the
 * socket service does the delete and broadcasts it, so the row disappears from
 * every open tab at once.
 */
export default function OrderCorner({
  id,
  status,
  name,
}: {
  id: string;
  status: "confirmed" | "pending" | "cancelled";
  name: string;
}) {
  const { send, status: connection } = useRealtime();
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  // Disarm on its own — see the note above.
  useEffect(() => {
    if (!armed) return;
    const timer = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(timer);
  }, [armed]);

  // Nothing to remove until a decision has been made.
  if (status === "pending") return null;

  async function remove() {
    if (!armed) {
      setArmed(true);
      return;
    }
    setBusy(true);
    try {
      await send({ type: "booking.delete", id });
      // No local state change: the broadcast refreshes the page and the card
      // goes with it.
    } catch {
      setBusy(false);
      setArmed(false);
    }
  }

  return (
    <button
      type="button"
      className={`${s.corner} ${armed ? s.cornerArmed : s.cornerBtn}`}
      onClick={remove}
      disabled={busy || connection !== "live"}
      aria-label={
        armed ? `Confirm removal of ${name}'s booking` : `Remove ${name}'s booking`
      }
      title={
        connection !== "live"
          ? "Socket offline"
          : armed
            ? "Click again to remove permanently"
            : "Remove this booking"
      }
    >
      {armed ? "Remove?" : <Cross />}
    </button>
  );
}

function Cross() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
