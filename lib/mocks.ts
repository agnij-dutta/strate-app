/**
 * Market data layer. The XLM-2026-08 entry is **live on Soroban testnet**
 * (deployed 2026-05-31) — its addresses come from lib/addresses.ts.
 * The remaining entries are illustrative cards for issuers cited in the
 * Mirror article; they have no contracts behind them yet.
 *
 * To make a market real:
 *   1. Add its addresses to lib/addresses.ts under TESTNET.markets
 *   2. Set isLive: true and contracts: <addresses> on its entry below
 */

import type { MarketView, UserPosition, YieldCurvePoint } from "@strate/sdk";
import { TESTNET } from "./addresses";

export type MarketSummary = {
  id: string;
  underlying: { symbol: string; issuer: string };
  maturity: number; // unix seconds
  impliedApy: number; // 0.0823 = 8.23%
  ptPrice: number;
  ytPrice: number;
  tvl: number; // USD
  status: "live" | "paused" | "expiring";
  /** True only when contracts are deployed and addresses are wired below. */
  isLive: boolean;
  /** Per-market contract handles. Present on isLive markets only. */
  contracts?: {
    oracle: string;
    pt: string;
    yt: string;
    yieldStripping: string;
    amm: string;
    underlying: string;
  };
};

const day = 86400;
const now = Math.floor(Date.now() / 1000);

// Hard-coded display values (price + APY) that match the current chart
// stub. Keep these in lock-step with the chart until the SDK can read
// live AMM state.
const LIVE_DISPLAY_DEFAULTS = {
  impliedApy: 0.0521,
  ptPrice: 0.9612,
  ytPrice: 0.0388,
  tvl: 0,
};

// Markets surface. Live entries are derived from TESTNET.markets so a
// factory-deployed market appears in the dApp by appending one entry to
// lib/addresses.ts. Illustrative cards (bUSDC/CETES/BENJI) follow.
const liveMarkets: MarketSummary[] = TESTNET.markets.map((m) => ({
  id: m.id,
  underlying: { symbol: m.underlying.symbol, issuer: m.underlying.issuer },
  maturity: m.maturity,
  ...LIVE_DISPLAY_DEFAULTS,
  status: m.status,
  isLive: true,
  contracts: {
    oracle: m.oracle,
    pt: m.pt,
    yt: m.yt,
    yieldStripping: m.yieldStripping,
    amm: m.amm,
    underlying: m.underlying.address,
  },
}));

export const MOCK_MARKETS: MarketSummary[] = [
  ...liveMarkets,
  {
    id: "busdc-2026-12",
    underlying: { symbol: "bUSDC", issuer: "Blend" },
    maturity: now + 220 * day,
    impliedApy: 0.0823,
    ptPrice: 0.9512,
    ytPrice: 0.0488,
    tvl: 1_240_000,
    status: "live",
    isLive: false,
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
    isLive: false,
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
    isLive: false,
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
