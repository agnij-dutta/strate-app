#!/usr/bin/env node
/**
 * Build a mint transaction via the vendored SDK and run it through
 * Soroban's `simulateTransaction` against the live mainnet RPC. No
 * broadcast, no signing, no XLM cost. The chain runs the contract
 * exactly as it would for a real tx and reports the result.
 *
 * If the SDK is calling a method name that doesn't exist on the
 * deployed contract, this script fails with the same MissingValue
 * error the user would have seen at "Sign & Broadcast" time, but
 * before any user has touched it.
 *
 * Run via:
 *   node scripts/verify-mainnet-mint.mjs
 */

import { rpc as StellarRpc, Networks, Account } from "@stellar/stellar-sdk";
import { buildMintTx } from "../vendor/strate-sdk/dist/index.js";

const RPC_URL = "https://mainnet.sorobanrpc.com";
const NETWORK = "TESTNET"; // The SDK's Network enum uses string values; "TESTNET" is the import-time tag, the passphrase decides the actual chain.
// XLM market YS (deployed via Factory.deploy_market 2026-06-06)
const MARKET = "CBEOPGLMDG3AGKMLTLBCGTXR2FAPC4XMR3BJFSID4LNP5K7LCTI7X4BZ";
// Any funded mainnet account works as the simulation source. We use
// the deploy account because it definitely exists.
const SOURCE = "GDJR3AP4ZAL4R634EZNN3FZJJL2KAU7WP52GAWLS5RUHK6YBOGKQ3HC4";

async function main() {
  const server = new StellarRpc.Server(RPC_URL);

  // Fetch the on-chain sequence so the simulator builds a valid tx.
  const account = await server.getAccount(SOURCE);

  // Build via the exact SDK path the dApp uses for a 1-XLM mint.
  const tx = await buildMintTx({
    server,
    network: "PUBLIC", // network passphrase tag; the actual passphrase comes from SDK config
    source: account,
    market: MARKET,
    user: SOURCE,
    underlyingAmount: 10_000_000n, // 1 XLM
  });

  // Simulate. This runs the wasm against ledger state without
  // broadcasting. If the method name is wrong, Soroban returns
  // a host error like the one the user hit in the screenshot.
  const sim = await server.simulateTransaction(tx);

  if ("error" in sim && sim.error) {
    console.error("✗ Simulation FAILED:");
    console.error(sim.error);
    process.exit(1);
  }
  if (StellarRpc.Api.isSimulationError(sim)) {
    console.error("✗ Simulation error:", sim.error);
    process.exit(1);
  }

  console.log("✓ Mint simulation succeeded");
  console.log(`  ledger:       ${sim.latestLedger}`);
  console.log(`  resource fee: ${sim.minResourceFee}`);
  if (sim.result?.retval) {
    console.log(`  retval:       (encoded ScVal, mint result triple)`);
  }
}

main().catch((e) => {
  console.error("✗ Simulation script crashed:", e.message || e);
  process.exit(1);
});
