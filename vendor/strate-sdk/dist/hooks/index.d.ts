import * as react from 'react';
import { ReactNode } from 'react';
import { S as StrateClient, A as Address, b as MarketView, a as MarketMeta, e as UserPosition, Y as YieldCurvePoint } from '../client-CyRRT1a-.js';
import { UseQueryResult } from '@tanstack/react-query';
import '@stellar/stellar-sdk';

interface StrateClientProviderProps {
    client: StrateClient;
    children: ReactNode;
}
declare function StrateClientProvider(props: StrateClientProviderProps): react.FunctionComponentElement<react.ProviderProps<StrateClient | null>>;
declare function useStrateClient(): StrateClient;
/** Variant that returns null if no provider is mounted (for optional usage). */
declare function useStrateClientOptional(): StrateClient | null;

interface UseMarketOptions {
    enabled?: boolean;
    staleTime?: number;
    /** AMM address. If omitted, the hook will resolve it from the factory.
     *  Provide explicitly to skip one RPC call when you already have it
     *  (e.g. from a prior `useMarkets()` listing). */
    amm?: Address | string;
}
declare function useMarket(marketAddress: Address | string | undefined, options?: UseMarketOptions): UseQueryResult<MarketView, Error>;

interface UseMarketsOptions {
    enabled?: boolean;
    /** Markets change at most once per factory deploy_market — default 5min. */
    staleTime?: number;
}
/**
 * Every market the configured factory knows about. Returns full
 * MarketMeta (including AMM, oracle, blend pool) for each.
 *
 * The factory address is taken from the configured StrateClient. If the
 * factory hasn't been deployed (placeholder address), the call will
 * simulate-error and the hook surfaces the error rather than guessing.
 */
declare function useMarkets(options?: UseMarketsOptions): UseQueryResult<MarketMeta[], Error>;

interface UseUserPositionOptions {
    enabled?: boolean;
    staleTime?: number;
    refetchOnWindowFocus?: boolean;
}
declare function useUserPosition(marketAddress: Address | string | undefined, userAddress: Address | string | undefined, options?: UseUserPositionOptions): UseQueryResult<UserPosition, Error>;

interface UseYieldCurveOptions {
    enabled?: boolean;
    staleTime?: number;
}
/**
 * Single live yield-curve point (implied APY + PT price + TTM).
 *
 * The full historical chart is built by accumulating these in the dApp's
 * query cache or by a future indexer.
 */
declare function useYieldCurve(marketAddress: Address | string | undefined, options?: UseYieldCurveOptions): UseQueryResult<YieldCurvePoint, Error>;

interface UseAccruedYieldOptions {
    enabled?: boolean;
    staleTime?: number;
}
/**
 * Underlying-denominated yield a user can claim right now from a
 * single market. Wraps `YS::pending_yield`.
 *
 * Equal in value to `useUserPosition().accruedYield`, but cheaper —
 * one RPC call instead of three.
 */
declare function useAccruedYield(marketAddress: Address | string | undefined, userAddress: Address | string | undefined, options?: UseAccruedYieldOptions): UseQueryResult<bigint, Error>;

export { StrateClientProvider, type StrateClientProviderProps, type UseAccruedYieldOptions, type UseMarketOptions, type UseMarketsOptions, type UseUserPositionOptions, type UseYieldCurveOptions, useAccruedYield, useMarket, useMarkets, useStrateClient, useStrateClientOptional, useUserPosition, useYieldCurve };
