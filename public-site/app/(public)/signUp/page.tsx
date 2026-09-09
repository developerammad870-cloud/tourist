"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import u from "@/app/components/ui/ui.module.css";
import n from "@/app/components/public/public.module.css";

/**
 * Sign-up screen.
 *
 * Posts to /api/auth/register, which hashes the password with bcrypt and signs
 * the new account straight in — so there's no second trip through /login.

 */
export default function SignUp() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setOk(false);
        setMessage(data.message ?? "Something went wrong.");
        return;
      }

      setOk(true);
      setMessage("Account created — signing you in…");

      router.refresh();
      router.push("/");
    } catch {
      setOk(false);
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
            <p className={u.eyebrow}>Get started</p>
            <h1 className={u.title}>Create your account</h1>
            <p className={u.lede}>
              Save trips, hold a booking for 48 hours, and pick up planning
              later.
            </p>
          </div>

          <form className={u.form} onSubmit={handleSubmit}>
            <div className={u.field}>
              <label className={u.label} htmlFor="su-name">
                Name
              </label>
              <input
                id="su-name"
                className={u.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className={u.field}>
              <label className={u.label} htmlFor="su-email">
                Email
              </label>
              <input
                id="su-email"
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
              <label className={u.label} htmlFor="su-password">
                Password
              </label>
              <input
                id="su-password"
                className={u.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
                required
              />
            </div>

            <button
              className={`${n.btn} ${n.btnPrimary}`}
              type="submit"
              disabled={busy}
            >
              {busy ? "Creating…" : "Sign up"}
            </button>

            {message && (
              <p
                className={`${u.notice} ${ok ? u.noticeOk : u.noticeBad}`}
                role="status"
              >
                {message}
              </p>
            )}
          </form>

          <p className={u.hint}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
