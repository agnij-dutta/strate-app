#!/usr/bin/env node
/**
 * Comprehensive mainnet simulation suite. Builds every user-facing
 * transaction via the vendored SDK and runs it through Soroban's
 * `simulateTransaction` against live mainnet. No broadcast, no
 * signing, no XLM cost.
 *
 * If anything in the SDK / dApp tx pipeline drifts from the
 * contract surface, this fails loudly within seconds.
 *
 * Run via:  node scripts/verify-mainnet-flows.mjs
 * Or:       npm run verify:mainnet-flows
 */

import { rpc as StellarRpc, Address, Contract, TransactionBuilder, nativeToScVal, BASE_FEE } from "@stellar/stellar-sdk";
import {
  buildMintTx,
  buildRedeemTx,
  buildClaimYieldTx,
  buildSwapTx,
  buildAddLiquidityTx,
} from "../vendor/strate-sdk/dist/index.js";

const RPC = "https://mainnet.sorobanrpc.com";
const PASS = "Public Global Stellar Network ; September 2015";
const NETWORK = "PUBLIC";
const SOURCE = "GDJR3AP4ZAL4R634EZNN3FZJJL2KAU7WP52GAWLS5RUHK6YBOGKQ3HC4";

const MARKETS = [
  {
    label: "XLM-2026-12",
    ys: "CBEOPGLMDG3AGKMLTLBCGTXR2FAPC4XMR3BJFSID4LNP5K7LCTI7X4BZ",
    amm: "CDXQHDRA5PPKAP4VAON5AKBLIDQKK3YRL2EWPUF3WSUUGRAI52HWAD63",
    oracle: "CD46L6MBSQZR7OPLYGIIXTQMRM4U2KD3C33MD2DKKQMYRL4PO35LNSXT",
    pt: "CC3F7U7Y47V4SRPY4W5OPPLJZIDGTZYSPYGZEYI2ZM3BYWHVVACLMBYE",
    yt: "CBZLU3JGUVDX2FGZ5FG2WCLFTBLFAXRHUQT5ICJC3E6PLF7VLURPOTIA",
  },
  {
    label: "USDC-2026-09",
    ys: "CA77CV5IM2MCKIK2CHJRAAB4O2KPFDLY4U65MNNC6OWL2QXA2VGBW7H3",
    amm: "CCMCCU7BDXOKO5P4ELQ7EMNZYSUXEAQB576AV4XC3UMI3SDNI3M4HA7T",
    oracle: "CAOVRE2BZYD2EKNY2O7TK6ICO6RHNNPLL7LZB6JOPVKOIR3CRZS2JLTO",
    pt: "CBFUFU3MSTN5WCGCEOMWJQ26B6MCKQOTUAEG2JZYRMDRWKGGN5CTFYTN",
    yt: "CCESXU33YVQKNYASPNYQMAFC24AX65NZUTSZSGY6SL6UAFGR2L55KYYX",
  },
];

const server = new StellarRpc.Server(RPC);

let passed = 0;
let failed = 0;
const failures = [];

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Surface just the most useful slice of the error.
    const head = msg.split("\n").slice(0, 2).join(" | ").slice(0, 220);
    console.log(`  ✗ ${name}: ${head}`);
    failures.push({ name, msg });
    failed++;
  }
}

function buildOracleSyncTx(account, oracleAddress) {
  const contract = new Contract(oracleAddress);
  return new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: PASS,
  })
    .addOperation(contract.call("sync_rate"))
    .setTimeout(60)
    .build();
}

function buildSwapManualTx(account, amm, method, trader, amountIn, minOut) {
  const contract = new Contract(amm);
  return new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: PASS,
  })
    .addOperation(
      contract.call(
        method,
        new Address(trader).toScVal(),
        nativeToScVal(amountIn, { type: "i128" }),
        nativeToScVal(minOut, { type: "i128" }),
      ),
    )
    .setTimeout(60)
    .build();
}

function buildBalanceReadTx(account, tokenAddress, holder) {
  const contract = new Contract(tokenAddress);
  return new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: PASS,
  })
    .addOperation(contract.call("balance", new Address(holder).toScVal()))
    .setTimeout(30)
    .build();
}

async function simulate(tx, label) {
  const sim = await server.simulateTransaction(tx);
  if (StellarRpc.Api.isSimulationError(sim)) {
    throw new Error(`${label}: ${sim.error}`);
  }
  return sim;
}

async function run() {
  console.log(`\n=== Mainnet flow audit ===`);
  console.log(`Source: ${SOURCE}`);
  console.log(`Markets: ${MARKETS.length}\n`);

  const account = await server.getAccount(SOURCE);

  for (const m of MARKETS) {
    console.log(`\n[${m.label}]`);

    // 1. Read PT balance (proves balance() lookup works for SAC-style tokens)
    await check("read PT balance", async () => {
      const tx = buildBalanceReadTx(account, m.pt, SOURCE);
      await simulate(tx, "PT.balance");
    });

    // 2. Read YT balance
    await check("read YT balance", async () => {
      const tx = buildBalanceReadTx(account, m.yt, SOURCE);
      await simulate(tx, "YT.balance");
    });

    // 3. Oracle sync (proves the Blend adapter chain still works)
    await check("Oracle.sync_rate", async () => {
      const tx = buildOracleSyncTx(account, m.oracle);
      await simulate(tx, "Oracle.sync_rate");
    });

    // 4. YS.mint (1 underlying)
    await check("YS.mint(1 unit)", async () => {
      const tx = await buildMintTx({
        server,
        network: NETWORK,
        source: account,
        market: m.ys,
        user: SOURCE,
        underlyingAmount: 10_000_000n,
      });
      await simulate(tx, "YS.mint");
    });

    // 5. YS.redeem_pair (pre-maturity)
    await check("YS.redeem_pair(0.1 PT+YT)", async () => {
      const tx = await buildRedeemTx({
        server,
        network: NETWORK,
        source: account,
        market: m.ys,
        user: SOURCE,
        ptAmount: 1_000_000n,
        atMaturity: false,
      });
      await simulate(tx, "YS.redeem_pair");
    });

    // 6. YS.claim_yield
    await check("YS.claim_yield", async () => {
      const tx = await buildClaimYieldTx({
        server,
        network: NETWORK,
        source: account,
        market: m.ys,
        user: SOURCE,
      });
      await simulate(tx, "YS.claim_yield");
    });

    // 7. AMM.swap_sy_for_exact_pt (Buy PT)
    await check("AMM buy-PT (0.1 underlying in)", async () => {
      const tx = buildSwapManualTx(
        account,
        m.amm,
        "swap_sy_for_exact_pt",
        SOURCE,
        1_000_000n,
        1n,
      );
      await simulate(tx, "AMM.swap_sy_for_exact_pt");
    });

    // 8. AMM.swap_exact_pt_for_sy (Sell PT)
    await check("AMM sell-PT (0.1 PT in)", async () => {
      const tx = buildSwapManualTx(
        account,
        m.amm,
        "swap_exact_pt_for_sy",
        SOURCE,
        1_000_000n,
        1n,
      );
      await simulate(tx, "AMM.swap_exact_pt_for_sy");
    });

    // 9. AMM.add_liquidity
    await check("AMM.add_liquidity (small)", async () => {
      const tx = await buildAddLiquidityTx({
        server,
        network: NETWORK,
        source: account,
        amm: m.amm,
        user: SOURCE,
        ptIn: 100_000n,
        underlyingIn: 100_000n,
        minLpOut: 1n,
      });
      await simulate(tx, "AMM.add_liquidity");
    });

    // 10. AMM.reserves
    await check("AMM.reserves view", async () => {
      const contract = new Contract(m.amm);
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: PASS,
      })
        .addOperation(contract.call("reserves"))
        .setTimeout(30)
        .build();
      await simulate(tx, "AMM.reserves");
    });

    // 11. Oracle.get_rate (read view)
    await check("Oracle.get_rate view", async () => {
      const contract = new Contract(m.oracle);
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: PASS,
      })
        .addOperation(contract.call("get_rate"))
        .setTimeout(30)
        .build();
      await simulate(tx, "Oracle.get_rate");
    });

    // 12. YS.config view
    await check("YS.config view", async () => {
      const contract = new Contract(m.ys);
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: PASS,
      })
        .addOperation(contract.call("config"))
        .setTimeout(30)
        .build();
      await simulate(tx, "YS.config");
    });

    // 13. YS.pending_yield view
    await check("YS.pending_yield view", async () => {
      const contract = new Contract(m.ys);
      const tx = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: PASS,
      })
        .addOperation(contract.call("pending_yield", new Address(SOURCE).toScVal()))
        .setTimeout(30)
        .build();
      await simulate(tx, "YS.pending_yield");
    });
  }

  console.log(`\n=== Summary ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  if (failed > 0) {
    console.log(`\nFailures:`);
    for (const f of failures) {
      console.log(`  • ${f.name}`);
      console.log(`    ${f.msg.split("\n")[0].slice(0, 300)}`);
    }
    process.exit(1);
  }
}

run().catch((e) => {
  console.error("Suite crashed:", e.message || e);
  process.exit(1);
});
