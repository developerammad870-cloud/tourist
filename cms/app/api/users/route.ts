import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { hashPassword, type Role } from "@/lib/passwords";

/**
 * User records for the CMS.
 *
 * There is no session check here: this application has no sign-in, so it is
 * only as private as the machine it runs on. That is fine for a CMS served on
 * localhost and NOT fine if this is ever exposed on a network — see the
 * README's "Security" note before deploying it anywhere.
 *
 * Passwords are hashed even though nothing here logs in, because the public
 * website authenticates against these same records.
 */

// GET - list all users
export async function GET() {
  try {
    const db = await getDb();

    // Never send password hashes to the client.
    const users = await db
      .collection("users")
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST - create a user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Emails are matched case-insensitively on the public site, so normalise.
    const normalisedEmail = String(email).trim().toLowerCase();

    if (await db.collection("users").findOne({ email: normalisedEmail })) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 }
      );
    }

    // Anything unrecognised falls back to a plain user rather than silently
    // granting access to the public site's admin-only areas.
    const role: Role = body.role === "admin" ? "admin" : "user";

    const result = await db.collection("users").insertOne({
      name: String(name).trim(),
      email: normalisedEmail,
      password: await hashPassword(password),
      role,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to create user" },
      { status: 500 }
    );
  }
}
