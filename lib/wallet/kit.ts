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
import type { WalletId } from "./kit-meta";

/**
 * Initialise StellarWalletsKit once per page lifetime with the four
 * adapters we support. The kit is a singleton static class internally,
 * so we just guard against double-init in dev/HMR.
 *
 * This module is intentionally heavy (~200 KB of wallet adapter code).
 * Top-level consumers MUST import only the type-only re-export below or
 * pull display metadata from `./kit-meta`. Anything that needs runtime
 * behaviour must dynamic-import this file so the wallet bundle lands in
 * its own chunk.
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

export type { WalletId };

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
