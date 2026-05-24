"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { freighterAdapter } from "./freighter";
import type { WalletAdapter, WalletId } from "./types";

type Status = "disconnected" | "connecting" | "connected" | "error";

interface WalletState {
  status: Status;
  address: string | null;
  walletId: WalletId | null;
  error: string | null;

  connect: (id?: WalletId) => Promise<void>;
  disconnect: () => Promise<void>;
  /** Hydrate from extension state on app load. */
  rehydrate: () => Promise<void>;
}

const ADAPTERS: Record<WalletId, WalletAdapter> = {
  freighter: freighterAdapter,
  // xbull, albedo, lobstr drop in here.
  xbull: freighterAdapter,
  albedo: freighterAdapter,
  lobstr: freighterAdapter,
};

export const useWallet = create<WalletState>()(
  persist(
    (set, get) => ({
      status: "disconnected",
      address: null,
      walletId: null,
      error: null,

      connect: async (id = "freighter") => {
        const adapter = ADAPTERS[id];
        set({ status: "connecting", error: null, walletId: id });
        try {
          const address = await adapter.connect();
          set({ status: "connected", address, walletId: id });
        } catch (err) {
          set({
            status: "error",
            error: err instanceof Error ? err.message : String(err),
          });
        }
      },

      disconnect: async () => {
        const { walletId } = get();
        if (walletId) {
          try {
            await ADAPTERS[walletId].disconnect();
          } catch {
            // Disconnect failures are non-fatal; we still clear local state.
          }
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
        const adapter = ADAPTERS[walletId];
        const address = await adapter.getAddress();
        if (address) {
          set({ status: "connected", address });
        } else {
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
