import { A as Address, N as Network, a as MarketView, M as MarketConfig, d as UserPosition, Y as YieldCurvePoint } from './client-C-4sL39j.js';
export { B as BuildSwapTxParams, H as HALF_WAD, S as StrateClient, b as StrateClientOptions, c as SwapDirection, U as UNDERLYING_DECIMALS, W as WAD, e as asAddress, f as buildSwapTx, i as i128FromString, g as i128ToString, h as isAddress, n as numberToWad, w as wadToNumber } from './client-C-4sL39j.js';
import { rpc, Account, Transaction, xdr } from '@stellar/stellar-sdk';

/** SDK-level error hierarchy. */
declare class StrateError extends Error {
    readonly cause?: unknown;
    constructor(message: string, cause?: unknown);
}
declare class StrateAddressError extends StrateError {
    constructor(message: string, cause?: unknown);
}
declare class StrateSimulationError extends StrateError {
    readonly contractAddress?: string | undefined;
    readonly method?: string | undefined;
    constructor(message: string, contractAddress?: string | undefined, method?: string | undefined, cause?: unknown);
}
declare class StrateNetworkError extends StrateError {
    constructor(message: string, cause?: unknown);
}
declare class StrateEncodingError extends StrateError {
    constructor(message: string, cause?: unknown);
}
declare class StrateNotConfiguredError extends StrateError {
    constructor(message: string);
}

/**
 * Contract address registry per network.
 *
 * Mainnet addresses are intentionally left as `null` until v1 deployment.
 * Testnet placeholders are set so dApp devs can wire integration tests
 * without hitting mainnet. Replace via {@link registerAddresses} for
 * local / futurenet deployments.
 */

interface AddressBook {
    factory: Address;
    /** Optional convenience: the canonical Blend bUSDC pool. */
    blendUsdc?: Address;
}
/**
 * Set or replace the address book for a given network.
 * Useful for local Stellar Quickstart / Futurenet deployments.
 */
declare function registerAddresses(network: Network, book: AddressBook): void;
/** Read the address book for a network. Throws if not configured. */
declare function getAddresses(network: Network): AddressBook;
/** Try-get variant: returns null instead of throwing. */
declare function tryGetAddresses(network: Network): AddressBook | null;

/**
 * YieldStripping::mint_pt_yt(user, underlying_amount) -> (i128, i128)
 *
 * The user deposits `underlyingAmount` of the market's underlying and
 * receives equal amounts of PT and YT.
 */

interface BuildMintTxParams {
    server: rpc.Server;
    network: Network;
    source: Account;
    market: Address;
    user: Address;
    underlyingAmount: bigint;
}
declare function buildMintTx(params: BuildMintTxParams): Promise<Transaction>;

/**
 * YieldStripping::redeem_pt_yt(user, pt_amount) -> i128         (pre-maturity)
 * YieldStripping::redeem_pt_at_maturity(user, pt_amount) -> i128 (at maturity)
 */

interface BuildRedeemTxParams {
    server: rpc.Server;
    network: Network;
    source: Account;
    market: Address;
    user: Address;
    ptAmount: bigint;
    /** When true, calls `redeem_pt_at_maturity`; otherwise `redeem_pt_yt`. */
    atMaturity: boolean;
}
declare function buildRedeemTx(params: BuildRedeemTxParams): Promise<Transaction>;

/**
 * YieldStripping::claim_yt_yield(user) -> i128
 *
 * Sends all currently-claimable underlying yield accrued on the user's
 * YT balance to the user.
 */

interface BuildClaimYieldTxParams {
    server: rpc.Server;
    network: Network;
    source: Account;
    market: Address;
    user: Address;
}
declare function buildClaimYieldTx(params: BuildClaimYieldTxParams): Promise<Transaction>;

/**
 * AMM::add_liquidity(user, pt_in, underlying_in, min_lp_out) -> i128
 *
 * Adds both legs of liquidity. The blockchain-developer's `traits.rs`
 * defines this on the AMM contract; signature matches.
 */

interface BuildAddLiquidityTxParams {
    server: rpc.Server;
    network: Network;
    source: Account;
    amm: Address;
    user: Address;
    ptIn: bigint;
    underlyingIn: bigint;
    minLpOut: bigint;
}
declare function buildAddLiquidityTx(params: BuildAddLiquidityTxParams): Promise<Transaction>;

/**
 * YieldStripping::get_config() -> MarketConfig
 * YieldStripping::total_supply() -> i128
 * AMM::reserves() -> (i128, i128)  // (pt, underlying)
 *
 * Aggregates all three into a single `MarketView`.
 */

interface ReadMarketParams {
    server: rpc.Server;
    network: Network;
    market: Address;
}
declare function readMarket(params: ReadMarketParams): Promise<MarketView>;
/** Lower-level: just the config, no supply/reserves. */
declare function readMarketConfig(params: ReadMarketParams): Promise<MarketConfig>;

/**
 * Reads a user's PT/YT balances and accrued yield in a single round-trip
 * (where possible).
 *
 * - PT balance:        PT-token contract `.balance(user)`
 * - YT balance:        YT-token contract `.balance(user)`
 * - Accrued yield:     YieldStripping::accrued_yield_of(user) -> i128
 * - Claimable yield:   YieldStripping::claimable_yield_of(user) -> i128
 */

interface ReadUserPositionParams {
    server: rpc.Server;
    network: Network;
    market: Address;
    user: Address;
}
declare function readUserPosition(params: ReadUserPositionParams): Promise<UserPosition>;

/**
 * Reads the implied APY and PT price from the AMM/Oracle contracts.
 *
 * - Oracle::implied_apy(market) -> i128   (WAD)
 * - Oracle::pt_price(market) -> i128      (WAD)
 *
 * Also provides a sampled curve helper for the chart UI.
 */

interface ReadYieldParams {
    server: rpc.Server;
    network: Network;
    market: Address;
}
declare function readImpliedApy(params: ReadYieldParams): Promise<bigint>;
declare function readPtPrice(params: ReadYieldParams): Promise<bigint>;
/**
 * Return a single live yield-curve point. The full historical curve is
 * built by the dApp accumulating these samples over time (or by a
 * dedicated indexer once the chain has enough history).
 */
declare function readYieldCurvePoint(params: ReadYieldParams): Promise<YieldCurvePoint>;

/**
 * Reads the Blend bUSDC exchange rate (bUSDC -> USDC).
 *
 * Blend's pool exposes `get_exchange_rate()` returning a WAD-scaled
 * value. We pass through unmodified so the dApp can compute the
 * underlying-denominated PnL of YT yields.
 */

interface ReadBlendRateParams {
    server: rpc.Server;
    network: Network;
    /** The Blend pool contract address (NOT the bUSDC token). */
    blendPool: Address;
}
declare function readBlendExchangeRate(params: ReadBlendRateParams): Promise<bigint>;

/**
 * BigInt <-> Soroban ScVal helpers.
 *
 * Soroban represents large integers as i64/i128/u128/u256 broken into
 * hi/lo limbs of i64/u64. We expose canonical encode/decode functions
 * that the rest of the SDK depends on.
 *
 * NOTE: this module imports from `@stellar/stellar-sdk` at the top level.
 * The SDK declares stellar-sdk as a peer dependency, so consumers must
 * install it.
 */

type IntKind = "i64" | "u64" | "i128" | "u128" | "u256";
/** Encode a bigint into a Soroban ScVal of the requested kind. */
declare function bigIntToScVal(value: bigint, kind: IntKind): xdr.ScVal;
/** Decode any Soroban integer ScVal into a JS bigint. */
declare function scValToBigInt(scVal: xdr.ScVal): bigint;
/** Multiply two WAD-scaled bigints, returning a WAD-scaled result. */
declare function wadMul(a: bigint, b: bigint): bigint;
/** Divide two WAD-scaled bigints, returning a WAD-scaled result. */
declare function wadDiv(a: bigint, b: bigint): bigint;
/** Scale a raw token amount (e.g. 7-decimal USDC) up to WAD. */
declare function toWad(amount: bigint, decimals: number): bigint;
/** Scale a WAD value down to a raw token amount with the given decimals. */
declare function fromWad(amount: bigint, decimals: number): bigint;

/** Time helpers for Stellar ledger timestamps. */
/** Convert a unix-seconds bigint or number to a JS Date. */
declare function ledgerTimestampToDate(seconds: number | bigint): Date;
/** Convert a JS Date to unix seconds. */
declare function dateToLedgerTimestamp(date: Date): number;
/** Seconds until a maturity timestamp; floor at 0. */
declare function timeToMaturity(maturityUnixSec: number, nowUnixSec?: number): number;
/** Current unix seconds (integer). */
declare function nowSec(): number;
/** Years remaining until maturity, as a float. Useful for APY math. */
declare function yearsToMaturity(maturityUnixSec: number, nowUnixSec?: number): number;
/** Has the market matured? */
declare function isMatured(maturityUnixSec: number, nowUnixSec?: number): boolean;

/** Human-readable formatters for use in the dApp UI. */
/** Format a WAD-scaled APY (e.g. 0.0842e18) as a percentage string. */
declare function formatApy(wadApy: bigint, digits?: number): string;
/** Format a raw token amount with the given decimals. */
declare function formatTokenAmount(amount: bigint, decimals?: number, displayDigits?: number): string;
/** Format an underlying (bUSDC) amount with the `$` prefix. */
declare function formatUnderlying(amount: bigint, displayDigits?: number): string;
/** Format a WAD-scaled PT price (e.g. 0.95e18) as a decimal string. */
declare function formatPtPrice(wadPrice: bigint, digits?: number): string;
/** Compact a Stellar address: G...ABC. */
declare function shortenAddress(addr: string, chars?: number): string;
/** Format seconds-to-maturity as e.g. "42 days, 3 hours". */
declare function formatTimeToMaturity(seconds: number): string;

export { Address, type AddressBook, type BuildAddLiquidityTxParams, type BuildClaimYieldTxParams, type BuildMintTxParams, type BuildRedeemTxParams, type IntKind, MarketConfig, MarketView, Network, type ReadBlendRateParams, type ReadMarketParams, type ReadUserPositionParams, type ReadYieldParams, StrateAddressError, StrateEncodingError, StrateError, StrateNetworkError, StrateNotConfiguredError, StrateSimulationError, UserPosition, YieldCurvePoint, bigIntToScVal, buildAddLiquidityTx, buildClaimYieldTx, buildMintTx, buildRedeemTx, dateToLedgerTimestamp, formatApy, formatPtPrice, formatTimeToMaturity, formatTokenAmount, formatUnderlying, fromWad, getAddresses, isMatured, ledgerTimestampToDate, nowSec, readBlendExchangeRate, readImpliedApy, readMarket, readMarketConfig, readPtPrice, readUserPosition, readYieldCurvePoint, registerAddresses, scValToBigInt, shortenAddress, timeToMaturity, toWad, tryGetAddresses, wadDiv, wadMul, yearsToMaturity };
