"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { publicNav, site } from "@/app/content/site";
import type { SessionUser } from "@/lib/auth";
import { cmsRoutes } from "@/lib/cms";
import s from "./public.module.css";

/**
 * Public navigation bar.
 *
 * A Client Component because it needs the current pathname to mark the active
 * link and a little state for the mobile menu. The session itself is resolved
 * on the server in app/(public)/layout.tsx and handed down as a prop, so this
 * never has to fetch /api/auth/me and flash a signed-out navbar first.
 */
export default function PublicNav({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    // "/" would otherwise match every path.
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    // refresh() re-runs the server layout so the navbar picks up the cleared
    // session; push() alone would serve the cached signed-in shell.
    router.refresh();
    router.push("/");
  }

  return (
    <header className={`${s.nav} ${open ? s.navOpen : ""}`}>
      <nav className={s.navInner}>
        <Link href="/" className={s.brand} onClick={() => setOpen(false)}>
          <span className={s.brandMark}>{site.mark}</span>
          <span className={s.brandName}>{site.name}</span>
        </Link>

        <button
          className={s.burger}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {open ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
            // Signing in happens here now, not in the CMS: this site has its
            // own accounts, its own JWT session cookie and its own booking
            // form, so a visitor never has to leave it.
            <Link
              href="/login"
              className={`${s.btn} ${s.btnGhost} ${s.btnSmall}`}
              onClick={() => setOpen(false)}
            >
              Login
            </Link>
          )}
          </svg>
        </button>

        <ul className={s.navLinks}>
          {publicNav.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={s.navLink}
                aria-current={isActive(link.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className={s.navActions}>
          {user ? (
            <>
              <Link
                href="/my-trips"
                className={s.navLink}
                onClick={() => setOpen(false)}
              >
                My trips
              </Link>

              {user.role === "admin" && (
                // The CMS is a separate application on its own port, so this
                // is a plain <a> with an absolute URL rather than a <Link> —
                // Next can't client-side navigate to a different app.
                <a
                  href={cmsRoutes.home}
                  className={`${s.btn} ${s.btnGhost} ${s.btnSmall}`}
                  onClick={() => setOpen(false)}
                >
                  CMS
                </a>
              )}

              <button
                className={`${s.btn} ${s.btnGhost} ${s.btnSmall}`}
                onClick={signOut}
              >
                Sign out
              </button>
            </>
          ) : (
            // Signing in is the CMS's job now, so this leaves the public app.
            // The label matches the page it opens — see cms/app/login/page.tsx.
            <a
              href={cmsRoutes.signIn}
              className={`${s.btn} ${s.btnGhost} ${s.btnSmall}`}
              onClick={() => setOpen(false)}
            >
              Login
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
