import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

/**
 * Password hashing and session tokens.
 *
 * Sessions are stateless JWTs carried in an httpOnly cookie rather than rows in
 * a `sessions` collection: the server can verify who you are from the cookie
 * alone, with no database round trip on every request. The trade-off is that a
 * token cannot be revoked before it expires — acceptable at this size, and the
 * reason the lifetime is a week rather than a year.
 *
 * Signed with HS256 via `jose`, which is what the Next.js authentication guide
 * recommends and, unlike `jsonwebtoken`, runs in the Edge runtime — so if route
 * protection ever moves into proxy.ts, this module can move with it unchanged.
 *
 * Everything here is async because signing and verifying are: `jose` returns
 * promises, and hiding that behind a sync wrapper would mean blocking or lying.
 */

const SESSION_COOKIE = "session";

/** Seven days, in seconds. Also used as the cookie's Max-Age. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type Role = "user" | "admin";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * The signing key, derived from AUTH_SECRET.
 *
 * Read at call time rather than at module load: a missing secret should fail
 * the request that needed it, with a message saying what to do, not crash the
 * whole app at import time — including during a build, where no request is
 * being served and the variable may legitimately be absent.
 */
function getKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Add a random 32+ character value to .env.local — see README."
    );
  }

  return new TextEncoder().encode(secret);
}

/** Identifies tokens minted by this app, and rejects anything else. */
const ISSUER = "travel-with-ammad";
const AUDIENCE = "travel-with-ammad:web";

/* ------------------------------------------------------------------ */
/* Passwords                                                           */
/* ------------------------------------------------------------------ */

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ------------------------------------------------------------------ */
/* Session tokens                                                      */
/* ------------------------------------------------------------------ */

/**
 * Mints a signed JWT for the given user.
 *
 * The standard claims carry the identity — `sub` is the user id — and the
 * display fields ride alongside so the navbar can greet someone without a
 * database read on every page. Nothing secret goes in: a JWT is signed, not
 * encrypted, and anyone holding the cookie can read its payload.
 */
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
 * Returns the session user, or null when the token is missing, tampered with,
 * malformed or expired. Never throws on bad input — callers treat null as
 * "logged out", and a bad cookie must not be able to 500 a page.
 *
 * `jwtVerify` does the work that matters: it checks the signature, enforces
 * `exp`, and — because the algorithm is pinned — refuses a token whose header
 * claims `alg: none` or swaps in something weaker. That last part is the
 * classic JWT hole, and it is closed by naming the algorithm here rather than
 * trusting the one in the header.
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
      // Anything that is not exactly "admin" is a normal user. A role is an
      // authorisation decision, so it fails closed.
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}

/** Cookie options shared by the login and logout route handlers. */
export const sessionCookie = {
  name: SESSION_COOKIE,
  maxAge: SESSION_MAX_AGE,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    // Only sent over HTTPS in production; localhost is plain HTTP in dev.
    secure: process.env.NODE_ENV === "production",
  },
};
