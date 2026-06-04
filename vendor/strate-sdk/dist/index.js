import {
  HALF_WAD,
  Network,
  StrateAddressError,
  StrateEncodingError,
  StrateError,
  StrateNetworkError,
  StrateNotConfiguredError,
  StrateSimulationError,
  UNDERLYING_DECIMALS,
  WAD,
  asAddress,
  bigIntToScVal,
  buildInvokeTx,
  fromWad,
  i128FromString,
  i128ToString,
  isAddress,
  listMarkets,
  numberToWad,
  readAccruedYieldOnYt,
  readCurrentIndex,
  readGlobalYieldIndex,
  readIsPaused,
  readMarket,
  readMarketByIndex,
  readMarketConfig,
  readMarketCount,
  readMarketMetaFromFactory,
  readPendingYield,
  readUserYieldIndex,
  scValToBigInt,
  simulateRead,
  toWad,
  wadDiv,
  wadMul,
  wadToNumber
} from "./chunk-HNLJKLKF.js";

// src/transactions/mint.ts
import { Address as SorobanAddress } from "@stellar/stellar-sdk";
async function buildMintTx(params) {
  return buildInvokeTx({
    server: params.server,
    network: params.network,
    source: params.source,
    contractAddress: params.market,
    method: "mint_pt_yt",
    args: [
      new SorobanAddress(params.user).toScVal(),
      bigIntToScVal(params.underlyingAmount, "i128")
    ]
  });
}

// src/transactions/redeem.ts
import { Address as SorobanAddress2 } from "@stellar/stellar-sdk";
async function buildRedeemTx(params) {
  const method = params.atMaturity ? "redeem_pt_at_maturity" : "redeem_pt_yt";
  return buildInvokeTx({
    server: params.server,
    network: params.network,
    source: params.source,
    contractAddress: params.market,
    method,
    args: [
      new SorobanAddress2(params.user).toScVal(),
      bigIntToScVal(params.ptAmount, "i128")
    ]
  });
}

// src/transactions/claim-yield.ts
import { Address as SorobanAddress3 } from "@stellar/stellar-sdk";
async function buildClaimYieldTx(params) {
  return buildInvokeTx({
    server: params.server,
    network: params.network,
    source: params.source,
    contractAddress: params.market,
    method: "claim_yield",
    args: [new SorobanAddress3(params.user).toScVal()]
  });
}

// src/transactions/swap.ts
import { Address as SorobanAddress4 } from "@stellar/stellar-sdk";
async function buildSwapTx(params) {
  const method = params.tokenIn === "PT" ? "swap_pt_for_underlying" : "swap_underlying_for_pt";
  return buildInvokeTx({
    server: params.server,
    network: params.network,
    source: params.source,
    contractAddress: params.amm,
    method,
    args: [
      new SorobanAddress4(params.user).toScVal(),
      bigIntToScVal(params.amountIn, "i128"),
      bigIntToScVal(params.minAmountOut, "i128")
    ]
  });
}

// src/transactions/add-liquidity.ts
import { Address as SorobanAddress5 } from "@stellar/stellar-sdk";
async function buildAddLiquidityTx(params) {
  return buildInvokeTx({
    server: params.server,
    network: params.network,
    source: params.source,
    contractAddress: params.amm,
    method: "add_liquidity",
    args: [
      new SorobanAddress5(params.user).toScVal(),
      bigIntToScVal(params.ptIn, "i128"),
      bigIntToScVal(params.underlyingIn, "i128"),
      bigIntToScVal(params.minLpOut, "i128")
    ]
  });
}

// src/transactions/sync-yield-index.ts
async function buildSyncYieldIndexTx(params) {
  return buildInvokeTx({
    server: params.server,
    network: params.network,
    source: params.source,
    contractAddress: params.market,
    method: "sync_yield_index",
    args: []
  });
}

// src/views/user-position.ts
import { Address as SorobanAddress6 } from "@stellar/stellar-sdk";
async function readUserPosition(params) {
  const { server, network, market, user } = params;
  const config = await readMarketConfig({ server, network, market });
  const userScv = new SorobanAddress6(user).toScVal();
  const [ptScv, ytScv, pendingScv] = await Promise.all([
    simulateRead({
      server,
      network,
      contractAddress: config.pt,
      method: "balance",
      args: [userScv]
    }),
    simulateRead({
      server,
      network,
      contractAddress: config.yt,
      method: "balance",
      args: [userScv]
    }),
    simulateRead({
      server,
      network,
      contractAddress: market,
      method: "pending_yield",
      args: [userScv]
    })
  ]);
  const pending = scValToBigInt(pendingScv);
  return {
    ptBalance: scValToBigInt(ptScv),
    ytBalance: scValToBigInt(ytScv),
    accruedYield: pending,
    claimableYield: pending
  };
}

// src/views/yield-curve.ts
import { Address as SorobanAddress7 } from "@stellar/stellar-sdk";

// src/utils/time.ts
function ledgerTimestampToDate(seconds) {
  const ms = typeof seconds === "bigint" ? Number(seconds) * 1e3 : seconds * 1e3;
  return new Date(ms);
}
function dateToLedgerTimestamp(date) {
  return Math.floor(date.getTime() / 1e3);
}
function timeToMaturity(maturityUnixSec, nowUnixSec = nowSec()) {
  return Math.max(0, maturityUnixSec - nowUnixSec);
}
function nowSec() {
  return Math.floor(Date.now() / 1e3);
}
function yearsToMaturity(maturityUnixSec, nowUnixSec = nowSec()) {
  const secs = timeToMaturity(maturityUnixSec, nowUnixSec);
  return secs / (365.25 * 24 * 60 * 60);
}
function isMatured(maturityUnixSec, nowUnixSec = nowSec()) {
  return nowUnixSec >= maturityUnixSec;
}

// src/views/yield-curve.ts
async function readImpliedApy(params) {
  const config = await readMarketConfig(params);
  const scv = await simulateRead({
    server: params.server,
    network: params.network,
    contractAddress: config.oracle,
    method: "implied_apy",
    args: [new SorobanAddress7(params.market).toScVal()]
  });
  return scValToBigInt(scv);
}
async function readPtPrice(params) {
  const config = await readMarketConfig(params);
  const scv = await simulateRead({
    server: params.server,
    network: params.network,
    contractAddress: config.oracle,
    method: "pt_price",
    args: [new SorobanAddress7(params.market).toScVal()]
  });
  return scValToBigInt(scv);
}
async function readYieldCurvePoint(params) {
  const config = await readMarketConfig(params);
  const [apy, price] = await Promise.all([
    readImpliedApy(params),
    readPtPrice(params)
  ]);
  return {
    timeToMaturity: timeToMaturity(config.maturity, nowSec()),
    impliedApy: apy,
    ptPrice: price
  };
}

// src/views/blend-rate.ts
async function readBlendExchangeRate(params) {
  const scv = await simulateRead({
    server: params.server,
    network: params.network,
    contractAddress: params.blendPool,
    method: "get_exchange_rate",
    args: []
  });
  return scValToBigInt(scv);
}

// src/client.ts
function ensureAddress(value, label) {
  if (isAddress(value)) return value;
  try {
    return asAddress(value);
  } catch (e) {
    throw new StrateAddressError(`${label}: ${e.message}`, e);
  }
}
var StrateClient = class {
  network;
  server;
  factoryAddress;
  constructor(opts) {
    this.network = opts.network;
    this.server = opts.server;
    this.factoryAddress = ensureAddress(opts.factoryAddress, "factoryAddress");
  }
  // -------- Mutations --------
  async buildMint(params) {
    return buildMintTx({
      server: this.server,
      network: this.network,
      source: params.source,
      market: ensureAddress(params.market, "market"),
      user: ensureAddress(params.user, "user"),
      underlyingAmount: params.underlyingAmount
    });
  }
  async buildRedeem(params) {
    return buildRedeemTx({
      server: this.server,
      network: this.network,
      source: params.source,
      market: ensureAddress(params.market, "market"),
      user: ensureAddress(params.user, "user"),
      ptAmount: params.ptAmount,
      atMaturity: params.atMaturity
    });
  }
  async buildClaimYield(params) {
    return buildClaimYieldTx({
      server: this.server,
      network: this.network,
      source: params.source,
      market: ensureAddress(params.market, "market"),
      user: ensureAddress(params.user, "user")
    });
  }
  async buildSwap(params) {
    return buildSwapTx({
      server: this.server,
      network: this.network,
      source: params.source,
      amm: ensureAddress(params.amm, "amm"),
      user: ensureAddress(params.user, "user"),
      tokenIn: params.tokenIn,
      amountIn: params.amountIn,
      minAmountOut: params.minAmountOut
    });
  }
  async buildAddLiquidity(params) {
    return buildAddLiquidityTx({
      server: this.server,
      network: this.network,
      source: params.source,
      amm: ensureAddress(params.amm, "amm"),
      user: ensureAddress(params.user, "user"),
      ptIn: params.ptIn,
      underlyingIn: params.underlyingIn,
      minLpOut: params.minLpOut
    });
  }
  async buildSyncYieldIndex(params) {
    return buildSyncYieldIndexTx({
      server: this.server,
      network: this.network,
      source: params.source,
      market: ensureAddress(params.market, "market")
    });
  }
  // -------- Views --------
  /**
   * Load full market view (config + supply + reserves). Resolves the
   * AMM peer via the factory when not provided.
   */
  async readMarket(market, opts = {}) {
    const ys = ensureAddress(market, "market");
    let amm = opts.amm ? ensureAddress(opts.amm, "amm") : void 0;
    if (!amm) {
      const meta = await readMarketMetaFromFactory({
        server: this.server,
        network: this.network,
        factory: this.factoryAddress,
        ys
      });
      if (!meta) {
        throw new Error(
          `Factory has no record of YS ${ys}. Pass opts.amm if this market was deployed outside the factory.`
        );
      }
      amm = meta.amm;
    }
    return readMarket({
      server: this.server,
      network: this.network,
      market: ys,
      amm
    });
  }
  /** Enumerate every market the factory knows about. */
  async listMarkets() {
    return listMarkets({
      server: this.server,
      network: this.network,
      factory: this.factoryAddress
    });
  }
  async readMarketCount() {
    return readMarketCount({
      server: this.server,
      network: this.network,
      factory: this.factoryAddress
    });
  }
  async readMarketMeta(ys) {
    return readMarketMetaFromFactory({
      server: this.server,
      network: this.network,
      factory: this.factoryAddress,
      ys: ensureAddress(ys, "ys")
    });
  }
  async readCurrentIndex(market) {
    return readCurrentIndex({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market")
    });
  }
  async readPendingYield(market, user) {
    return readPendingYield({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market"),
      user: ensureAddress(user, "user")
    });
  }
  async readIsPaused(market) {
    return readIsPaused({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market")
    });
  }
  async readGlobalYieldIndex(yt) {
    return readGlobalYieldIndex({
      server: this.server,
      network: this.network,
      yt: ensureAddress(yt, "yt")
    });
  }
  async readUserPosition(market, user) {
    return readUserPosition({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market"),
      user: ensureAddress(user, "user")
    });
  }
  async readImpliedApy(market) {
    return readImpliedApy({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market")
    });
  }
  async readPtPrice(market) {
    return readPtPrice({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market")
    });
  }
  async readYieldCurvePoint(market) {
    return readYieldCurvePoint({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market")
    });
  }
  async readBlendExchangeRate(blendPool) {
    return readBlendExchangeRate({
      server: this.server,
      network: this.network,
      blendPool: ensureAddress(blendPool, "blendPool")
    });
  }
};

// src/addresses.ts
var registry = {
  ["PUBLIC" /* Mainnet */]: null,
  ["TESTNET" /* Testnet */]: null,
  ["FUTURENET" /* Futurenet */]: null
};
function registerAddresses(network, book) {
  registry[network] = book;
}
function getAddresses(network) {
  const entry = registry[network];
  if (!entry) {
    throw new StrateNotConfiguredError(
      `No Strate addresses registered for ${network}. Call registerAddresses(${network}, { factory, ... }) first.`
    );
  }
  return entry;
}
function tryGetAddresses(network) {
  return registry[network];
}

// src/utils/format.ts
function formatApy(wadApy, digits = 2) {
  const negative = wadApy < 0n;
  const abs = negative ? -wadApy : wadApy;
  const scaled = abs * 100n * 10n ** BigInt(digits) / WAD;
  const s = scaled.toString().padStart(digits + 1, "0");
  const intPart = s.slice(0, s.length - digits) || "0";
  const fracPart = digits > 0 ? "." + s.slice(s.length - digits) : "";
  return `${negative ? "-" : ""}${intPart}${fracPart}%`;
}
function formatTokenAmount(amount, decimals = UNDERLYING_DECIMALS, displayDigits = 4) {
  const negative = amount < 0n;
  const abs = negative ? -amount : amount;
  const divisor = 10n ** BigInt(decimals);
  const intPart = abs / divisor;
  const fracPart = abs % divisor;
  if (displayDigits === 0) return `${negative ? "-" : ""}${intPart}`;
  const fracStr = fracPart.toString().padStart(decimals, "0").slice(0, displayDigits);
  return `${negative ? "-" : ""}${intPart}.${fracStr}`;
}
function formatUnderlying(amount, displayDigits = 2) {
  return `$${formatTokenAmount(amount, UNDERLYING_DECIMALS, displayDigits)}`;
}
function formatPtPrice(wadPrice, digits = 4) {
  const negative = wadPrice < 0n;
  const abs = negative ? -wadPrice : wadPrice;
  const scaled = abs * 10n ** BigInt(digits) / WAD;
  const s = scaled.toString().padStart(digits + 1, "0");
  const intPart = s.slice(0, s.length - digits) || "0";
  const fracPart = digits > 0 ? "." + s.slice(s.length - digits) : "";
  return `${negative ? "-" : ""}${intPart}${fracPart}`;
}
function shortenAddress(addr, chars = 4) {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}
function formatTimeToMaturity(seconds) {
  if (seconds <= 0) return "matured";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor(seconds % 86400 / 3600);
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  const minutes = Math.floor(seconds % 3600 / 60);
  return `${hours}h ${minutes}m`;
}
export {
  HALF_WAD,
  Network,
  StrateAddressError,
  StrateClient,
  StrateEncodingError,
  StrateError,
  StrateNetworkError,
  StrateNotConfiguredError,
  StrateSimulationError,
  UNDERLYING_DECIMALS,
  WAD,
  asAddress,
  bigIntToScVal,
  buildAddLiquidityTx,
  buildClaimYieldTx,
  buildMintTx,
  buildRedeemTx,
  buildSwapTx,
  buildSyncYieldIndexTx,
  dateToLedgerTimestamp,
  formatApy,
  formatPtPrice,
  formatTimeToMaturity,
  formatTokenAmount,
  formatUnderlying,
  fromWad,
  getAddresses,
  i128FromString,
  i128ToString,
  isAddress,
  isMatured,
  ledgerTimestampToDate,
  listMarkets,
  nowSec,
  numberToWad,
  readAccruedYieldOnYt,
  readBlendExchangeRate,
  readCurrentIndex,
  readGlobalYieldIndex,
  readImpliedApy,
  readIsPaused,
  readMarket,
  readMarketByIndex,
  readMarketConfig,
  readMarketCount,
  readMarketMetaFromFactory,
  readPendingYield,
  readPtPrice,
  readUserPosition,
  readUserYieldIndex,
  readYieldCurvePoint,
  registerAddresses,
  scValToBigInt,
  shortenAddress,
  timeToMaturity,
  toWad,
  tryGetAddresses,
  wadDiv,
  wadMul,
  wadToNumber,
  yearsToMaturity
};
