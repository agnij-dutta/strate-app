"use client";

import { create } from "zustand";

export type TxAction = "mint" | "redeem" | "swap" | "claim";

export interface TxPreview {
  /** What the user is doing in plain language. */
  action: TxAction;
  /** Title for the drawer header. */
  title: string;
  /** Key-value summary rendered as a definition list. */
  rows: { label: string; value: string; emphasis?: boolean }[];
  /** Optional warning rendered in a foil hairline frame. */
  warning?: string;
  /** Plain-language disclosure. */
  copy?: string;
}

type Status =
  | { kind: "idle" }
  | { kind: "open"; preview: TxPreview }
  | { kind: "signing"; preview: TxPreview }
  | { kind: "broadcasting"; preview: TxPreview; hash?: string }
  | { kind: "success"; preview: TxPreview; hash: string }
  | { kind: "error"; preview: TxPreview; message: string };

interface TxStore {
  status: Status;
  open: (preview: TxPreview) => void;
  close: () => void;
  setSigning: () => void;
  setBroadcasting: (hash?: string) => void;
  setSuccess: (hash: string) => void;
  setError: (message: string) => void;
}

export const useTx = create<TxStore>((set, get) => ({
  status: { kind: "idle" },
  open: (preview) => set({ status: { kind: "open", preview } }),
  close: () => set({ status: { kind: "idle" } }),
  setSigning: () => {
    const s = get().status;
    if (s.kind === "open" || s.kind === "error")
      set({ status: { kind: "signing", preview: s.preview } });
  },
  setBroadcasting: (hash) => {
    const s = get().status;
    if (s.kind === "signing")
      set({ status: { kind: "broadcasting", preview: s.preview, hash } });
  },
  setSuccess: (hash) => {
    const s = get().status;
    if (s.kind !== "idle")
      set({ status: { kind: "success", preview: s.preview, hash } });
  },
  setError: (message) => {
    const s = get().status;
    if (s.kind !== "idle")
      set({ status: { kind: "error", preview: s.preview, message } });
  },
}));
