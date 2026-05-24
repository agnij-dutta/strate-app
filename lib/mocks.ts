/**
 * Mock data layer used until protocol contracts are deployed to testnet.
 * Every shape mirrors the SDK types so the swap to live data is a one-line
 * change at the call site.
 */

import type { MarketView, UserPosition, YieldCurvePoint } from "@strate/sdk";

export type MarketSummary = {
  id: string;
  underlying: { symbol: string; issuer: string };
  maturity: number; // unix seconds
  impliedApy: number; // 0.0823 = 8.23%
  ptPrice: number;
  ytPrice: number;
  tvl: number; // USD
  status: "live" | "paused" | "expiring";
};

const day = 86400;
const now = Math.floor(Date.now() / 1000);

// Three reference markets that match the issuers we cite in the Mirror article.
// The bUSDC market is "live" because Blend is the only issuer with a live
// integration path on testnet today. CETES and BENJI are stubs for the
// allocator-facing surface.
export const MOCK_MARKETS: MarketSummary[] = [
  {
    id: "busdc-2026-12",
    underlying: { symbol: "bUSDC", issuer: "Blend" },
    maturity: now + 220 * day,
    impliedApy: 0.0823,
    ptPrice: 0.9512,
    ytPrice: 0.0488,
    tvl: 1_240_000,
    status: "live",
  },
  {
    id: "cetes-2026-09",
    underlying: { symbol: "CETES", issuer: "Etherfuse" },
    maturity: now + 130 * day,
    impliedApy: 0.1004,
    ptPrice: 0.9655,
    ytPrice: 0.0345,
    tvl: 480_000,
    status: "live",
  },
  {
    id: "benji-2027-03",
    underlying: { symbol: "BENJI", issuer: "Franklin Templeton" },
    maturity: now + 310 * day,
    impliedApy: 0.0541,
    ptPrice: 0.9543,
    ytPrice: 0.0457,
    tvl: 0,
    status: "paused",
  },
];

export function getMockMarket(id: string): MarketSummary | undefined {
  return MOCK_MARKETS.find((m) => m.id === id);
}

/**
 * Sample yield curve for the chart. Real data flows through
 * useYieldCurve once we have a deployed AMM to read from.
 */
export function mockYieldCurve(impliedApy: number, samples = 24): YieldCurvePoint[] {
  return Array.from({ length: samples }, (_, i) => {
    const t = (i / (samples - 1)) * 365 * day;
    // Decaying APY toward maturity, anchored on the market's current implied
    // APY at t = 90 days, with a mild upward bias for longer durations.
    const apy =
      impliedApy *
      (0.78 + 0.32 * Math.exp(-Math.abs(t - 90 * day) / (180 * day)));
    return {
      timeToMaturity: Math.round(t),
      impliedApy: BigInt(Math.round(apy * 1e18)),
      ptPrice: BigInt(Math.round((1 - apy * (t / (365 * day))) * 1e18)),
    } as YieldCurvePoint;
  });
}

export const MOCK_POSITION: UserPosition = {
  ptBalance: 4_532_000_000n, // 453.20 PT in 1e7 units
  ytBalance: 4_532_000_000n,
  accruedYield: 78_400_000n, // 7.84 underlying
  claimableYield: 78_400_000n,
};

export const EMPTY_POSITION: UserPosition = {
  ptBalance: 0n,
  ytBalance: 0n,
  accruedYield: 0n,
  claimableYield: 0n,
};

/** Toggle off when factoryAddress + market addresses are real. */
export const USE_MOCKS = true;

// Avoid unused-import warnings — MarketView is re-exported for downstream
// modules that wire mocks to the same shape later.
export type { MarketView };
