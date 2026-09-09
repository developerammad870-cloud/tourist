/**
 * Set (or reset) an account's password from the command line.
 *
 * There is no password-reset flow in the app yet, so this is the way back in
 * if you can't remember the password on an account — including your own admin
 * account, which is the one that locks you out of the CMS.
 *
 * Usage:  npm run db:set-password -- you@example.com newpassword123
 */

import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error(
    "Usage: npm run db:set-password -- you@example.com newpassword123"
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "tourist";

if (!uri) {
  console.error(
    "MONGODB_URI is not set. Run this through `npm run db:set-password`, which loads .env.local."
  );
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const users = client.db(dbName).collection("users");

  const normalised = email.trim().toLowerCase();

  // Emails were only normalised to lowercase from a certain point on, so match
  // case-insensitively or an older record won't be found.
  const user = await users.findOne({
    email: {
      $regex: `^${normalised.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  });

  if (!user) {
    console.error(`No account found for ${email}.`);
    console.error("Registered emails:");
    for (const u of await users
      .find({}, { projection: { email: 1, role: 1 } })
      .toArray()) {
      console.error(`  ${u.email}  (${u.role ?? "user"})`);
    }
    process.exitCode = 1;
  } else {
    await users.updateOne(
      { _id: user._id },
      { $set: { password: await bcrypt.hash(password, 10), updatedAt: new Date() } }
    );

    console.log(`Password updated for ${user.email} (${user.role ?? "user"}).`);
    console.log("You can sign in with it now at /login.");
  }
} catch (error) {
  console.error("Failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
