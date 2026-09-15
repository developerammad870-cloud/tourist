import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/session";

/**
 * Admin actions on a single booking: change its status, or delete it.
 *
 * `params` is a Promise in Next 16 — it must be awaited before use.
 */

const STATUSES = ["pending", "confirmed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const FORBIDDEN = NextResponse.json(
  { success: false, message: "Admins only" },
  { status: 403 }
);

function toObjectId(id: string) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// PATCH - move a booking between pending / confirmed / cancelled
export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/bookings/[id]">
) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

    const { id } = await ctx.params;
    const _id = toObjectId(id);

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Invalid booking id" },
        { status: 400 }
      );
    }

    const { status } = await request.json();

    if (!STATUSES.includes(status as Status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Status must be one of: ${STATUSES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .collection("bookings")
      .updateOne({ _id }, { $set: { status, updatedAt: new Date() } });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: `Marked ${status}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to update booking" },
      { status: 500 }
    );
  }
}

// DELETE - remove a booking outright
export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/bookings/[id]">
) {
  try {
    const session = await getSession();
    if (session?.role !== "admin") return FORBIDDEN;

    const { id } = await ctx.params;
    const _id = toObjectId(id);

    if (!_id) {
      return NextResponse.json(
        { success: false, message: "Invalid booking id" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("bookings").deleteOne({ _id });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Booking not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Booking deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to delete booking" },
      { status: 500 }
    );
  }
}
