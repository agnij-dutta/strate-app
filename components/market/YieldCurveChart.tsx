"use client";

import { useMemo, useState } from "react";

type Pt = { t: number; apy: number };

/**
 * Pure-SVG yield curve chart. Avoids pulling in a chart library so the
 * bundle stays small and the styling stays editorial. X axis is days to
 * maturity; Y axis is implied APY at that maturity.
 *
 * Data is currently derived analytically from the current market's APY.
 * Once the AMM is deployed, swap to useYieldCurve from @strate/sdk/hooks.
 */
export default function YieldCurveChart({ impliedApy }: { impliedApy: number }) {
  const samples = 64;
  const data: Pt[] = useMemo(() => {
    return Array.from({ length: samples }, (_, i) => {
      const t = (i / (samples - 1)) * 365; // days
      const apy =
        impliedApy *
        (0.78 + 0.32 * Math.exp(-Math.abs(t - 90) / 180)) *
        (1 + (Math.random() - 0.5) * 0.012);
      return { t, apy };
    });
  }, [impliedApy]);

  const [hover, setHover] = useState<Pt | null>(null);

  const W = 720;
  const H = 280;
  const padL = 56;
  const padR = 16;
  const padT = 24;
  const padB = 32;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const xs = data.map((d) => d.t);
  const ys = data.map((d) => d.apy);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys) * 0.85;
  const yMax = Math.max(...ys) * 1.08;

  const x = (t: number) => padL + ((t - xMin) / (xMax - xMin)) * innerW;
  const y = (a: number) => padT + (1 - (a - yMin) / (yMax - yMin)) * innerH;

  const path = data
    .map((d, i) => (i === 0 ? `M ${x(d.t)} ${y(d.apy)}` : `L ${x(d.t)} ${y(d.apy)}`))
    .join(" ");
  const area =
    path + ` L ${x(xMax)} ${padT + innerH} L ${x(xMin)} ${padT + innerH} Z`;

  const xTicks = [0, 90, 180, 270, 365];
  const yTicks = 4;

  return (
    <div
      className="relative"
      onMouseLeave={() => setHover(null)}
      onMouseMove={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const px = e.clientX - rect.left;
        const scale = W / rect.width;
        const svgX = px * scale;
        const t = xMin + ((svgX - padL) / innerW) * (xMax - xMin);
        const nearest = data.reduce((best, p) =>
          Math.abs(p.t - t) < Math.abs(best.t - t) ? p : best,
        );
        if (nearest.t >= xMin && nearest.t <= xMax) setHover(nearest);
      }}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
        className="block"
      >
        <defs>
          <linearGradient id="foilArea" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#C9A961" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#C9A961" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const yy = padT + (i / yTicks) * innerH;
          return (
            <line
              key={`g${i}`}
              x1={padL}
              x2={W - padR}
              y1={yy}
              y2={yy}
              stroke="rgba(245,241,232,0.06)"
              strokeWidth={1}
            />
          );
        })}

        {/* Y axis labels */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const a = yMin + ((yTicks - i) / yTicks) * (yMax - yMin);
          const yy = padT + (i / yTicks) * innerH;
          return (
            <text
              key={`yl${i}`}
              x={padL - 8}
              y={yy + 3}
              textAnchor="end"
              fontSize={9.5}
              fontFamily="var(--font-jetbrains), monospace"
              fill="rgba(245,241,232,0.45)"
            >
              {(a * 100).toFixed(1)}%
            </text>
          );
        })}

        {/* X axis labels */}
        {xTicks.map((t) => (
          <text
            key={`xl${t}`}
            x={x(t)}
            y={H - padB + 18}
            textAnchor="middle"
            fontSize={9.5}
            fontFamily="var(--font-jetbrains), monospace"
            fill="rgba(245,241,232,0.45)"
          >
            {t === 0 ? "0d" : t === 365 ? "1y" : `${t}d`}
          </text>
        ))}

        {/* Area under curve */}
        <path d={area} fill="url(#foilArea)" />

        {/* Curve */}
        <path
          d={path}
          fill="none"
          stroke="#C9A961"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />

        {/* Hover crosshair */}
        {hover && (
          <g>
            <line
              x1={x(hover.t)}
              x2={x(hover.t)}
              y1={padT}
              y2={H - padB}
              stroke="rgba(245,241,232,0.35)"
              strokeWidth={0.8}
              strokeDasharray="2,3"
            />
            <circle
              cx={x(hover.t)}
              cy={y(hover.apy)}
              r={3.5}
              fill="#F5F1E8"
              stroke="#C9A961"
              strokeWidth={1}
            />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="pointer-events-none absolute font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/85"
          style={{
            left: `${(x(hover.t) / W) * 100}%`,
            top: `${(y(hover.apy) / H) * 100}%`,
            transform: "translate(12px, -28px)",
          }}
        >
          <span className="border border-foil/35 bg-ink-deep/95 px-2 py-1">
            {`${Math.round(hover.t)}d  ·  ${(hover.apy * 100).toFixed(2)}%`}
          </span>
        </div>
      )}
    </div>
  );
}
