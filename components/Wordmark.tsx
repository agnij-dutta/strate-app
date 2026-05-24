type Props = {
  size?: number;
  color?: "ink" | "parchment" | string;
  compact?: boolean;
};

/**
 * Lowercase "strate" in Fraunces with 5 Foil Gold perforation dots
 * occupying the optical kerning gap between "a" and "t". Identical to the
 * landing wordmark so brand carries across app + marketing.
 */
export default function Wordmark({
  size = 32,
  color = "parchment",
  compact = false,
}: Props) {
  const c =
    color === "ink" ? "#0B2545" : color === "parchment" ? "#F5F1E8" : color;
  const fontSize = size;
  const capH = fontSize * 0.7;
  const dotD = Math.max(2.5, capH * 0.085);
  const gap = dotD;
  const stripH = 5 * dotD + 4 * gap;
  const wordW = size * 3.0;
  const h = size * 1.05;
  const perfX = wordW * 0.605;
  const yMid = h * 0.62;

  return (
    <span
      className="strate-wordmark inline-flex items-center"
      style={{ height: h, lineHeight: 1 }}
      aria-label="Strate"
    >
      <svg
        width={wordW}
        height={h}
        viewBox={`0 0 ${wordW} ${h}`}
        role="img"
        aria-hidden="true"
      >
        <text
          x={0}
          y={yMid + fontSize * 0.32}
          fill={c}
          style={{
            fontFamily: "var(--font-fraunces), Georgia, serif",
            fontWeight: 600,
            fontSize,
            letterSpacing: size >= 32 ? "-0.02em" : "0",
            fontFeatureSettings: '"ss01" 1',
          }}
        >
          strate
        </text>
        {!compact && (
          <g
            className="strate-perf"
            transform={`translate(${perfX}, ${yMid - stripH / 2})`}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <circle
                key={i}
                cx={0}
                cy={i * (dotD + gap) + dotD / 2}
                r={dotD / 2}
                fill="#C9A961"
              />
            ))}
          </g>
        )}
      </svg>
    </span>
  );
}
