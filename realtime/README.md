# Realtime service

A ~200 line WebSocket broadcaster that sits between the two Next.js apps.

## Why it is a separate process

A Next.js route handler cannot hold a WebSocket open — it answers a request and
finishes. The two apps also run as independent servers on their own ports, so
neither one is a natural place to keep the other's connections. A third small
process both can talk to is the shape that actually fits.

## Why it has no dependencies

`ws` is the usual choice and it is a fine library. This service does one thing —
broadcast short JSON messages from the server to browsers that are listening —
and the slice of RFC 6455 that requires is small enough to read in one sitting:
the handshake, one frame writer, one frame reader, ping/pong. No dependency also
means `npm install` is not a prerequisite for the socket to run.

If this ever grows into chat, per-connection state or backpressure, swap in `ws`
rather than extending `server.mjs`.

## Shape

```
public-site  ─┐
              ├─ POST /publish ──► realtime ──► WS /ws ──► CMS browser tabs
cms          ─┘   (server side)                            (live enquiry feed)
```

- `POST /publish` — server-to-server only, guarded by `REALTIME_TOKEN`.
- `GET  /ws`      — the WebSocket endpoint browsers connect to.
- `GET  /health`  — how many clients are connected.

Publishing is fire-and-forget on the app side: if this process is not running, a
booking is still written and the traveller still gets their confirmation. The
feed is an enhancement, never a dependency.

## Running

    npm run dev            # from the repo root, starts all three
    npm --prefix realtime run dev   # or on its own

`PORT` (default 3002) and `REALTIME_TOKEN` are read from the environment.
