/**
 * Deployed contract addresses, per network. Keep this file in sync with
 * the live deploys; the dApp reads from here at module-load time.
 *
 * Testnet markets deployed 2026-05-31 via stellar-cli with the
 * deployer identity `strate-deploy`. The push topology from PR #2 is in
 * effect on every contract listed here.
 */

export type Network = "testnet" | "mainnet";

export interface MarketAddresses {
  /** Stable slug used as the route param and SDK lookup key. */
  id: string;
  /** Display label, e.g. "XLM-2026-08". */
  label: string;
  underlying: { symbol: string; issuer: string; address: string };
  oracle: string;
  pt: string;
  yt: string;
  yieldStripping: string;
  amm: string;
  /** Unix seconds. */
  maturity: number;
  /** Display status; affects ordering and the live/soon badge. */
  status: "live" | "paused" | "expiring";
}

export interface NetworkAddresses {
  rpcUrl: string;
  passphrase: string;
  explorer: string;
  /** Factory deploys are deferred to a follow-up PR (cross-build issue);
   *  for now the dApp lists markets statically from `markets` below. */
  factory: string | null;
  markets: MarketAddresses[];
}

export const TESTNET: NetworkAddresses = {
  rpcUrl: "https://soroban-testnet.stellar.org",
  passphrase: "Test SDF Network ; September 2015",
  explorer: "https://stellar.expert/explorer/testnet",
  // Factory deployed 2026-06-01 after the strate-types refactor unblocked
  // the wasm32 build. Markets can now be created via factory.deploy_market.
  factory: "CDVQN2JWB34LRXM2C44N34CYPZKTLOQ77FPGXKBOHUWMLIURFEXNMQRU",
  markets: [
    {
      // Redeployed 2026-06-01 against a real (deployable) mock Blend pool
      // at CDH5TUDZ...JOES. The first deploy used a placeholder G-address
      // for blend_pool which made every sync_rate fail. Since Oracle, YS,
      // and AMM all immutably bind to their peers at construction, fixing
      // it required a full fresh market deploy.
      id: "xlm-2026-08",
      label: "XLM-2026-08",
      underlying: {
        symbol: "XLM",
        issuer: "Stellar (native SAC)",
        address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      },
      oracle: "CBNKJPM7PO4S747EH56UMNC47MR6HTLNHHOK6CGFTXNVTVW6NB67IMYB",
      pt: "CAPA4XMPYH7FOXBASMKQPF7KHQORHEN3333ZN36AT2WKGMVYV5PKD2UG",
      yt: "CDQ5PIMKUCOICJR225SY52SDNCQLOBQZVHAFYMWH3GURYQLETAZ2VYKQ",
      yieldStripping: "CBGFES4EV36QBPLRYNMZZDAJDGC7QNXBHW3XZNN35GNWFG3T6YVI6SS7",
      amm: "CAJXHXMAH44MXCMA2ILPS7TK55FNWRD7F5ILNKPZJM6EZDSRCRVLAO2L",
      maturity: 1788081701,
      status: "live",
    },
    {
      // Deployed via Factory.deploy_market on 2026-06-01 — the first
      // market created by the factory rather than hand-wired.
      id: "xlm-2026-11",
      label: "XLM-2026-11",
      underlying: {
        symbol: "XLM",
        issuer: "Stellar (native SAC)",
        address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      },
      oracle: "CCNKCM76YA6KO3WL23HR2MM2KFQLZIMFBAMHDVS6XA2RLHPZDRMGSAAB",
      pt: "CAEMICU4MLAAQXZMVYABLNJDWQRIEVK7KZQ33VBQENLBLDTX6KLD6AT4",
      yt: "CC5HUC635C6JOI6IRLES45JOB2LPSRKBC345F4X2WKZ6G3PDCHVR73SG",
      yieldStripping: "CDGGSFEQK6Q2M573NOZ6BSRML4AT34BPUUSXCV6IEII6SO3GQO4OAOOG",
      amm: "CA4EUITWVZQOT7QHE76F4PDYTDRL2YSZPPYD5MNSD7CNMGPHU476OZ7N",
      maturity: 1795871716,
      status: "live",
    },
  ],
};

/**
 * Mainnet addresses. Filled in by the deploy script after `stellar
 * contract deploy` resolves each contract address. Until those are
 * pasted in, `MAINNET.factory` is null and the dApp falls back to
 * testnet wherever it depends on factory presence.
 *
 * Blend V2 Fixed pool (XLM + USDC):
 *   CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD
 *
 * One blend-adapter is deployed per (pool, asset) pair — adapters
 * translate Blend V2's `get_reserve(asset)` into the V1-shaped
 * `get_reserve_data()` the Oracle expects.
 */
export const MAINNET: NetworkAddresses = {
  rpcUrl: "https://mainnet.sorobanrpc.com",
  passphrase: "Public Global Stellar Network ; September 2015",
  explorer: "https://stellar.expert/explorer/public",
  // Deployed 2026-06-06 from strate-deploy
  // (GDJR3AP4ZAL4R634EZNN3FZJJL2KAU7WP52GAWLS5RUHK6YBOGKQ3HC4). Total
  // mainnet spend on the launch: 111.47 XLM (uploads dominated; the
  // five sub-contract deploys per market via Factory.deploy_market
  // were cheap once the WASMs were registered).
  //
  // Each market routes Oracle reads through a blend-adapter shim
  // because Blend V2's get_reserve(asset) returns a different shape
  // than the V1 get_reserve_data() our audit-baseline Oracle expects.
  // Both adapters point at the Blend V2 Fixed pool
  // CAJJZSGMMM3PD7N33TAPHGBUGTB43OC73HVIK2L2G6BNGGGYOSSYBXBD.
  factory: "CCZRYDA637Z6CCH5MXMBZDHKDKYWIKDVADJ2FTQ6E2RWMWUBBZG4USAW",
  markets: [
    {
      id: "xlm-2026-12",
      label: "XLM-2026-12",
      underlying: {
        symbol: "XLM",
        issuer: "Stellar (native SAC)",
        address: "CAS3J7GYLGXMF6TDJBBYYSE3HQ6BBSMLNUQ34T6TZMYMW2EVH34XOWMA",
      },
      oracle: "CD46L6MBSQZR7OPLYGIIXTQMRM4U2KD3C33MD2DKKQMYRL4PO35LNSXT",
      pt: "CC3F7U7Y47V4SRPY4W5OPPLJZIDGTZYSPYGZEYI2ZM3BYWHVVACLMBYE",
      yt: "CBZLU3JGUVDX2FGZ5FG2WCLFTBLFAXRHUQT5ICJC3E6PLF7VLURPOTIA",
      yieldStripping:
        "CBEOPGLMDG3AGKMLTLBCGTXR2FAPC4XMR3BJFSID4LNP5K7LCTI7X4BZ",
      amm: "CDXQHDRA5PPKAP4VAON5AKBLIDQKK3YRL2EWPUF3WSUUGRAI52HWAD63",
      // 2026-12-06 00:00 IST = unix 1796495400. Six-month tenor from
      // the launch date.
      maturity: 1796495400,
      status: "live",
    },
    {
      id: "usdc-2026-09",
      label: "USDC-2026-09",
      underlying: {
        symbol: "USDC",
        issuer: "Circle (native SAC)",
        address: "CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75",
      },
      oracle: "CAOVRE2BZYD2EKNY2O7TK6ICO6RHNNPLL7LZB6JOPVKOIR3CRZS2JLTO",
      pt: "CBFUFU3MSTN5WCGCEOMWJQ26B6MCKQOTUAEG2JZYRMDRWKGGN5CTFYTN",
      yt: "CCESXU33YVQKNYASPNYQMAFC24AX65NZUTSZSGY6SL6UAFGR2L55KYYX",
      yieldStripping:
        "CA77CV5IM2MCKIK2CHJRAAB4O2KPFDLY4U65MNNC6OWL2QXA2VGBW7H3",
      amm: "CCMCCU7BDXOKO5P4ELQ7EMNZYSUXEAQB576AV4XC3UMI3SDNI3M4HA7T",
      // 2026-09-06 00:00 IST = unix 1788633000. Three-month tenor.
      maturity: 1788633000,
      status: "live",
    },
  ],
};

/**
 * Active network. Reads NEXT_PUBLIC_STRATE_NETWORK at build time so a
 * single dApp build can target either network. Defaults to testnet so
 * forgetting to set the env var on Vercel doesn't accidentally send
 * users to mainnet.
 */
const networkEnv = process.env.NEXT_PUBLIC_STRATE_NETWORK?.toLowerCase();
export const ACTIVE: NetworkAddresses =
  networkEnv === "mainnet" ? MAINNET : TESTNET;

export const IS_MAINNET = ACTIVE === MAINNET;
