import * as react from 'react';
import { ReactNode } from 'react';
import { S as StrateClient, A as Address, a as MarketView, d as UserPosition, Y as YieldCurvePoint } from '../client-C-4sL39j.js';
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
}
declare function useMarket(marketAddress: Address | string | undefined, options?: UseMarketOptions): UseQueryResult<MarketView, Error>;

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

export { StrateClientProvider, type StrateClientProviderProps, type UseMarketOptions, type UseUserPositionOptions, type UseYieldCurveOptions, useMarket, useStrateClient, useStrateClientOptional, useUserPosition, useYieldCurve };
