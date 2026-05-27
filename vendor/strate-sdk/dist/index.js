import {
  StrateAddressError,
  StrateEncodingError,
  StrateError,
  StrateNetworkError,
  StrateNotConfiguredError,
  StrateSimulationError
} from "./chunk-M2UWPFZV.js";

// src/types.ts
var Network = /* @__PURE__ */ ((Network4) => {
  Network4["Mainnet"] = "PUBLIC";
  Network4["Testnet"] = "TESTNET";
  Network4["Futurenet"] = "FUTURENET";
  return Network4;
})(Network || {});
var WAD = 1000000000000000000n;
var HALF_WAD = WAD / 2n;
var UNDERLYING_DECIMALS = 7;
function wadToNumber(value) {
  const scaled = value / 10n ** 8n;
  return Number(scaled) / 1e10;
}
function numberToWad(value) {
  if (!Number.isFinite(value)) {
    throw new RangeError(`numberToWad: non-finite value ${value}`);
  }
  const [intPart, fracPart = ""] = value.toString().split(".");
  const frac = (fracPart + "0".repeat(18)).slice(0, 18);
  const sign = value < 0 ? -1n : 1n;
  const absInt = (intPart ?? "0").replace("-", "");
  return sign * (BigInt(absInt) * WAD + BigInt(frac));
}
function i128FromString(value) {
  return BigInt(value);
}
function i128ToString(value) {
  return value.toString(10);
}
var STRKEY_RE = /^[CG][A-Z2-7]{55}$/;
function asAddress(value) {
  if (typeof value !== "string") {
    throw new TypeError("Address must be a string");
  }
  if (!STRKEY_RE.test(value)) {
    throw new Error(
      `Invalid Stellar address: ${value}. Expected a 56-char base32 strkey starting with C (contract) or G (account).`
    );
  }
  return value;
}
function isAddress(value) {
  return typeof value === "string" && STRKEY_RE.test(value);
}

// src/transactions/mint.ts
import { Address as SorobanAddress } from "@stellar/stellar-sdk";

// src/utils/bigint.ts
import { xdr } from "@stellar/stellar-sdk";
var U64_MAX = (1n << 64n) - 1n;
var U64_MOD = 1n << 64n;
var I64_MIN = -(1n << 63n);
var I64_MAX = (1n << 63n) - 1n;
var I128_MIN = -(1n << 127n);
var I128_MAX = (1n << 127n) - 1n;
var U128_MAX = (1n << 128n) - 1n;
var U256_MAX = (1n << 256n) - 1n;
function splitToLimbs(value, bits) {
  const limbCount = bits / 64;
  const out = [];
  let v = value < 0n ? value + (1n << BigInt(bits)) : value;
  for (let i = 0; i < limbCount; i++) {
    out.push(v & U64_MAX);
    v >>= 64n;
  }
  return out;
}
function recombineLimbs(limbs, signed) {
  let v = 0n;
  for (let i = limbs.length - 1; i >= 0; i--) {
    v = v << 64n | (limbs[i] ?? 0n);
  }
  if (signed) {
    const bits = BigInt(limbs.length * 64);
    const max = 1n << bits - 1n;
    if (v >= max) v -= 1n << bits;
  }
  return v;
}
function bigIntToScVal(value, kind) {
  switch (kind) {
    case "i64": {
      if (value < I64_MIN || value > I64_MAX) {
        throw new StrateEncodingError(`i64 out of range: ${value}`);
      }
      return xdr.ScVal.scvI64(xdr.Int64.fromString(value.toString()));
    }
    case "u64": {
      if (value < 0n || value > U64_MAX) {
        throw new StrateEncodingError(`u64 out of range: ${value}`);
      }
      return xdr.ScVal.scvU64(xdr.Uint64.fromString(value.toString()));
    }
    case "i128": {
      if (value < I128_MIN || value > I128_MAX) {
        throw new StrateEncodingError(`i128 out of range: ${value}`);
      }
      const limbs = splitToLimbs(value, 128);
      return xdr.ScVal.scvI128(
        new xdr.Int128Parts({
          hi: xdr.Int64.fromString(
            // Hi limb is signed: convert back to signed bigint.
            recombineLimbs([0n, limbs[1] ?? 0n], false) >= 1n << 63n ? ((limbs[1] ?? 0n) - U64_MOD).toString() : (limbs[1] ?? 0n).toString()
          ),
          lo: xdr.Uint64.fromString((limbs[0] ?? 0n).toString())
        })
      );
    }
    case "u128": {
      if (value < 0n || value > U128_MAX) {
        throw new StrateEncodingError(`u128 out of range: ${value}`);
      }
      const limbs = splitToLimbs(value, 128);
      return xdr.ScVal.scvU128(
        new xdr.UInt128Parts({
          hi: xdr.Uint64.fromString((limbs[1] ?? 0n).toString()),
          lo: xdr.Uint64.fromString((limbs[0] ?? 0n).toString())
        })
      );
    }
    case "u256": {
      if (value < 0n || value > U256_MAX) {
        throw new StrateEncodingError(`u256 out of range: ${value}`);
      }
      const limbs = splitToLimbs(value, 256);
      return xdr.ScVal.scvU256(
        new xdr.UInt256Parts({
          hiHi: xdr.Uint64.fromString((limbs[3] ?? 0n).toString()),
          hiLo: xdr.Uint64.fromString((limbs[2] ?? 0n).toString()),
          loHi: xdr.Uint64.fromString((limbs[1] ?? 0n).toString()),
          loLo: xdr.Uint64.fromString((limbs[0] ?? 0n).toString())
        })
      );
    }
    default: {
      const _exhaustive = kind;
      throw new StrateEncodingError(`Unknown int kind: ${String(_exhaustive)}`);
    }
  }
}
function scValToBigInt(scVal) {
  const t = scVal.switch().name;
  switch (t) {
    case "scvI64":
      return BigInt(scVal.i64().toString());
    case "scvU64":
      return BigInt(scVal.u64().toString());
    case "scvI128": {
      const parts = scVal.i128();
      const lo = BigInt(parts.lo().toString());
      const hi = BigInt(parts.hi().toString());
      const composed = (hi << 64n) + lo;
      return composed;
    }
    case "scvU128": {
      const parts = scVal.u128();
      const lo = BigInt(parts.lo().toString());
      const hi = BigInt(parts.hi().toString());
      return hi << 64n | lo;
    }
    case "scvU256": {
      const parts = scVal.u256();
      const loLo = BigInt(parts.loLo().toString());
      const loHi = BigInt(parts.loHi().toString());
      const hiLo = BigInt(parts.hiLo().toString());
      const hiHi = BigInt(parts.hiHi().toString());
      return hiHi << 192n | hiLo << 128n | loHi << 64n | loLo;
    }
    default:
      throw new StrateEncodingError(`scValToBigInt: not an integer ScVal: ${t}`);
  }
}
function wadMul(a, b) {
  return a * b / WAD;
}
function wadDiv(a, b) {
  if (b === 0n) throw new RangeError("wadDiv: division by zero");
  return a * WAD / b;
}
function toWad(amount, decimals) {
  if (decimals === 18) return amount;
  if (decimals < 18) return amount * 10n ** BigInt(18 - decimals);
  return amount / 10n ** BigInt(decimals - 18);
}
function fromWad(amount, decimals) {
  if (decimals === 18) return amount;
  if (decimals < 18) return amount / 10n ** BigInt(18 - decimals);
  return amount * 10n ** BigInt(decimals - 18);
}

// src/transactions/_common.ts
import {
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder
} from "@stellar/stellar-sdk";
var DEFAULT_TIMEOUT_SECONDS = 180;
var DEFAULT_FEE = String(Number(BASE_FEE) * 10);
function networkPassphrase(network) {
  switch (network) {
    case "PUBLIC" /* Mainnet */:
      return Networks.PUBLIC;
    case "TESTNET" /* Testnet */:
      return Networks.TESTNET;
    case "FUTURENET" /* Futurenet */:
      return Networks.FUTURENET;
    default: {
      const _exhaustive = network;
      throw new StrateNetworkError(`Unknown network: ${String(_exhaustive)}`);
    }
  }
}
async function buildInvokeTx(opts) {
  const { server, network, source, contractAddress, method, args } = opts;
  const contract = new Contract(contractAddress);
  const tx = new TransactionBuilder(source, {
    fee: opts.fee ?? DEFAULT_FEE,
    networkPassphrase: networkPassphrase(network)
  }).addOperation(contract.call(method, ...args)).setTimeout(opts.timeoutSeconds ?? DEFAULT_TIMEOUT_SECONDS).build();
  try {
    const prepared = await server.prepareTransaction(tx);
    return prepared;
  } catch (err) {
    throw new StrateNetworkError(
      `prepareTransaction failed for ${contractAddress}.${method}: ${err instanceof Error ? err.message : String(err)}`,
      err
    );
  }
}

// src/transactions/mint.ts
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
    method: "claim_yt_yield",
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

// src/views/market.ts
import { scValToNative, Address as SorobanAddress6 } from "@stellar/stellar-sdk";

// src/views/_simulate.ts
import {
  Account,
  Contract as Contract2,
  TransactionBuilder as TransactionBuilder2,
  rpc as rpc2
} from "@stellar/stellar-sdk";
var SIM_DUMMY_ACCOUNT_ID = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
async function simulateRead(opts) {
  const { server, network, contractAddress, method, args } = opts;
  const contract = new Contract2(contractAddress);
  const dummy = new Account(SIM_DUMMY_ACCOUNT_ID, "0");
  const tx = new TransactionBuilder2(dummy, {
    fee: DEFAULT_FEE,
    networkPassphrase: networkPassphrase(network)
  }).addOperation(contract.call(method, ...args)).setTimeout(DEFAULT_TIMEOUT_SECONDS).build();
  let sim;
  try {
    sim = await server.simulateTransaction(tx);
  } catch (err) {
    throw new StrateSimulationError(
      `simulateTransaction RPC failed for ${contractAddress}.${method}`,
      contractAddress,
      method,
      err
    );
  }
  if (rpc2.Api.isSimulationError(sim)) {
    throw new StrateSimulationError(
      `Simulation error for ${contractAddress}.${method}: ${sim.error}`,
      contractAddress,
      method
    );
  }
  if (!("result" in sim) || !sim.result) {
    throw new StrateSimulationError(
      `Simulation returned no result for ${contractAddress}.${method}`,
      contractAddress,
      method
    );
  }
  return sim.result.retval;
}

// src/views/market.ts
function parseMarketConfig(scVal) {
  const native = scValToNative(scVal);
  if (!native || typeof native !== "object") {
    throw new StrateEncodingError("MarketConfig: expected struct map");
  }
  const m = native;
  const addrFromField = (key) => {
    const v = m[key];
    if (typeof v === "string") return asAddress(v);
    if (v && typeof v.toString === "function") {
      return asAddress(v.toString());
    }
    throw new StrateEncodingError(`MarketConfig.${key}: not an address`);
  };
  return {
    underlying: addrFromField("underlying"),
    pt: addrFromField("pt"),
    yt: addrFromField("yt"),
    amm: addrFromField("amm"),
    oracle: addrFromField("oracle"),
    maturity: Number(m["maturity"] ?? 0),
    scalarRoot: BigInt(m["scalar_root"] ?? m["scalarRoot"] ?? 0n)
  };
}
async function readMarket(params) {
  const { server, network, market } = params;
  const [configScv, supplyScv] = await Promise.all([
    simulateRead({ server, network, contractAddress: market, method: "get_config", args: [] }),
    simulateRead({ server, network, contractAddress: market, method: "total_supply", args: [] })
  ]);
  const config = parseMarketConfig(configScv);
  const totalSupply = scValToBigInt(supplyScv);
  const reservesScv = await simulateRead({
    server,
    network,
    contractAddress: config.amm,
    method: "reserves",
    args: []
  });
  const reservesNative = scValToNative(reservesScv);
  if (!Array.isArray(reservesNative) || reservesNative.length < 2) {
    throw new StrateEncodingError("AMM.reserves: expected (i128, i128) tuple");
  }
  return {
    ...config,
    totalSupply,
    reserves: {
      pt: BigInt(reservesNative[0]),
      underlying: BigInt(reservesNative[1])
    }
  };
}
async function readMarketConfig(params) {
  const scv = await simulateRead({
    server: params.server,
    network: params.network,
    contractAddress: params.market,
    method: "get_config",
    args: []
  });
  return parseMarketConfig(scv);
}

// src/views/user-position.ts
import { Address as SorobanAddress7 } from "@stellar/stellar-sdk";
async function readUserPosition(params) {
  const { server, network, market, user } = params;
  const config = await readMarketConfig({ server, network, market });
  const userScv = new SorobanAddress7(user).toScVal();
  const [ptScv, ytScv, accruedScv, claimableScv] = await Promise.all([
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
      method: "accrued_yield_of",
      args: [userScv]
    }),
    simulateRead({
      server,
      network,
      contractAddress: market,
      method: "claimable_yield_of",
      args: [userScv]
    })
  ]);
  return {
    ptBalance: scValToBigInt(ptScv),
    ytBalance: scValToBigInt(ytScv),
    accruedYield: scValToBigInt(accruedScv),
    claimableYield: scValToBigInt(claimableScv)
  };
}

// src/views/yield-curve.ts
import { Address as SorobanAddress8 } from "@stellar/stellar-sdk";

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
    args: [new SorobanAddress8(params.market).toScVal()]
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
    args: [new SorobanAddress8(params.market).toScVal()]
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
  // -------- Views --------
  async readMarket(market) {
    return readMarket({
      server: this.server,
      network: this.network,
      market: ensureAddress(market, "market")
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
  nowSec,
  numberToWad,
  readBlendExchangeRate,
  readImpliedApy,
  readMarket,
  readMarketConfig,
  readPtPrice,
  readUserPosition,
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
