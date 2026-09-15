import bcrypt from "bcryptjs";

export type { Role } from "./permissions";

/**
 * Password hashing for the `users` collection.
 *
 * Both apps read and write this collection, so both must hash the same way: an
 * account created here has to be able to sign in on the public website, and the
 * reverse. bcrypt, cost 10, on both sides.
 */

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/**
 * A real bcrypt hash of a random string, compared against when the email does
 * not exist.
 *
 * Without it, "no such account" returns instantly while "wrong password" waits
 * for bcrypt — and that difference in response time tells an attacker which
 * emails are registered. Comparing against this makes both paths cost the same.
 */
const TIMING_DECOY =
  "$2a$10$CwTycUXWue0Thq9StjUM0uJ8.jD8Ww3ILmXZq3Gq5sQnKjcyKrsGW";

export async function verifyPassword(
  plain: string,
  hash: string | undefined
): Promise<boolean> {
  if (typeof hash !== "string" || !hash.startsWith("$2")) {
    await bcrypt.compare(plain, TIMING_DECOY);
    return false;
  }
  return bcrypt.compare(plain, hash);
}
