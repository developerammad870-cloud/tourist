import crypto from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * Password hashing and session tokens.
 *
 * Sessions are stateless signed cookies rather than rows in a `sessions`
 * collection: the payload is base64url JSON with an HMAC-SHA256 signature
 * appended, so the server can verify a session without a database round trip
 * on every request. The trade-off is that a token can't be revoked before it
 * expires — acceptable at this size, and the reason the lifetime is short.
 *
 * `node:crypto` is used directly instead of a JWT library because this needs
 * no algorithm negotiation and no third-party keys; it's one HMAC.
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

type SessionPayload = SessionUser & {
  /** Unix seconds. */
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or too short. Add a random 32+ character value to .env.local — see README."
    );
  }

  return secret;
}

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

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string): string {
  return base64url(
    crypto.createHmac("sha256", getSecret()).update(data).digest()
  );
}

/** Builds a `<payload>.<signature>` token for the given user. */
export function createSessionToken(user: SessionUser): string {
  const payload: SessionPayload = {
    ...user,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const body = base64url(JSON.stringify(payload));

  return `${body}.${sign(body)}`;
}

/**
 * Returns the session user, or null when the token is missing, tampered with,
 * malformed or expired. Never throws on bad input — callers treat null as
 * "logged out".
 */
export function verifySessionToken(token: string | undefined): SessionUser | null {
  if (!token) return null;

  const [body, signature] = token.split(".");

  if (!body || !signature) return null;

  const expected = sign(body);

  // Constant-time compare so a wrong signature can't be guessed byte by byte.
  // timingSafeEqual throws on a length mismatch, hence the length check first.
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;

    if (typeof payload.exp !== "number" || payload.exp < Date.now() / 1000) {
      return null;
    }

    return {
      id: payload.id,
      name: payload.name,
      email: payload.email,
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
