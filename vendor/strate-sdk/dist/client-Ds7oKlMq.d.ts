import { rpc, Account, Transaction } from '@stellar/stellar-sdk';

/**
 * Domain types for the Strate SDK.
 *
 * Mirrors the Soroban contract ABI surface produced by the
 * blockchain-developer in `traits.rs`. All on-chain integers use
 * native `bigint`. Fixed-point values are WAD-scaled (1e18).
 */
/** Stellar network selector. */
declare enum Network {
    Mainnet = "PUBLIC",
    Testnet = "TESTNET",
    Futurenet = "FUTURENET"
}
/**
 * Branded type for a validated Stellar contract address (`C...`) or
 * account address (`G...`). Construct only via {@link asAddress}.
 */
type Address = string & {
    readonly __brand: "StellarAddress";
};
/** WAD = 1e18 fixed-point base used throughout the protocol. */
declare const WAD: bigint;
/** Half-WAD, useful for rounding. */
declare const HALF_WAD: bigint;
/** Underlying token decimals for Blend bUSDC. */
declare const UNDERLYING_DECIMALS = 7;
/**
 * Market configuration as returned by the YieldStripping contract's
 * `config()` getter. Maturity is a unix timestamp (seconds).
 *
 * The AMM is NOT in YS's config: AMM and YS are independent peers wired
 * by the Factory. Look up the AMM (and all other market handles) via
 * the Factory's `get_market_meta(ys)` — see `MarketMeta` below.
 */
interface MarketConfig {
    underlying: Address;
    pt: Address;
    yt: Address;
    oracle: Address;
    /** Unix seconds at which PT redeems 1:1 with underlying. */
    maturity: number;
    /** WAD-scaled scalar root used by the AMM curve. */
    scalarRoot: bigint;
    /** Single admin address authorized to pause / unpause. */
    admin: Address;
}
/**
 * Factory's view of a deployed market. This is the authoritative record
 * for joining YS to its AMM peer. Returned by Factory::get_market_meta.
 */
interface MarketMeta {
    pt: Address;
    yt: Address;
    amm: Address;
    oracle: Address;
    yieldStripping: Address;
    underlying: Address;
    maturity: number;
    scalarRoot: bigint;
    feeBps: number;
    blendPool: Address;
    deployedAt: number;
    deployer: Address;
}
/** A user's current position in a single market. */
interface UserPosition {
    ptBalance: bigint;
    ytBalance: bigint;
    /** Underlying-denominated yield accrued so far. Equal to `pending_yield`
     *  on the contract since H-01 collapsed accrued/claimable into one
     *  push-topology value. */
    accruedYield: bigint;
    /** Same as `accruedYield` — kept for source-compat with older callers.
     *  Will be removed in 0.3. */
    claimableYield: bigint;
}
/** A single point on the implied-APY / PT-price curve. */
interface YieldCurvePoint {
    /** Seconds remaining until maturity at the time this point was sampled. */
    timeToMaturity: number;
    /** WAD-scaled implied APY (e.g. 0.0842e18 = 8.42%). */
    impliedApy: bigint;
    /** WAD-scaled PT price in underlying terms (e.g. 0.95e18 = 0.95). */
    ptPrice: bigint;
}
/** Market state + live supply / reserve numbers (one read).
 *
 *  `totalSupply` is YT.total_supply (= PT.total_supply by construction).
 *  YS does NOT track its own supply since H-01 — PT/YT do.
 *  `amm` is supplied by the caller (typically resolved from the factory)
 *  because YS doesn't store it; passing it through keeps `MarketView`
 *  self-sufficient for downstream UI code.
 */
interface MarketView extends MarketConfig {
    amm: Address;
    totalSupply: bigint;
    reserves: {
        pt: bigint;
        underlying: bigint;
    };
}
/** Convert a WAD-scaled value to a JS number. Loses precision; UI only. */
declare function wadToNumber(value: bigint): number;
/** Convert a JS number to a WAD-scaled bigint. */
declare function numberToWad(value: number): bigint;
/** Parse a decimal string into a bigint (no scaling applied). */
declare function i128FromString(value: string): bigint;
/** Stringify a bigint for log / display use. */
declare function i128ToString(value: bigint): string;
declare function asAddress(value: string): Address;
/** Type guard equivalent of {@link asAddress}. */
declare function isAddress(value: unknown): value is Address;

/**
 * AMM::swap_pt_for_underlying(user, pt_in, min_out) -> i128
 * AMM::swap_underlying_for_pt(user, under_in, min_out) -> i128
 *
 * `market` here is the AMM contract address (read via readMarket().amm).
 */

type SwapDirection = "PT" | "UNDERLYING";
interface BuildSwapTxParams {
    server: rpc.Server;
    network: Network;
    source: Account;
    /** AMM contract address for the market. */
    amm: Address;
    user: Address;
    tokenIn: SwapDirection;
    amountIn: bigint;
    minAmountOut: bigint;
}
declare function buildSwapTx(params: BuildSwapTxParams): Promise<Transaction>;

interface StrateClientOptions {
    network: Network;
    server: rpc.Server;
    factoryAddress: Address | string;
}
declare class StrateClient {
    readonly network: Network;
    readonly server: rpc.Server;
    readonly factoryAddress: Address;
    constructor(opts: StrateClientOptions);
    buildMint(params: {
        market: Address | string;
        underlyingAmount: bigint;
        user: Address | string;
        source: Account;
    }): Promise<Transaction>;
    buildRedeem(params: {
        market: Address | string;
        ptAmount: bigint;
        user: Address | string;
        atMaturity: boolean;
        source: Account;
    }): Promise<Transaction>;
    buildClaimYield(params: {
        market: Address | string;
        user: Address | string;
        source: Account;
    }): Promise<Transaction>;
    buildSwap(params: {
        /** AMM address. Get this from `readMarket(market).amm`. */
        amm: Address | string;
        tokenIn: SwapDirection;
        amountIn: bigint;
        minAmountOut: bigint;
        user: Address | string;
        source: Account;
    }): Promise<Transaction>;
    buildAddLiquidity(params: {
        amm: Address | string;
        user: Address | string;
        ptIn: bigint;
        underlyingIn: bigint;
        minLpOut: bigint;
        source: Account;
    }): Promise<Transaction>;
    buildSyncYieldIndex(params: {
        market: Address | string;
        source: Account;
    }): Promise<Transaction>;
    /**
     * Load full market view (config + supply + reserves). Resolves the
     * AMM peer via the factory when not provided.
     */
    readMarket(market: Address | string, opts?: {
        amm?: Address | string;
    }): Promise<MarketView>;
    /** Enumerate every market the factory knows about. */
    listMarkets(): Promise<MarketMeta[]>;
    readMarketCount(): Promise<number>;
    readMarketMeta(ys: Address | string): Promise<MarketMeta | null>;
    readCurrentIndex(market: Address | string): Promise<bigint>;
    readPendingYield(market: Address | string, user: Address | string): Promise<bigint>;
    readIsPaused(market: Address | string): Promise<boolean>;
    readGlobalYieldIndex(yt: Address | string): Promise<bigint>;
    readUserPosition(market: Address | string, user: Address | string): Promise<UserPosition>;
    readImpliedApy(market: Address | string): Promise<bigint>;
    readPtPrice(market: Address | string): Promise<bigint>;
    readYieldCurvePoint(market: Address | string): Promise<YieldCurvePoint>;
    readBlendExchangeRate(blendPool: Address | string): Promise<bigint>;
}

export { type Address as A, type BuildSwapTxParams as B, HALF_WAD as H, type MarketConfig as M, Network as N, StrateClient as S, UNDERLYING_DECIMALS as U, WAD as W, type YieldCurvePoint as Y, type MarketMeta as a, type MarketView as b, type StrateClientOptions as c, type SwapDirection as d, type UserPosition as e, asAddress as f, buildSwapTx as g, i128ToString as h, i128FromString as i, isAddress as j, numberToWad as n, wadToNumber as w };
