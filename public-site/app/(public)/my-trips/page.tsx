import Link from "next/link";
import type { Metadata } from "next";
import { getDb } from "@/lib/mongodb";
import { requireUser } from "@/lib/session";
import s from "@/app/components/public/pages.module.css";
import n from "@/app/components/public/public.module.css";
import u from "@/app/components/ui/ui.module.css";

export const metadata: Metadata = { title: "My trips" };

/**
 * The traveller's own bookings.
 *
 * A Server Component that queries MongoDB directly — no API round trip, since
 * this only reads. Scoped to the signed-in user's email so nobody sees anyone
 * else's booking.
 */

// Always read fresh: a booking made seconds ago must show up on next load.
export const dynamic = "force-dynamic";

type Status = "confirmed" | "pending" | "cancelled";

const statusClass: Record<Status, string> = {
  confirmed: u.badgeOk,
  pending: u.badgeWait,
  cancelled: u.badgeOff,
};

const statusLabel: Record<Status, string> = {
  confirmed: "Confirmed",
  pending: "Awaiting confirmation",
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

export default async function MyTrips() {
  const user = await requireUser("/my-trips");

  const db = await getDb();
  const docs = await db
    .collection("bookings")
    .find({ email: user.email.toLowerCase() })
    .sort({ createdAt: -1 })
    .toArray();

  return (
    <div className={s.wrap}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>Your account</p>
        <h1 className={s.h1}>My trips</h1>
        <p className={s.lede}>
          Every trip you&rsquo;ve booked with us, newest first.
        </p>
      </header>

      {docs.length === 0 ? (
        <div className={u.empty}>
          <p className={u.emptyTitle}>No bookings yet</p>
          <p>Book a trip and it&rsquo;ll appear here.</p>
          <p style={{ marginTop: 18 }}>
            <Link href="/destinations" className={`${n.btn} ${n.btnPrimary}`}>
              Browse destinations
            </Link>
          </p>
        </div>
      ) : (
        <div className={u.grid}>
          {docs.map((o) => {
            const status = (o.status ?? "pending") as Status;

            return (
              <article className={u.itemCard} key={String(o._id)}>
                <div className={u.headRow}>
                  <div>
                    <h2 className={u.itemName}>{o.trip ?? "Trip"}</h2>
                    <p className={u.itemMeta}>{o.region ?? ""}</p>
                  </div>
                  <span className={`${u.badge} ${statusClass[status]}`}>
                    {statusLabel[status]}
                  </span>
                </div>

                <div className={u.itemRows}>
                  <span className={u.itemRow}>
                    Reference&nbsp;&middot;&nbsp;{o.ref ?? "—"}
                  </span>
                  <span className={u.itemRow}>
                    Departs&nbsp;&middot;&nbsp;{formatDate(o.departDate ?? "")}
                  </span>
                  <span className={u.itemRow}>
                    {o.travellers ?? 1} traveller
                    {o.travellers === 1 ? "" : "s"}
                    &nbsp;&middot;&nbsp;Rs{" "}
                    {(o.total ?? 0).toLocaleString("en-PK")}
                  </span>
                </div>

                {o.destinationId && (
                  <div className={u.cardActions}>
                    <Link
                      href={`/destinations/${o.destinationId}`}
                      className={`${n.btn} ${n.btnGhost} ${n.btnSmall}`}
                    >
                      View trip
                    </Link>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
