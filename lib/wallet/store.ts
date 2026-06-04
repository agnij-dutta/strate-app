"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WalletId } from "./kit-meta";

// All kit operations are dynamic-imported so the wallet adapter bundle
// (~200 KB across four modules) lands in its own chunk and never
// touches the initial page load.
async function kit() {
  return import("./kit");
}

type Status = "disconnected" | "connecting" | "connected" | "error";

interface WalletState {
  status: Status;
  address: string | null;
  walletId: WalletId | null;
  error: string | null;

  connect: (id: WalletId) => Promise<void>;
  disconnect: () => Promise<void>;
  /** Hydrate from prior persisted choice. Best-effort — if the wallet
   *  refuses (locked, not installed, etc), we drop back to disconnected. */
  rehydrate: () => Promise<void>;
}

export type { WalletId };

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      status: "disconnected",
      address: null,
      walletId: null,
      error: null,

      connect: async (id) => {
        set({ status: "connecting", error: null, walletId: id });
        try {
          const { connectWallet } = await kit();
          const address = await connectWallet(id);
          set({ status: "connected", address, walletId: id });
        } catch (err) {
          // Kit errors are shaped { code, message }. Plain Error works too.
          const message =
            typeof err === "object" && err && "message" in err
              ? String((err as { message: unknown }).message)
              : String(err);
          set({ status: "error", error: message });
        }
      },

      disconnect: async () => {
        try {
          const { disconnectWallet } = await kit();
          await disconnectWallet();
        } catch {
          // Disconnect failures are non-fatal; we clear local state regardless.
        }
        set({
          status: "disconnected",
          address: null,
          walletId: null,
          error: null,
        });
      },

      rehydrate: async () => {
        const { walletId } = get();
        if (!walletId) return;
        if (typeof window === "undefined") return;
        try {
          const { initWalletKit, connectWallet } = await kit();
          initWalletKit();
          const address = await connectWallet(walletId);
          set({ status: "connected", address });
        } catch {
          // Don't loudly fail rehydration — most often the user closed the
          // wallet or revoked the page. Reset and let them reconnect.
          set({ status: "disconnected", address: null, walletId: null });
        }
      },
    }),
    {
      name: "strate.wallet",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ walletId: s.walletId }),
    },
  ),
);
