"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TxAction } from "./store";

export interface TxRecord {
  hash: string;
  action: TxAction;
  title: string;
  marketId?: string;
  network: "testnet" | "mainnet";
  walletAddress: string | null;
  /** Snapshot of the drawer rows so we can render the historical summary. */
  rows: { label: string; value: string }[];
  status: "success" | "error";
  errorMessage?: string;
  ts: number;
}

interface HistoryStore {
  records: TxRecord[];
  /** Push a new record. Caps the list at 50 entries (drop oldest). */
  record: (r: Omit<TxRecord, "ts">) => void;
  clear: () => void;
  /** Records for a specific wallet only, newest first. */
  forWallet: (addr: string | null) => TxRecord[];
}

const MAX_RECORDS = 50;

export const useHistory = create<HistoryStore>()(
  persist(
    (set, get) => ({
      records: [],
      record: (r) => {
        const next: TxRecord = { ...r, ts: Date.now() };
        set((s) => {
          const merged = [next, ...s.records];
          if (merged.length > MAX_RECORDS) merged.length = MAX_RECORDS;
          return { records: merged };
        });
      },
      clear: () => set({ records: [] }),
      forWallet: (addr) =>
        get()
          .records.filter((r) => (addr ? r.walletAddress === addr : true))
          .slice()
          .sort((a, b) => b.ts - a.ts),
    }),
    {
      name: "strate.tx.history",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);
