import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createSessionToken, sessionCookie, type SessionUser } from "@/lib/auth";
import { hashPassword } from "@/lib/passwords";

/**
 * Self-service sign-up. Always creates a normal user, whatever the request says.
 *
 * This replaced the sign-up form posting to /api/users, which is the admin
 * endpoint and takes `role` from the request body. With a login in front of the
 * CMS, that would have been a one-request path to admin: send
 * `{"role":"admin"}` and walk in. There is no role field read here at all — the
 * value is written, not accepted. Admins are made by an existing admin on the
 * Users screen, or by `npm run db:make-admin` on the server.
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

    if (String(password).length < 8) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const normalisedEmail = String(email).trim().toLowerCase();
    const db = await getDb();

    if (await db.collection("users").findOne({ email: normalisedEmail })) {
      return NextResponse.json(
        { success: false, message: "An account with that email already exists" },
        { status: 409 }
      );
    }

    const result = await db.collection("users").insertOne({
      name: String(name).trim(),
      email: normalisedEmail,
      password: await hashPassword(String(password)),
      role: "user",
      createdAt: new Date(),
    });

    const user: SessionUser = {
      id: String(result.insertedId),
      name: String(name).trim(),
      email: normalisedEmail,
      role: "user",
    };

    const response = NextResponse.json({ success: true, user });
    response.cookies.set(sessionCookie.name, await createSessionToken(user), {
      ...sessionCookie.options,
      maxAge: sessionCookie.maxAge,
    });
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Could not create your account" },
      { status: 500 }
    );
  }
}
