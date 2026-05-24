"use client";

import { useState } from "react";
import type { MarketSummary } from "@/lib/mocks";
import { useTx } from "@/lib/tx/store";
import { useWallet } from "@/lib/wallet/store";
import { fmtMaturityDate } from "@/lib/format";
import AmountInput from "./AmountInput";
import PrimaryButton from "./PrimaryButton";

export default function RedeemForm({ market }: { market: MarketSummary }) {
  const [amount, setAmount] = useState("");
  const wallet = useWallet();
  const tx = useTx();

  const matured = market.maturity * 1000 <= Date.now();
  const value = Number(amount) || 0;
  // Pre-maturity: must burn matched PT + YT pair to redeem underlying 1:1.
  // At maturity: PT alone redeems 1:1.
  const isConnected = wallet.status === "connected";
  const isValid = value > 0;

  const underlyingOut = value;

  const onSubmit = () => {
    tx.open({
      action: "redeem",
      title: matured
        ? `Redeem PT for ${market.underlying.symbol}`
        : `Redeem PT + YT pair for ${market.underlying.symbol}`,
      rows: matured
        ? [
            { label: "You burn", value: `${value.toFixed(4)} pt-${market.underlying.symbol}` },
            {
              label: "You receive",
              value: `${underlyingOut.toFixed(4)} ${market.underlying.symbol}`,
              emphasis: true,
            },
          ]
        : [
            { label: "You burn", value: `${value.toFixed(4)} pt-${market.underlying.symbol}` },
            { label: "You burn", value: `${value.toFixed(4)} yt-${market.underlying.symbol}` },
            {
              label: "You receive",
              value: `${underlyingOut.toFixed(4)} ${market.underlying.symbol}`,
              emphasis: true,
            },
            { label: "Maturity date", value: fmtMaturityDate(market.maturity) },
          ],
      copy: matured
        ? "Post-maturity redemption uses the PT side only. YT is worthless after maturity by design."
        : "Pre-maturity redemption requires matched PT and YT amounts. To redeem only PT, sell your YT on the AMM first.",
    });
  };

  return (
    <div className="space-y-5">
      <AmountInput
        label={
          matured
            ? `Burn pt-${market.underlying.symbol}`
            : `Burn matched pt + yt`
        }
        value={amount}
        onChange={setAmount}
        suffix={`pt-${market.underlying.symbol}`}
        helper={`Balance: 0.0000  ·  ${matured ? "PT-only redemption" : "PT + YT pair required"}`}
      />

      <div className="border border-parchment/10 bg-parchment/[0.02] p-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
          You receive
        </p>
        <p className="num mt-2 font-display text-[24px] text-parchment">
          {underlyingOut.toFixed(4)}{" "}
          <span className="text-[14px] text-parchment/60">
            {market.underlying.symbol}
          </span>
        </p>
      </div>

      {!matured && (
        <p
          className="border border-foil/25 bg-foil/[0.04] p-3 text-[12px] leading-[1.55] text-parchment/75"
          style={{ fontFamily: "var(--font-fraunces), serif" }}
        >
          Pre-maturity redemption burns matching PT and YT amounts. To redeem
          only PT, sell YT on the AMM first.
        </p>
      )}

      <PrimaryButton
        onClick={onSubmit}
        disabled={!isValid || !isConnected}
        label={isConnected ? "Review redemption" : "Connect wallet to redeem"}
      />
    </div>
  );
}
