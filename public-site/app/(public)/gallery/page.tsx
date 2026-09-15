import Link from "next/link";
import type { Metadata } from "next";
import { galleryGroups } from "@/app/content/gallery";
import s from "@/app/components/public/pages.module.css";
import u from "@/app/components/ui/ui.module.css";

export const metadata: Metadata = {
  title: "Gallery",
  description:
    "Photos from the valleys, lakes and peaks along our northern routes.",
};

/**
 * Photo gallery, grouped by place.
 *
 * Plain <img> tags rather than next/image on purpose — these are remote
 * hotlinks and next/image would need a `remotePatterns` entry per host. The
 * full reasoning is at the top of app/content/gallery.ts.
 */
export default function GalleryPage() {
  return (
    <div className={s.wrap}>
      <header className={s.pageHead}>
        <p className={s.eyebrow}>Gallery</p>
        <h1 className={s.h1}>Places we travel</h1>
        <p className={s.lede}>
          The valleys, lakes and peaks along our northern routes.
        </p>
      </header>

      {galleryGroups.map((place) => (
        <section className={u.galleryBlock} key={place.name}>
          <div className={u.galleryHead}>
            <h2 className={u.galleryTitle}>{place.name}</h2>

            {place.destinationId ? (
              <Link
                href={`/destinations/${place.destinationId}`}
                className={s.tripCta}
              >
                {place.region} &middot; view trip &rarr;
              </Link>
            ) : (
              <span className={u.galleryRegion}>{place.region}</span>
            )}
          </div>

          <div className={u.gallery}>
            {place.shots.map((src, i) => (
              <figure className={u.shot} key={src}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${place.name} — view ${i + 1}`}
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
