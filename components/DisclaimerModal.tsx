"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const STORAGE_KEY = "strate.disclaimer.v1.ack";

/**
 * One-time legal disclosure modal. Shown the first time a user opens
 * the dApp on a given browser; their acknowledgement is persisted in
 * localStorage and the modal never reappears unless the storage is
 * cleared (or we bump the version key for material changes).
 *
 * The body is plain, declarative, and short. We do not say "Strate is
 * safe." We say: unaudited, capped, you can lose money, here are the
 * specifics.
 */
export default function DisclaimerModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ack = window.localStorage.getItem(STORAGE_KEY);
    if (!ack) setOpen(true);
  }, []);

  const onAcknowledge = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[80] bg-ink-deep/85 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 4 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed left-1/2 top-1/2 z-[90] w-[min(540px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 border border-parchment/14 bg-ink shadow-panel"
            style={{ borderRadius: 2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="disclaimer-title"
          >
            <div className="border-b border-parchment/10 px-7 py-5">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.36em] text-foil/85">
                Risk disclosure
              </p>
              <h2
                id="disclaimer-title"
                className="mt-3 font-display text-[28px] text-parchment"
                style={{ lineHeight: 1.08, letterSpacing: "-0.018em" }}
              >
                Strate is an{" "}
                <span className="italic text-foil-gradient" style={{ fontWeight: 400 }}>
                  unaudited beta.
                </span>
              </h2>
            </div>

            <div className="px-7 py-6">
              <p
                className="text-[14.5px] leading-[1.65] text-parchment/80"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                You can lose every token you deposit. The contracts have
                not been formally audited. We are launching mainnet on a
                Stellar Foundation deadline and the OtterSec report is
                pending. By using the dApp you accept:
              </p>

              <ul
                className="mt-4 space-y-2.5 text-[13.5px] leading-[1.55] text-parchment/70"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 block h-px w-3 shrink-0 bg-foil/60" />
                  <span>
                    <span className="text-parchment">Hard TVL cap</span> of
                    50,000 underlying units per market, enforced on-chain. Mints
                    revert past the cap.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 block h-px w-3 shrink-0 bg-foil/60" />
                  <span>
                    Single-key admin can pause every market. Multisig
                    rotation lands in v0.3.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 block h-px w-3 shrink-0 bg-foil/60" />
                  <span>
                    No yield, principal, or peg is guaranteed. Smart-contract
                    risk is concentrated and uninsured.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="mt-2 block h-px w-3 shrink-0 bg-foil/60" />
                  <span>
                    Audit report will be published as soon as it lands; the
                    diff against v0.1.0-h01-fix is on GitHub today.
                  </span>
                </li>
              </ul>

              <p
                className="mt-5 text-[12.5px] leading-[1.5] text-parchment/55"
                style={{ fontFamily: "var(--font-fraunces), serif" }}
              >
                If you are not comfortable with any of the above, close
                this tab. There is no waitlist gating mainnet — but
                deposit only what you can afford to lose.
              </p>
            </div>

            <div className="flex items-center justify-between border-t border-parchment/10 px-7 py-4">
              <a
                href="https://github.com/agnij-dutta/strate-protocol"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/55 underline decoration-foil/40 underline-offset-4 transition-colors hover:text-foil"
              >
                Read the contracts →
              </a>
              <button
                type="button"
                onClick={onAcknowledge}
                className="inline-flex h-10 items-center gap-2 border border-foil/55 bg-foil/[0.08] px-5 font-mono text-[10.5px] uppercase tracking-[0.28em] text-foil transition-colors hover:border-foil hover:bg-foil hover:text-ink"
                style={{ borderRadius: 2 }}
              >
                I understand the risk
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
