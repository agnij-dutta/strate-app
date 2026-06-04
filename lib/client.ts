import { rpc as StellarRpc } from "@stellar/stellar-sdk";
import { Network, StrateClient } from "@strate/sdk";
import { ACTIVE } from "./addresses";

// Factory contract is not yet deployed on testnet — the v1 protocol
// architecture had a cross-build issue between the Factory crate and the
// child contract cdylibs (`__constructor` symbol collision) that needs a
// `strate-types` shared crate refactor to resolve. Tracked as a follow-up.
// Until then, markets are listed statically from `lib/addresses.ts` and the
// SDK client carries a shape-valid placeholder so the StrateClient
// constructor accepts it.
const PLACEHOLDER_FACTORY =
  ACTIVE.factory ??
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS ??
  "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB";

let cached: StrateClient | null = null;

export function getStrateClient(): StrateClient {
  if (cached) return cached;
  cached = new StrateClient({
    network: Network.Testnet,
    server: new StellarRpc.Server(ACTIVE.rpcUrl),
    factoryAddress: PLACEHOLDER_FACTORY,
  });
  return cached;
}
