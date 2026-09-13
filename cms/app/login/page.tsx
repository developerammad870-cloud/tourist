"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import s from "../components/ui/ui.module.css";

/**
 * Sign in to the CMS.
 *
 * Posts to /api/auth/login, which sets the `cms_session` JWT cookie; this page
 * never sees the token. On success it goes to wherever the proxy was sending the
 * person before it stopped them (`?next=`), or home.
 *
 * `next` is read from the URL at submit time rather than during render. Reading
 * it with useSearchParams would need a Suspense boundary to prerender, and in an
 * effect would mean setting state from one; neither is worth it for a value only
 * the submit handler uses.
 */

/**
 * Only a path on this site. Taking `next` at face value is an open redirect:
 * `/login?next=https://evil.example` would sign someone in here and then hand
 * them to a lookalike page. `//host` is rejected too — browsers read it as a
 * full URL to another origin.
 */
function safeNext(): string {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setMessage(data.message ?? "Could not sign you in.");
        setBusy(false);
        return;
      }

      // replace, so Back does not return to the form; refresh, so the layout
      // re-reads the cookie and draws the signed-in sidebar.
      router.replace(safeNext());
      router.refresh();
    } catch {
      setMessage("Couldn't reach the server.");
      setBusy(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.authWrap}>
        <div className={`${s.panel} ${s.authPanel}`}>
          <div className={s.head}>
            <p className={s.eyebrow}>Welcome back</p>
            <h1 className={s.title}>Login</h1>
            <p className={s.lede}>Sign in to manage trips, bookings and travellers.</p>
          </div>

          <form className={s.form} onSubmit={handleSubmit}>
            <div className={s.field}>
              <label className={s.label} htmlFor="login-email">Email</label>
              <input
                id="login-email"
                className={s.input}
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="login-password">Password</label>
              <input
                id="login-password"
                className={s.input}
                type="password"
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button className={`${s.btn} ${s.btnPrimary}`} type="submit" disabled={busy}>
              {busy ? "Signing in…" : "Login"}
            </button>

            {message && (
              <p className={`${s.notice} ${s.noticeBad}`} role="alert">
                {message}
              </p>
            )}
          </form>

          <p className={s.hint}>
            No account yet? <Link href="/signUp">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
