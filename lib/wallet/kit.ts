"use client";

import {
  StellarWalletsKit,
  Networks,
  type ISupportedWallet,
} from "@creit.tech/stellar-wallets-kit";
import {
  FreighterModule,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit/modules/freighter";
import {
  xBullModule,
  XBULL_ID,
} from "@creit.tech/stellar-wallets-kit/modules/xbull";
import {
  AlbedoModule,
  ALBEDO_ID,
} from "@creit.tech/stellar-wallets-kit/modules/albedo";
import {
  LobstrModule,
  LOBSTR_ID,
} from "@creit.tech/stellar-wallets-kit/modules/lobstr";

/**
 * Initialise StellarWalletsKit once per page lifetime with the four
 * adapters we support. The kit is a singleton static class internally,
 * so we just guard against double-init in dev/HMR.
 */
let inited = false;
export function initWalletKit() {
  if (inited || typeof window === "undefined") return;
  inited = true;
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: [
      new FreighterModule(),
      new xBullModule(),
      new AlbedoModule(),
      new LobstrModule(),
    ],
  });
}

export const WALLET_IDS = {
  freighter: FREIGHTER_ID,
  xbull: XBULL_ID,
  albedo: ALBEDO_ID,
  lobstr: LOBSTR_ID,
} as const;

export type WalletId = keyof typeof WALLET_IDS;

export const WALLET_DISPLAY: Record<WalletId, { name: string; tagline: string }> = {
  freighter: {
    name: "Freighter",
    tagline: "Browser extension by SDF. The default.",
  },
  xbull: {
    name: "xBull",
    tagline: "Browser extension + mobile. Multi-account.",
  },
  albedo: {
    name: "Albedo",
    tagline: "Web-based. No install needed.",
  },
  lobstr: {
    name: "Lobstr Signer",
    tagline: "Mobile wallet. Read-only sessions.",
  },
};

/** Returns the list of wallets the kit reports as available (installed). */
export async function listSupportedWallets(): Promise<ISupportedWallet[]> {
  if (typeof window === "undefined") return [];
  initWalletKit();
  return StellarWalletsKit.refreshSupportedWallets();
}

/** Set the active wallet on the kit, then trigger getAddress to connect. */
export async function connectWallet(id: WalletId): Promise<string> {
  initWalletKit();
  StellarWalletsKit.setWallet(WALLET_IDS[id]);
  const { address } = await StellarWalletsKit.fetchAddress();
  return address;
}

/** Sign a base64-encoded XDR via the active wallet. */
export async function signXdr(
  xdr: string,
  opts: { networkPassphrase: string },
): Promise<string> {
  initWalletKit();
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, opts);
  return signedTxXdr;
}

/** Best-effort disconnect; kit clears its in-memory state. */
export async function disconnectWallet(): Promise<void> {
  initWalletKit();
  await StellarWalletsKit.disconnect();
}
