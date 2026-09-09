import Link from "next/link";
import type { Metadata } from "next";
import { destinations } from "@/app/content/destinations";
import s from "@/app/components/public/pages.module.css";
import n from "@/app/components/public/public.module.css";
import { cmsRoutes } from "@/lib/cms";

export const metadata: Metadata = {
  title: "Destinations",
  description:
    "Every trip we run — Hunza, Skardu, Fairy Meadows, Neelum Valley, Lahore and the Makran coast.",
};

/**
 * Trip index. A Server Component reading the shared content array, so the
 * whole page is HTML by the time it reaches the browser.
 */
export default function DestinationsPage() {
  return (
    <div className={s.wrap}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>Where we go</p>
        <h1 className={s.h1}>Destinations</h1>
        <p className={s.lede}>
          Six routes we run ourselves, from three nights in Lahore to a week in
          the Karakoram. Guides, transfers and overnight stops are arranged
          before you arrive — you only have to show up.
        </p>
      </header>

      <div className={s.tripGrid}>
        {destinations.map((d) => (
          <Link key={d.id} href={`/destinations/${d.id}`} className={s.tripCard}>
            <div className={s.tripMedia}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.images[0]} alt={d.name} loading="lazy" />
              <span className={s.tripTag}>
                {d.nights} nights &middot; {d.difficulty}
              </span>
            </div>

            <div className={s.tripBody}>
              <div className={s.tripTop}>
                <div>
                  <h2 className={s.tripName}>{d.name}</h2>
                  <span className={s.tripRegion}>{d.region}</span>
                </div>
                <span
                  className={s.rating}
                  aria-label={`Rated ${d.rating} out of 5`}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
                  </svg>
                  {d.rating.toFixed(1)}
                </span>
              </div>

              <p className={s.tripTagline}>{d.tagline}</p>

              {/* No price: every route is quoted per party once the dates
                  and the group are known. What goes here instead is the
                  information that actually decides a trip. */}
              <div className={s.tripFoot}>
                <span className={s.tripWhen}>
                  <span className={s.tripWhenLabel}>Best months</span>
                  <strong className={s.tripWhenValue}>{d.bestMonths}</strong>
                </span>
                <span className={s.tripCta}>View trip &rarr;</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <section className={s.ctaBand}>
        <h2>Not sure which one?</h2>
        <p>
          Tell us roughly when you can travel and how long you have. We&rsquo;ll
          come back with the two or three routes that actually fit.
        </p>
        <div className={s.ctaActions}>
          <Link href="/contact" className={`${n.btn} ${s.btnLight}`}>
            Ask us
          </Link>
          <a href={cmsRoutes.book} className={`${n.btn} ${s.btnOutline}`}>
            Start a trip request
          </a>
        </div>
      </section>
    </div>
  );
}
