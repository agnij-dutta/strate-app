"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getStrateClient } from "@/lib/client";
import { useWallet } from "@/lib/wallet/store";
import { ACTIVE } from "@/lib/addresses";

/**
 * Quote a PT/underlying swap by running it through Soroban's
 * `simulateTransaction` against the live AMM. No broadcast, no
 * signing, no XLM cost. Returns the exact amount the chain would
 * hand back if the user signed and broadcast right now.
 *
 * This replaces the dApp's earlier "multiply by static price" math,
 * which was wildly wrong in shallow pools (50%+ off when pool depth
 * was small) and caused the user's broadcast to revert with
 * SlippageExceeded.
 *
 * The simulation uses `min_out = 1` so slippage never blocks the
 * quote itself; the caller adds the user-facing slippage tolerance
 * to the simulated value to produce a real `min_out` for broadcast.
 *
 * Pass `enabled: false` for non-live markets (no AMM to query) or
 * while the user is typing a non-numeric amount.
 */
export interface UseSwapQuoteOptions {
  amm: string | undefined;
  /** "buy-pt" = underlying in, PT out. "sell-pt" = PT in, underlying out. */
  direction: "buy-pt" | "sell-pt";
  /** Input amount in token base units (7 decimals on Stellar SAC). */
  amountIn: bigint;
  enabled?: boolean;
}

export function useSwapQuote(
  opts: UseSwapQuoteOptions,
): UseQueryResult<bigint, Error> {
  const wallet = useWallet();
  const trader = wallet.address;

  const enabled =
    (opts.enabled ?? true) &&
    Boolean(opts.amm) &&
    Boolean(trader) &&
    opts.amountIn > 0n;

  return useQuery<bigint, Error>({
    queryKey: [
      "strate",
      "swap-quote",
      ACTIVE.passphrase,
      opts.amm,
      opts.direction,
      opts.amountIn.toString(),
      trader,
    ],
    queryFn: async () => {
      if (!opts.amm || !trader) {
        throw new Error("amm and connected wallet required");
      }
      const client = getStrateClient();
      const {
        Address,
        Contract,
        TransactionBuilder,
        nativeToScVal,
        scValToNative,
        rpc,
      } = await import("@stellar/stellar-sdk");

      const method =
        opts.direction === "buy-pt"
          ? "swap_sy_for_exact_pt"
          : "swap_exact_pt_for_sy";
      const inArgName = opts.direction === "buy-pt" ? "sy_in" : "pt_in";
      const minOutArgName =
        opts.direction === "buy-pt" ? "min_pt_out" : "min_sy_out";
      void inArgName;
      void minOutArgName;

      const account = await client.server.getAccount(trader);
      const contract = new Contract(opts.amm);
      const traderScv = new Address(trader).toScVal();
      const amountScv = nativeToScVal(opts.amountIn, { type: "i128" });
      const minOutScv = nativeToScVal(1n, { type: "i128" });

      const tx = new TransactionBuilder(account, {
        fee: "100000",
        networkPassphrase: ACTIVE.passphrase,
      })
        .addOperation(contract.call(method, traderScv, amountScv, minOutScv))
        .setTimeout(60)
        .build();

      const sim = await client.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        // Surface AMM errors verbatim (InsufficientLiquidity,
        // OracleStale, MarketLockedNearMaturity, etc) so the form
        // can show why the quote couldn't be produced.
        throw new Error(sim.error);
      }
      const retval = (sim as { result?: { retval?: unknown } }).result?.retval;
      if (!retval) {
        throw new Error("simulation returned no value");
      }
      const native = scValToNative(retval as Parameters<typeof scValToNative>[0]);
      return BigInt(native as string | number | bigint);
    },
    enabled,
    staleTime: 5_000,
    retry: false,
  });
}
