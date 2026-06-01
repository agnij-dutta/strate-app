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
  factory: null,
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
  ],
};

export const MAINNET: NetworkAddresses = {
  rpcUrl: "https://soroban.stellar.org",
  passphrase: "Public Global Stellar Network ; September 2015",
  explorer: "https://stellar.expert/explorer/public",
  factory: null,
  markets: [],
};

export const ACTIVE: NetworkAddresses = TESTNET;
