"use client";

import { useState } from "react";
import type { MarketSummary } from "@/lib/mocks";
import { useTx } from "@/lib/tx/store";
import { useWallet } from "@/lib/wallet/store";
import { fmtApy, fmtPrice } from "@/lib/format";
import AmountInput from "./AmountInput";
import PrimaryButton from "./PrimaryButton";

type Direction = "buy-pt" | "sell-pt" | "buy-yt" | "sell-yt";

const DIRECTIONS: { id: Direction; label: string; pair: string }[] = [
  { id: "buy-pt", label: "Buy PT", pair: "U → PT" },
  { id: "sell-pt", label: "Sell PT", pair: "PT → U" },
  { id: "buy-yt", label: "Buy YT", pair: "U → YT" },
  { id: "sell-yt", label: "Sell YT", pair: "YT → U" },
];

export default function SwapForm({ market }: { market: MarketSummary }) {
  const [direction, setDirection] = useState<Direction>("buy-pt");
  const [amount, setAmount] = useState("");
  const wallet = useWallet();
  const tx = useTx();

  const value = Number(amount) || 0;
  const isConnected = wallet.status === "connected";
  const isValid = value > 0;

  // Simplified pricing for the preview surface. Live, this runs through the
  // AMM's swap simulator and returns a quote with slippage bounds attached.
  const price =
    direction === "buy-pt" || direction === "sell-pt"
      ? market.ptPrice
      : market.ytPrice;
  const inSymbol =
    direction === "buy-pt" || direction === "buy-yt"
      ? market.underlying.symbol
      : direction === "sell-pt"
        ? `pt-${market.underlying.symbol}`
        : `yt-${market.underlying.symbol}`;
  const outSymbol =
    direction === "buy-pt"
      ? `pt-${market.underlying.symbol}`
      : direction === "sell-pt"
        ? market.underlying.symbol
        : direction === "buy-yt"
          ? `yt-${market.underlying.symbol}`
          : market.underlying.symbol;
  const out =
    direction === "buy-pt"
      ? value / price
      : direction === "sell-pt"
        ? value * price
        : direction === "buy-yt"
          ? value / price
          : value * price;

  const slippageBps = 50; // 0.5%
  const minOut = out * (1 - slippageBps / 10_000);

  const onSubmit = () => {
    tx.open({
      action: "swap",
      title: `${DIRECTIONS.find((d) => d.id === direction)?.label} on ${market.underlying.symbol}`,
      rows: [
        { label: "You pay", value: `${value.toFixed(4)} ${inSymbol}` },
        { label: "You receive", value: `${out.toFixed(4)} ${outSymbol}`, emphasis: true },
        { label: "Min received (0.5%)", value: `${minOut.toFixed(4)} ${outSymbol}` },
        { label: "Effective price", value: fmtPrice(price) },
        { label: "Implied APY", value: fmtApy(market.impliedApy) },
      ],
      warning:
        out / value < 0.5 || out / value > 2
          ? "Large move against pool depth. Confirm trade size against AMM liquidity."
          : undefined,
      copy: "Swap routes through the time-decaying AMM curve. Slippage tightens as maturity approaches.",
    });
  };

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Swap direction" className="grid grid-cols-4 gap-1.5">
        {DIRECTIONS.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={direction === d.id}
            onClick={() => setDirection(d.id)}
            className={`h-9 border font-mono text-[10px] uppercase tracking-[0.24em] transition-colors duration-200 ${
              direction === d.id
                ? "border-foil/70 bg-foil/[0.08] text-foil"
                : "border-parchment/12 bg-parchment/[0.02] text-parchment/55 hover:border-parchment/30 hover:text-parchment"
            }`}
            style={{ borderRadius: 2 }}
          >
            {d.label}
          </button>
        ))}
      </div>

      <AmountInput
        label={`Pay`}
        value={amount}
        onChange={setAmount}
        suffix={inSymbol}
        helper="Balance: 0.0000"
      />

      <div className="border border-parchment/10 bg-parchment/[0.02] p-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
          Receive
        </p>
        <p className="num mt-2 font-display text-[24px] text-parchment">
          {out.toFixed(4)}{" "}
          <span className="text-[14px] text-parchment/60">{outSymbol}</span>
        </p>
        <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/40">
          Min received {minOut.toFixed(4)} {outSymbol} · 0.50% slippage
        </p>
      </div>

      <PrimaryButton
        onClick={onSubmit}
        disabled={!isValid || !isConnected}
        label={isConnected ? "Review swap" : "Connect wallet to swap"}
      />
    </div>
  );
}
