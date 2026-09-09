"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Owns the CMS's single WebSocket connection.
 *
 * One socket for the whole back office, not one per component: the feed in the
 * corner and every Confirm/Cancel button on /orders all talk through this. Two
 * components each opening their own would mean two connections, two heartbeats
 * and two reconnect storms whenever the service restarts.
 *
 * The socket is the only channel the CMS uses for booking status — there is no
 * fetch() behind these buttons. A command goes up, the service writes it to
 * MongoDB, and the result comes back to every open tab.
 *
 * State that is *displayed* still comes from the database: on any event this
 * calls router.refresh(), which re-runs the Server Components. The socket says
 * when to look; MongoDB says what is true.
 */

const WS_URL = process.env.NEXT_PUBLIC_REALTIME_WS ?? "ws://localhost:3002/ws";

/*
 * The only screens that open a socket.
 *
 * These are the three that show records which change under the operator:
 * enquiries arriving, statuses moving, accounts being added. Hotels, Places and
 * the home page read from content files or a snapshot and have nothing to be
 * told about, so holding a connection open on them would be a socket, a
 * heartbeat and a reconnect loop bought for nothing.
 *
 * Matching is prefix-based so a detail route underneath one of these stays
 * live too.
 */
const LIVE_ROUTES = ["/orders", "/bookings", "/users"];

export type ServerEvent = {
  type: string;
  [key: string]: unknown;
};

export type Status = "off" | "connecting" | "live" | "down";

type Realtime = {
  status: Status;
  /** Sends a command and resolves with the service's reply for it. */
  send: (message: Record<string, unknown>) => Promise<ServerEvent>;
  /** Subscribe to every event; returns an unsubscribe function. */
  subscribe: (listener: (event: ServerEvent) => void) => () => void;
};

const RealtimeContext = createContext<Realtime | null>(null);

export function useRealtime(): Realtime {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtime must be used inside <RealtimeProvider>");
  return ctx;
}

export default function RealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  /** True on the screens listed above, false everywhere else. */
  const live = LIVE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  /*
   * The socket's own state, written only from its callbacks — an external
   * system reporting in, which is what effects are for. What the app sees is
   * derived below rather than stored, so a route change never has to push a
   * status into state from inside the effect.
   */
  const [socketStatus, setSocketStatus] = useState<Status>("connecting");
  const status: Status = live ? socketStatus : "off";

  const socketRef = useRef<WebSocket | null>(null);
  const listeners = useRef(new Set<(event: ServerEvent) => void>());
  /** Commands awaiting their reply, keyed by the nonce sent with them. */
  const pending = useRef(new Map<string, (event: ServerEvent) => void>());

  useEffect(() => {
    // Not a live screen: no socket. Any existing one was already closed by
    // this effect's cleanup when the route changed.
    if (!live) return;

    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let closed = false; // set on unmount so a queued retry doesn't reopen

    const connect = () => {
      const socket = new WebSocket(WS_URL);
      socketRef.current = socket;

      socket.onopen = () => {
        attempt = 0;
        setSocketStatus("live");
      };

      socket.onmessage = (raw) => {
        let event: ServerEvent;
        try {
          event = JSON.parse(raw.data as string);
        } catch {
          return;
        }

        // A reply to one of our own commands, or a broadcast for everyone.
        if (typeof event.nonce === "string" && pending.current.has(event.nonce)) {
          pending.current.get(event.nonce)?.(event);
          pending.current.delete(event.nonce);
        }

        listeners.current.forEach((listener) => listener(event));

        // Anything that changed the database means the rendered rows are now
        // stale, whoever caused it.
        if (
          event.type === "booking.created" ||
          event.type === "booking.updated" ||
          event.type === "booking.deleted" ||
          event.type === "message.created"
        ) {
          router.refresh();
        }
      };

      socket.onclose = () => {
        if (closed) return;
        setSocketStatus("down");
        // 1s, 2s, 4s … capped at 15s: quick enough to catch a dev restart,
        // slow enough not to hammer a service that is genuinely gone.
        const wait = Math.min(15000, 1000 * 2 ** attempt++);
        retry = setTimeout(connect, wait);
      };

      // An error is always followed by a close, which handles the reconnect.
      socket.onerror = () => socket.close();
    };

    connect();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [router, live]);

  const send = useCallback(
    (message: Record<string, unknown>) =>
      new Promise<ServerEvent>((resolve, reject) => {
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
          reject(new Error("not connected"));
          return;
        }

        const nonce = crypto.randomUUID();
        pending.current.set(nonce, resolve);
        socket.send(JSON.stringify({ ...message, nonce }));

        // A command with no reply must not leave a button spinning forever.
        setTimeout(() => {
          if (pending.current.delete(nonce)) reject(new Error("timed out"));
        }, 8000);
      }),
    []
  );

  const subscribe = useCallback((listener: (event: ServerEvent) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const value = useMemo(
    () => ({ status, send, subscribe }),
    [status, send, subscribe]
  );

  return (
    <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
  );
}
