import { notFound } from "next/navigation";
import { getMockMarket, MOCK_MARKETS } from "@/lib/mocks";
import MarketDetail from "@/components/market/MarketDetail";

export function generateStaticParams() {
  return MOCK_MARKETS.map((m) => ({ id: m.id }));
}

export function generateMetadata({ params }: { params: { id: string } }) {
  const m = getMockMarket(params.id);
  if (!m) return {};
  return {
    title: `${m.underlying.symbol} · Strate`,
    description: `Mint, redeem and trade PT/YT on ${m.underlying.symbol} (${m.underlying.issuer}).`,
  };
}

export default function MarketDetailPage({ params }: { params: { id: string } }) {
  const market = getMockMarket(params.id);
  if (!market) notFound();
  return <MarketDetail market={market} />;
}
