"use client";

import { useEffect, useRef, useState } from "react";
import s from "./Home.module.css";

/**
 * Fades its children up as they enter the viewport, once.
 *
 * Uses IntersectionObserver rather than a scroll listener so the browser does
 * the visibility maths off the main thread. Disconnects after the first
 * intersection — the animation only ever runs once per element.
 */
export default function Reveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Under reduced motion, don't observe and don't set state — the
    // `prefers-reduced-motion` block in the stylesheet already pins .reveal to
    // opacity 1 with no transform, so the content is visible either way.
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.05 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${s.reveal} ${shown ? s.revealed : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
