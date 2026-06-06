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

// src/errors.ts
var StrateError = class extends Error {
  cause;
  constructor(message, cause) {
    super(message);
    this.name = "StrateError";
    this.cause = cause;
  }
};
var StrateAddressError = class extends StrateError {
  constructor(message, cause) {
    super(message, cause);
    this.name = "StrateAddressError";
  }
};
var StrateSimulationError = class extends StrateError {
  constructor(message, contractAddress, method, cause) {
    super(message, cause);
    this.contractAddress = contractAddress;
    this.method = method;
    this.name = "StrateSimulationError";
  }
  contractAddress;
  method;
};
var StrateNetworkError = class extends StrateError {
  constructor(message, cause) {
    super(message, cause);
    this.name = "StrateNetworkError";
  }
};
var StrateEncodingError = class extends StrateError {
  constructor(message, cause) {
    super(message, cause);
    this.name = "StrateEncodingError";
  }
};
var StrateNotConfiguredError = class extends StrateError {
  constructor(message) {
    super(message);
    this.name = "StrateNotConfiguredError";
  }
};

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

// src/views/market.ts
import { scValToNative, Address as SorobanAddress } from "@stellar/stellar-sdk";

// src/views/_simulate.ts
import {
  Account,
  Contract as Contract2,
  TransactionBuilder as TransactionBuilder2,
  rpc as rpc2
} from "@stellar/stellar-sdk";

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

// src/views/_simulate.ts
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
    oracle: addrFromField("oracle"),
    maturity: Number(m["maturity"] ?? 0),
    scalarRoot: BigInt(m["scalar_root"] ?? m["scalarRoot"] ?? 0n),
    admin: addrFromField("admin"),
    tvlCap: BigInt(m["tvl_cap"] ?? m["tvlCap"] ?? 0n)
  };
}
async function readMarket(params) {
  const { server, network, market, amm } = params;
  const [configScv, reservesScv] = await Promise.all([
    simulateRead({ server, network, contractAddress: market, method: "config", args: [] }),
    simulateRead({ server, network, contractAddress: amm, method: "reserves", args: [] })
  ]);
  const config = parseMarketConfig(configScv);
  const supplyScv = await simulateRead({
    server,
    network,
    contractAddress: config.yt,
    method: "total_supply",
    args: []
  });
  const totalSupply = scValToBigInt(supplyScv);
  const reservesNative = scValToNative(reservesScv);
  if (!Array.isArray(reservesNative) || reservesNative.length < 2) {
    throw new StrateEncodingError("AMM.reserves: expected (i128, i128) tuple");
  }
  return {
    ...config,
    amm,
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
    method: "config",
    args: []
  });
  return parseMarketConfig(scv);
}

// src/views/factory.ts
import { Address as SorobanAddress2, xdr as xdr4, scValToNative as scValToNative2 } from "@stellar/stellar-sdk";
function parseMarketMeta(scVal) {
  const native = scValToNative2(scVal);
  if (native === null || native === void 0) return null;
  if (typeof native !== "object") {
    throw new StrateEncodingError("MarketMeta: expected struct map");
  }
  const m = native;
  const addr = (key) => {
    const v = m[key];
    if (typeof v === "string") return asAddress(v);
    if (v && typeof v.toString === "function") {
      return asAddress(v.toString());
    }
    throw new StrateEncodingError(`MarketMeta.${key}: not an address`);
  };
  return {
    pt: addr("pt"),
    yt: addr("yt"),
    amm: addr("amm"),
    oracle: addr("oracle"),
    yieldStripping: addr("yield_stripping"),
    underlying: addr("underlying"),
    maturity: Number(m["maturity"] ?? 0),
    scalarRoot: BigInt(m["scalar_root"] ?? 0n),
    feeBps: Number(m["fee_bps"] ?? 0),
    blendPool: addr("blend_pool"),
    deployedAt: Number(m["deployed_at"] ?? 0),
    deployer: addr("deployer")
  };
}
async function readMarketCount(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.factory,
    method: "market_count",
    args: []
  });
  return Number(scValToNative2(scv));
}
async function readMarketByIndex(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.factory,
    method: "get_market_by_index",
    args: [xdr4.ScVal.scvU32(p.index)]
  });
  const v = scValToNative2(scv);
  if (v === null || v === void 0) return null;
  return asAddress(String(v));
}
async function readMarketMetaFromFactory(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.factory,
    method: "get_market_meta",
    args: [new SorobanAddress2(p.ys).toScVal()]
  });
  return parseMarketMeta(scv);
}
async function listMarkets(p) {
  const count = await readMarketCount(p);
  if (count === 0) return [];
  const indices = Array.from({ length: count }, (_, i) => i);
  const addrs = await Promise.all(
    indices.map((i) => readMarketByIndex({ ...p, index: i }))
  );
  const metas = await Promise.all(
    addrs.map(
      (a) => a ? readMarketMetaFromFactory({ ...p, ys: a }) : Promise.resolve(null)
    )
  );
  return metas.filter((m) => m !== null);
}

// src/views/yield-index.ts
import { Address as SorobanAddress3, scValToNative as scValToNative3 } from "@stellar/stellar-sdk";
async function readCurrentIndex(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.market,
    method: "current_index",
    args: []
  });
  return scValToBigInt(scv);
}
async function readPendingYield(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.market,
    method: "pending_yield",
    args: [new SorobanAddress3(p.user).toScVal()]
  });
  return scValToBigInt(scv);
}
async function readIsPaused(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.market,
    method: "is_paused",
    args: []
  });
  return Boolean(scValToNative3(scv));
}
async function readGlobalYieldIndex(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.yt,
    method: "global_yield_index",
    args: []
  });
  return scValToBigInt(scv);
}
async function readUserYieldIndex(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.yt,
    method: "user_yield_index",
    args: [new SorobanAddress3(p.user).toScVal()]
  });
  return scValToBigInt(scv);
}
async function readAccruedYieldOnYt(p) {
  const scv = await simulateRead({
    server: p.server,
    network: p.network,
    contractAddress: p.yt,
    method: "accrued_yield",
    args: [new SorobanAddress3(p.user).toScVal()]
  });
  return scValToBigInt(scv);
}

export {
  Network,
  WAD,
  HALF_WAD,
  UNDERLYING_DECIMALS,
  wadToNumber,
  numberToWad,
  i128FromString,
  i128ToString,
  asAddress,
  isAddress,
  StrateError,
  StrateAddressError,
  StrateSimulationError,
  StrateNetworkError,
  StrateEncodingError,
  StrateNotConfiguredError,
  bigIntToScVal,
  scValToBigInt,
  wadMul,
  wadDiv,
  toWad,
  fromWad,
  buildInvokeTx,
  simulateRead,
  readMarket,
  readMarketConfig,
  readMarketCount,
  readMarketByIndex,
  readMarketMetaFromFactory,
  listMarkets,
  readCurrentIndex,
  readPendingYield,
  readIsPaused,
  readGlobalYieldIndex,
  readUserYieldIndex,
  readAccruedYieldOnYt
};
