"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import u from "@/app/components/ui/ui.module.css";
import n from "@/app/components/public/public.module.css";

/**
 * Sign-in screen.
 *
 * Posts to /api/auth/login, which compares the password against the bcrypt
 * hash and sets an httpOnly session cookie. `?next=` carries the page the
 * visitor was trying to reach — proxy.ts sets it when it bounces someone off
 * an admin route.
 */
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
        setMessage(data.message ?? "Couldn't sign you in.");
        return;
      }

      // refresh() re-runs the server layouts so the navbar picks up the new
      // session before we navigate.
      router.refresh();
      router.push(next);
    } catch {
      setMessage("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={u.page}>
      <div className={u.authWrap}>
        <div className={`${u.panel} ${u.authPanel}`}>
          <div className={u.head}>
            <p className={u.eyebrow}>Welcome back</p>
            <h1 className={u.title}>Sign in</h1>
            <p className={u.lede}>
              Pick up your saved trips and bookings where you left off.
            </p>
          </div>

          <form className={u.form} onSubmit={handleSubmit}>
            <div className={u.field}>
              <label className={u.label} htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                className={u.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className={u.field}>
              <label className={u.label} htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className={u.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className={`${n.btn} ${n.btnPrimary}`}
              type="submit"
              disabled={busy}
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>

            {message && (
              <p className={`${u.notice} ${u.noticeBad}`} role="status">
                {message}
              </p>
            )}
          </form>

          <p className={u.hint}>
            No account yet? <Link href="/signUp">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * useSearchParams needs a Suspense boundary above it, otherwise the whole
 * route is forced into client-side rendering at build time.
 */
export default function Login() {
  return (
    <Suspense fallback={<div className={u.page} />}>
      <LoginForm />
    </Suspense>
  );
}
