import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  createSessionToken,
  hashPassword,
  sessionCookie,
  type Role,
} from "@/lib/auth";

/**
 * Public sign-up. Creates the account, hashes the password, and signs the new
 * user straight in so they don't have to type their credentials twice.
 *
 * The very first account created becomes the admin — otherwise a fresh install
 * has a CMS nobody can reach. Every account after that is a plain user, and
 * roles are never taken from the request body.
 */
export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

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
    const users = db.collection("users");

    // Emails are matched case-insensitively everywhere, so normalise on write.
    const normalisedEmail = String(email).trim().toLowerCase();

    if (await users.findOne({ email: normalisedEmail })) {
      return NextResponse.json(
        { success: false, message: "That email is already registered" },
        { status: 409 }
      );
    }

    // First account bootstraps the CMS.
    const role: Role = (await users.countDocuments()) === 0 ? "admin" : "user";

    const result = await users.insertOne({
      name: String(name).trim(),
      email: normalisedEmail,
      password: await hashPassword(password),
      role,
      createdAt: new Date(),
    });

    const token = await createSessionToken({
      id: String(result.insertedId),
      name: String(name).trim(),
      email: normalisedEmail,
      role,
    });

    const response = NextResponse.json({
      success: true,
      message: "Account created",
      user: { id: String(result.insertedId), name, email: normalisedEmail, role },
    });

    response.cookies.set(sessionCookie.name, token, {
      ...sessionCookie.options,
      maxAge: sessionCookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Could not create the account" },
      { status: 500 }
    );
  }
}
