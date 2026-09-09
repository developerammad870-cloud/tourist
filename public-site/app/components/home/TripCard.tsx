import Image from "next/image";
import Link from "next/link";
import s from "./Home.module.css";
import type { Destination } from "@/app/content/destinations";

/**
 * Destination card.
 *
 * Replaces the pointer-tilted 3D card: this is a Server Component with no
 * client JavaScript, and hover is a small lift plus a slow zoom on the
 * photograph — both pure CSS. The photograph is the same remote hotlink the
 * /destinations index uses, so the two pages can never show a different picture
 * for the same trip — through next/image, so each card downloads the photograph
 * at the width it is actually painted rather than at whatever the source is.
 */
export default function TripCard({ dest }: { dest: Destination }) {
  return (
    <Link className={s.card} href={`/destinations/${dest.id}`}>
      <div className={s.cardMedia}>
        <Image
          src={dest.images[0]}
          alt={dest.name}
          fill
          // Three across on a wide screen, two on a tablet, one on a phone.
          sizes="(max-width: 40rem) 100vw, (max-width: 70rem) 50vw, 27rem"
          loading="lazy"
        />
        <span className={s.badge}>{dest.nights} nights</span>
      </div>

      <div className={s.cardBody}>
        <div className={s.cardTop}>
          <div>
            <h3 className={s.cardName}>{dest.name}</h3>
            <span className={s.cardRegion}>{dest.region}</span>
          </div>
          <span className={s.rating} aria-label={`Rated ${dest.rating} out of 5`}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" />
            </svg>
            {dest.rating.toFixed(1)}
          </span>
        </div>

        <p className={s.cardTagline}>{dest.tagline}</p>

        {/* Deliberately not a price. These trips are quoted per party, and
            the thing a reader actually needs at this size is when to come. */}
        <div className={s.cardFoot}>
          <span className={s.when}>
            <span className={s.whenLabel}>Best months</span>
            <strong className={s.whenValue}>{dest.bestMonths}</strong>
          </span>
          <span className={s.cardCta}>
            View trip
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
