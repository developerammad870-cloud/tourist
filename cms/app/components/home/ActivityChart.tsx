import s from "./Home.module.css";

/**
 * Enquiries over the last fortnight.
 *
 * Hand-drawn SVG rather than a charting library: this is one series of
 * fourteen points, and every library that could draw it would ship more
 * JavaScript than the whole page. It is also a Server Component — the shape
 * arrives as HTML, so there is nothing to hydrate and no empty box while a
 * chart boots.
 *
 * The line is drawn through the points, the area beneath it fades into the
 * card, and each point carries a soft halo. The peak gets a brighter halo and
 * a label, because the one thing anyone reads off a chart this size is where
 * the busiest day was.
 */

export type Point = { label: string; value: number };

const W = 720;
const H = 200;
const PAD_X = 14;
const PAD_Y = 22;

export default function ActivityChart({ points }: { points: Point[] }) {
  if (points.length === 0) return null;

  const max = Math.max(1, ...points.map((p) => p.value));
  const step = (W - PAD_X * 2) / Math.max(1, points.length - 1);

  const xy = points.map((p, i) => ({
    ...p,
    x: PAD_X + i * step,
    // Values grow upward, SVG grows downward — hence the subtraction.
    y: PAD_Y + (1 - p.value / max) * (H - PAD_Y * 2),
  }));

  const line = xy
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  // The fill is the same path closed along the bottom edge.
  const area = `${line} L ${xy[xy.length - 1].x.toFixed(1)} ${H} L ${xy[0].x.toFixed(1)} ${H} Z`;
  const peak = xy.reduce((a, b) => (b.value >= a.value ? b : a));

  return (
    <svg
      className={s.chart}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Enquiries per day for the last ${points.length} days. Busiest: ${peak.label}, ${peak.value}.`}
    >
      <defs>
        <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f3c98c" />
          <stop offset="55%" stopColor="#d9a05e" />
          <stop offset="100%" stopColor="#a86a32" />
        </linearGradient>
        <linearGradient id="chartArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d9a05e" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#d9a05e" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Two faint rules, so a value can be read against something. */}
      {[0.33, 0.66].map((f) => (
        <line
          key={f}
          x1={0}
          x2={W}
          y1={PAD_Y + f * (H - PAD_Y * 2)}
          y2={PAD_Y + f * (H - PAD_Y * 2)}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="1"
        />
      ))}

      <path d={area} fill="url(#chartArea)" />
      <path
        d={line}
        fill="none"
        stroke="url(#chartLine)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {xy.map((p) => (
        <g key={p.label}>
          {/* Halo first, dot on top: drawing them the other way round puts the
              soft edge over the sharp one and the point looks smudged. */}
          <circle
            cx={p.x}
            cy={p.y}
            r={p === peak ? 9 : 6}
            fill={p === peak ? "rgba(233,176,106,0.4)" : "rgba(217,160,94,0.24)"}
          />
          <circle cx={p.x} cy={p.y} r={p === peak ? 3.4 : 2.4} fill="#fff" />
        </g>
      ))}

      <text
        x={Math.min(W - 40, Math.max(28, peak.x))}
        y={Math.max(14, peak.y - 14)}
        textAnchor="middle"
        className={s.chartPeak}
      >
        {peak.value}
      </text>
    </svg>
  );
}
