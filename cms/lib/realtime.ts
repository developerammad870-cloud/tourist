/**
 * Publishes an event to the realtime service, which pushes it to any CMS tab
 * with a socket open. See ../../realtime/README.md.
 *
 * Server-side only — it carries the shared token, which must never reach a
 * browser, and it is called from route handlers after the database write.
 *
 * Fire-and-forget on purpose. A booking that was successfully saved must not
 * fail because a notification could not be delivered, so every error here is
 * swallowed after a log line. The CMS re-reads from MongoDB when nudged, so a
 * missed event costs a delayed refresh, never a lost record.
 */

const REALTIME_URL = process.env.REALTIME_URL ?? "http://localhost:3002";
const REALTIME_TOKEN = process.env.REALTIME_TOKEN ?? "dev-token";

export type RealtimeEvent =
  | {
      type: "booking.created";
      ref: string;
      trip: string;
      name: string;
      travellers: number;
      source: "public-site" | "cms";
    }
  | { type: "message.created"; name: string; subject: string };

export async function publish(event: RealtimeEvent): Promise<void> {
  try {
    await fetch(`${REALTIME_URL}/publish`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-realtime-token": REALTIME_TOKEN,
      },
      body: JSON.stringify(event),
      // Never let a slow or missing socket service hold a booking response
      // open: two seconds is already far longer than a localhost POST needs.
      signal: AbortSignal.timeout(2000),
    });
  } catch (error) {
    console.warn(
      "[realtime] could not publish",
      event.type,
      error instanceof Error ? error.message : error
    );
  }
}
