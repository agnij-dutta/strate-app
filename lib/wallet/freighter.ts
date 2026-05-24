import {
  isConnected,
  getAddress,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import type { WalletAdapter } from "./types";

class FreighterError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "FreighterError";
  }
}

/**
 * Maps freighter-api v6 to our wallet adapter contract. The library returns
 * union shapes ({ value } | { error }) and we normalize to throws/returns
 * because that is what the call sites expect.
 */
export const freighterAdapter: WalletAdapter = {
  id: "freighter",
  displayName: "Freighter",

  async isAvailable() {
    try {
      const res = await isConnected();
      return Boolean(res?.isConnected);
    } catch {
      return false;
    }
  },

  async connect() {
    const res = await requestAccess();
    if (res.error) {
      throw new FreighterError(
        res.error.message ?? "Freighter rejected the connection request.",
        res.error.code,
      );
    }
    if (!res.address) {
      throw new FreighterError("Freighter returned no address.");
    }
    return res.address;
  },

  async disconnect() {
    // Freighter does not expose a programmatic disconnect; clearing the
    // store is the only thing that matters from the app's perspective.
    return;
  },

  async getAddress() {
    try {
      const res = await getAddress();
      if (res.error || !res.address) return null;
      return res.address;
    } catch {
      return null;
    }
  },

  async signTransaction(xdr, opts) {
    const res = await signTransaction(xdr, {
      networkPassphrase: opts.networkPassphrase,
    });
    if (res.error) {
      throw new FreighterError(
        res.error.message ?? "Freighter rejected the signature request.",
        res.error.code,
      );
    }
    return res.signedTxXdr;
  },
};
