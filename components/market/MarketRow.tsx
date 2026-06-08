"use client";

import Link from "next/link";
import type { MarketSummary } from "@/lib/mocks";
import { useLiveMarketState } from "@/lib/hooks/use-live-market-state";
import { fmtApy, fmtPrice, fmtTimeToMaturity, fmtUsd } from "@/lib/format";

const STATUS_DOT: Record<string, string> = {
  live: "bg-bid",
  paused: "bg-parchment/30",
  expiring: "bg-foil",
};
const STATUS_LABEL: Record<string, string> = {
  live: "Live",
  paused: "Soon",
  expiring: "Expiring",
};

function fmtSupply(value: number, symbol: string): string {
  if (value === 0) return `0 ${symbol}`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M ${symbol}`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K ${symbol}`;
  if (value >= 1) return `${value.toFixed(2)} ${symbol}`;
  return `${value.toFixed(4)} ${symbol}`;
}

/**
 * One market row. Live markets read implied APY, PT/YT price, and total
 * supply on-chain via useLiveMarketState; the TVL column shows that
 * supply denominated in the underlying (there is no USD price feed, so
 * "TVL" is the underlying locked). Mock cards fall back to their static
 * display values.
 */
export default function MarketRow({ market: m }: { market: MarketSummary }) {
  const live = useLiveMarketState(m.isLive ? m.contracts?.yieldStripping : undefined);

  const impliedApy = live.impliedApy ?? m.impliedApy;
  const ptPrice = live.ptPrice ?? m.ptPrice;
  const ytPrice = live.ytPrice ?? m.ytPrice;

  const tvlValue = m.isLive
    ? live.supplyUnderlying === undefined
      ? live.isLoading
        ? "…"
        : "—"
      : fmtSupply(live.supplyUnderlying, m.underlying.symbol)
    : m.tvl === 0
      ? "—"
      : fmtUsd(m.tvl);

  return (
    <li>
      <Link
        href={`/markets/${m.id}`}
        className="group block border-b border-parchment/8 transition-colors duration-200 hover:bg-parchment/[0.025]"
      >
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 py-4 sm:px-6 sm:py-5 lg:grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr_0.6fr] lg:items-center lg:gap-4">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-baseline gap-2.5">
              <p className="font-display text-[22px] text-parchment">
                {m.underlying.symbol}
              </p>
              {m.isLive && (
                <span className="inline-flex items-center gap-1.5 border border-bid/40 bg-bid/[0.08] px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.28em] text-bid">
                  <span aria-hidden="true" className="block h-1 w-1 bg-bid" />
                  Live
                </span>
              )}
            </div>
            <p
              className="text-[12px] italic text-parchment/55"
              style={{ fontFamily: "var(--font-fraunces), serif" }}
            >
              {m.underlying.issuer}
            </p>
          </div>
          <Cell
            label="Maturity"
            value={fmtTimeToMaturity(m.maturity)}
            accent={m.status === "expiring"}
          />
          <Cell label="Implied APY" value={fmtApy(impliedApy)} primary pulse={m.isLive && live.isLoading} />
          <Cell label="PT" value={fmtPrice(ptPrice)} mono />
          <Cell label="YT" value={fmtPrice(ytPrice)} mono />
          <Cell label="TVL" value={tvlValue} mono={m.isLive} />
          <div className="hidden items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/65 lg:flex">
            <span aria-hidden="true" className={`block h-1.5 w-1.5 ${STATUS_DOT[m.status]}`} />
            {STATUS_LABEL[m.status]}
          </div>
        </div>
      </Link>
    </li>
  );
}

function Cell({
  label,
  value,
  primary,
  mono,
  accent,
  pulse,
}: {
  label: string;
  value: string;
  primary?: boolean;
  mono?: boolean;
  accent?: boolean;
  pulse?: boolean;
}) {
  return (
    <div className="lg:text-right">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/40 lg:hidden">
        {label}
      </p>
      <p
        className={`num text-[14px] ${mono ? "font-mono" : "font-display"} ${
          primary ? "text-foil" : accent ? "text-foil/85" : "text-parchment/90"
        } ${pulse ? "animate-pulse" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
