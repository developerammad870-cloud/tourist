"use client";

import { useState } from "react";
import Link from "next/link";
import s from "../components/ui/ui.module.css";

/**
 * Sign-in screen.
 *
 * Labelled "Login" throughout — the sidebar item, this heading, the submit
 * button and the link on the public website that opens it all use the same
 * word. Which word matters less than that they agree: a person clicking one
 * label and landing on another assumes they have ended up somewhere else.
 *
 * NOTE: this posts nothing — the CMS has no session layer, and every screen in
 * it is reachable without signing in. It is a placeholder: the public site has
 * a working bcrypt + session implementation that can be lifted across when the
 * CMS needs to be locked down.
 *
 * If you want the CMS itself locked down, say so — the public site already has
 * a working bcrypt + session implementation that can be lifted across.
 */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(
      "The CMS has no sign-in — every page here is already open. Use the public website to sign in as a traveller."
    );
  }

  return (
    <div className={s.page}>
      <div className={s.authWrap}>
        <div className={`${s.panel} ${s.authPanel}`}>
          <div className={s.head}>
            <p className={s.eyebrow}>Welcome back</p>
            <h1 className={s.title}>Login</h1>
            <p className={s.lede}>
              Pick up your saved trips and bookings where you left off.
            </p>
          </div>

          <form className={s.form} onSubmit={handleSubmit}>
            <div className={s.field}>
              <label className={s.label} htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
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
              <label className={s.label} htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                className={s.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button className={`${s.btn} ${s.btnPrimary}`} type="submit">
              Login
            </button>

            {message && (
              <p className={`${s.notice} ${s.noticeBad}`} role="status">
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
