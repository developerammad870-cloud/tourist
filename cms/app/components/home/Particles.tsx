"use client";

import { useEffect, useRef } from "react";
import s from "./Home.module.css";

/**
 * Bubbles that rise from the cursor.
 *
 * Moving the pointer across the hero releases them; they drift upward, wobble
 * as they go, swell slightly, and thin out to nothing near the top. Standing
 * still releases nothing, so the effect belongs to the movement rather than
 * running on its own.
 *
 * Drawn on a canvas, not in the DOM. A hundred absolutely positioned divs would
 * mean a hundred style recalculations per frame; one canvas is a single paint,
 * and the whole simulation stays off the React tree — this component renders
 * once and never re-renders.
 *
 * PERFORMANCE. Each bubble is a pre-rendered sprite blitted with drawImage, not
 * an arc drawn with `shadowBlur`. Canvas shadows are recomputed per shape per
 * frame and once cost this hero most of its frame budget — ninety shadowed arcs
 * took the page to about 6fps. Rendering the bubble once into a small offscreen
 * canvas and stamping it is the same picture for a fraction of the work.
 *
 * The loop also stops entirely when the tab is hidden or the hero is scrolled
 * out of view: a back office sits open all day, and there is no reason to burn
 * a core animating something nobody is looking at.
 */

/** Hard ceiling on live bubbles: a fast scribble must not fill the screen. */
const MAX = 90;
/** Minimum pixels of cursor travel between releases. Tight, so a quick flick
 *  still leaves a continuous trail rather than a dotted one. */
const SPACING = 14;
/** Sprite resolution. Bubbles are drawn scaled down from this. */
const SPRITE = 64;

type Bubble = {
  x: number;
  y: number;
  /** Rise speed, px per frame. */
  vy: number;
  /** Sideways drift, so they do not all climb in parallel lines. */
  vx: number;
  r: number;
  /** Life, 0 → 1. Everything else is derived from it. */
  age: number;
  /** How fast this one lives; smaller bubbles last longer. */
  decay: number;
  /** Phase offset so each wobbles independently. */
  phase: number;
};

export default function Particles() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      return;
    }

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    /*
     * One bubble, rendered once.
     *
     * A real bubble is mostly edge: a bright rim where the film catches the
     * light, a highlight up and to the left, and almost nothing in the middle.
     * Drawing that with three gradients here costs nothing, because it happens
     * a single time rather than ninety times a frame.
     */
    const sprite = document.createElement("canvas");
    sprite.width = SPRITE;
    sprite.height = SPRITE;
    const sctx = sprite.getContext("2d");
    if (!sctx) return;

    const c = SPRITE / 2;

    // The film: transparent centre, dark rim. Black bubbles on a cream page
    // are the inverse of the usual soap-bubble treatment, so the rim carries
    // almost all the weight — a filled dark circle would read as a hole.
    const rim = sctx.createRadialGradient(c, c, c * 0.55, c, c, c);
    rim.addColorStop(0, "rgba(0, 0, 0, 0)");
    rim.addColorStop(0.82, "rgba(0, 0, 0, 0.5)");
    rim.addColorStop(0.94, "rgba(0, 0, 0, 0.95)");
    rim.addColorStop(1, "rgba(0, 0, 0, 0)");
    sctx.fillStyle = rim;
    sctx.beginPath();
    sctx.arc(c, c, c, 0, Math.PI * 2);
    sctx.fill();

    // Filled black, not just outlined. The gradient runs light-to-dark away
    // from the highlight so the sphere still has a lit side and a shaded one —
    // a flat disc of pure black reads as a hole, not an object.
    const body = sctx.createRadialGradient(c * 0.68, c * 0.6, 0, c, c, c);
    body.addColorStop(0, "rgba(38, 30, 24, 0.9)");
    body.addColorStop(0.55, "rgba(14, 10, 7, 0.94)");
    body.addColorStop(0.93, "rgba(0, 0, 0, 0.96)");
    body.addColorStop(1, "rgba(0, 0, 0, 0)");
    sctx.fillStyle = body;
    sctx.beginPath();
    sctx.arc(c, c, c * 0.96, 0, Math.PI * 2);
    sctx.fill();

    // The specular highlight, kept white on purpose. It is the one thing that
    // makes a dark ring read as a rounded, lit object rather than a hole
    // punched in the page.
    const spec = sctx.createRadialGradient(
      c * 0.62, c * 0.55, 0,
      c * 0.62, c * 0.55, c * 0.34
    );
    spec.addColorStop(0, "rgba(255, 255, 255, 0.8)");
    spec.addColorStop(0.45, "rgba(255, 255, 255, 0.22)");
    spec.addColorStop(1, "rgba(255, 255, 255, 0)");
    sctx.fillStyle = spec;
    sctx.beginPath();
    sctx.arc(c * 0.62, c * 0.55, c * 0.34, 0, Math.PI * 2);
    sctx.fill();

    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    // Never reassigned — bubbles are added and removed in place.
    const bubbles: Bubble[] = [];

    // Where the cursor was when the last bubble was released.
    let lastX = 0;
    let lastY = 0;
    let seeded = false;

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      // 1.5 is the point past which nobody can see the difference in a field of
      // soft shapes, and every step above it quadruples fill cost.
      dpr = Math.min(1.5, window.devicePixelRatio || 1);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const release = (x: number, y: number) => {
      if (bubbles.length >= MAX) return;
      bubbles.push({
        x,
        y,
        // Bigger bubbles rise faster, as they do in water. These climb about
        // three times as fast as the first pass, which is the difference
        // between drifting and darting.
        vy: -(2.1 + Math.random() * 2.3),
        vx: (Math.random() - 0.5) * 1,
        // Smaller than before: less air to push, and small dark shapes read as
        // quick where big ones read as heavy, whatever the actual speed.
        r: 2.2 + Math.random() * 5,
        age: 0,
        // Shorter lives to match: a fast bubble that lingers looks like it
        // stalled halfway up.
        decay: 0.013 + Math.random() * 0.011,
        phase: Math.random() * Math.PI * 2,
      });
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.age += b.decay;

        if (b.age >= 1 || b.y < -40) {
          // Swap-and-pop: cheaper than splice, and order does not matter here.
          bubbles[i] = bubbles[bubbles.length - 1];
          bubbles.pop();
          continue;
        }

        // The wobble is what stops them climbing in straight lines; the phase
        // offset keeps each one on its own path.
        b.x += b.vx + Math.sin(b.age * 16 + b.phase) * 1.1;
        b.y += b.vy;
        // Rising bubbles accelerate and swell as the pressure drops.
        b.vy -= 0.026;

        const grow = 1 + b.age * 0.35;
        const d = b.r * 2 * grow;
        // In for a fifth of its life, out for the last third.
        const fade =
          b.age < 0.2 ? b.age / 0.2 : b.age > 0.66 ? (1 - b.age) / 0.34 : 1;

        ctx.globalAlpha = Math.max(0, fade) * 0.85;
        ctx.drawImage(sprite, b.x - d / 2, b.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;

      frame = requestAnimationFrame(step);
    };

    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Only over the scene.
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;

      if (!seeded) {
        lastX = x;
        lastY = y;
        seeded = true;
        return;
      }

      /*
       * Released by DISTANCE travelled, not by event. Pointer events fire at
       * whatever rate the device reports — a gaming mouse reports eight times
       * as often as a trackpad — so spawning per event would give two people
       * completely different effects. Spacing them along the path makes the
       * trail depend on how far the cursor went, which is what the eye
       * actually reads.
       */
      if (Math.hypot(x - lastX, y - lastY) < SPACING) return;
      lastX = x;
      lastY = y;
      release(x, y);
      // A second, smaller one just behind gives the trail some depth.
      if (Math.random() < 0.5) release(x + (Math.random() - 0.5) * 18, y + 6);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    /*
     * Run only while the hero is on screen and the tab is in front. A CMS sits
     * open all day; there is no reason to burn a core on something scrolled
     * past or behind another window.
     */
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { threshold: 0 }
    );
    io.observe(canvas);

    const onVisibility = () =>
      document.hidden ? stop() : io.takeRecords().length === 0 && start();

    size();
    // A typeof test rather than a truthiness one: the DOM lib declares
    // requestIdleCallback as always present, so `if (window.requestIdleCallback)`
    // is rejected as a condition that is always true — but Safari has still not
    // shipped it, so the fallback is not dead code.
    const supportsIdle = typeof window.requestIdleCallback === "function";
    const idle: number = supportsIdle
      ? window.requestIdleCallback(start, { timeout: 900 })
      : window.setTimeout(start, 400);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("resize", size);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stop();
      if (supportsIdle) window.cancelIdleCallback(idle);
      else clearTimeout(idle);
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", size);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} className={s.particles} aria-hidden="true" />;
}
