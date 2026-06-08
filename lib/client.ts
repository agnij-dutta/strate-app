import { rpc as StellarRpc } from "@stellar/stellar-sdk";
import { Network, StrateClient } from "@strate/sdk";
import { ACTIVE, IS_MAINNET } from "./addresses";

// The factory is deployed on both networks now. Fall back to a
// shape-valid placeholder only if an address is somehow missing, so the
// StrateClient constructor never throws at module load.
const FACTORY_ADDRESS =
  ACTIVE.factory ??
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS ??
  "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB";

let cached: StrateClient | null = null;

export function getStrateClient(): StrateClient {
  if (cached) return cached;
  cached = new StrateClient({
    // Must match the active network. A hardcoded Testnet here builds
    // read simulations against the wrong passphrase and breaks every
    // on-chain read on mainnet (supply, implied APY, PT/YT prices).
    network: IS_MAINNET ? Network.Mainnet : Network.Testnet,
    server: new StellarRpc.Server(ACTIVE.rpcUrl),
    factoryAddress: FACTORY_ADDRESS,
  });
  return cached;
}
