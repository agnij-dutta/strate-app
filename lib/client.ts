import { rpc as StellarRpc } from "@stellar/stellar-sdk";
import { Network, StrateClient } from "@strate/sdk";

// Public Soroban RPC endpoints. Swap to a dedicated provider before mainnet
// (StellarExpert and Validation Cloud both offer authenticated tiers).
const TESTNET_RPC = "https://soroban-testnet.stellar.org";

// Factory contract address. Replace with the deterministic address produced by
// the Factory deploy step once the protocol is on testnet. Until then this is
// a placeholder used only to satisfy the StrateClient constructor; UI flows
// route through the mock layer in lib/mocks.ts. The string below is a
// shape-valid 56-char strkey (C + 55 base32 chars). The SDK only validates
// shape, not on-chain existence, which is what we want for build-time.
const PLACEHOLDER_FACTORY =
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS ??
  "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB";

let cached: StrateClient | null = null;

export function getStrateClient(): StrateClient {
  if (cached) return cached;
  cached = new StrateClient({
    network: Network.Testnet,
    server: new StellarRpc.Server(TESTNET_RPC),
    factoryAddress: PLACEHOLDER_FACTORY,
  });
  return cached;
}
