"use client";

import { useState } from "react";
import type { MarketSummary } from "@/lib/mocks";
import { useTx } from "@/lib/tx/store";
import { toUnits } from "@/lib/tx/build";
import { useWallet } from "@/lib/wallet/store";
import { fmtApy, fmtPrice } from "@/lib/format";
import AmountInput from "./AmountInput";
import PrimaryButton from "./PrimaryButton";

const UNDERLYING_DECIMALS = 7;

export default function MintForm({ market }: { market: MarketSummary }) {
  const [amount, setAmount] = useState("");
  const wallet = useWallet();
  const tx = useTx();

  const value = Number(amount) || 0;
  // Mint: deposit U → receive U/ptPrice PT + U/ptPrice YT. The PT/YT mint
  // ratio is 1:1 by design; price differentiation is purely on AMM, not at mint.
  const ptOut = value;
  const ytOut = value;

  const isConnected = wallet.status === "connected";
  const isValid = value > 0;

  const onSubmit = () => {
    // Real params iff the market is live AND we have a connected wallet.
    // Otherwise the drawer falls back to the simulated round-trip.
    const params =
      market.isLive && market.contracts
        ? ({
            kind: "mint" as const,
            market: market.contracts.yieldStripping,
            underlyingAmount: toUnits(amount, UNDERLYING_DECIMALS),
          })
        : undefined;

    tx.open({
      action: "mint",
      title: `Mint PT + YT against ${market.underlying.symbol}`,
      rows: [
        { label: "You deposit", value: `${value.toFixed(4)} ${market.underlying.symbol}` },
        { label: "PT received", value: `${ptOut.toFixed(4)} pt-${market.underlying.symbol}`, emphasis: true },
        { label: "YT received", value: `${ytOut.toFixed(4)} yt-${market.underlying.symbol}`, emphasis: true },
        { label: "Implied APY at PT mint", value: fmtApy(market.impliedApy) },
        { label: "Current PT price", value: fmtPrice(market.ptPrice) },
      ],
      copy:
        "Mint is reversible by redeeming the matched PT + YT pair before maturity. At maturity the PT alone redeems 1:1 with underlying.",
      params,
    });
  };

  return (
    <div className="space-y-5">
      <AmountInput
        label={`Deposit ${market.underlying.symbol}`}
        value={amount}
        onChange={setAmount}
        suffix={market.underlying.symbol}
        helper="Balance: 0.0000 (testnet faucet pending)"
      />

      <div className="border border-parchment/10 bg-parchment/[0.02] p-4">
        <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/45">
          You receive
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <ReceiveRow label="Principal (PT)" amount={ptOut} />
          <ReceiveRow label="Yield (YT)" amount={ytOut} />
        </div>
      </div>

      <PrimaryButton
        onClick={onSubmit}
        disabled={!isValid || !isConnected}
        label={isConnected ? "Review mint" : "Connect wallet to mint"}
      />

      <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/35">
        1 U → 1 PT + 1 YT · split fee 0.0% pre-mainnet
      </p>
    </div>
  );
}

function ReceiveRow({ label, amount }: { label: string; amount: number }) {
  return (
    <div>
      <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-foil/75">
        {label}
      </p>
      <p className="num mt-1 font-display text-[24px] text-parchment">
        {amount.toFixed(4)}
      </p>
    </div>
  );
}
