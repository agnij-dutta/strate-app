import Link from "next/link";
import { MOCK_MARKETS } from "@/lib/mocks";
import {
  fmtApy,
  fmtPrice,
  fmtTimeToMaturity,
  fmtUsd,
} from "@/lib/format";

export const metadata = {
  title: "Markets · Strate",
  description: "Yield-stripping markets live on Stellar testnet.",
};

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

export default function MarketsPage() {
  const markets = MOCK_MARKETS;
  const totals = markets.reduce(
    (acc, m) => {
      acc.tvl += m.tvl;
      acc.count += 1;
      return acc;
    },
    { tvl: 0, count: 0 },
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] px-6 py-12 lg:px-10 lg:py-16">
      <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.36em] text-foil/80">
        <span>§ 01</span>
        <span className="block h-px flex-1 bg-foil/15" />
        <span className="text-parchment/40">Yield-stripping markets</span>
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
          Markets.
        </h1>
        <p
          className="col-span-12 max-w-[44ch] text-[16px] leading-[1.6] text-parchment/65 lg:col-span-4"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Mint principal (PT) and yield (YT) tokens against any listed market.
          Trade them separately on the AMM. Redeem at maturity.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-2 gap-6 border-y border-parchment/10 py-6 lg:grid-cols-4">
        <Stat label="Live markets" value={`${markets.filter((m) => m.status === "live").length}`} />
        <Stat label="Total markets" value={`${totals.count}`} />
        <Stat label="TVL (testnet)" value={fmtUsd(totals.tvl)} />
        <Stat label="Network" value="Stellar Testnet" />
      </div>

      <div className="mt-10 overflow-hidden border border-parchment/10">
        <div className="hidden grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr_0.6fr] gap-4 border-b border-parchment/10 bg-ink-deep/60 px-6 py-4 font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/55 lg:grid">
          <span>Market</span>
          <span className="text-right">Maturity</span>
          <span className="text-right">Implied APY</span>
          <span className="text-right">PT</span>
          <span className="text-right">YT</span>
          <span className="text-right">TVL</span>
          <span className="text-right">Status</span>
        </div>

        <ul>
          {markets.map((m) => (
            <li key={m.id}>
              <Link
                href={`/markets/${m.id}`}
                className="group block border-b border-parchment/8 transition-colors duration-200 hover:bg-parchment/[0.025]"
              >
                <div className="grid grid-cols-2 gap-2 px-6 py-5 lg:grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr_0.6fr] lg:items-center lg:gap-4">
                  <div className="col-span-2 lg:col-span-1">
                    <p className="font-display text-[22px] text-parchment">
                      {m.underlying.symbol}
                    </p>
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
                  <Cell label="Implied APY" value={fmtApy(m.impliedApy)} primary />
                  <Cell label="PT" value={fmtPrice(m.ptPrice)} mono />
                  <Cell label="YT" value={fmtPrice(m.ytPrice)} mono />
                  <Cell label="TVL" value={m.tvl === 0 ? "—" : fmtUsd(m.tvl)} />
                  <div className="hidden items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-parchment/65 lg:flex">
                    <span
                      aria-hidden="true"
                      className={`block h-1.5 w-1.5 ${STATUS_DOT[m.status]}`}
                    />
                    {STATUS_LABEL[m.status]}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/35">
        Click any market for the order entry surface · prices are reads from
        the AMM contract · refresh every 30s
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
        {label}
      </p>
      <p className="mt-1.5 num font-display text-[28px] text-parchment">
        {value}
      </p>
    </div>
  );
}

function Cell({
  label,
  value,
  primary,
  mono,
  accent,
}: {
  label: string;
  value: string;
  primary?: boolean;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="lg:text-right">
      <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/40 lg:hidden">
        {label}
      </p>
      <p
        className={`num text-[14px] ${
          mono ? "font-mono" : "font-display"
        } ${
          primary
            ? "text-foil"
            : accent
              ? "text-foil/85"
              : "text-parchment/90"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
