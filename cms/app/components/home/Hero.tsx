"use client";

import { useEffect, useRef } from "react";
import s from "./Home.module.css";
import Particles from "./Particles";

/**
 * Hero: quiet depth behind the words.
 *
 * A set of concentric frames receding behind the headline — no object, no
 * mockup, nothing competing with the copy. The whole effect is that each frame
 * sits deeper than the one inside it, so turning the stage a few degrees spreads
 * them apart: the nearest sweeps furthest, the deepest barely moves.
 *
 * The scene is one CSS 3D space. `.hero` owns the `perspective`, `.stage`
 * carries `preserve-3d`, and every frame sits at its own negative `translateZ`
 * with a matching scale-up so it keeps its intended size:
 *
 *   apparent size = perspective / (perspective + depth)
 *   so a panel at translateZ(-D) is scaled by (P + D) / P to compensate.
 *
 * Tilting the stage toward the pointer then produces the parallax for free, and
 * correctly — near panels sweep further than far ones because the geometry says
 * so, not because each was hand-tuned. Depth of field comes from the same
 * number: the further back a panel is, the more it is blurred.
 *
 * Two rules the stage has to respect:
 *   1. Inside `preserve-3d` the browser sorts by 3D position and ignores
 *      `z-index` — depth is the only ordering here.
 *   2. `.stage` itself must never take `overflow`, `filter`, `opacity < 1` or a
 *      blend mode: any of those flattens the whole subtree. Its children may;
 *      they simply become flat planes at a distance, which is what a pane of
 *      glass is.
 *
 * Pointer and scroll go to CSS custom properties (`--mx`, `--my`, `--sy`)
 * rather than React state — this
 * fires on every pointer move, and a state update per event would re-render the
 * tree ~60×/second. Updates are coalesced into one rAF, so a burst of events
 * costs a single frame.
 */
export default function Hero() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    if (!motionOk.matches) return;

    let frame = 0;
    // Targets written by the events…
    let tx = 0;
    let ty = 0;
    // …and the eased values actually painted.
    let mx = 0;
    let my = 0;
    let sy = 0;

    const paint = () => {
      // 0.09 ≈ a quarter-second to settle at 60fps: enough drift to feel like
      // weight, not so much that the scene lags behind the cursor.
      mx += (tx - mx) * 0.09;
      my += (ty - my) * 0.09;

      el.style.setProperty("--mx", mx.toFixed(4));
      el.style.setProperty("--my", my.toFixed(4));
      el.style.setProperty("--sy", sy.toFixed(4));

      if (Math.abs(tx - mx) > 0.001 || Math.abs(ty - my) > 0.001) {
        frame = requestAnimationFrame(paint);
      } else {
        frame = 0;
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onPointer = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      schedule();
    };

    const onLeave = () => {
      tx = 0;
      ty = 0;
      schedule();
    };

    const onScroll = () => {
      const r = el.getBoundingClientRect();
      sy = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
      schedule();
    };

    onScroll();
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("pointerleave", onLeave);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <section ref={ref} className={s.hero} aria-label="Dashboard overview">
      {/* Ambient light for the glass to refract. Outside the stage: these are
          blurred fields, and a filter inside the 3D subtree would flatten it. */}
      <div className={s.aura} />

      <div className={s.stage}>
        {/*
          Concentric frames receding behind the headline. Each is a percentage
          inset of the hero rather than a fixed size, so the composition holds
          its proportions at any width — nothing here needs a breakpoint.

          They are ordered furthest first and each sits deeper than the last, so
          the perspective spreads them apart as the stage turns: the nearest
          frame sweeps further than the one behind it, which is the whole cue.
        */}
        <div className={`${s.frame} ${s.frame1}`} />
        <div className={`${s.frame} ${s.frame2}`} />
        <div className={`${s.frame} ${s.frame3}`} />
        <div className={`${s.frame} ${s.frame4}`} />

        <div className={s.gridPlane} />
      </div>

      <Particles />

      {/*
        The copy is a normal in-flow grid item, not an absolute overlay: on a
        narrow panel it is much taller than the art, and an absolute block would
        simply be clipped. It still sits inside .hero's `perspective`, so it
        turns in the same camera as the panels behind it.
      */}
      <div className={s.heroCopy}>
        <p className={s.eyebrow}>Travel with AMMAD</p>
        <h1 className={s.title}>
          Everything you run,
          <span className={s.titleAccent}>in one place.</span>
        </h1>
        <p className={s.lede}>
  Bookings, orders, hotels, travellers — live, the moment anything changes.
</p>
        <div className={s.actions}>
          <a className={`${s.btn} ${s.btnPrimary}`} href="/orders">
            Open orders
          </a>
          <a className={`${s.btn} ${s.btnGhost}`} href="/bookings">
            New booking
          </a>
        </div>
      </div>

      <div className={s.scrollCue} aria-hidden="true" />
    </section>
  );
}
