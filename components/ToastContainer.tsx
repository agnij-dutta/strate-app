"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useToast, type Toast } from "@/lib/toast/store";

const KIND_STYLES: Record<Toast["kind"], { dot: string; ring: string }> = {
  info: { dot: "bg-parchment/55", ring: "border-parchment/15" },
  pending: { dot: "bg-foil animate-pulse", ring: "border-foil/35" },
  success: { dot: "bg-bid", ring: "border-bid/35" },
  error: { dot: "bg-ask", ring: "border-ask/40" },
};

const KIND_KICKER: Record<Toast["kind"], string> = {
  info: "Notice",
  pending: "In flight",
  success: "Confirmed",
  error: "Rejected",
};

export default function ToastContainer() {
  const toasts = useToast((s) => s.toasts);
  const dismiss = useToast((s) => s.dismiss);

  // Per-toast auto-dismiss timers. Pending toasts have no ttl so they
  // stay on screen until upsert flips them to success/error.
  useEffect(() => {
    const timers = toasts
      .filter((t) => typeof t.ttl === "number")
      .map((t) =>
        window.setTimeout(() => dismiss(t.id), t.ttl as number),
      );
    return () => {
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [toasts, dismiss]);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] flex flex-col-reverse gap-3 sm:left-auto sm:bottom-6 sm:right-6 sm:w-full sm:max-w-sm"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const style = KIND_STYLES[t.kind];
          return (
            <motion.div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              layout
              initial={{ opacity: 0, x: 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, transition: { duration: 0.18 } }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`pointer-events-auto border ${style.ring} bg-ink-deep/95 backdrop-blur-md shadow-panel`}
              style={{ borderRadius: 2 }}
            >
              <div className="flex items-start gap-3 px-4 py-3.5">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 block h-1.5 w-1.5 shrink-0 ${style.dot}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/55">
                    {KIND_KICKER[t.kind]}
                  </p>
                  <p className="mt-0.5 text-[13px] font-medium text-parchment">
                    {t.title}
                  </p>
                  {t.body && (
                    <p
                      className="mt-1 text-[12px] leading-[1.45] text-parchment/65"
                      style={{ fontFamily: "var(--font-fraunces), serif" }}
                    >
                      {t.body}
                    </p>
                  )}
                  {t.action && (
                    <a
                      href={t.action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex font-mono text-[10px] uppercase tracking-[0.28em] text-foil hover:text-foil-deep"
                    >
                      {t.action.label} →
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/40 transition-colors hover:text-foil"
                >
                  ×
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
