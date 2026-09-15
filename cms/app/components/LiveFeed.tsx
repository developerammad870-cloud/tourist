"use client";

import { useEffect, useState } from "react";
import { useRealtime } from "./RealtimeProvider";
import s from "./live.module.css";

/**
 * The toast stack and connection light in the corner of every CMS screen.
 *
 * Purely a view over the shared socket — it opens no connection of its own and
 * triggers no refresh; RealtimeProvider does both. This decides what an
 * operator is told and nothing else.
 *
 * On screens that hold no socket (see LIVE_ROUTES) the provider reports "off"
 * and this renders nothing at all: no pill, no toasts. A connection indicator
 * on a page that was never going to receive anything is worse than none — it
 * implies the page is watching something.
 */

type Note = {
  id: string;
  title: string;
  detail: string;
};

export default function LiveFeed() {
  const { status, subscribe } = useRealtime();
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(
    () =>
      subscribe((event) => {
        const push = (title: string, detail: string) =>
          setNotes((current) =>
            [{ id: crypto.randomUUID(), title, detail }, ...current].slice(0, 4)
          );

        if (event.type === "booking.created") {
          push(
            `New enquiry · ${event.ref}`,
            `${event.name} — ${event.trip}, ${event.travellers} travelling`
          );
        }

        if (event.type === "booking.updated") {
          const outcome =
            event.status === "confirmed"
              ? "Confirmed"
              : event.status === "cancelled"
                ? "Cancelled"
                : "Updated";
          push(`${outcome} · ${event.ref}`, `${event.name} — ${event.trip}`);
        }

        if (event.type === "booking.deleted") {
          push(`Removed · ${event.ref}`, `${event.name} — ${event.trip}`);
        }

        if (event.type === "message.created") {
          push("New message", `${event.name} — ${event.subject}`);
        }
      }),
    [subscribe]
  );

  const dismiss = (id: string) =>
    setNotes((current) => current.filter((n) => n.id !== id));

  /*
   * Toasts clear themselves after a few seconds. They sit over the bottom-right
   * of the page, which on /orders is where the cards are — a stack that waits
   * to be clicked ends up covering the buttons it is telling you about.
   */
  useEffect(() => {
    if (notes.length === 0) return;
    const timer = setTimeout(
      () => setNotes((current) => current.slice(0, -1)),
      6000
    );
    return () => clearTimeout(timer);
  }, [notes]);

  // Below the hooks, never above them: bailing out earlier would skip the
  // effect on some renders and React requires the same hooks in the same order
  // every time.
  if (status === "off") return null;

  return (
    <div className={s.wrap} aria-live="polite">
      {notes.map((note) => (
        <button
          key={note.id}
          className={s.note}
          onClick={() => dismiss(note.id)}
          title="Dismiss"
        >
          <span className={s.noteTitle}>{note.title}</span>
          <span className={s.noteDetail}>{note.detail}</span>
        </button>
      ))}

      <span className={`${s.status} ${s[status]}`}>
        <i className={s.dot} aria-hidden="true" />
        {status === "live"
          ? "Live"
          : status === "connecting"
            ? "Connecting…"
            : "Offline — retrying"}
      </span>
    </div>
  );
}
