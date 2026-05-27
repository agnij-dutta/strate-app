"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { listSupportedWallets, WALLET_DISPLAY, type WalletId } from "@/lib/wallet/kit";
import { useWallet } from "@/lib/wallet/store";

type Props = {
  open: boolean;
  onClose: () => void;
};

const ORDER: WalletId[] = ["freighter", "xbull", "albedo", "lobstr"];

type WalletEntry = {
  id: WalletId;
  installed: boolean;
  installUrl?: string;
};

export default function WalletPicker({ open, onClose }: Props) {
  const wallet = useWallet();
  const [entries, setEntries] = useState<WalletEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<WalletId | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    listSupportedWallets()
      .then((supported) => {
        if (cancelled) return;
        const byId = new Map(supported.map((s) => [s.id as WalletId, s]));
        const list: WalletEntry[] = ORDER.map((id) => {
          const s = byId.get(id);
          return {
            id,
            installed: Boolean(s?.isAvailable),
            installUrl: s?.url,
          };
        });
        setEntries(list);
      })
      .catch(() => {
        if (!cancelled) setEntries(ORDER.map((id) => ({ id, installed: false })));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onPick = async (id: WalletId, installed: boolean, installUrl?: string) => {
    if (!installed && installUrl) {
      window.open(installUrl, "_blank", "noopener,noreferrer");
      return;
    }
    setPicking(id);
    await wallet.connect(id);
    setPicking(null);
    // Auto-close on successful connect; leave open on error so the user
    // can see the error message and retry.
    if (useWallet.getState().status === "connected") onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-ink-deep/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-[70] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-parchment/12 bg-ink shadow-panel"
            style={{ borderRadius: 2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-picker-title"
          >
            <div className="border-b border-parchment/10 px-6 py-5">
              <div className="flex items-baseline justify-between">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.36em] text-foil/80">
                  Connect wallet
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/45 transition-colors hover:text-foil"
                >
                  Close ×
                </button>
              </div>
              <h2
                id="wallet-picker-title"
                className="mt-3 font-display text-[26px] text-parchment"
                style={{ lineHeight: 1.08, letterSpacing: "-0.018em" }}
              >
                Pick your{" "}
                <span className="italic text-foil-gradient" style={{ fontWeight: 400 }}>
                  signer.
                </span>
              </h2>
            </div>

            <div className="px-6 py-4">
              {loading ? (
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-parchment/45">
                  Detecting wallets…
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {entries.map(({ id, installed, installUrl }) => {
                    const display = WALLET_DISPLAY[id];
                    const isCurrent = wallet.walletId === id && wallet.status === "connected";
                    const isPicking = picking === id;
                    return (
                      <li key={id}>
                        <button
                          type="button"
                          onClick={() => onPick(id, installed, installUrl)}
                          disabled={isPicking || isCurrent}
                          className={`group flex w-full items-center justify-between gap-4 border px-4 py-3.5 text-left transition-colors duration-200 disabled:opacity-60 ${
                            isCurrent
                              ? "border-foil/55 bg-foil/[0.06]"
                              : installed
                                ? "border-parchment/12 hover:border-foil/45 hover:bg-parchment/[0.025]"
                                : "border-parchment/8 hover:border-parchment/20"
                          }`}
                          style={{ borderRadius: 2 }}
                        >
                          <div>
                            <p
                              className={`text-[15px] font-medium ${
                                installed ? "text-parchment" : "text-parchment/55"
                              }`}
                            >
                              {display.name}
                            </p>
                            <p
                              className="mt-0.5 text-[12.5px] leading-[1.45] text-parchment/55"
                              style={{ fontFamily: "var(--font-fraunces), serif" }}
                            >
                              {display.tagline}
                            </p>
                          </div>
                          <div className="flex items-center gap-3 font-mono text-[9.5px] uppercase tracking-[0.32em]">
                            {isCurrent ? (
                              <span className="text-foil">Connected</span>
                            ) : isPicking ? (
                              <span className="text-foil">Connecting…</span>
                            ) : installed ? (
                              <span className="text-parchment/55 transition-colors group-hover:text-foil">
                                Use →
                              </span>
                            ) : installUrl ? (
                              <span className="text-parchment/45 transition-colors group-hover:text-foil">
                                Install →
                              </span>
                            ) : (
                              <span className="text-parchment/35">Unavailable</span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {wallet.error && (
                <p
                  role="alert"
                  className="mt-4 border border-ask/35 bg-ask/[0.06] p-3 text-[12px] leading-[1.5] text-parchment/85"
                  style={{ fontFamily: "var(--font-fraunces), serif" }}
                >
                  {wallet.error}
                </p>
              )}
            </div>

            <p className="border-t border-parchment/8 px-6 py-3 font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/35">
              We never custody · all signatures stay client-side
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
