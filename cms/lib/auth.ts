import { SignJWT, jwtVerify } from "jose";
import type { Role } from "./permissions";

/**
 * CMS session tokens.
 *
 * A signed JWT (HS256, via `jose`) in an httpOnly cookie. The server verifies it
 * from the cookie alone, so no database round trip on every request — and proxy
 * can do it before a page even starts rendering. Nothing server-only is imported
 * here for exactly that reason: proxy.ts runs this file.
 *
 * Kept deliberately separate from the public website's session in three ways:
 *
 *   - its own cookie name, `cms_session`;
 *   - its own audience, so a public-site token is refused here even though both
 *     apps may share AUTH_SECRET — a traveller's login must never double as a
 *     back-office login;
 *   - a shorter life: twelve hours rather than a week. This cookie opens the
 *     screens that delete customers' bookings.
 *
 * The algorithm is pinned at verification rather than read from the token's
 * header. That is the classic JWT hole — a forged header claiming `alg: none` —
 * and naming HS256 explicitly is what closes it.
 */

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export const SESSION_COOKIE = "cms_session";

/** Twelve hours, in seconds. Also the cookie's Max-Age. */
const SESSION_MAX_AGE = 60 * 60 * 12;

const ISSUER = "travel-with-ammad";
const AUDIENCE = "travel-with-ammad:cms";

/** Tickets that let a browser open the realtime socket. See createSocketTicket. */
export const SOCKET_AUDIENCE = "travel-with-ammad:socket";

/**
 * The signing key. Read at call time, not at import: a missing secret should
 * fail the request that needed it with a message saying what to do, not crash
 * the app at load — including during a build, when no request is being served.
 */
function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Add a random 32+ character value to cms/.env.local, and to the tourist-cms project on Vercel."
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getKey());
}

/**
 * The session user, or null for a missing, forged, malformed or expired token.
 * Never throws on bad input: a bad cookie must not be able to 500 a page.
 */
export async function verifySessionToken(
  token: string | undefined
): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      name: typeof payload.name === "string" ? payload.name : "",
      email: typeof payload.email === "string" ? payload.email : "",
      // An authorisation decision, so it fails closed.
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

/**
 * A short-lived pass for the WebSocket.
 *
 * The socket service runs on a different origin, so the browser will not send
 * it this app's cookie. Instead the CMS hands a signed-in admin a ticket that is
 * good for sixty seconds and for one purpose — its own audience — which the
 * browser presents when it connects. Long enough to open a socket; useless if it
 * leaks, because by then it has expired and it opens nothing but the socket.
 */
export async function createSocketTicket(user: SessionUser): Promise<string> {
  return new SignJWT({ role: user.role, name: user.name })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(SOCKET_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(getKey());
}

export const sessionCookie = {
  name: SESSION_COOKIE,
  maxAge: SESSION_MAX_AGE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // HTTPS only in production; localhost is plain HTTP in development.
    secure: process.env.NODE_ENV === "production",
  },
};
