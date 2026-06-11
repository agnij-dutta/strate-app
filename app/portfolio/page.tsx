"use client";

import Link from "next/link";
import { useTx } from "@/lib/tx/store";
import { useWallet } from "@/lib/wallet/store";
import { MOCK_MARKETS } from "@/lib/mocks";
import { useUserPosition } from "@strate/sdk/hooks";
import {
  fmtApy,
  fmtMaturityDate,
  fmtTimeToMaturity,
} from "@/lib/format";

const TOKEN_DECIMALS = 7;

/**
 * Portfolio view, mainnet-wired. For each live market we run
 * `useUserPosition` against the YS contract, which reads PT/YT
 * balances and `pending_yield` from chain. Markets where the
 * connected wallet has nothing are hidden; the empty state
 * shows only when every position is zero.
 */
export default function PortfolioPage() {
  const { status, address } = useWallet();
  const isConnected = status === "connected" && Boolean(address);
  const tx = useTx();

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.36em] text-foil/80">
        <span>§ 01</span>
        <span className="block h-px flex-1 bg-foil/15" />
        <span className="text-parchment/40">Your positions</span>
      </div>

      <header className="mt-6 grid grid-cols-12 gap-x-10 gap-y-6">
        <h1
          className="col-span-12 font-display font-medium text-parchment lg:col-span-8"
          style={{
            fontSize: "clamp(40px, 5.6vw, 72px)",
            lineHeight: 0.98,
            letterSpacing: "-0.022em",
          }}
        >
          Portfolio.
        </h1>
        <p
          className="col-span-12 max-w-[44ch] text-[16px] leading-[1.6] text-parchment/65 lg:col-span-4"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Principal and yield positions across all markets. Claim accrued yield
          per market or redeem matched PT + YT pairs back to underlying.
        </p>
      </header>

      {!isConnected ? (
        <div className="mt-12 border border-parchment/10 bg-parchment/[0.02] px-8 py-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foil/80">
            Wallet not connected
          </p>
          <p
            className="mx-auto mt-4 max-w-[44ch] text-[17px] leading-[1.55] text-parchment/65"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Connect Freighter from the header to load your positions, accrued
            yield, and per-market P/L.
          </p>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {MOCK_MARKETS.filter((m) => m.isLive && m.contracts).map((market) => (
            <MarketRow
              key={market.id}
              market={market}
              userAddress={address!}
              onClaim={(claim) =>
                tx.open({
                  action: "claim",
                  title: `Claim yield on ${market.underlying.symbol}`,
                  rows: [
                    {
                      label: "You receive",
                      value: `${claim.toFixed(4)} ${market.underlying.symbol}`,
                      emphasis: true,
                    },
                    { label: "Resets accrual to 0", value: "Confirm" },
                  ],
                  copy:
                    "Claims the underlying yield accrued by your YT balance since the last claim or mint event.",
                  params:
                    market.isLive && market.contracts
                      ? {
                          kind: "claim" as const,
                          market: market.contracts.yieldStripping,
                        }
                      : undefined,
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MarketRow({
  market,
  userAddress,
  onClaim,
}: {
  market: (typeof MOCK_MARKETS)[number];
  userAddress: string;
  onClaim: (claim: number) => void;
}) {
  const pos = useUserPosition(market.contracts!.yieldStripping, userAddress);

  if (pos.isLoading) {
    return (
      <div className="border border-parchment/10 bg-parchment/[0.02] px-6 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/45">
          Loading {market.underlying.symbol}…
        </p>
      </div>
    );
  }
  if (pos.error || !pos.data) {
    return null;
  }

  const pt = Number(pos.data.ptBalance) / 10 ** TOKEN_DECIMALS;
  const yt = Number(pos.data.ytBalance) / 10 ** TOKEN_DECIMALS;
  const accrued = Number(pos.data.accruedYield) / 10 ** TOKEN_DECIMALS;
  const claim = Number(pos.data.claimableYield) / 10 ** TOKEN_DECIMALS;

  // Hide markets where the user has nothing.
  if (pt === 0 && yt === 0 && claim === 0) return null;

  return (
    <div className="border border-parchment/12 bg-ink-deep/40">
      <div className="border-b border-parchment/8 px-6 py-5">
        <div className="flex items-baseline justify-between gap-6">
          <div>
            <Link
              href={`/markets/${market.id}`}
              className="group inline-flex items-baseline gap-3 transition-colors"
            >
              <h2 className="font-display text-[28px] text-parchment group-hover:text-foil">
                {market.underlying.symbol}
              </h2>
              <span
                className="text-[13px] italic text-parchment/55"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                {market.underlying.issuer}
              </span>
            </Link>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/45">
              Matures {fmtMaturityDate(market.maturity)} ·{" "}
              {fmtTimeToMaturity(market.maturity)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/40">
              Implied APY
            </p>
            <p className="num mt-1 font-display text-[24px] text-foil">
              {fmtApy(market.impliedApy)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-6 px-6 py-5 lg:grid-cols-4">
        <PosCell label="PT balance" value={pt.toFixed(4)} />
        <PosCell label="YT balance" value={yt.toFixed(4)} />
        <PosCell label="Accrued yield" value={accrued.toFixed(4)} />
        <PosCell label="Claimable" value={claim.toFixed(4)} primary />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-parchment/8 px-6 py-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/40">
          Underlying held in vault on this market
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onClaim(claim)}
            disabled={claim === 0}
            className="h-10 border border-foil/40 bg-foil/[0.08] px-5 font-mono text-[10px] uppercase tracking-[0.24em] text-foil transition-colors hover:border-foil hover:bg-foil hover:text-ink disabled:opacity-40"
            style={{ borderRadius: 2 }}
          >
            Claim yield
          </button>
          <Link
            href={`/markets/${market.id}`}
            className="h-10 border border-parchment/25 px-5 font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/85 transition-colors hover:border-parchment/55 inline-flex items-center"
            style={{ borderRadius: 2 }}
          >
            Manage
          </Link>
        </div>
      </div>
    </div>
  );
}

function PosCell({
  label,
  value,
  primary,
}: {
  label: string;
  value: string;
  primary?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
        {label}
      </p>
      <p
        className={`num mt-1.5 font-display text-[22px] ${
          primary ? "text-foil" : "text-parchment/95"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
