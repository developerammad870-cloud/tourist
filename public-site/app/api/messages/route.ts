import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { publish } from "@/lib/realtime";
import { getSession } from "@/lib/session";

/**
 * Contact-form messages.
 *
 * POST is open — a public enquiry form is the whole point. GET is admin-only,
 * because the inbox is not public.
 */

// GET - the CMS inbox, newest first
export async function GET() {
  try {
    const session = await getSession();

    if (session?.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Admins only" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const messages = await db
      .collection("messages")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - public enquiry
export async function POST(request: Request) {
  try {
    const { name, email, subject, body } = await request.json();

    if (!name || !email || !subject || !body) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Cheap ceiling so a script can't fill the collection with one huge
    // document. Not rate limiting — that belongs in front of the app.
    if (String(body).length > 5000) {
      return NextResponse.json(
        { success: false, message: "Message is too long" },
        { status: 400 }
      );
    }

    const db = await getDb();

    await db.collection("messages").insertOne({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      subject: String(subject).trim(),
      body: String(body).trim(),
      read: false,
      createdAt: new Date(),
    });

    await publish({
      type: "message.created",
      name: String(name).trim(),
      subject: String(subject).trim(),
    });

    return NextResponse.json({ success: true, message: "Message sent" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 }
    );
  }
}
