"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useTx } from "@/lib/tx/store";
import { executeTx } from "@/lib/tx/build";
import { useHistory } from "@/lib/tx/history";
import { useToast } from "@/lib/toast/store";
import { useWallet } from "@/lib/wallet/store";

/**
 * Right-side slide-in drawer that confirms the pending transaction. The
 * sign + broadcast path is stubbed against the wallet adapter; once live
 * markets are deployed, this becomes the single place that calls
 * adapter.signTransaction(xdr).
 */
export default function TxDrawer() {
  const { status, close, setSigning, setBroadcasting, setSuccess, setError } =
    useTx();
  const wallet = useWallet();
  const open = status.kind !== "idle";

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status.kind !== "signing" && status.kind !== "broadcasting") {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, status.kind, close]);

  // Stable toast id for the duration of this tx so successive state
  // transitions upsert the same notification instead of stacking.
  const toastIdRef = useRef<string | null>(null);
  const toastUpsert = useToast((s) => s.upsert);
  const toastPush = useToast((s) => s.push);
  const recordTx = useHistory((s) => s.record);

  const onSign = async () => {
    if (status.kind !== "open" && status.kind !== "error") return;
    const title = status.preview.title;
    setSigning();
    const tid = toastIdRef.current ?? toastPush({
      kind: "pending",
      title,
      body: "Awaiting wallet signature.",
    });
    toastIdRef.current = tid;

    try {
      let hash: string;
      const hasParams = !!status.preview.params;

      if (hasParams && wallet.address) {
        // Real Soroban pipeline: build → sign via wallet kit → RPC submit
        // → poll getTransaction. The drawer's `signing` and `broadcasting`
        // states aren't visited individually here because executeTx is
        // a single awaitable; we leave the toast on "pending" through both
        // and flip the drawer state in one step.
        toastUpsert(tid, {
          kind: "pending",
          title,
          body: "Awaiting wallet signature.",
        });
        setBroadcasting();
        // Slight delay so the user sees the signing state before the
        // wallet popup steals focus.
        await Promise.resolve();
        hash = await executeTx(status.preview.params!, wallet.address);
        toastUpsert(tid, {
          kind: "pending",
          title,
          body: "Broadcasting to Soroban testnet.",
        });
      } else {
        // Simulated path — used for non-live markets and YT swap directions
        // (no SDK builder yet). Identical UX to the real path but no
        // signature or RPC traffic.
        await new Promise((r) => setTimeout(r, 900));
        setBroadcasting();
        toastUpsert(tid, {
          kind: "pending",
          title,
          body: "Broadcasting (simulated · no contracts wired for this market)",
        });
        await new Promise((r) => setTimeout(r, 1200));
        hash =
          "stub" +
          Math.random().toString(36).slice(2).padEnd(60, "0").slice(0, 60);
      }

      setSuccess(hash);
      toastUpsert(tid, {
        kind: "success",
        title,
        body: hasParams
          ? "Transaction confirmed on testnet."
          : "Simulated transaction recorded.",
        action: hasParams
          ? {
              label: "View on Stellar Expert",
              href: `https://stellar.expert/explorer/testnet/tx/${hash}`,
            }
          : undefined,
        ttl: 8000,
      });
      recordTx({
        hash,
        action: status.preview.action,
        title,
        network: "testnet",
        walletAddress: wallet.address,
        rows: status.preview.rows.map((r) => ({ label: r.label, value: r.value })),
        status: "success",
      });
      toastIdRef.current = null;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      toastUpsert(tid, {
        kind: "error",
        title,
        body: message,
        ttl: 7000,
      });
      recordTx({
        hash: "",
        action: status.preview.action,
        title,
        network: "testnet",
        walletAddress: wallet.address,
        rows: status.preview.rows.map((r) => ({ label: r.label, value: r.value })),
        status: "error",
        errorMessage: message,
      });
      toastIdRef.current = null;
    }
  };

  const isBusy = status.kind === "signing" || status.kind === "broadcasting";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[60] bg-ink-deep/70 backdrop-blur-sm"
            onClick={isBusy ? undefined : close}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 right-0 top-0 z-[70] w-full max-w-[460px] border-l border-parchment/12 bg-ink shadow-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tx-drawer-title"
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-parchment/10 px-7 py-6">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.36em] text-foil/80">
                    Review · {status.kind === "open" ? "Pending" : status.kind}
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    disabled={isBusy}
                    aria-label="Close"
                    className="font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/45 transition-colors hover:text-foil disabled:opacity-30"
                  >
                    Close ×
                  </button>
                </div>
                <h2
                  id="tx-drawer-title"
                  className="mt-4 font-display text-[28px] text-parchment"
                  style={{ lineHeight: 1.1, letterSpacing: "-0.018em" }}
                >
                  {status.preview.title}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto px-7 py-6">
                {/* States: open + error → show preview; signing → spinner; broadcasting → progress; success → hash. */}
                {(status.kind === "open" || status.kind === "error" || status.kind === "signing" || status.kind === "broadcasting") && (
                  <dl className="space-y-3.5">
                    {status.preview.rows.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between gap-4 border-b border-parchment/8 pb-3.5"
                      >
                        <dt className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/55">
                          {r.label}
                        </dt>
                        <dd
                          className={`num text-right font-mono ${
                            r.emphasis
                              ? "text-[15px] text-foil"
                              : "text-[13px] text-parchment/90"
                          }`}
                        >
                          {r.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}

                {status.preview.warning && (
                  <p
                    className="mt-5 border border-foil/30 bg-foil/[0.06] p-3.5 text-[12px] leading-[1.6] text-parchment/85"
                    style={{ fontFamily: "var(--font-fraunces), serif" }}
                  >
                    {status.preview.warning}
                  </p>
                )}

                {status.preview.copy && (
                  <p
                    className="mt-5 text-[12.5px] leading-[1.65] text-parchment/65"
                    style={{ fontFamily: "var(--font-fraunces), serif" }}
                  >
                    {status.preview.copy}
                  </p>
                )}

                {status.kind === "signing" && (
                  <BusyBanner copy="Waiting for wallet signature…" />
                )}
                {status.kind === "broadcasting" && (
                  <BusyBanner copy="Broadcasting to Soroban…" />
                )}
                {status.kind === "success" && (
                  <SuccessBanner hash={status.hash} />
                )}
                {status.kind === "error" && (
                  <p
                    className="mt-5 border border-ask/40 bg-ask/[0.08] p-3.5 text-[12px] leading-[1.55] text-parchment/85"
                    style={{ fontFamily: "var(--font-fraunces), serif" }}
                  >
                    {status.message}
                  </p>
                )}
              </div>

              <div className="border-t border-parchment/10 px-7 py-5">
                {status.kind === "success" ? (
                  <button
                    type="button"
                    onClick={close}
                    className="h-12 w-full bg-foil font-mono text-[11px] uppercase tracking-[0.28em] text-ink transition-colors hover:bg-foil-deep"
                    style={{ borderRadius: 2 }}
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onSign}
                    disabled={isBusy || wallet.status !== "connected"}
                    className="group inline-flex h-12 w-full items-center justify-center gap-3 bg-foil font-mono text-[11px] uppercase tracking-[0.28em] text-ink transition-all hover:bg-foil-deep disabled:cursor-not-allowed disabled:bg-parchment/15 disabled:text-parchment/40"
                    style={{ borderRadius: 2 }}
                  >
                    {isBusy && (
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 14 14"
                        className="animate-spin"
                        aria-hidden="true"
                      >
                        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" fill="none" />
                        <path d="M12 7a5 5 0 0 0-5-5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    )}
                    {status.kind === "signing"
                      ? "Signing"
                      : status.kind === "broadcasting"
                        ? "Broadcasting"
                        : wallet.status !== "connected"
                          ? "Connect wallet"
                          : "Sign & broadcast"}
                  </button>
                )}
                <p className="mt-3 text-center font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/35">
                  Testnet · contracts pending deploy · no value at risk
                </p>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function BusyBanner({ copy }: { copy: string }) {
  return (
    <div className="mt-6 flex items-center gap-3 border border-foil/25 bg-foil/[0.04] p-4">
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        className="animate-spin text-foil"
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
      <p
        className="text-[13px] text-parchment/85"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        {copy}
      </p>
    </div>
  );
}

function SuccessBanner({ hash }: { hash: string }) {
  return (
    <div className="mt-6 border border-bid/35 bg-bid/[0.05] p-4">
      <div className="flex items-baseline gap-3">
        <span aria-hidden="true" className="block h-1.5 w-1.5 bg-bid" />
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-bid">
          Confirmed on testnet
        </p>
      </div>
      <p
        className="mt-2 text-[14px] leading-[1.55] text-parchment/85"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        Your transaction was accepted by the Soroban network.
      </p>
      <p className="mt-3 break-all font-mono text-[11px] text-parchment/55">
        {hash}
      </p>
      <a
        href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex font-mono text-[10px] uppercase tracking-[0.28em] text-foil hover:text-foil-deep"
      >
        View on Stellar Expert →
      </a>
    </div>
  );
}
