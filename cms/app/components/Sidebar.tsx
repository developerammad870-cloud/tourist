"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SessionUser } from "@/lib/auth";
import { NAV, canAccess } from "@/lib/permissions";

/**
 * Collapsible sidebar wrapping every CMS page.
 *
 * It draws only what the signed-in role may open, from the same rules proxy.ts
 * enforces (lib/permissions.ts). Hiding a link is courtesy, not security — the
 * proxy and the route handlers are what actually refuse — but offering someone a
 * link that will only bounce them is a small lie about what they can do.
 *
 * `SessionUser` is imported as a type only, so none of the token code (jose)
 * reaches the browser bundle.
 *
 * Guests only ever reach /login and /signUp, so for them the list is just those
 * two.
 */
export default function Sidebar({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser | null;
}) {
  const [open, setOpen] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const router = useRouter();

  async function signOut() {
    setLeaving(true);
    await fetch("/api/auth/logout", { method: "POST" });
    // replace, not push: Back should not return to a screen that now bounces.
    router.replace("/login");
    router.refresh();
  }

  const links = user ? NAV.filter((item) => canAccess(user.role, item.href)) : [];

  return (
    <>
      <aside className={open ? "sidebar" : "sidebar sidebar-closed"}>
        <button
          className="collapse-btn"
          onClick={() => setOpen(!open)}
          aria-label="Toggle sidebar"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
        </button>

        {open && (
          <ul>
            <h2 className="logo">ℜᗰΔ</h2>

            {links.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}

            {user ? (
              <>
                <li className="sidebar-user">
                  <span className="sidebar-user-name">{user.name || user.email}</span>
                  <span className="sidebar-user-role">{user.role}</span>
                </li>
                <li>
                  <button className="sidebar-signout" onClick={signOut} disabled={leaving}>
                    {leaving ? "Signing out…" : "Sign out"}
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link href="/login">Login</Link></li>
                <li><Link href="/signUp">Sign Up</Link></li>
              </>
            )}
          </ul>
        )}
      </aside>

      <div className={open ? "main-content" : "main-content main-full"}>
        {children}
      </div>
    </>
  );
}
