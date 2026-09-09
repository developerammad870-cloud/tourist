import Link from "next/link";
import s from "../components/ui/ui.module.css";
import OrderActions from "../components/OrderActions";
import OrderCorner from "../components/OrderCorner";
import live from "../components/live.module.css";
import { getDb } from "@/lib/mongodb";

/**
 * Orders screen, backed by the `bookings` collection in MongoDB.
 *
 * A Server Component that queries the database directly — no API round trip
 * needed, since this only reads. Bookings created on /bookings appear here,
 * and so do the ones made from the public website: both apps share one
 * database.
 *
 * Reading stays here; *writing* does not. Confirm and Cancel are handled by
 * <OrderActions>, which sends the change up the WebSocket — the socket service
 * writes it to MongoDB and broadcasts the result, and RealtimeProvider calls
 * router.refresh(), which re-runs this query. So the buttons never set what
 * you see; the database does, on every screen that has this open.
 */

// Always read fresh: a booking made seconds ago must show up on next load, and
// a refresh triggered by the socket must not be served from a cache.
export const dynamic = "force-dynamic";

type Status = "confirmed" | "pending" | "cancelled";

type Order = {
  _id: string;
  ref: string;
  /** Who booked it. The reason this screen exists is to answer that. */
  name: string;
  email: string;
  phone: string;
  trip: string;
  region: string;
  travellers: number;
  departDate: string;
  notes: string;
  total: number;
  status: Status;
};

const statusClass: Record<Status, string> = {
  confirmed: s.badgeOk,
  pending: s.badgeWait,
  cancelled: s.badgeOff,
};

const statusLabel: Record<Status, string> = {
  confirmed: "Confirmed",
  pending: "Awaiting payment",
  cancelled: "Cancelled",
};

function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function getOrders(): Promise<Order[]> {
  const db = await getDb();
  const docs = await db
    .collection("bookings")
    .find({})
    .sort({ createdAt: -1 })
    .toArray();

  // _id is an ObjectId; serialise it before it crosses into the client tree.
  return docs.map((d) => ({
    _id: String(d._id),
    ref: d.ref ?? "—",
    name: d.name ?? "Unknown",
    email: d.email ?? "",
    phone: d.phone ?? "",
    trip: d.trip ?? "Trip",
    region: d.region ?? "",
    travellers: d.travellers ?? 1,
    departDate: d.departDate ?? "",
    notes: d.notes ?? "",
    total: d.total ?? 0,
    status: (d.status ?? "pending") as Status,
  }));
}

export default async function Orders() {
  const orders = await getOrders();

  return (
    <div className={s.page}>
      <div className={s.head}>
        <div className={s.headRow}>
          <div>
            <p className={s.eyebrow}>Your account</p>
            <h1 className={s.title}>Orders</h1>
            <p className={s.lede}>
              Every trip booked with us, newest first.
            </p>
          </div>
          <Link className={`${s.btn} ${s.btnGhost}`} href="/bookings">
            Book a trip
          </Link>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className={s.empty}>
          <p className={s.emptyTitle}>No orders yet</p>
          <p>
            Book a trip and it&rsquo;ll appear here — and in the{" "}
            <code>bookings</code> collection in Compass.
          </p>
        </div>
      ) : (
        <div className={s.grid}>
          {orders.map((o) => (
            <article className={s.itemCard} key={o._id}>
              {/* The traveller's name leads: on this screen the question is
                  always "who is this?", not "which route?". */}
              <div className={s.headRow}>
                <div className={live.headMain}>
                  <h2 className={s.itemName}>{o.name}</h2>
                  <p className={s.itemMeta}>
                    {o.trip}
                    {o.region ? ` · ${o.region}` : ""}
                  </p>
                </div>
                {/* Badge and mark travel together: the header row wraps, and
                    left to themselves they wrapped onto separate lines, which
                    dropped the mark into the middle of the card. */}
                <div className={live.headEnd}>
                  <span className={`${s.badge} ${statusClass[o.status]}`}>
                    {statusLabel[o.status]}
                  </span>
                  {/* Appears once the booking is confirmed or cancelled:
                      removes the record for good. */}
                  <OrderCorner id={o._id} status={o.status} name={o.name} />
                </div>
              </div>

              <div className={s.itemRows}>
                <span className={s.itemRow}>Reference&nbsp;&middot;&nbsp;{o.ref}</span>
                {/* Separate rows: an email and a phone number joined by a
                    middot wrap badly, leaving the separator stranded at the
                    end of a line. */}
                {o.email && (
                  <span className={s.itemRow}>
                    <a href={`mailto:${o.email}`}>{o.email}</a>
                  </span>
                )}
                {o.phone && (
                  <span className={s.itemRow}>
                    <a href={`tel:${o.phone}`}>{o.phone}</a>
                  </span>
                )}
                <span className={s.itemRow}>
                  Departs&nbsp;&middot;&nbsp;{formatDate(o.departDate)}
                </span>
                <span className={s.itemRow}>
                  {o.travellers} traveller{o.travellers === 1 ? "" : "s"}
                  &nbsp;&middot;&nbsp;Rs {o.total.toLocaleString("en-PK")}
                </span>
                {o.notes && <span className={s.itemRow}>&ldquo;{o.notes}&rdquo;</span>}
              </div>

              <OrderActions id={o._id} status={o.status} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
