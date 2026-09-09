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
| `/bookings` | Booking form |
| `/places` | Places gallery |
| `/orders` | Every booking in the database |
| `/users` | Users — create, edit, set role, delete |
| `/login`, `/signUp` | Account pages |

### Security — read before deploying

**The CMS has no sign-in.** Every page and every API route in `cms/` is open to
anyone who can reach port 3001. That matches the original app, and it is fine on
localhost. It is *not* fine on a network or a public host.

If you want it locked down, the public site already has a working bcrypt +
session implementation (`public-site/lib/auth.ts`, `lib/session.ts`,
`proxy.ts`) that can be lifted across.

The CMS does still **hash passwords** when creating users, because the public
site authenticates against those same records — a plain-text password written
here would simply fail to log in there.

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
