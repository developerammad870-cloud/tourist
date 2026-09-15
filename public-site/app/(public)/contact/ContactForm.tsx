"use client";

import { useState } from "react";
import u from "@/app/components/ui/ui.module.css";
import n from "@/app/components/public/public.module.css";

/**
 * Enquiry form. Posts to /api/messages, which writes to the `messages`
 * collection — the collection the CMS app's inbox reads.
 * A contact form that only prints a thank-you and drops the message is worse
 * than no contact form.
 */
export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const formEl = e.currentTarget;
    const form = new FormData(formEl);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          subject: form.get("subject"),
          body: form.get("body"),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOk(false);
        setMessage(data.message ?? "Couldn't send that message.");
        return;
      }

      setOk(true);
      setMessage("Thanks — we've got it and we'll reply shortly.");
      formEl.reset();
    } catch {
      setOk(false);
      setMessage("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={u.panel}>
      <form className={u.form} onSubmit={handleSubmit}>
        <div className={u.row}>
          <div className={u.field}>
            <label className={u.label} htmlFor="c-name">
              Your name
            </label>
            <input
              id="c-name"
              name="name"
              className={u.input}
              type="text"
              autoComplete="name"
              required
            />
          </div>

          <div className={u.field}>
            <label className={u.label} htmlFor="c-email">
              Email
            </label>
            <input
              id="c-email"
              name="email"
              className={u.input}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className={u.field}>
          <label className={u.label} htmlFor="c-subject">
            Subject
          </label>
          <input
            id="c-subject"
            name="subject"
            className={u.input}
            type="text"
            placeholder="Which trip, or what you'd like to know"
            required
          />
        </div>

        <div className={u.field}>
          <label className={u.label} htmlFor="c-body">
            Message
          </label>
          <textarea
            id="c-body"
            name="body"
            className={u.input}
            rows={6}
            placeholder="Dates you have in mind, how many of you, anything else worth knowing…"
            required
          />
        </div>

        <div className={u.actions}>
          <button
            className={`${n.btn} ${n.btnPrimary}`}
            type="submit"
            disabled={busy}
          >
            {busy ? "Sending…" : "Send message"}
          </button>
        </div>

        {message && (
          <p
            className={`${u.notice} ${ok ? u.noticeOk : u.noticeBad}`}
            role="status"
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
