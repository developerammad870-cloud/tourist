import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookie, verifySessionToken, type SessionUser } from "./auth";

/**
 * Server-side session reads for Server Components, Server Actions and Route
 * Handlers.
 *
 * Kept apart from lib/auth.ts on purpose: this module imports `next/headers`,
 * which is not available inside proxy.ts. proxy.ts imports the pure token
 * helpers from lib/auth.ts instead, so neither file drags the other's
 * dependencies along.
 *
 * `cookies()` is async in Next 16 — synchronous access was removed — so every
 * helper here is async.
 */

/** The signed-in user, or null. Reading it opts the route into dynamic rendering. */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(sessionCookie.name)?.value);
}

/**
 * Same as getSession but redirects to /login when there's nobody signed in.
 * Use in any page that must not render for a guest.
 */
export async function requireUser(returnTo = "/"): Promise<SessionUser> {
  const user = await getSession();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  }

  return user;
}

