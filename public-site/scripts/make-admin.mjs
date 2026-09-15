/**
 * Promote an account to admin, so it can reach the CMS at /admin.
 *
 * The first account registered through the sign-up form becomes an admin
 * automatically. This exists for every other case: an account that predates
 * roles, a second administrator, or a first account that was created before
 * that rule was in place.
 *
 * Usage:  npm run db:make-admin -- you@example.com
 *         npm run db:make-admin -- you@example.com --demote
 */

import { MongoClient } from "mongodb";

const args = process.argv.slice(2);
const email = args.find((a) => !a.startsWith("--"));
const demote = args.includes("--demote");

if (!email) {
  console.error("Usage: npm run db:make-admin -- you@example.com [--demote]");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "tourist";

if (!uri) {
  console.error(
    "MONGODB_URI is not set. Run this through `npm run db:make-admin`, which loads .env.local."
  );
  process.exit(1);
}

const client = new MongoClient(uri);
const role = demote ? "user" : "admin";

try {
  await client.connect();
  const users = client.db(dbName).collection("users");

  const normalised = email.trim().toLowerCase();

  // Emails were only normalised to lowercase from a certain point on, so match
  // case-insensitively or an older record won't be found.
  const user = await users.findOne({
    email: { $regex: `^${normalised.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });

  if (!user) {
    console.error(`No account found for ${email}.`);
    console.error("Registered emails:");
    for (const u of await users.find({}, { projection: { email: 1, role: 1 } }).toArray()) {
      console.error(`  ${u.email}  (${u.role ?? "user"})`);
    }
    process.exitCode = 1;
  } else if ((user.role ?? "user") === role) {
    console.log(`${user.email} is already ${role}. Nothing to do.`);
  } else {
    await users.updateOne(
      { _id: user._id },
      { $set: { role, updatedAt: new Date() } }
    );
    console.log(`${user.email} is now ${role}.`);
  }
} catch (error) {
  console.error("Failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
