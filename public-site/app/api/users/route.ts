import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";
import { hashPassword, type Role } from "@/lib/auth";

/**
 * User management for the CMS.
 *
 * Admin-only. The CMS is a separate app with its own API; this route exists
 * so the public site can never expose the user table to a visitor.
 *
 * Public sign-up does NOT come through here; it has its own route at
 * /api/auth/register.
 */

const FORBIDDEN = NextResponse.json(
  { success: false, message: "Admins only" },
  { status: 403 }
);

// GET - list all users
export async function GET() {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

    const db = await getDb();

    // Never send password hashes to the client, not even to an admin.
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

// POST - create a user from the admin screen
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

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
    const normalisedEmail = String(email).trim().toLowerCase();

    if (await db.collection("users").findOne({ email: normalisedEmail })) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 }
      );
    }

    // An admin may set the role explicitly; anything unrecognised falls back
    // to a plain user rather than silently granting access.
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
