import Link from "next/link";
import type { Metadata } from "next";
import { hotels } from "@/app/content/hotels";
import { getDestination } from "@/app/content/destinations";
import s from "@/app/components/public/pages.module.css";
import n from "@/app/components/public/public.module.css";

export const metadata: Metadata = {
  title: "Stays",
  description:
    "The hotels, lodges, cabins and camps we put people in across Pakistan.",
};

/**
 * Stays page.
 *
 * Images are remote hotlinks in plain <img> tags rather than next/image —
 * next/image would need a `remotePatterns` entry per host in next.config.ts.
 * See the note at the top of app/content/gallery.ts.
 */
export default function HotelsPage() {
  return (
    <div className={s.wrap}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>Stays</p>
        <h1 className={s.h1}>Where you&rsquo;ll sleep</h1>
        <p className={s.lede}>
          We book these ourselves and we&rsquo;ve stayed in all of them. Some
          are proper hotels, some are cabins with a wood stove and no road —
          each one is picked for where it is rather than for its star rating.
        </p>
      </header>

      <div className={s.hotelGrid}>
        {hotels.map((h) => {
          const trip = getDestination(h.destinationId);

          return (
            <article className={s.hotelCard} key={h.id} id={h.id}>
              <div className={s.hotelMedia}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.image} alt={h.name} loading="lazy" />
              </div>

              <div className={s.hotelBody}>
                <div className={s.tripTop}>
                  <div>
                    <h2 className={s.tripName}>{h.name}</h2>
                    <span className={s.tripRegion}>{h.location}</span>
                  </div>
                  <span
                    className={s.rating}
                    aria-label={`Rated ${h.rating} out of 5`}
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
                    {h.rating.toFixed(1)}
                  </span>
                </div>

                <span
                  className={s.stars}
                  aria-label={`${h.stars} star accommodation`}
                >
                  {"★".repeat(h.stars)}
                  <span style={{ color: "#d8dee6" }}>
                    {"★".repeat(5 - h.stars)}
                  </span>
                </span>

                <p className={s.hotelBlurb}>{h.blurb}</p>

                <ul className={s.amenities}>
                  {h.amenities.map((a) => (
                    <li className={s.amenity} key={a}>
                      {a}
                    </li>
                  ))}
                </ul>

                <div className={s.tripFoot}>
                  {/* Rooms are booked as part of the trip, so a nightly rate
                      here would be a number nobody actually pays. */}
                  <span className={s.tripWhen}>
                    <span className={s.tripWhenLabel}>Room</span>
                    <strong className={s.tripWhenValue}>
                      Included in the trip
                    </strong>
                  </span>

                  {trip && (
                    <Link
                      href={`/destinations/${trip.id}`}
                      className={s.tripCta}
                    >
                      {trip.name} &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <section className={s.ctaBand}>
        <h2>Stays come with the trip</h2>
        <p>
          You don&rsquo;t book these separately — accommodation is included in
          every route we run. Pick a trip and the beds are already arranged.
        </p>
        <div className={s.ctaActions}>
          <Link href="/destinations" className={`${n.btn} ${s.btnLight}`}>
            See the trips
          </Link>
          <Link href="/contact" className={`${n.btn} ${s.btnOutline}`}>
            Ask a question
          </Link>
        </div>
      </section>
    </div>
  );
}
