import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

/**
 * Mark one enquiry read/unread, or delete it. Admin-only.
 *
 * `params` is a Promise in Next 16 — it must be awaited before use.
 */

const FORBIDDEN = NextResponse.json(
  { success: false, message: "Admins only" },
  { status: 403 }
);

function toObjectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/messages/[id]">
) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

    const { id } = await ctx.params;
    const _id = toObjectId(id);

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Invalid message id" },
        { status: 400 }
      );
    }

    const { read } = await request.json();

    const result = await (await getDb())
      .collection("messages")
      .updateOne({ _id }, { $set: { read: Boolean(read) } });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Updated" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update message" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/messages/[id]">
) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

    const { id } = await ctx.params;
    const _id = toObjectId(id);

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Invalid message id" },
        { status: 400 }
      );
    }

    const result = await (await getDb())
      .collection("messages")
      .deleteOne({ _id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to delete message" },
      { status: 500 }
    );
  }
}
