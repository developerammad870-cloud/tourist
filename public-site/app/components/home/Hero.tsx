import Image from "next/image";
import Link from "next/link";
import { heroSlides } from "@/app/content/hero";
import s from "./Home.module.css";

/**
 * Photographic hero: a fast crossfading slideshow.
 *
 * Still a Server Component with no JavaScript. The rotation is pure CSS — every
 * slide runs the same keyframes over the whole cycle and is offset by its own
 * `animation-delay`, so the browser drives it on the compositor and nothing has
 * to hydrate before the first picture moves.
 *
 * The pictures go through next/image rather than a plain <img>: at `sizes`
 * 100vw each device downloads the frame at its own width, in AVIF or WebP, from
 * whatever the source resolution happens to be. Swap the entries in
 * app/content/hero.ts for local files under public/photos and this component
 * needs no changes at all.
 *
 * IMPORTANT: the keyframes in Home.module.css divide the cycle into quarters
 * (each slide is visible for ~25% of it), so the list must hold exactly four
 * slides. A fifth means retuning `slideFade` / `slideZoom` to 20%.
 *
 * The credit line is a stack of spans running the same animation with the same
 * delays, which is how the caption changes with the picture without a line of
 * script.
 */

const SLIDE_SECONDS = 3.5;
const CYCLE = `${SLIDE_SECONDS * heroSlides.length}s`;

export default function Hero() {
  return (
    <section className={s.hero} aria-label="Featured destinations">
      <div className={s.heroMedia}>
        {heroSlides.map((slide, i) => (
          <div
            key={slide.src}
            className={s.slide}
            style={{
              animationDuration: CYCLE,
              animationDelay: `${i * SLIDE_SECONDS}s`,
            }}
          >
            <Image
              src={slide.src}
              alt=""
              fill
              // The hero is edge to edge at every width, so the browser should
              // pick the candidate closest to the viewport itself.
              sizes="100vw"
              quality={85}
              // Only the first frame is on the critical path; the rest have
              // three and a half seconds before anyone sees them.
              priority={i === 0}
              loading={i === 0 ? "eager" : "lazy"}
              style={{
                animationDuration: CYCLE,
                animationDelay: `${i * SLIDE_SECONDS}s`,
              }}
            />
          </div>
        ))}
      </div>
      <div className={s.heroScrim} />

      <div className={s.heroInner}>
        <p className={s.eyebrow}>Travel with AMMAD</p>
        <h1 className={s.title}>
          Pakistan, taken slowly
          <span className={s.titleAccent}>and taken seriously.</span>
        </h1>
        <p className={s.lede}>
          Private journeys through the Karakoram, Kashmir and the Makran coast —
          small groups, hand-picked stays, and a guide who has driven every one
          of these roads before.
        </p>

        <div className={s.actions}>
          <a className={`${s.btn} ${s.btnPrimary}`} href="#destinations">
            Explore the collection
          </a>
          <Link className={`${s.btn} ${s.btnGlass}`} href="/book">
            Plan a private trip
          </Link>
        </div>
      </div>

      <p className={s.heroCredit} aria-hidden="true">
        {heroSlides.map((slide, i) => (
          <span
            key={slide.credit}
            className={s.credit}
            style={{
              animationDuration: CYCLE,
              animationDelay: `${i * SLIDE_SECONDS}s`,
            }}
          >
            {slide.credit}
          </span>
        ))}
      </p>
    </section>
  );
}
