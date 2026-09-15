/**
 * Who may open what in the CMS.
 *
 * Pure data and pure functions — no `jose`, no `next/headers`, nothing
 * server-only — because three very different places read it: proxy.ts (before a
 * page renders), the route handlers (before an API call runs), and the sidebar
 * (a client component deciding which links to draw). Keeping it dependency-free
 * is what lets the browser import it without dragging the token code along.
 *
 * Two roles for now. Adding a third means adding it to `Role` and deciding, per
 * entry in ADMIN_ONLY, whether it belongs there.
 */

export type Role = "user" | "admin";

/** Pages anyone can reach, signed in or not. Everything else needs a session. */
export const PUBLIC_PAGES = ["/login", "/signUp"];

/** API routes that must work before there is a session to check. */
export const PUBLIC_API = ["/api/auth/login", "/api/auth/register", "/api/auth/logout"];

/**
 * Admin-only, pages and API alike.
 *
 * Orders shows every customer's name, contact details and booking, and carries
 * the controls that cancel and permanently delete them. Users manages accounts,
 * including who else is an admin. The socket ticket is what grants those live
 * controls. None of that is for a normal account.
 *
 * `/api/bookings` is deliberately NOT here: a user may create a booking request
 * (POST) but not list everyone's (GET). That split is per-method, so it is
 * enforced in the route handler rather than by path.
 */
export const ADMIN_ONLY = ["/orders", "/users", "/api/users", "/api/test-db", "/api/realtime"];

function matches(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export const isPublicPage = (pathname: string) => matches(pathname, PUBLIC_PAGES);
export const isPublicApi = (pathname: string) => matches(pathname, PUBLIC_API);
export const isAdminOnly = (pathname: string) => matches(pathname, ADMIN_ONLY);

/** Whether a role may open a path. Fails closed: an unknown role is not an admin. */
export function canAccess(role: Role | undefined, pathname: string): boolean {
  return !isAdminOnly(pathname) || role === "admin";
}

/** Sidebar entries. The sidebar filters these through canAccess. */
export const NAV: { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/hotels", label: "Hotels" },
  { href: "/bookings", label: "Bookings" },
  { href: "/places", label: "Places" },
  { href: "/orders", label: "Orders" },
  { href: "/users", label: "Users" },
];
