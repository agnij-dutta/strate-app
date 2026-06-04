"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWallet } from "@/lib/wallet/store";
import { WALLET_DISPLAY } from "@/lib/wallet/kit-meta";
import WalletPicker from "./WalletPicker";

function shorten(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function ConnectButton() {
  const { status, address, walletId, disconnect, rehydrate } = useWallet();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void rehydrate();
  }, [rehydrate]);

  if (status === "connected" && address) {
    const walletName = walletId ? WALLET_DISPLAY[walletId].name : "Wallet";
    return (
      <>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="group flex h-10 items-center gap-3 border border-parchment/15 bg-parchment/[0.04] px-4 font-mono text-[11px] uppercase tracking-[0.24em] text-parchment/85 transition-colors duration-200 hover:border-foil/60 hover:text-parchment"
            style={{ borderRadius: 2 }}
          >
            <span aria-hidden="true" className="block h-1.5 w-1.5 bg-foil" />
            <span>{shorten(address)}</span>
            <svg
              width="9"
              height="9"
              viewBox="0 0 10 10"
              fill="none"
              className={`transition-transform duration-200 ${
                menuOpen ? "rotate-180" : ""
              }`}
              aria-hidden="true"
            >
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.3" />
            </svg>
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-12 z-50 w-64 border border-parchment/12 bg-ink-deep/95 backdrop-blur-md shadow-panel"
                style={{ borderRadius: 2 }}
              >
                <div className="border-b border-parchment/10 px-4 py-3">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/45">
                    Connected via {walletName}
                  </p>
                  <p className="mt-1 break-all font-mono text-[11px] text-parchment/90">
                    {address}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setPickerOpen(true);
                  }}
                  className="block w-full px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.28em] text-parchment/65 transition-colors hover:bg-parchment/[0.04] hover:text-foil"
                >
                  Switch wallet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void disconnect();
                    setMenuOpen(false);
                  }}
                  className="block w-full border-t border-parchment/8 px-4 py-3 text-left font-mono text-[11px] uppercase tracking-[0.28em] text-parchment/65 transition-colors hover:bg-parchment/[0.04] hover:text-foil"
                >
                  Disconnect
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <WalletPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        disabled={status === "connecting"}
        onClick={() => setPickerOpen(true)}
        className="group inline-flex h-10 items-center gap-2.5 border border-foil/40 bg-foil/[0.08] px-5 font-mono text-[11px] uppercase tracking-[0.24em] text-foil transition-all duration-300 hover:border-foil hover:bg-foil hover:text-ink disabled:opacity-60"
        style={{ borderRadius: 2 }}
      >
        <span>{status === "connecting" ? "Connecting" : "Connect wallet"}</span>
        {status === "connecting" ? (
          <svg
            width="11"
            height="11"
            viewBox="0 0 14 14"
            className="animate-spin"
            aria-hidden="true"
          >
            <circle
              cx="7"
              cy="7"
              r="5"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M12 7a5 5 0 0 0-5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden="true"
          >
            <path
              d="M3 9L9 3M9 3H4M9 3V8"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="square"
            />
          </svg>
        )}
      </button>
      <WalletPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}
