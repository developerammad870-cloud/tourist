import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
  createSessionToken,
  sessionCookie,
  verifyPassword,
  type Role,
} from "@/lib/auth";

/**
 * Credential sign-in.
 *
 * A wrong email and a wrong password return exactly the same message and
 * status, so the response can't be used to enumerate which addresses have
 * accounts.
 */
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const user = await db
      .collection("users")
      .findOne({ email: String(email).trim().toLowerCase() });

    // Accounts created before password hashing landed have no usable
    // credential. Treat them as unable to sign in rather than letting a plain
    // string comparison through.
    const stored = typeof user?.password === "string" ? user.password : "";
    const looksHashed = stored.startsWith("$2");

    if (!user || !looksHashed || !(await verifyPassword(password, stored))) {
      return NextResponse.json(
        { success: false, message: "Email or password is incorrect" },
        { status: 401 }
      );
    }

    const role: Role = user.role === "admin" ? "admin" : "user";

    const sessionUser = {
      id: String(user._id),
      name: typeof user.name === "string" ? user.name : "",
      email: String(user.email),
      role,
    };

    const response = NextResponse.json({
      success: true,
      message: "Signed in",
      user: sessionUser,
    });

    response.cookies.set(sessionCookie.name, createSessionToken(sessionUser), {
      ...sessionCookie.options,
      maxAge: sessionCookie.maxAge,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Could not sign you in" },
      { status: 500 }
    );
  }
}
