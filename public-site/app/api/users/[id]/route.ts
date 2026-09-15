import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

/**
 * Single-user operations. The collection-level route (../route.ts) handles
 * GET (list) and POST (create); edit and delete live here.
 *
 * Admin-only, for the same reason as the collection route: proxy.ts guards
 * pages, not API routes.
 *
 * `params` is a Promise in Next 16 — it must be awaited before use.
 */

const FORBIDDEN = NextResponse.json(
  { success: false, message: "Admins only" },
  { status: 403 }
);

/** Guards against a malformed id reaching ObjectId() and throwing a 500. */
function toObjectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// PUT - update a user
export async function PUT(request: Request, ctx: RouteContext<"/api/users/[id]">) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

    const { id } = await ctx.params;
    const _id = toObjectId(id);

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Whitelist the editable fields. Notably `password` is NOT among them —
    // a profile edit must never overwrite or clear the stored credential.
    const allowed = ["name", "username", "email", "phone"] as const;
    const update: Record<string, unknown> = {};

    for (const key of allowed) {
      if (body[key] !== undefined) update[key] = body[key];
    }

    // Role is handled apart from the whitelist so an unrecognised value can
    // never be written straight through as a privilege level.
    if (body.role !== undefined) {
      update.role = body.role === "admin" ? "admin" : "user";
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { success: false, message: "Nothing to update" },
        { status: 400 }
      );
    }

    const db = await getDb();

    if (typeof update.email === "string") {
      update.email = update.email.trim().toLowerCase();

      // Don't let an edit duplicate another account's email.
      const clash = await db
        .collection("users")
        .findOne({ email: update.email, _id: { $ne: _id } });

      if (clash) {
        return NextResponse.json(
          { success: false, message: "Email already exists" },
          { status: 409 }
        );
      }
    }

    // Demoting the only admin would lock everyone out of the CMS permanently.
    if (update.role === "user") {
      const admins = await db
        .collection("users")
        .countDocuments({ role: "admin" });
      const target = await db.collection("users").findOne({ _id });

      if (admins <= 1 && target?.role === "admin") {
        return NextResponse.json(
          {
            success: false,
            message: "This is the last admin — promote someone else first",
          },
          { status: 409 }
        );
      }
    }

    update.updatedAt = new Date();

    const result = await db
      .collection("users")
      .updateOne({ _id }, { $set: update });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "User updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE - remove a user
export async function DELETE(_request: Request, ctx: RouteContext<"/api/users/[id]">) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

    const { id } = await ctx.params;
    const _id = toObjectId(id);

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 }
      );
    }

    // Deleting the account you're signed in as leaves you holding a session
    // that points at nothing.
    if (session.id === id) {
      return NextResponse.json(
        { success: false, message: "You can't delete your own account" },
        { status: 409 }
      );
    }

    const db = await getDb();

    const target = await db.collection("users").findOne({ _id });

    if (target?.role === "admin") {
      const admins = await db
        .collection("users")
        .countDocuments({ role: "admin" });

      if (admins <= 1) {
        return NextResponse.json(
          {
            success: false,
            message: "This is the last admin — promote someone else first",
          },
          { status: 409 }
        );
      }
    }

    const result = await db.collection("users").deleteOne({ _id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    );
  }
}
