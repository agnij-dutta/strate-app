"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { MarketSummary } from "@/lib/mocks";
import {
  fmtApy,
  fmtMaturityDate,
  fmtPrice,
  fmtTimeToMaturity,
  fmtUsd,
} from "@/lib/format";
import YieldCurveChart from "./YieldCurveChart";
import ActionPanel from "./ActionPanel";

export default function MarketDetail({ market }: { market: MarketSummary }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-10 lg:px-10 lg:py-14">
      <div className="mb-6">
        <Link
          href="/markets"
          className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.32em] text-parchment/55 transition-colors hover:text-foil"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          >
            <path d="M9 3L3 9M3 9H8M3 9V4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
          </svg>
          All markets
        </Link>
      </div>

      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-12 items-end gap-x-10 gap-y-4 border-b border-parchment/10 pb-8"
      >
        <div className="col-span-12 lg:col-span-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.36em] text-foil/80">
            Market · {market.id}
          </p>
          <h1
            className="mt-2 font-display font-medium text-parchment"
            style={{
              fontSize: "clamp(40px, 6.4vw, 88px)",
              lineHeight: 0.96,
              letterSpacing: "-0.024em",
            }}
          >
            {market.underlying.symbol}{" "}
            <span
              className="italic text-foil-gradient"
              style={{ fontWeight: 400 }}
            >
              {market.underlying.issuer}
            </span>
          </h1>
          <p
            className="mt-3 text-[15px] text-parchment/65"
            style={{ fontFamily: "var(--font-fraunces), serif" }}
          >
            Matures {fmtMaturityDate(market.maturity)} · {fmtTimeToMaturity(market.maturity)} remaining
          </p>
        </div>

        <div className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-4 lg:col-span-5 lg:grid-cols-4">
          <StatMini label="Implied APY" value={fmtApy(market.impliedApy)} primary />
          <StatMini label="PT" value={fmtPrice(market.ptPrice)} mono />
          <StatMini label="YT" value={fmtPrice(market.ytPrice)} mono />
          <StatMini label="TVL" value={market.tvl === 0 ? "—" : fmtUsd(market.tvl)} />
        </div>
      </motion.header>

      <div className="mt-10 grid grid-cols-12 gap-x-10 gap-y-10">
        <section className="col-span-12 lg:col-span-7">
          <div className="flex items-baseline gap-4 font-mono text-[9.5px] uppercase tracking-[0.36em] text-foil/80">
            <span>§ 02</span>
            <span className="block h-px flex-1 bg-foil/15" />
            <span className="text-parchment/40">Implied yield curve</span>
          </div>
          <div className="mt-5 border border-parchment/10 bg-ink-deep/40 p-6">
            <YieldCurveChart impliedApy={market.impliedApy} />
          </div>

          <div className="mt-10 flex items-baseline gap-4 font-mono text-[9.5px] uppercase tracking-[0.36em] text-foil/80">
            <span>§ 03</span>
            <span className="block h-px flex-1 bg-foil/15" />
            <span className="text-parchment/40">Mechanics</span>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Mechanic
              label="Principal token (PT)"
              copy={`Holds a redemption right for 1 ${market.underlying.symbol} at maturity. Trades below par; the gap is the locked-in yield until ${fmtMaturityDate(market.maturity)}.`}
            />
            <Mechanic
              label="Yield token (YT)"
              copy={`Receives the underlying yield accrued by 1 ${market.underlying.symbol} until maturity. Value goes to zero at maturity by design.`}
            />
            <Mechanic
              label="AMM"
              copy="Time-decaying weight curve. PT-vs-underlying liquidity narrows as maturity approaches, so trade size limits tighten in the final weeks."
            />
            <Mechanic
              label="Oracle"
              copy="Reads the wrapper exchange rate directly from the issuer contract. No external price feed."
            />
          </div>
        </section>

        <aside className="col-span-12 lg:col-span-5">
          <ActionPanel market={market} />
        </aside>
      </div>
    </div>
  );
}

function StatMini({
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
        className={`mt-1.5 num text-[22px] ${mono ? "font-mono" : "font-display"} ${
          primary ? "text-foil" : "text-parchment/95"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Mechanic({ label, copy }: { label: string; copy: string }) {
  return (
    <div className="border border-parchment/10 p-5">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-foil/75">
        {label}
      </p>
      <p
        className="mt-2 text-[14px] leading-[1.6] text-parchment/75"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        {copy}
      </p>
    </div>
  );
}
