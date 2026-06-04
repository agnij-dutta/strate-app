import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Strate · Markets";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Markets index OG. Same editorial vocabulary as the root card but
 * leans on a tabular treatment that signals "ledger / index" — three
 * rows of fake market data behind a foil hairline.
 */
export default async function OG() {
  const rows = [
    { sym: "XLM", maturity: "Aug 2026", apy: "8.23%" },
    { sym: "bUSDC", maturity: "Dec 2026", apy: "5.21%" },
    { sym: "CETES", maturity: "Sep 2026", apy: "10.04%" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0B2545",
          color: "#F5F1E8",
          fontFamily: "Georgia, serif",
          padding: 80,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(rgba(245,241,232,0.07) 1.4px, transparent 1.4px)",
            backgroundSize: "40px 40px",
            opacity: 0.55,
          }}
        />

        {/* Top eyebrow */}
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
            zIndex: 1,
          }}
        >
          <span>§ Markets</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,169,97,0.30)" }} />
          <span style={{ color: "rgba(245,241,232,0.45)" }}>strate.app</span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 32,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 92,
              lineHeight: 1,
              letterSpacing: "-0.025em",
              fontWeight: 600,
              color: "#F5F1E8",
            }}
          >
            Markets.
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.5,
              marginTop: 16,
              maxWidth: 760,
              color: "rgba(245,241,232,0.7)",
              fontStyle: "italic",
            }}
          >
            Yield-stripping markets live on Stellar testnet. Mint principal
            and yield tokens, trade them separately, redeem at maturity.
          </div>
        </div>

        {/* Mini ledger table */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            flexDirection: "column",
            border: "1px solid rgba(245,241,232,0.18)",
            zIndex: 1,
          }}
        >
          {rows.map((r, i) => (
            <div
              key={r.sym}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 28px",
                borderBottom:
                  i < rows.length - 1
                    ? "1px solid rgba(245,241,232,0.10)"
                    : "none",
                fontFamily: "Menlo, monospace",
                fontSize: 22,
                color: "rgba(245,241,232,0.9)",
              }}
            >
              <span style={{ width: 200, fontFamily: "Georgia, serif", fontSize: 28 }}>
                {r.sym}
              </span>
              <span style={{ width: 200, color: "rgba(245,241,232,0.55)" }}>
                {r.maturity}
              </span>
              <span style={{ color: "#C9A961" }}>{r.apy}</span>
            </div>
          ))}
        </div>

        {/* Bottom signature */}
        <div
          style={{
            position: "absolute",
            bottom: 60,
            left: 80,
            right: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: "1px solid rgba(201,169,97,0.30)",
            paddingTop: 18,
            fontFamily: "Menlo, monospace",
            fontSize: 14,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(245,241,232,0.45)",
          }}
        >
          <span style={{ fontFamily: "Georgia, serif", fontSize: 40, fontStyle: "italic", color: "#F5F1E8", textTransform: "none", letterSpacing: "-0.01em" }}>
            strate
          </span>
          <span>Testnet · Mainnet pending audit</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
