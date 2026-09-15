import { getDb } from "@/lib/mongodb";
import ActivityChart, { type Point } from "./ActivityChart";
import s from "./Home.module.css";

/**
 * The numbers at the top of the CMS, read straight from MongoDB.
 *
 * An async Server Component: it queries in place and renders HTML, so there is
 * no API route, no loading state and nothing to hydrate. The page is already
 * `force-dynamic` further down the tree, and the realtime socket calls
 * router.refresh() when a booking changes, so these stay current without
 * polling.
 *
 * Everything degrades to zeros if the database is unreachable — a dashboard
 * that shows nothing is better than a screen that shows an error where the
 * business summary should be.
 */

type Stats = {
  total: number;
  pending: number;
  confirmed: number;
  travellers: number;
  series: Point[];
};

const DAYS = 14;

async function getStats(): Promise<Stats> {
  const empty: Stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    travellers: 0,
    series: [],
  };

  try {
    const db = await getDb();
    const bookings = await db
      .collection("bookings")
      .find({}, { projection: { status: 1, travellers: 1, createdAt: 1 } })
      .toArray();

    // Buckets for the last fortnight, oldest first, keyed by calendar day.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const series: Point[] = Array.from({ length: DAYS }, (_, i) => {
      const day = new Date(today);
      day.setDate(day.getDate() - (DAYS - 1 - i));
      return {
        label: day.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        value: 0,
      };
    });

    for (const b of bookings) {
      const made = b.createdAt ? new Date(b.createdAt) : null;
      if (!made) continue;
      made.setHours(0, 0, 0, 0);
      const age = Math.round((today.getTime() - made.getTime()) / 86_400_000);
      const slot = DAYS - 1 - age;
      if (slot >= 0 && slot < DAYS) series[slot].value += 1;
    }

    return {
      total: bookings.length,
      pending: bookings.filter((b) => (b.status ?? "pending") === "pending").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      travellers: bookings.reduce((sum, b) => sum + (Number(b.travellers) || 0), 0),
      series,
    };
  } catch (error) {
    console.warn("[dashboard] could not read stats:", error);
    return empty;
  }
}

export default async function Dashboard() {
  const stats = await getStats();

  const tiles = [
    { label: "Enquiries", value: stats.total, tone: s.toneBlue },
    { label: "Awaiting payment", value: stats.pending, tone: s.toneAmber },
    { label: "Confirmed", value: stats.confirmed, tone: s.toneGreen },
    { label: "Travellers booked", value: stats.travellers, tone: s.toneViolet },
  ];

  return (
    <section className={s.section}>
      <div className={s.dashGrid}>
        {tiles.map((tile) => (
          <div key={tile.label} className={`${s.tile} ${tile.tone}`}>
            <span className={s.tileValue}>{tile.value}</span>
            <span className={s.tileLabel}>{tile.label}</span>
          </div>
        ))}
      </div>

      <div className={s.chartCard}>
        <div className={s.chartHead}>
          <div>
            <h2 className={s.chartTitle}>Enquiries</h2>
            <p className={s.chartNote}>
              Requests received per day over the last fortnight, from both the
              public website and this app.
            </p>
          </div>
          <span className={s.chartTotal}>{stats.total} total</span>
        </div>

        {stats.series.some((p) => p.value > 0) ? (
          <ActivityChart points={stats.series} />
        ) : (
          <p className={s.chartEmpty}>
            No enquiries in the last {DAYS} days — the chart fills in as they
            arrive.
          </p>
        )}
      </div>
    </section>
  );
}
