import bcrypt from "bcryptjs";

/**
 * Password hashing for this app's user records.
 *
 * The CMS has no sign-in of its own, but it still writes to the same `users`
 * collection the public website authenticates against. If it stored a password
 * in plain text, that account simply could not sign in over there — the public
 * login only accepts bcrypt hashes. So hashing here is not optional.
 */

export type Role = "user" | "admin";

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
