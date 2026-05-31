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
      id: "xlm-2026-08",
      label: "XLM-2026-08",
      underlying: {
        symbol: "XLM",
        issuer: "Stellar (native SAC)",
        address: "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC",
      },
      oracle: "CAS4UNLV2MVRRMZGYSRX76Q3L64KVYZP54FPOXCD4JTKT6RW5SWR5BTX",
      pt: "CBW5G34G2BVVGHUOUM3EATQ24HZTJDOL2L2ZQL4SXKFNL6K4OJC2OALQ",
      yt: "CDY6GHX6QTXVBW2HZOP6PNU734P5XNC5NXW26H3ADXYPLR7KLABRRHNU",
      yieldStripping: "CAMLQV6XY5LPMILUIMHIYOONDS2PZ4YQQ54UITGS7BFCBR5V6QZGACMZ",
      amm: "CCKXOP4CIGAH7IEUS3FJYVYBNJTARM4G75T2K2KWAXBP2UTBH35647QU",
      maturity: 1787984043,
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
