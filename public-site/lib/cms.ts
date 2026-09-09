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
 * NEXT_PUBLIC_CMS_URL overrides where they point. It has to be NEXT_PUBLIC_
 * because these links render in the browser, which also means it is baked in at
 * build time — changing it needs a redeploy, not just a restart.
 *
 * Both fallbacks below matter. Without a production default, a deployment with
 * the variable unset sends real visitors to `localhost:3001`, which fails
 * silently for everyone but the developer. And an obviously-unfilled
 * placeholder is treated as unset rather than trusted — a link to a domain that
 * does not exist is worse than a link to the right default, because it returns
 * a 404 that looks like the app is broken.
 */

const PRODUCTION_CMS = "https://tourist-cms.vercel.app";
const DEVELOPMENT_CMS = "http://localhost:3001";

const configured = process.env.NEXT_PUBLIC_CMS_URL?.trim();
const usable =
  configured && !configured.includes("REPLACE-WITH") ? configured : undefined;

const CMS_URL =
  usable ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_CMS : DEVELOPMENT_CMS);

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
