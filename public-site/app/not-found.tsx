import Link from "next/link";
import { site } from "./content/site";
import s from "./components/public/pages.module.css";
import n from "./components/public/public.module.css";

/**
 * 404 page.
 *
 * Lives at the root rather than inside (public) so it also covers URLs that
 * match no route at all. It carries its own minimal header for the same
 * reason — the root layout deliberately has no navigation, and a dead end with
 * no way back to the site is a worse 404 than none.
 */
export default function NotFound() {
  return (
    <div className={s.wrap}>
      <header className={s.pageHead} style={{ paddingTop: 40 }}>
        <Link href="/" className={s.backLink}>
          <span style={{ fontSize: 18 }}>{site.mark}</span> {site.name}
        </Link>

        <p className={s.eyebrow}>404</p>
        <h1 className={s.h1}>That page isn&rsquo;t here</h1>
        <p className={s.lede}>
          The link may be out of date, or the trip may have moved. Everything we
          run is on the destinations page.
        </p>

        <div className={s.ctaActions} style={{ justifyContent: "flex-start", marginTop: 26 }}>
          <Link href="/destinations" className={`${n.btn} ${n.btnPrimary}`}>
            Browse destinations
          </Link>
          <Link href="/" className={`${n.btn} ${n.btnGhost}`}>
            Back home
          </Link>
        </div>
      </header>
    </div>
  );
}
