"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getStrateClient } from "@/lib/client";
import { ACTIVE } from "@/lib/addresses";

/**
 * Read an SAC- or Soroban-fungible balance for `user` from
 * `tokenAddress`. Works for the native XLM SAC, the USDC SAC, and
 * for the PT/YT contracts (all of which expose the standard
 * `balance(id: Address) -> i128` signature).
 *
 * Pass `undefined` for either address to disable the query. Returns
 * a base-unit bigint (7-decimal on Stellar SAC).
 */
export function useTokenBalance(
  tokenAddress: string | undefined,
  user: string | undefined,
): UseQueryResult<bigint, Error> {
  const enabled = Boolean(tokenAddress) && Boolean(user);
  return useQuery<bigint, Error>({
    queryKey: ["strate", "balance", ACTIVE.passphrase, tokenAddress, user],
    queryFn: async () => {
      if (!tokenAddress || !user) throw new Error("token and user required");
      const client = getStrateClient();
      const { Address, Contract, TransactionBuilder, scValToNative, rpc } =
        await import("@stellar/stellar-sdk");
      const account = await client.server.getAccount(user);
      const contract = new Contract(tokenAddress);
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: ACTIVE.passphrase,
      })
        .addOperation(contract.call("balance", new Address(user).toScVal()))
        .setTimeout(30)
        .build();
      const sim = await client.server.simulateTransaction(tx);
      if (rpc.Api.isSimulationError(sim)) {
        // Brand-new account that's never received this token returns
        // zero, not an error, on the standard SAC. Treat any sim
        // error as zero to avoid showing a scary state for the
        // common "no balance yet" case.
        return 0n;
      }
      const retval = (sim as { result?: { retval?: unknown } }).result?.retval;
      if (!retval) return 0n;
      const native = scValToNative(
        retval as Parameters<typeof scValToNative>[0],
      );
      return BigInt(native as string | number | bigint);
    },
    enabled,
    staleTime: 10_000,
    retry: 1,
  });
}
