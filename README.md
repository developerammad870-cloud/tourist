# Travel with AMMAD

Two separate applications that share one MongoDB database.

```
tourist/
  public-site/   the public website   →  http://localhost:3000
  cms/           the CMS              →  http://localhost:3001
         ↓ both connect to ↓
  mongodb://127.0.0.1:27017  ·  database "tourist"
```

They are genuinely independent: separate `package.json`, separate
`node_modules`, separate builds, separate servers. Nothing is shared but the
database.

## Running them

Two terminals, one each:

```bash
cd public-site && npm run dev     # → http://localhost:3000
cd cms         && npm run dev     # → http://localhost:3001
```

Each has its own `.env.local`:

```ini
MONGODB_URI="mongodb://127.0.0.1:27017"
MONGODB_DB="tourist"
AUTH_SECRET="<random 32+ character string>"   # public-site only
```

> **After editing `.env.local`, restart that app.** Next.js reads env files only
> at startup, so a running server keeps using the old values — the usual reason
> data appears to "not save" while pointing at a different database than the one
> open in Compass.

---

## The public website — `public-site/` · port 3000

Navbar and footer, no sidebar. Built for visitors.

| Route | |
| --- | --- |
| `/` | Home, with the parallax hero and trip cards |
| `/destinations` | All trips |
| `/destinations/[slug]` | One trip: itinerary, pricing, what's included |
| `/hotels` | Stays |
| `/gallery` | Photos, grouped by place |
| `/about` | About |
| `/contact` | Enquiry form → `messages` collection |
| `/book` | Booking form → `bookings` collection |
| `/my-trips` | The signed-in traveller's own bookings |
| `/login`, `/signUp` | Auth — bcrypt hashed, signed session cookie |

Signing in as an admin puts a **CMS** button in the navbar pointing at
`http://localhost:3001`. Change that with `NEXT_PUBLIC_CMS_URL`.

## The CMS — `cms/` · port 3001

Collapsible navy sidebar, no navbar. This is the original app.

| Route | |
| --- | --- |
| `/` | Home |
| `/hotels` | Hotels |
| `/bookings` | Booking form, then Stripe Checkout for the deposit |
| `/bookings/paid` | Where Stripe returns after payment |
| `/places` | Places gallery |
| `/orders` | Every booking in the database |
| `/users` | Users — create, edit, set role, delete |
| `/login`, `/signUp` | Account pages |

### Sign-in and roles

The CMS is closed: every page and API route needs a session except `/login`,
`/signUp` and the Stripe webhook. A session is a JWT in an httpOnly `cms_session`
cookie (12 hours), checked in three places — `proxy.ts` before a page renders,
`guardApi()` inside each route handler, and a ticket check on the WebSocket
upgrade. `lib/permissions.ts` holds the lists; `ADMIN_ONLY` covers `/orders`,
`/users`, `/api/users`, `/api/test-db` and `/api/realtime`.

Two roles. A **user** may book and pay for their own trips; an **admin** also
sees Orders, Users and the live socket. Sign-up always creates a user — the role
is never read from the request body. Promote with `npm run db:make-admin -- you@example.com`.

`AUTH_SECRET` (32+ characters) must be set wherever the CMS runs, including on
the host. Without it, signing in throws.

### Payments — Stripe deposits

Booking and paying are one flow on `/bookings`: the booking is written to
MongoDB first, then `/api/checkout` opens a Stripe Checkout session and the
browser is sent to it. An abandoned payment therefore costs nothing — the
enquiry is saved, marked unpaid, and shows that way on Orders.

| Piece | |
| --- | --- |
| `lib/payments.ts` | The arithmetic: 20% deposit, PKR→USD at a fixed rate, Stripe's 50c floor |
| `lib/stripe.ts` | Lazy Stripe client and webhook signature check |
| `app/api/checkout/route.ts` | Creates the session. Amount comes from the stored booking, never the request |
| `app/api/stripe/webhook/route.ts` | The only thing that marks a booking paid |
| `app/bookings/paid/page.tsx` | Where Stripe returns the traveller; reports, decides nothing |

The webhook is public because Stripe cannot sign in; its signature is what
authenticates it. Retries are harmless — a second event for a paid booking is
ignored rather than re-announced.

Set up locally:

```bash
# 1. cms/.env.local
STRIPE_SECRET_KEY=sk_test_...        # dashboard.stripe.com/test/apikeys
STRIPE_WEBHOOK_SECRET=whsec_...      # printed by the listen command below

# 2. forward Stripe's events to the dev server
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

Test card `4242 4242 4242 4242`, any future expiry and CVC. Live keys need the
same two variables set on the host, and a webhook endpoint pointed at
`https://<your-cms>/api/stripe/webhook`.

## Accounts

The first account registered on the public site's `/signUp` becomes an admin;
everyone after is a plain user. To change that afterwards, from `public-site/`:

```bash
npm run db:make-admin -- you@example.com
npm run db:make-admin -- you@example.com --demote
npm run db:set-password -- you@example.com newpassword123
npm run db:migrate-passwords          # hashes any plain-text passwords in place
```

The same scripts are wired up in `cms/` and operate on the same database.

## Shared collections

| Collection | Written by | Read by |
| --- | --- | --- |
| `users` | public `/signUp`, CMS `/users` | public login, CMS `/users` |
| `bookings` | public `/book`, CMS `/bookings` | public `/my-trips`, CMS `/orders` |
| `messages` | public `/contact` | — (public site only) |

A booking made in either app shows up in the other immediately — both query the
same database, and neither caches.

## Content

Trips are typed arrays, not database rows:

| File | |
| --- | --- |
| `public-site/app/content/destinations.ts` | Trips, itineraries, pricing |
| `public-site/app/content/hotels.ts` | Stays |
| `public-site/app/content/gallery.ts` | Gallery photos |
| `public-site/app/content/site.ts` | Brand details and navigation |
| `cms/app/components/home/destinations.ts` | The CMS's own copy of the trips |

Because the apps are independent, the trip list exists in both. Edit both if you
change it, or move trips into MongoDB so the CMS drives them — the public pages
are Server Components, so that swap is contained.

Gallery and trip images are **remote hotlinks** in plain `<img>` tags. They can
disappear without warning — download anything you want permanently into
`public/` and reference it by local path.

## Known gaps

- No sign-in on the CMS (see Security above).
- No password reset flow in the app; use `db:set-password`.
- No rate limiting on the login or contact endpoints.
- Sessions are stateless signed cookies, so one can't be revoked before it
  expires (seven days).
