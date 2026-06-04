"use client";

import { useMarket, useYieldCurve } from "@strate/sdk/hooks";

const WAD = 1_000_000_000_000_000_000n;
const ONE_UNDERLYING = 10_000_000n; // 1e7, matches PT/YT 7-decimal token

function wadToNumber(value: bigint | undefined): number | undefined {
  if (value === undefined) return undefined;
  // 6 sig-figs is enough for the UI; preserve sign on negatives.
  const scaled = Number(value / (WAD / 1_000_000n));
  return scaled / 1_000_000;
}

function underlyingToNumber(value: bigint | undefined): number | undefined {
  if (value === undefined) return undefined;
  return Number(value) / Number(ONE_UNDERLYING);
}

export interface LiveMarketState {
  /** WAD-decoded implied APY, e.g. 0.0521 for 5.21%. */
  impliedApy?: number;
  /** WAD-decoded PT price, e.g. 0.9612. */
  ptPrice?: number;
  /** WAD-decoded YT price, derived as (1 - ptPrice). */
  ytPrice?: number;
  /** Total YS supply in underlying units (PT outstanding ~= YT outstanding). */
  supplyUnderlying?: number;
  /** True until first successful read; consumers can keep showing defaults. */
  isLoading: boolean;
  /** True if any read errored — caller should fall back to static display. */
  isError: boolean;
}

/**
 * Reads live on-chain state for one market and exposes it in display-ready
 * units. Used by MarketDetail to overlay live numbers on top of the
 * hardcoded defaults from `lib/mocks.ts`. Both reads run in parallel via
 * react-query; staleness is 30s to match Soroban's ~5s close time without
 * thrashing the RPC.
 *
 * Pass `undefined` when the market has no contracts wired — the hook
 * disables itself and the consumer keeps using static values.
 */
export function useLiveMarketState(
  yieldStrippingAddress: string | undefined,
): LiveMarketState {
  const market = useMarket(yieldStrippingAddress, {
    enabled: Boolean(yieldStrippingAddress),
  });
  const curve = useYieldCurve(yieldStrippingAddress, {
    enabled: Boolean(yieldStrippingAddress),
  });

  const ptPrice = wadToNumber(curve.data?.ptPrice);
  const impliedApy = wadToNumber(curve.data?.impliedApy);
  const ytPrice = ptPrice === undefined ? undefined : Math.max(0, 1 - ptPrice);
  const supplyUnderlying = underlyingToNumber(market.data?.totalSupply);

  return {
    impliedApy,
    ptPrice,
    ytPrice,
    supplyUnderlying,
    isLoading: market.isLoading || curve.isLoading,
    isError: Boolean(market.error || curve.error),
  };
}
