/**
 * Where the CMS application lives, and how the public site links into it.
 *
 * The CMS is a separate Next.js app on its own port, so every one of these is
 * a plain <a> with an absolute URL — next/link cannot client-side navigate
 * across applications, and trying makes the first click look broken.
 *
 * Booking and account actions on the public site are deliberately handed over
 * to the CMS rather than handled here: the request form, the sign-in screen
 * and the account screen all live there now, and the public site is the shop
 * window.
 *
 * Set NEXT_PUBLIC_CMS_URL when the CMS is not on localhost:3001 — it has to be
 * NEXT_PUBLIC_ because these links render in the browser.
 */

const CMS_URL = process.env.NEXT_PUBLIC_CMS_URL ?? "http://localhost:3001";

/** Absolute URL for a CMS path, e.g. cms("/bookings"). */
export function cms(path = "/"): string {
  return `${CMS_URL}${path}`;
}

/** The CMS screens the public site links to, named so a rename is one edit. */
export const cmsRoutes = {
  /** Trip request form. */
  book: cms("/bookings"),
  signIn: cms("/login"),
  signUp: cms("/signUp"),
  home: cms("/"),
} as const;
