"use client";

import { useState } from "react";
import type { MarketSummary } from "@/lib/mocks";
import { useTx } from "@/lib/tx/store";
import { toUnits } from "@/lib/tx/build";
import { useWallet } from "@/lib/wallet/store";
import { fmtApy, fmtPrice } from "@/lib/format";
import { useSwapQuote } from "@/lib/hooks/use-swap-quote";
import { useTokenBalance } from "@/lib/hooks/use-token-balance";
import AmountInput from "./AmountInput";
import PrimaryButton from "./PrimaryButton";

const TOKEN_DECIMALS = 7;

type Direction = "buy-pt" | "sell-pt" | "buy-yt" | "sell-yt";

// YT directions route through a second-leg helper that isn't shipped on the
// testnet AMM yet. We render them disabled with an explanation so users
// can see the full surface without hitting a dead end.
const DIRECTIONS: { id: Direction; label: string; pair: string; live: boolean }[] = [
  { id: "buy-pt", label: "Buy PT", pair: "U → PT", live: true },
  { id: "sell-pt", label: "Sell PT", pair: "PT → U", live: true },
  { id: "buy-yt", label: "Buy YT", pair: "U → YT", live: false },
  { id: "sell-yt", label: "Sell YT", pair: "YT → U", live: false },
];

export default function SwapForm({ market }: { market: MarketSummary }) {
  const [direction, setDirection] = useState<Direction>("buy-pt");
  const [amount, setAmount] = useState("");
  const wallet = useWallet();
  const tx = useTx();

  const value = Number(amount) || 0;
  const isConnected = wallet.status === "connected";
  const isValid = value > 0;
  const isPtRoute = direction === "buy-pt" || direction === "sell-pt";

  // Static price used only as a fallback for non-live (mock) markets
  // and for the YT direction tabs. The live PT swap path uses the
  // on-chain quote below.
  const staticPrice =
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

  // Live balance for the "Pay" side, read off-chain via simulateTransaction.
  // For "buy-pt" / "buy-yt" the user spends the underlying; for "sell-pt" /
  // "sell-yt" the user spends PT or YT respectively.
  const inTokenAddress = market.isLive && market.contracts
    ? direction === "buy-pt" || direction === "buy-yt"
      ? market.contracts.underlying
      : direction === "sell-pt"
        ? market.contracts.pt
        : market.contracts.yt
    : undefined;
  const inBalance = useTokenBalance(inTokenAddress, wallet.address ?? undefined);
  const inBalanceDisplay = inBalance.data !== undefined
    ? (Number(inBalance.data) / 10 ** TOKEN_DECIMALS).toFixed(4)
    : "—";

  // On-chain quote, only for live markets on a PT route. Simulates
  // the actual AMM call against the user's wallet so the displayed
  // output matches what the chain would deliver. Falls back to the
  // static `staticPrice` math for non-live markets.
  const amountInUnits = toUnits(amount, TOKEN_DECIMALS);
  const liveQuote = useSwapQuote({
    amm: market.isLive ? market.contracts?.amm : undefined,
    direction: direction === "buy-pt" ? "buy-pt" : "sell-pt",
    amountIn: amountInUnits,
    enabled: market.isLive && isPtRoute && isConnected && isValid,
  });

  const staticOut =
    direction === "buy-pt"
      ? value / staticPrice
      : direction === "sell-pt"
        ? value * staticPrice
        : direction === "buy-yt"
          ? value / staticPrice
          : value * staticPrice;

  const liveOut = liveQuote.data
    ? Number(liveQuote.data) / 10 ** TOKEN_DECIMALS
    : undefined;

  const out =
    market.isLive && isPtRoute
      ? (liveOut ?? 0) // live: show the chain's number, or 0 while loading
      : staticOut;
  const quoteState: "live" | "loading" | "error" | "static" =
    !market.isLive || !isPtRoute
      ? "static"
      : liveQuote.isLoading
        ? "loading"
        : liveQuote.isError
          ? "error"
          : "live";

  const slippageBps = 50; // 0.5%
  const minOut = out * (1 - slippageBps / 10_000);
  const effectivePrice =
    value > 0 && out > 0
      ? direction === "buy-pt"
        ? value / out // underlying paid per PT received
        : out / value // underlying received per PT paid
      : staticPrice;

  const onSubmit = () => {
    // The AMM only routes PT ↔ underlying. YT directions fall back to the
    // simulated path until a YT swap builder lands in the SDK.
    const params =
      market.isLive && market.contracts && isPtRoute
        ? ({
            kind: "swap" as const,
            amm: market.contracts.amm,
            tokenIn: direction === "buy-pt" ? ("UNDERLYING" as const) : ("PT" as const),
            amountIn: toUnits(amount, TOKEN_DECIMALS),
            minAmountOut: BigInt(Math.floor(minOut * 10 ** TOKEN_DECIMALS)),
          })
        : undefined;

    tx.open({
      action: "swap",
      title: `${DIRECTIONS.find((d) => d.id === direction)?.label} on ${market.underlying.symbol}`,
      rows: [
        { label: "You pay", value: `${value.toFixed(4)} ${inSymbol}` },
        { label: "You receive", value: `${out.toFixed(4)} ${outSymbol}`, emphasis: true },
        { label: "Min received (0.5%)", value: `${minOut.toFixed(4)} ${outSymbol}` },
        { label: "Effective price", value: fmtPrice(effectivePrice) },
        { label: "Implied APY", value: fmtApy(market.impliedApy) },
      ],
      warning:
        quoteState === "live" && Math.abs(effectivePrice / staticPrice - 1) > 0.1
          ? "Pool depth is shallow. The effective price differs from the implied price by more than 10%."
          : !isPtRoute && market.isLive
            ? "YT directions are not yet routed on-chain; this preview will record as a simulated transaction."
            : undefined,
      copy: "Swap routes through the time-decaying AMM curve. Slippage tightens as maturity approaches.",
      params,
    });
  };

  const reviewDisabled =
    !isValid ||
    !isConnected ||
    (market.isLive && isPtRoute && quoteState !== "live");

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label="Swap direction" className="grid grid-cols-4 gap-1.5">
        {DIRECTIONS.map((d) => {
          const disabled = market.isLive && !d.live;
          return (
            <button
              key={d.id}
              role="tab"
              aria-selected={direction === d.id}
              disabled={disabled}
              title={
                disabled
                  ? "YT routes ship with the next AMM pass. PT and underlying only for now."
                  : undefined
              }
              onClick={() => !disabled && setDirection(d.id)}
              className={`h-9 border font-mono text-[10px] uppercase tracking-[0.24em] transition-colors duration-200 ${
                disabled
                  ? "cursor-not-allowed border-parchment/8 bg-parchment/[0.01] text-parchment/25"
                  : direction === d.id
                    ? "border-foil/70 bg-foil/[0.08] text-foil"
                    : "border-parchment/12 bg-parchment/[0.02] text-parchment/55 hover:border-parchment/30 hover:text-parchment"
              }`}
              style={{ borderRadius: 2 }}
            >
              {d.label}
              {disabled && (
                <span className="ml-1.5 text-[8px] tracking-[0.2em] text-parchment/30">
                  SOON
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AmountInput
        label={`Pay`}
        value={amount}
        onChange={setAmount}
        suffix={inSymbol}
        helper={`Balance: ${inBalanceDisplay} ${inSymbol}`}
      />

      <div className="border border-parchment/10 bg-parchment/[0.02] p-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
          Receive
        </p>
        <p className="num mt-2 font-display text-[24px] text-parchment">
          {quoteState === "loading"
            ? "…"
            : quoteState === "error"
              ? "—"
              : out.toFixed(4)}{" "}
          <span className="text-[14px] text-parchment/60">{outSymbol}</span>
        </p>
        <p className="mt-3 font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/40">
          {quoteState === "loading"
            ? "Quoting against the live AMM…"
            : quoteState === "error"
              ? "AMM rejected the quote — likely InsufficientLiquidity or OracleStale. Try again or use a smaller amount."
              : quoteState === "live"
                ? `Min received ${minOut.toFixed(4)} ${outSymbol} · 0.50% slippage · live AMM quote`
                : `Min received ${minOut.toFixed(4)} ${outSymbol} · 0.50% slippage`}
        </p>
        {quoteState === "live" && Math.abs(effectivePrice / staticPrice - 1) > 0.1 && (
          <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.28em] text-ask">
            Price impact &gt;10%. Pool depth is shallow.
          </p>
        )}
      </div>

      <PrimaryButton
        onClick={onSubmit}
        disabled={reviewDisabled}
        label={
          !isConnected
            ? "Connect wallet to swap"
            : quoteState === "loading"
              ? "Quoting…"
              : quoteState === "error"
                ? "Quote unavailable"
                : "Review swap"
        }
      />
    </div>
  );
}
