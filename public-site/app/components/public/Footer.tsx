import Link from "next/link";
import { publicNav, site } from "@/app/content/site";
import { destinations } from "@/app/content/destinations";
import s from "./public.module.css";

/**
 * Site footer. A Server Component — it's static markup, so there's no reason
 * to ship it to the browser.
 */
export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div>
          <div className={s.footerBrand}>
            <span className={s.brandMark}>{site.mark}</span>
            <span>{site.name}</span>
          </div>
          <p className={s.footerNote}>
            {site.tagline} Small groups, local guides, and an itinerary that
            leaves room for the weather to change its mind.
          </p>
        </div>

        <div>
          <h3 className={s.footerHeading}>Trips</h3>
          <ul className={s.footerList}>
            {destinations.slice(0, 5).map((d) => (
              <li key={d.id}>
                <Link href={`/destinations/${d.id}`}>{d.name}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className={s.footerHeading}>Company</h3>
          <ul className={s.footerList}>
            {publicNav
              .filter((l) => l.href !== "/")
              .map((l) => (
                <li key={l.href}>
                  <Link href={l.href}>{l.label}</Link>
                </li>
              ))}
            <li>
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </li>
          </ul>
        </div>
      </div>

      <div className={s.footerBar}>
        <span>
          &copy; {new Date().getFullYear()} {site.name} — all routes planned in
          house.
        </span>
        <span>
          {site.phone} &middot; {site.address}
        </span>
      </div>
    </footer>
  );
}
