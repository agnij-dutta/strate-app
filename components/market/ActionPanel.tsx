"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MarketSummary } from "@/lib/mocks";
import MintForm from "./MintForm";
import RedeemForm from "./RedeemForm";
import SwapForm from "./SwapForm";

type Tab = "mint" | "redeem" | "swap";

const TABS: { id: Tab; label: string }[] = [
  { id: "mint", label: "Mint" },
  { id: "redeem", label: "Redeem" },
  { id: "swap", label: "Swap" },
];

export default function ActionPanel({ market }: { market: MarketSummary }) {
  const [active, setActive] = useState<Tab>("mint");

  return (
    <div className="lg:sticky lg:top-24">
      <div className="flex items-baseline gap-4 font-mono text-[9.5px] uppercase tracking-[0.36em] text-foil/80">
        <span>§ 04</span>
        <span className="block h-px flex-1 bg-foil/15" />
        <span className="text-parchment/40">Order entry</span>
      </div>

      <div className="mt-5 border border-parchment/12 bg-ink-deep/55 shadow-panel">
        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Action"
          className="grid grid-cols-3 border-b border-parchment/10"
        >
          {TABS.map((t) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActive(t.id)}
                className={`relative h-12 font-mono text-[11px] uppercase tracking-[0.28em] transition-colors duration-200 ${
                  isActive ? "text-foil" : "text-parchment/55 hover:text-parchment"
                }`}
              >
                {t.label}
                {isActive && (
                  <motion.span
                    layoutId="action-tab-indicator"
                    className="absolute inset-x-0 -bottom-px h-px bg-foil"
                    transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="p-6"
          >
            {active === "mint" && <MintForm market={market} />}
            {active === "redeem" && <RedeemForm market={market} />}
            {active === "swap" && <SwapForm market={market} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
