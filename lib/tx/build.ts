"use client";

import { asAddress } from "@strate/sdk";
import { getStrateClient } from "@/lib/client";
import { ACTIVE } from "@/lib/addresses";
import { signXdr } from "@/lib/wallet/kit";

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
  const { Networks, TransactionBuilder } = await import("@stellar/stellar-sdk");
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
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
        `Transaction failed on-chain. See https://stellar.expert/explorer/testnet/tx/${hash}`,
      );
    }
    // NOT_FOUND or PENDING — keep polling.
  }
  throw new Error(
    `Transaction did not finalize within 30 seconds. Check explorer: ${hash}`,
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
  const source = await client.server.getAccount(walletAddress);

  let unsigned;
  switch (params.kind) {
    case "mint":
      unsigned = await client.buildMint({
        market: params.market,
        underlyingAmount: params.underlyingAmount,
        user,
        source,
      });
      break;
    case "redeem":
      unsigned = await client.buildRedeem({
        market: params.market,
        ptAmount: params.ptAmount,
        atMaturity: params.atMaturity,
        user,
        source,
      });
      break;
    case "swap":
      unsigned = await client.buildSwap({
        amm: params.amm,
        tokenIn: params.tokenIn,
        amountIn: params.amountIn,
        minAmountOut: params.minAmountOut,
        user,
        source,
      });
      break;
    case "claim":
      unsigned = await client.buildClaimYield({
        market: params.market,
        user,
        source,
      });
      break;
  }

  const signed = await signXdr(unsigned.toXDR(), {
    networkPassphrase: ACTIVE.passphrase,
  });
  return submitAndPoll(signed);
}
