"use client";

import { useEffect, useRef } from "react";
import s from "./Home.module.css";
import type { Destination } from "./destinations";

/**
 * A destination card that tilts toward the pointer in real CSS 3D.
 *
 * Same approach as the hero: pointer position goes straight to custom
 * properties, never to React state, so hovering doesn't re-render. The card
 * face rotates, while the badge and body sit at positive `translateZ` — so
 * they genuinely stand off the surface as it turns, instead of being painted
 * flat onto it.
 *
 * The head of the card is the trip's own photograph, graded into the card by a
 * scrim so a bright sky does not fight the caramel around it. Behind the image
 * sits a caramel gradient: it is what shows while the photo loads, and what
 * remains if the remote host drops it, so a dead hotlink still looks
 * deliberate. Its two stops walk a little either side of caramel by position in
 * the list, which keeps the six cards distinguishable in one family.
 *
 * A plain <img> rather than next/image, matching /hotels and /places: these are
 * remote hotlinks, and next/image would need a `remotePatterns` entry for every
 * host in the content file.
 */
export default function TiltCard({
  dest,
  index = 0,
}: {
  dest: Destination;
  index?: number;
}) {
  // ±18° around caramel (≈32°), so six cards spread across the warm band.
  const hue = 32 + ((index % 6) - 2.5) * 7;
  const ref = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!motionOk.matches) return;

    let frame = 0;
    let rx = 0;
    let ry = 0;
    let gx = 50;
    let gy = 50;
    let glare = 0;
    let pop = 0;

    const paint = () => {
      frame = 0;
      el.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--gx", `${gx.toFixed(1)}%`);
      el.style.setProperty("--gy", `${gy.toFixed(1)}%`);
      el.style.setProperty("--glare", glare.toFixed(2));
      el.style.setProperty("--pop", `${pop}px`);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const MAX_TILT = 7; // degrees — past ~10 it stops reading as depth and starts looking broken

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      // Pointer right → rotate right edge away, so the card faces the cursor.
      ry = (px * 2 - 1) * MAX_TILT;
      rx = -(py * 2 - 1) * MAX_TILT;
      gx = px * 100;
      gy = py * 100;
      glare = 1;
      pop = 16;
      schedule();
    };

    const onLeave = () => {
      rx = 0;
      ry = 0;
      gx = 50;
      gy = 50;
      glare = 0;
      pop = 0;
      schedule();
    };

    // Keyboard users get the lift without the pointer-driven tilt.
    const onFocus = () => {
      pop = 16;
      schedule();
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("focus", onFocus);
    el.addEventListener("blur", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("focus", onFocus);
      el.removeEventListener("blur", onLeave);
    };
  }, []);

  return (
    <div className={s.cardWrap}>
      {/*
        Straight to a booking for this trip, with the destination already
        chosen. It used to point at `/hotels#<id>` — a leftover from when this
        app was split off the public website: the CMS has no per-trip page, and
        the Hotels screen has no such anchor, so the link simply dropped you at
        the top of Hotels.
      */}
      <a ref={ref} className={s.card} href={`/bookings?trip=${dest.id}`}>
        <div
          className={s.cardScene}
          style={
            {
              "--c1": `hsl(${hue} 62% 46%)`,
              "--c2": `hsl(${hue - 12} 55% 26%)`,
            } as React.CSSProperties
          }
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dest.images[0]} alt={dest.name} loading="lazy" />
          <div className={s.sceneShade} />
          <div className={s.glare} />
          <span className={s.badge}>
            {dest.nights} nights
          </span>
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

          <div className={s.cardFoot}>
            <span className={s.price}>
              per person from
              <strong className={s.priceValue}>
                Rs {dest.priceFrom.toLocaleString("en-PK")}
              </strong>
            </span>
            <span className={s.cardCta}>Take a booking →</span>
          </div>
        </div>
      </a>
    </div>
  );
}
