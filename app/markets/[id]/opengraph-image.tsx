import { ImageResponse } from "next/og";
import { getMockMarket } from "@/lib/mocks";

export const runtime = "edge";
export const alt = "Strate market";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function fmtDate(unixSec: number) {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function fmtAge(unixSec: number) {
  const s = unixSec - Math.floor(Date.now() / 1000);
  if (s <= 0) return "matured";
  const day = 86400;
  if (s < 60 * day) return `${Math.round(s / day)}d remaining`;
  if (s < 365 * day) return `${Math.round(s / (30 * day))}mo remaining`;
  return `${(s / (365 * day)).toFixed(1)}y remaining`;
}

/**
 * Per-market OG. Big symbol + issuer + key stats. Foil "Live" pill when
 * the market is deployed; muted "Soon" otherwise.
 */
export default async function OG({ params }: { params: { id: string } }) {
  const m = getMockMarket(params.id);
  if (!m) {
    // Fallback to a generic card so Next doesn't 500 a previewing scraper
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "#0B2545",
            color: "#F5F1E8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Georgia, serif",
            fontSize: 64,
          }}
        >
          Market not found
        </div>
      ),
      { ...size },
    );
  }

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
            opacity: 0.5,
          }}
        />

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
          <span>Market · {m.id}</span>
          <div style={{ flex: 1, height: 1, background: "rgba(201,169,97,0.30)" }} />
          {m.isLive ? (
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "6px 14px",
                border: "1px solid rgba(122,168,111,0.55)",
                color: "#7AA86F",
                fontSize: 13,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: "#7AA86F",
                  display: "block",
                }}
              />
              Live testnet
            </span>
          ) : (
            <span style={{ color: "rgba(245,241,232,0.4)" }}>Soon</span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 28,
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: 132,
              lineHeight: 0.95,
              letterSpacing: "-0.028em",
              fontWeight: 600,
              color: "#F5F1E8",
            }}
          >
            {m.underlying.symbol}
          </div>
          <div
            style={{
              fontSize: 44,
              lineHeight: 1.1,
              fontStyle: "italic",
              fontWeight: 400,
              color: "#C9A961",
              marginTop: 8,
            }}
          >
            {m.underlying.issuer}
          </div>
          <div
            style={{
              fontSize: 22,
              marginTop: 18,
              color: "rgba(245,241,232,0.65)",
              fontFamily: "Menlo, monospace",
              letterSpacing: "0.08em",
            }}
          >
            Matures {fmtDate(m.maturity)} · {fmtAge(m.maturity)}
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 64,
            marginTop: "auto",
            paddingTop: 24,
            borderTop: "1px solid rgba(245,241,232,0.15)",
            zIndex: 1,
          }}
        >
          <Stat label="Implied APY" value={`${(m.impliedApy * 100).toFixed(2)}%`} accent />
          <Stat label="PT" value={m.ptPrice.toFixed(4)} />
          <Stat label="YT" value={m.ytPrice.toFixed(4)} />
          <Stat label="Fee" value="0.30%" />
        </div>
      </div>
    ),
    { ...size },
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span
        style={{
          fontFamily: "Menlo, monospace",
          fontSize: 13,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(245,241,232,0.45)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "Menlo, monospace",
          fontSize: 44,
          letterSpacing: "-0.01em",
          color: accent ? "#C9A961" : "#F5F1E8",
        }}
      >
        {value}
      </span>
    </div>
  );
}
