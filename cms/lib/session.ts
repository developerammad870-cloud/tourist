import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken, type SessionUser } from "./auth";

/**
 * Session reads for Server Components and Route Handlers.
 *
 * Separate from lib/auth.ts because this imports `next/headers`, which proxy.ts
 * cannot use; proxy reads the cookie off the request instead.
 *
 * proxy.ts already stops a guest reaching any protected page. These checks run
 * again inside the page or handler anyway — a matcher typo, a new route nobody
 * added to the rules, a future refactor: any of those would silently open the
 * door if the only lock were the one at the front. `cookies()` is async in
 * Next 16, so everything here is.
 */

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Redirects a guest to /login, then back to `returnTo` once signed in. */
export async function requireUser(returnTo = "/"): Promise<SessionUser> {
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

/** As requireUser, and sends a signed-in non-admin home with a notice. */
export async function requireAdmin(returnTo = "/"): Promise<SessionUser> {
  const user = await requireUser(returnTo);
  if (user.role !== "admin") redirect(`/?denied=${encodeURIComponent(returnTo)}`);
  return user;
}

/**
 * For Route Handlers: either the user, or the response to send instead.
 *
 * 401 means "sign in"; 403 means "you are signed in, and the answer is still
 * no". Keeping them distinct is what lets the UI tell someone whether signing in
 * would help.
 */
export async function guardApi(
  need: "user" | "admin" = "user"
): Promise<{ user: SessionUser; denied?: never } | { user?: never; denied: NextResponse }> {
  const user = await getSession();
  if (!user) {
    return {
      denied: NextResponse.json(
        { success: false, message: "Sign in required" },
        { status: 401 }
      ),
    };
  }
  if (need === "admin" && user.role !== "admin") {
    return {
      denied: NextResponse.json(
        { success: false, message: "Admins only" },
        { status: 403 }
      ),
    };
  }
  return { user };
}
