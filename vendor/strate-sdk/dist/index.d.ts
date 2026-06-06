import { A as Address, N as Network, b as MarketView, M as MarketConfig, e as UserPosition, Y as YieldCurvePoint, a as MarketMeta } from './client-CyRRT1a-.js';
export { B as BuildSwapTxParams, H as HALF_WAD, S as StrateClient, c as StrateClientOptions, d as SwapDirection, U as UNDERLYING_DECIMALS, W as WAD, f as asAddress, g as buildSwapTx, i as i128FromString, h as i128ToString, j as isAddress, n as numberToWad, w as wadToNumber } from './client-CyRRT1a-.js';
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
 * YieldStripping::claim_yield(user) -> i128
 *
 * Sends all currently-claimable underlying yield accrued on the user's
 * YT balance to the user. Internally drains the per-user accrual bucket
 * on YT via the push topology introduced in H-01.
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
 * YieldStripping::sync_yield_index()
 *
 * Anyone-can-call helper that reads the latest Blend rate via the
 * Oracle and pushes the freshly-computed global yield index into YT.
 * Useful as a poke before claim/redeem when the dApp wants the most
 * up-to-date numbers, although every state-mutating YS entrypoint
 * already calls this internally.
 */

interface BuildSyncYieldIndexTxParams {
    server: rpc.Server;
    network: Network;
    source: Account;
    market: Address;
}
declare function buildSyncYieldIndexTx(params: BuildSyncYieldIndexTxParams): Promise<Transaction>;

/**
 * YieldStripping::config() -> MarketConfig
 * YT::total_supply() -> i128             (= PT::total_supply by construction)
 * AMM::reserves() -> (i128, i128)        // (pt, underlying)
 *
 * Aggregates into a single `MarketView`. YS does not know its AMM peer
 * (they're independent contracts wired by the Factory), so callers must
 * pass the AMM address — typically resolved via Factory::get_market_meta.
 */

interface ReadMarketParams {
    server: rpc.Server;
    network: Network;
    /** YS contract address. */
    market: Address;
    /** AMM address. Resolve via `Factory::get_market_meta(market)` before
     *  calling, since YS doesn't know its AMM peer. */
    amm: Address;
}
declare function readMarket(params: ReadMarketParams): Promise<MarketView>;
/** Lower-level: just YS::config, no supply/reserves. */
declare function readMarketConfig(params: {
    server: rpc.Server;
    network: Network;
    market: Address;
}): Promise<MarketConfig>;

/**
 * Reads a user's PT/YT balances and accrued yield in a single round-trip.
 *
 * - PT balance:        PT-token contract `.balance(user)`
 * - YT balance:        YT-token contract `.balance(user)`
 * - Pending yield:     YieldStripping::pending_yield(user) -> i128
 *
 * H-01 (push topology) collapsed the previous `accrued_yield_of` /
 * `claimable_yield_of` pair into a single `pending_yield` reading. The
 * `UserPosition.claimableYield` field is kept for source-compat and
 * mirrors `accruedYield` exactly.
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
 * Factory views.
 *
 * - Factory::market_count() -> u32
 * - Factory::get_market_by_index(i) -> Option<Address>     (YS address)
 * - Factory::get_market_meta(ys) -> Option<MarketMeta>
 *
 * The Factory is the only place that joins a YS address to its AMM
 * peer. Use `readMarketMetaFromFactory` whenever you need an AMM
 * address starting from YS.
 */

interface FactoryReadParams {
    server: rpc.Server;
    network: Network;
    factory: Address;
}
declare function readMarketCount(p: FactoryReadParams): Promise<number>;
declare function readMarketByIndex(p: FactoryReadParams & {
    index: number;
}): Promise<Address | null>;
declare function readMarketMetaFromFactory(p: FactoryReadParams & {
    ys: Address;
}): Promise<MarketMeta | null>;
/**
 * Convenience: enumerate every market the factory knows about and
 * return their full `MarketMeta`. O(N) RPC calls — N = market_count().
 */
declare function listMarkets(p: FactoryReadParams): Promise<MarketMeta[]>;

/**
 * Push-topology reads against the YT contract and the YS contract.
 *
 * - YT::global_yield_index() -> i128       (WAD)
 * - YT::user_yield_index(user) -> i128     (WAD; user's snapshot)
 * - YT::accrued_yield(user) -> i128        (underlying-denom)
 * - YS::current_index() -> i128            (WAD; delegates to YT)
 * - YS::pending_yield(user) -> i128        (underlying-denom; delegates to YT)
 * - YS::is_paused() -> bool
 *
 * Use `readPendingYield` or `readAccruedYieldOnYt` for "how much can the
 * user claim right now" — they return the same value via different paths.
 * Prefer the YS path when the dApp already has the YS address; prefer the
 * YT path when iterating multiple users on one contract.
 */

interface YsReadParams {
    server: rpc.Server;
    network: Network;
    market: Address;
}
interface YtReadParams {
    server: rpc.Server;
    network: Network;
    yt: Address;
}
declare function readCurrentIndex(p: YsReadParams): Promise<bigint>;
declare function readPendingYield(p: YsReadParams & {
    user: Address;
}): Promise<bigint>;
declare function readIsPaused(p: YsReadParams): Promise<boolean>;
declare function readGlobalYieldIndex(p: YtReadParams): Promise<bigint>;
declare function readUserYieldIndex(p: YtReadParams & {
    user: Address;
}): Promise<bigint>;
declare function readAccruedYieldOnYt(p: YtReadParams & {
    user: Address;
}): Promise<bigint>;

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

export { Address, type AddressBook, type BuildAddLiquidityTxParams, type BuildClaimYieldTxParams, type BuildMintTxParams, type BuildRedeemTxParams, type BuildSyncYieldIndexTxParams, type FactoryReadParams, type IntKind, MarketConfig, MarketMeta, MarketView, Network, type ReadBlendRateParams, type ReadMarketParams, type ReadUserPositionParams, type ReadYieldParams, StrateAddressError, StrateEncodingError, StrateError, StrateNetworkError, StrateNotConfiguredError, StrateSimulationError, UserPosition, YieldCurvePoint, type YsReadParams, type YtReadParams, bigIntToScVal, buildAddLiquidityTx, buildClaimYieldTx, buildMintTx, buildRedeemTx, buildSyncYieldIndexTx, dateToLedgerTimestamp, formatApy, formatPtPrice, formatTimeToMaturity, formatTokenAmount, formatUnderlying, fromWad, getAddresses, isMatured, ledgerTimestampToDate, listMarkets, nowSec, readAccruedYieldOnYt, readBlendExchangeRate, readCurrentIndex, readGlobalYieldIndex, readImpliedApy, readIsPaused, readMarket, readMarketByIndex, readMarketConfig, readMarketCount, readMarketMetaFromFactory, readPendingYield, readPtPrice, readUserPosition, readUserYieldIndex, readYieldCurvePoint, registerAddresses, scValToBigInt, shortenAddress, timeToMaturity, toWad, tryGetAddresses, wadDiv, wadMul, yearsToMaturity };
