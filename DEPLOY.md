# Deploying to Vercel

Two Next.js apps in one repository, plus a WebSocket service that **cannot run
on Vercel**. Read the blockers first — two of them need a decision from you, not
a config change.

## What goes where

| Piece | Host | Why |
|---|---|---|
| `public-site` | Vercel project #1 | A normal Next.js app. |
| `cms` | Vercel project #2 | Same. |
| `realtime` | **Not Vercel** | It holds WebSocket connections open. See below. |
| MongoDB | Atlas (or any hosted Mongo) | Vercel cannot reach your laptop. |

---

## Blocker 1 — the database

`MONGODB_URI` is `mongodb://127.0.0.1:27017` in both `.env.local` files. That is
the Mongo running on this machine, and nothing on the internet can reach it.

There is already an Atlas connection string commented out just below it in both
files. Switch to that, or make a new cluster, then:

1. Atlas → **Network Access** → allow `0.0.0.0/0`. Vercel's functions do not
   have fixed IPs on the Hobby plan, so an allowlist of specific addresses will
   not work. (Atlas also has a Vercel integration that does this for you.)
2. Atlas → **Database Access** → a user with read/write on the `tourist` db.
3. Put the resulting URI in both Vercel projects as `MONGODB_URI`.

Both apps write to the **same** database — that is the whole design — so both
projects get the same URI and the same `MONGODB_DB`.

## Blocker 2 — the WebSocket service

`realtime/server.mjs` is a long-running process that keeps a socket open per
browser tab. Vercel runs serverless functions: they start on a request, finish,
and are torn down. There is no process to hold a connection, so this service
cannot be deployed there. It is not a configuration problem.

Three ways forward, in order of least work:

1. **Host it somewhere that runs processes.** Render, Railway and Fly.io all
   have free or near-free tiers and take a plain Node service. Point
   `REALTIME_URL` (server-to-server) and `NEXT_PUBLIC_REALTIME_WS` (the browser)
   at it. **Use `wss://`, not `ws://`** — a browser on an HTTPS page refuses a
   plain-text socket, and the live feed will silently never connect.
2. **Swap in a hosted realtime provider** (Pusher, Ably). A code change in
   `lib/realtime.ts` and `RealtimeProvider.tsx`, but nothing to operate.
3. **Ship without live updates.** Leave `REALTIME_URL` unset: publishing fails
   quietly by design, bookings still save, and the CMS just needs a refresh to
   show new ones. Nothing else breaks.

Whichever you pick, note the security point from earlier: the socket service can
change and delete bookings, and the CMS has no sign-in. Do not expose it
publicly until there is a session check on the upgrade request.

---

## Vercel setup

Do this twice — once per app. Vercel deploys from the GitHub repo, so **push
first**; it builds what is on the branch, not what is on your disk.

1. Vercel → **Add New → Project** → import `developerammad870-cloud/tourist`.
2. **Root Directory**: `public-site` for the first project, `cms` for the second.
   This is the only setting that matters for a monorepo; leave the build command
   and output directory on their defaults, which Next sets correctly.
3. Add the environment variables below (Production *and* Preview).
4. Deploy. Then take the two URLs it gives you and fill in the cross-references
   marked ⟳ below — they cannot be known until both exist.

### public-site

| Variable | Value |
|---|---|
| `MONGODB_URI` | your Atlas URI |
| `MONGODB_DB` | `tourist` |
| `AUTH_SECRET` | a fresh 32+ character random string — **not** the local one |
| `NEXT_PUBLIC_CMS_URL` | ⟳ the deployed CMS URL, e.g. `https://tourist-cms.vercel.app` |
| `REALTIME_URL` | your realtime host, e.g. `https://tourist-socket.onrender.com` (omit if not using it) |
| `REALTIME_TOKEN` | the shared secret, same on all three |

### cms

| Variable | Value |
|---|---|
| `MONGODB_URI` | same Atlas URI |
| `MONGODB_DB` | `tourist` |
| `REALTIME_URL` | same as above |
| `REALTIME_TOKEN` | same as above |
| `NEXT_PUBLIC_REALTIME_WS` | ⟳ `wss://<realtime host>/ws` |

`NEXT_PUBLIC_*` values are compiled into the browser bundle, so changing one
needs a redeploy, not just a restart. Everything else is read on the server.

### realtime (wherever you host it)

| Variable | Value |
|---|---|
| `MONGODB_URI`, `MONGODB_DB` | same Atlas URI and db |
| `REALTIME_TOKEN` | same shared secret |
| `PORT` | usually set by the host automatically |

Start command: `node server.mjs`. Run `npm install` in `realtime/` first — it
depends on the `mongodb` driver, and on this machine that dependency is
currently satisfied by a local filesystem link rather than a real install.

---

## Before the first deploy

- `.env*` is gitignored, so none of your secrets are in the repo. Every value
  above has to be entered in the Vercel dashboard; nothing is inherited.
- Generate a **new** `AUTH_SECRET` for production. It signs session cookies;
  reusing the development one means anything that has seen it can mint a
  session.
- Both apps build clean locally (`npm run build` in each) — if a Vercel build
  fails it will be environment, not code.
- The trip photographs are hotlinks to istock, BBC and others. They will keep
  working until those hosts stop serving them, and they are not licensed for a
  commercial site. Your own photographs in `public/photos/` are the fix.
