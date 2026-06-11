import { MOCK_MARKETS } from "@/lib/mocks";
import { IS_MAINNET, NETWORK_LABEL, NETWORK_SLUG } from "@/lib/addresses";
import MarketRow from "@/components/market/MarketRow";

export const metadata = {
  title: "Markets · Strate",
  description: `Yield-stripping markets live on Stellar ${NETWORK_SLUG}.`,
};

export default function MarketsPage() {
  const markets = MOCK_MARKETS;
  // Count only markets that are actually live on chain (have a contracts
  // entry in addresses.ts). The mock illustrative cards have
  // status: "live" set for color/style purposes but aren't on chain.
  const liveCount = markets.filter((m) => m.isLive).length;

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
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
        <Stat label="Live markets" value={`${liveCount}`} />
        <Stat label="Total markets" value={`${markets.length}`} />
        <Stat label="TVL cap / market" value={IS_MAINNET ? "50,000" : "unlimited"} />
        <Stat label="Network" value={`Stellar ${NETWORK_LABEL}`} />
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
            <MarketRow key={m.id} market={m} />
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

