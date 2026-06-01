import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Strate · Yield-stripping on Stellar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Root OG image. Editorial bond-tear aesthetic: parchment ground, foil
 * accent strip down the middle, italic display headline. Designed to be
 * legible at thumbnail size on Twitter/LinkedIn cards.
 */
export default async function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0B2545",
          color: "#F5F1E8",
          fontFamily: "Georgia, serif",
          position: "relative",
          padding: 80,
        }}
      >
        {/* Faint dot grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(245,241,232,0.07) 1.4px, transparent 1.4px)",
            backgroundSize: "40px 40px",
            opacity: 0.6,
          }}
        />
        {/* Foil perforation strip */}
        <div
          style={{
            position: "absolute",
            top: 80,
            bottom: 80,
            left: 800,
            width: 4,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 4,
                height: 4,
                borderRadius: 2,
                background: "#C9A961",
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontFamily: "Menlo, monospace",
              fontSize: 18,
              letterSpacing: "0.36em",
              textTransform: "uppercase",
              color: "#C9A961",
            }}
          >
            <div
              style={{
                width: 60,
                height: 1,
                background: "rgba(201,169,97,0.8)",
              }}
            />
            <span>Yield stripping · Stellar · RWA</span>
          </div>

          {/* Headline */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              maxWidth: 760,
              marginTop: 28,
            }}
          >
            <div
              style={{
                fontSize: 96,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                fontWeight: 600,
                color: "#F5F1E8",
              }}
            >
              Split yield
            </div>
            <div
              style={{
                fontSize: 96,
                lineHeight: 1.02,
                letterSpacing: "-0.03em",
                fontWeight: 400,
                fontStyle: "italic",
                color: "#C9A961",
              }}
            >
              from principal.
            </div>
          </div>

          {/* Bottom row: wordmark + serial */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(201,169,97,0.30)",
              paddingTop: 24,
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 600,
                fontStyle: "italic",
                letterSpacing: "-0.02em",
                color: "#F5F1E8",
                lineHeight: 1,
              }}
            >
              strate
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                fontFamily: "Menlo, monospace",
                fontSize: 14,
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: "rgba(245,241,232,0.55)",
                lineHeight: 1.6,
              }}
            >
              <span>STR-2026-001247</span>
              <span style={{ opacity: 0.75 }}>Bearer · Series A · MMXXVI</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
