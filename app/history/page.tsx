"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useHistory, type TxRecord } from "@/lib/tx/history";
import { useWallet } from "@/lib/wallet/store";
import { shortAddr } from "@/lib/format";

const ACTION_LABEL: Record<TxRecord["action"], string> = {
  mint: "Mint",
  redeem: "Redeem",
  swap: "Swap",
  claim: "Claim",
};

function ageOf(ts: number): string {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function HistoryPage() {
  const wallet = useWallet();
  const all = useHistory((s) => s.records);
  const clear = useHistory((s) => s.clear);

  // Avoid hydration mismatch — render an empty list during SSR, then the
  // persisted store hydrates on first paint.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const records = hydrated
    ? all
        .filter((r) =>
          wallet.address ? r.walletAddress === wallet.address : true,
        )
        .slice()
        .sort((a, b) => b.ts - a.ts)
    : [];

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-10 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.36em] text-foil/80">
        <span>§ 01</span>
        <span className="block h-px flex-1 bg-foil/15" />
        <span className="text-parchment/40">Your transactions</span>
      </div>

      <header className="mt-6 grid grid-cols-12 gap-x-10 gap-y-6">
        <h1
          className="col-span-12 font-display font-medium text-parchment lg:col-span-8"
          style={{
            fontSize: "clamp(40px, 5.6vw, 72px)",
            lineHeight: 0.98,
            letterSpacing: "-0.022em",
          }}
        >
          History.
        </h1>
        <p
          className="col-span-12 max-w-[44ch] text-[16px] leading-[1.6] text-parchment/65 lg:col-span-4"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Local record of every transaction you have signed from this device.
          The on-chain ledger is authoritative; this list is for your records
          only.
        </p>
      </header>

      <div className="mt-10 grid grid-cols-2 gap-6 border-y border-parchment/10 py-6 lg:grid-cols-4">
        <Stat label="Records" value={`${records.length}`} />
        <Stat
          label="Confirmed"
          value={`${records.filter((r) => r.status === "success").length}`}
        />
        <Stat
          label="Failed"
          value={`${records.filter((r) => r.status === "error").length}`}
        />
        <Stat label="Wallet" value={wallet.address ? shortAddr(wallet.address) : "—"} />
      </div>

      {!hydrated ? null : records.length === 0 ? (
        <EmptyState connected={wallet.status === "connected"} />
      ) : (
        <ul className="mt-10 space-y-2">
          {records.map((r, idx) => (
            <li key={`${r.hash || "err"}-${r.ts}-${idx}`}>
              <article className="border border-parchment/10 bg-ink-deep/40 p-5 transition-colors hover:border-parchment/25">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <span
                      aria-hidden="true"
                      className={`block h-1.5 w-1.5 ${
                        r.status === "success" ? "bg-bid" : "bg-ask"
                      }`}
                    />
                    <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-parchment/55">
                      {ACTION_LABEL[r.action]} · {r.network}
                    </p>
                  </div>
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/40">
                    {ageOf(r.ts)}
                  </p>
                </div>

                <h3 className="mt-3 font-display text-[20px] text-parchment">
                  {r.title}
                </h3>

                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {r.rows.slice(0, 4).map((row, i) => (
                    <div
                      key={i}
                      className="flex items-baseline justify-between gap-3 text-[12px]"
                    >
                      <dt className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/45">
                        {row.label}
                      </dt>
                      <dd className="num font-mono text-parchment/85">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-parchment/8 pt-3">
                  <p className="num break-all font-mono text-[10px] text-parchment/45">
                    {r.hash || r.errorMessage || "(no hash)"}
                  </p>
                  {r.hash && (
                    <a
                      href={`https://stellar.expert/explorer/${r.network}/tx/${r.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[10px] uppercase tracking-[0.28em] text-foil hover:text-foil-deep"
                    >
                      Stellar Expert →
                    </a>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {hydrated && records.length > 0 && (
        <div className="mt-8 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              if (confirm("Clear local transaction history? On-chain records are not affected.")) {
                clear();
              }
            }}
            className="font-mono text-[10px] uppercase tracking-[0.28em] text-parchment/40 transition-colors hover:text-ask"
          >
            Clear local history
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
        {label}
      </p>
      <p className="num mt-1.5 font-display text-[26px] text-parchment">
        {value}
      </p>
    </div>
  );
}

function EmptyState({ connected }: { connected: boolean }) {
  return (
    <div className="mt-12 border border-parchment/10 bg-parchment/[0.02] px-8 py-12 text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-foil/80">
        {connected ? "No transactions yet" : "Wallet not connected"}
      </p>
      <p
        className="mx-auto mt-4 max-w-[44ch] text-[16px] leading-[1.55] text-parchment/65"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        {connected
          ? "Sign a mint, redeem, or swap from any market to start a record here."
          : "Connect your wallet from the header to see history scoped to your address."}
      </p>
      <Link
        href="/markets"
        className="mt-6 inline-flex h-11 items-center gap-3 bg-foil px-6 font-mono text-[11px] uppercase tracking-[0.28em] text-ink transition-colors hover:bg-foil-deep"
        style={{ borderRadius: 2 }}
      >
        Browse markets →
      </Link>
    </div>
  );
}
