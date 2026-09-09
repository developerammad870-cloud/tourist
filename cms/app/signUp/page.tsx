"use client";

import { useState } from "react";
import Link from "next/link";
import s from "../components/ui/ui.module.css";

/**
 * Sign-up screen. Posts to /api/users, which writes to the shared MongoDB.
 *
 * The account it creates is the same kind the public website signs in with —
 * both apps read one `users` collection.
 */
export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOk(true);
        setMessage("Account created successfully.");

        setName("");
        setEmail("");
        setPassword("");
      } else {
        setOk(false);
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setOk(false);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={s.page}>
      <div className={s.authWrap}>
        <div className={`${s.panel} ${s.authPanel}`}>
          <div className={s.head}>
            <p className={s.eyebrow}>Get started</p>
            <h1 className={s.title}>Sign Up</h1>
            <p className={s.lede}>
              Save trips, hold a booking for 48 hours, and pick up planning later.
            </p>
          </div>

          <form className={s.form} onSubmit={handleSubmit}>
            <div className={s.field}>
              <label className={s.label} htmlFor="su-name">Name</label>
              <input
                id="su-name"
                className={s.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                required
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="su-email">Email</label>
              <input
                id="su-email"
                className={s.input}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </div>

            <div className={s.field}>
              <label className={s.label} htmlFor="su-password">Password</label>
              <input
                id="su-password"
                className={s.input}
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
              className={`${s.btn} ${s.btnPrimary}`}
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating…" : "Sign Up"}
            </button>

            {message && (
              <p
                className={`${s.notice} ${ok ? s.noticeOk : s.noticeBad}`}
                role="status"
              >
                {message}
              </p>
            )}
          </form>

          <p className={s.hint}>
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
