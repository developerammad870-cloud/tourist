"use client";

import { useState } from "react";
import { useRealtime } from "./RealtimeProvider";
import s from "./live.module.css";

/**
 * Confirm / Cancel for one booking.
 *
 * The click goes up the WebSocket, not to an API route: the socket service
 * writes the new status to MongoDB and broadcasts the result, which is what
 * re-renders this page — and every other tab that has it open. There is no
 * fetch() here and no optimistic local state, so what you see after a click is
 * what the database actually holds.
 */
export default function OrderActions({
  id,
  status,
}: {
  id: string;
  status: "confirmed" | "pending" | "cancelled";
}) {
  const { send, status: connection } = useRealtime();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const offline = connection !== "live";

  async function setStatus(next: "confirmed" | "cancelled") {
    setBusy(next);
    setError("");
    try {
      const reply = await send({ type: "booking.setStatus", id, status: next });
      if (reply.type === "command.error") {
        setError(String(reply.error ?? "failed"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={s.actions}>
      <button
        type="button"
        className={`${s.action} ${s.confirm}`}
        onClick={() => setStatus("confirmed")}
        disabled={offline || busy !== null || status === "confirmed"}
      >
        {busy === "confirmed" ? "Saving…" : "Confirm"}
      </button>

      <button
        type="button"
        className={`${s.action} ${s.cancel}`}
        onClick={() => setStatus("cancelled")}
        disabled={offline || busy !== null || status === "cancelled"}
      >
        {busy === "cancelled" ? "Saving…" : "Cancel"}
      </button>

      {/* Says why the buttons are dead, rather than leaving them mysteriously
          greyed out. */}
      {offline && <span className={s.actionNote}>socket offline</span>}
      {error && <span className={s.actionError}>{error}</span>}
    </div>
  );
}
