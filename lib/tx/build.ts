"use client";

import { asAddress } from "@strate/sdk";
import { getStrateClient } from "@/lib/client";
import { ACTIVE, EXPLORER_NETWORK, IS_MAINNET } from "@/lib/addresses";

/** YS / Oracle error code for a stale TWAP. */
const ERROR_ORACLE_STALE = 80;

/**
 * Structured parameters for a transaction the drawer is about to submit.
 * `kind` selects which SDK builder to call; the remaining fields are the
 * builder's inputs in their canonical types (addresses as strings, on-chain
 * integers as bigints with full token-decimals scaling).
 *
 * `null` means the drawer should fall back to its simulated path — used
 * for non-live markets, YT swap directions (no SDK builder yet), and the
 * portfolio preview path.
 */
export type TxParams =
  | { kind: "mint"; market: string; underlyingAmount: bigint }
  | { kind: "redeem"; market: string; ptAmount: bigint; atMaturity: boolean }
  | {
      kind: "swap";
      amm: string;
      tokenIn: "PT" | "UNDERLYING";
      amountIn: bigint;
      minAmountOut: bigint;
    }
  | { kind: "claim"; market: string };

/**
 * Convert a human-typed decimal string to on-chain token units.
 * Avoids `Number`-based math to keep wei-precision intact at 7-decimal scale.
 *
 * toUnits("1.5", 7) === 15_000_000n
 * toUnits("0.0000001", 7) === 1n
 * toUnits("", 7) === 0n
 */
export function toUnits(value: string, decimals: number): bigint {
  const v = (value || "").trim();
  if (!v) return 0n;
  const [whole, frac = ""] = v.split(".");
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  const cleaned = `${whole.replace(/[^0-9]/g, "") || "0"}${padded.replace(/[^0-9]/g, "")}`;
  return BigInt(cleaned.replace(/^0+(?=\d)/, "") || "0");
}

/**
 * The Soroban transaction lifecycle: submit → poll getTransaction until
 * a terminal state. Returns the transaction hash on success; throws with
 * the host-reported result on failure or timeout.
 *
 * Polling cadence: 800ms initially, scaling up to 2s. Cap at 30s — long
 * enough for two ledger closes (~5s each) with comfortable headroom.
 */
async function submitAndPoll(signedXdr: string): Promise<string> {
  const client = getStrateClient();
  const { TransactionBuilder } = await import("@stellar/stellar-sdk");
  // Rehydrate against the active network's passphrase, not a hardcoded
  // testnet one, so mainnet transactions parse and submit correctly.
  const tx = TransactionBuilder.fromXDR(signedXdr, ACTIVE.passphrase);
  const sendResp = await client.server.sendTransaction(tx);

  if (sendResp.status === "ERROR") {
    throw new Error(
      `RPC rejected the transaction: ${
        sendResp.errorResult?.result().switch().name ?? "unknown"
      }`,
    );
  }
  const hash = sendResp.hash;

  // Poll. Stop on SUCCESS, throw on FAILED, time out after ~30s.
  const start = Date.now();
  let delay = 800;
  while (Date.now() - start < 30_000) {
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay + 200, 2000);
    const txResp = await client.server.getTransaction(hash);
    if (txResp.status === "SUCCESS") return hash;
    if (txResp.status === "FAILED") {
      throw new Error(
        `Transaction failed on-chain. See https://stellar.expert/explorer/${EXPLORER_NETWORK}/tx/${hash}`,
      );
    }
    // NOT_FOUND or PENDING — keep polling.
  }
  throw new Error(
    `Transaction did not finalize within 30 seconds. Check explorer: ${hash}`,
  );
}

/**
 * Look up the Oracle address for a given YS / AMM contract. Mint, redeem,
 * and claim go through YS, which reads from `cfg.oracle`. Swap goes
 * through AMM, which reads from its own oracle. Both are pre-recorded
 * in `lib/addresses.ts` so the dApp doesn't have to make an RPC call
 * to find them.
 *
 * Returns `null` if the contract isn't in our registry; in that case
 * the caller skips the pre-sync and lets the contract surface its own
 * error.
 */
function oracleForContract(contractAddress: string): string | null {
  for (const m of ACTIVE.markets) {
    if (m.yieldStripping === contractAddress || m.amm === contractAddress) {
      return m.oracle;
    }
  }
  return null;
}

/**
 * Build + sign + broadcast `Oracle.sync_rate()` for a specific Oracle.
 * Used as a pre-step before any tx that goes through YS's
 * `sync_yield_index`, which reads from `Oracle.get_rate()` and reverts
 * with `OracleStale` (Error #80) if the cache has expired.
 *
 * The Oracle's `sync_rate` is permissionless: anyone can call it, no
 * auth required. We sign with the user's wallet because the SDK
 * already has the signing pipeline plumbed there. Cost is ~0.1 XLM.
 */
async function primeOracle(
  oracleAddress: string,
  walletAddress: string,
): Promise<void> {
  const client = getStrateClient();
  const { Address, Contract, TransactionBuilder, BASE_FEE } = await import(
    "@stellar/stellar-sdk"
  );
  const account = await client.server.getAccount(walletAddress);
  const contract = new Contract(oracleAddress);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: ACTIVE.passphrase,
  })
    .addOperation(contract.call("sync_rate"))
    .setTimeout(60)
    .build();
  const prepared = await client.server.prepareTransaction(tx);
  const { signXdr } = await import("@/lib/wallet/kit");
  const signed = await signXdr(prepared.toXDR(), {
    networkPassphrase: ACTIVE.passphrase,
  });
  await submitAndPoll(signed);
  void Address; // type re-export side effect
}

/**
 * Detect the "stale oracle" failure mode by inspecting the host-error
 * code. Soroban encodes contract errors as `Error(Contract, N)`. We
 * key off the substring because the SDK error object's shape varies
 * across stellar-sdk versions.
 */
function isOracleStaleError(err: unknown): boolean {
  const s = err instanceof Error ? err.message : String(err);
  return (
    s.includes(`Error(Contract, #${ERROR_ORACLE_STALE})`) ||
    s.includes("OracleStale") ||
    s.includes(`get_rate`)
  );
}

/**
 * Build, sign, submit, and poll a single Strate transaction. Returns the
 * confirmed transaction hash. The caller passes the typed `TxParams` from
 * the form layer and the connected wallet address.
 */
export async function executeTx(
  params: TxParams,
  walletAddress: string,
): Promise<string> {
  const client = getStrateClient();
  const user = asAddress(walletAddress);
  // getAccount throws if the account does not exist on the active
  // network. The most common cause is an unfunded wallet: a Stellar
  // account only exists once it holds the ~1 XLM base reserve. Translate
  // the raw "Account not found" into something a user can act on.
  let source;
  try {
    source = await client.server.getAccount(walletAddress);
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e);
    if (/not found|notfound|404/i.test(raw)) {
      const net = IS_MAINNET ? "Stellar mainnet" : "Stellar testnet";
      throw new Error(
        `Your wallet is not funded on ${net}. A Stellar account needs at least ~1 XLM to exist. Send some XLM to ${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}, then try again.`,
      );
    }
    throw e;
  }

  // Dynamic-import the wallet kit so its bundle (~200 KB) only loads when
  // the user actually submits a transaction, not on initial page render.
  const { signXdr } = await import("@/lib/wallet/kit");

  /**
   * Build, sign, submit, and poll the user's intended tx once. Pulled
   * out so we can call it twice in the OracleStale recovery path with
   * a fresh source-account sequence between attempts.
   */
  const buildSignSubmit = async (sourceAccount: typeof source): Promise<string> => {
    let unsigned;
    switch (params.kind) {
      case "mint":
        unsigned = await client.buildMint({
          market: params.market,
          underlyingAmount: params.underlyingAmount,
          user,
          source: sourceAccount,
        });
        break;
      case "redeem":
        unsigned = await client.buildRedeem({
          market: params.market,
          ptAmount: params.ptAmount,
          atMaturity: params.atMaturity,
          user,
          source: sourceAccount,
        });
        break;
      case "swap":
        unsigned = await client.buildSwap({
          amm: params.amm,
          tokenIn: params.tokenIn,
          amountIn: params.amountIn,
          minAmountOut: params.minAmountOut,
          user,
          source: sourceAccount,
        });
        break;
      case "claim":
        unsigned = await client.buildClaimYield({
          market: params.market,
          user,
          source: sourceAccount,
        });
        break;
    }
    const signed = await signXdr(unsigned.toXDR(), {
      networkPassphrase: ACTIVE.passphrase,
    });
    return submitAndPoll(signed);
  };

  // First attempt. If the Oracle's TWAP cache has expired the SDK's
  // prepareTransaction call (which simulates against current ledger
  // state) returns OracleStale before we ever sign. Catch that, prime
  // the Oracle with a sync_rate tx from the user's wallet, then retry
  // with a fresh account sequence.
  //
  // The Oracle's sync_rate is permissionless. A backend keeper cron
  // (queued, separate PR) will also poke sync_rate from a dedicated
  // wallet on a regular cadence so real users almost never see the
  // stale path; this is the user-side fallback.
  try {
    return await buildSignSubmit(source);
  } catch (e) {
    if (!isOracleStaleError(e)) throw e;
    const target =
      params.kind === "swap"
        ? params.amm
        : params.kind === "claim" || params.kind === "mint" || params.kind === "redeem"
          ? params.market
          : null;
    const oracleAddr = target ? oracleForContract(target) : null;
    if (!oracleAddr) throw e; // unknown market, can't recover

    await primeOracle(oracleAddr, walletAddress);

    const freshSource = await client.server.getAccount(walletAddress);
    return await buildSignSubmit(freshSource);
  }
}
