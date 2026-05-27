"use client";

import Link from "next/link";
import { useTx } from "@/lib/tx/store";
import { useWallet } from "@/lib/wallet/store";
import { MOCK_MARKETS, MOCK_POSITION, EMPTY_POSITION } from "@/lib/mocks";
import {
  fmtApy,
  fmtMaturityDate,
  fmtTimeToMaturity,
  fmtUsd,
} from "@/lib/format";

/**
 * Portfolio view. Mock-backed for the moment. When live, replace the
 * useMockPositions hook with a per-market useUserPosition from @strate/sdk.
 */
export default function PortfolioPage() {
  const { status } = useWallet();
  const isConnected = status === "connected";
  const tx = useTx();

  // Show positions only for the bUSDC market in the mock; the others read
  // as empty so the empty state is also visible at the same time.
  const positions = MOCK_MARKETS.map((m, idx) => ({
    market: m,
    position: idx === 0 ? MOCK_POSITION : EMPTY_POSITION,
  }));

  const totalPt =
    Number(positions.reduce((sum, p) => sum + p.position.ptBalance, 0n)) / 1e7;
  const totalYt =
    Number(positions.reduce((sum, p) => sum + p.position.ytBalance, 0n)) / 1e7;
  const claimable =
    Number(positions.reduce((sum, p) => sum + p.position.claimableYield, 0n)) /
    1e7;

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

      <div className="mt-10 grid grid-cols-2 gap-6 border-y border-parchment/10 py-6 lg:grid-cols-4">
        <Stat label="Total PT" value={totalPt.toFixed(2)} mono />
        <Stat label="Total YT" value={totalYt.toFixed(2)} mono />
        <Stat label="Claimable yield" value={claimable.toFixed(2)} primary mono />
        <Stat label="Markets with position" value={`${positions.filter((p) => p.position.ptBalance > 0n).length}`} />
      </div>

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
          {positions.map(({ market, position }) => {
            const hasPosition = position.ptBalance > 0n || position.ytBalance > 0n;
            if (!hasPosition) return null;
            const pt = Number(position.ptBalance) / 1e7;
            const yt = Number(position.ytBalance) / 1e7;
            const accrued = Number(position.accruedYield) / 1e7;
            const claim = Number(position.claimableYield) / 1e7;

            return (
              <div
                key={market.id}
                className="border border-parchment/12 bg-ink-deep/40"
              >
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
                    Position value (est) · {fmtUsd((pt + yt) / 2)}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
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
                          copy: "Claims the underlying yield accrued by your YT balance since the last claim or mint event.",
                        })
                      }
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
          })}

          {positions.every((p) => p.position.ptBalance === 0n) && (
            <div className="border border-parchment/10 bg-parchment/[0.02] px-8 py-12 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foil/80">
                No positions yet
              </p>
              <p
                className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.55] text-parchment/65"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                Open a position by minting PT + YT against any live market.
              </p>
              <Link
                href="/markets"
                className="mt-6 inline-flex h-11 items-center gap-3 bg-foil px-6 font-mono text-[11px] uppercase tracking-[0.28em] text-ink transition-colors hover:bg-foil-deep"
                style={{ borderRadius: 2 }}
              >
                Browse markets →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  primary,
  mono,
}: {
  label: string;
  value: string;
  primary?: boolean;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
        {label}
      </p>
      <p
        className={`num mt-1.5 ${mono ? "font-mono" : "font-display"} text-[28px] ${
          primary ? "text-foil" : "text-parchment"
        }`}
      >
        {value}
      </p>
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
