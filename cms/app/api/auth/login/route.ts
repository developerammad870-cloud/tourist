import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createSessionToken, sessionCookie, type SessionUser } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";

/**
 * Sign in to the CMS: checks the password against the shared `users` collection
 * and, if it matches, sets the `cms_session` JWT cookie.
 *
 * Wrong email and wrong password get the same answer, word for word and — via
 * verifyPassword's timing decoy — in the same time. Anything more specific tells
 * a stranger which email addresses have accounts.
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
    const account = await db
      .collection("users")
      .findOne({ email: String(email).trim().toLowerCase() });

    const ok = await verifyPassword(String(password), account?.password);

    if (!account || !ok) {
      return NextResponse.json(
        { success: false, message: "Email or password is incorrect" },
        { status: 401 }
      );
    }

    const user: SessionUser = {
      id: String(account._id),
      name: account.name ?? "",
      email: account.email,
      role: account.role === "admin" ? "admin" : "user",
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
      { success: false, message: "Could not sign you in" },
      { status: 500 }
    );
  }
}
