/**
 * One-off migration: hash any password still stored in plain text.
 *
 * Accounts created before hashing landed have their password saved as the raw
 * string. The login route refuses those outright (it requires a bcrypt hash),
 * so those users can't sign in at all until this runs.
 *
 * Hashing the existing value in place is deliberate: it preserves the password
 * the person already chose, so nobody has to be told to reset anything. A
 * bcrypt hash always starts with "$2", which is how a migrated record is told
 * apart from a legacy one — that makes this safe to run twice.
 *
 * Usage:  npm run db:migrate-passwords
 */

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "tourist";

if (!uri) {
  console.error(
    "MONGODB_URI is not set. Run this through `npm run db:migrate-passwords`, which loads .env.local."
  );
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const users = client.db(dbName).collection("users");

  const legacy = await users
    .find({ password: { $exists: true, $not: /^\$2/ } })
    .toArray();

  if (legacy.length === 0) {
    console.log("Nothing to do — every stored password is already hashed.");
  } else {
    console.log(`Found ${legacy.length} plain-text password(s).`);

    for (const user of legacy) {
      await users.updateOne(
        { _id: user._id },
        {
          $set: {
            password: await bcrypt.hash(String(user.password), 10),
            // Records from before roles existed default to a plain user.
            role: user.role === "admin" ? "admin" : "user",
            updatedAt: new Date(),
          },
        }
      );

      console.log(`  hashed: ${user.email ?? user._id}`);
    }

    console.log("Done. Those accounts can now sign in with the same password.");
  }
} catch (error) {
  console.error("Migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
