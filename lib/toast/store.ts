"use client";

import { create } from "zustand";

export type ToastKind = "info" | "success" | "error" | "pending";

export interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
  /** Optional explorer / external link rendered as the right-hand action. */
  action?: { label: string; href: string };
  /** Milliseconds before auto-dismiss. Pending toasts default to no auto-dismiss. */
  ttl?: number;
  ts: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "ts">) => string;
  /** Replace an existing toast (by id) or push a new one. Returns the id. */
  upsert: (id: string, t: Omit<Toast, "id" | "ts">) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

function rand() {
  return Math.random().toString(36).slice(2, 9);
}

export const useToast = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => {
    const id = rand();
    const ts = Date.now();
    set((s) => ({ toasts: [...s.toasts, { ...t, id, ts }] }));
    return id;
  },
  upsert: (id, t) => {
    const ts = Date.now();
    set((s) => {
      const exists = s.toasts.some((x) => x.id === id);
      if (exists) {
        return {
          toasts: s.toasts.map((x) => (x.id === id ? { ...x, ...t, id, ts } : x)),
        };
      }
      return { toasts: [...s.toasts, { ...t, id, ts }] };
    });
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
