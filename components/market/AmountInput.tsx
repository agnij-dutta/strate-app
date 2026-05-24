"use client";

import { useId } from "react";

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  helper?: string;
  /** Future: max button uses this to fill the input. */
  max?: number;
};

export default function AmountInput({
  label,
  value,
  onChange,
  suffix,
  helper,
  max,
}: Props) {
  const id = useId();

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label
          htmlFor={id}
          className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/55"
        >
          {label}
        </label>
        {typeof max === "number" && (
          <button
            type="button"
            onClick={() => onChange(String(max))}
            className="font-mono text-[9.5px] uppercase tracking-[0.28em] text-foil hover:text-foil-deep"
          >
            Max
          </button>
        )}
      </div>
      <div className="relative mt-2">
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0.0000"
          value={value}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9.]/g, "");
            if (v.split(".").length > 2) return;
            onChange(v);
          }}
          className="num h-14 w-full border border-parchment/15 bg-parchment/[0.02] px-4 pr-24 font-mono text-[20px] text-parchment outline-none transition-colors duration-200 focus:border-foil/70"
          style={{ borderRadius: 2, letterSpacing: "-0.005em" }}
        />
        {suffix && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center font-mono text-[11px] uppercase tracking-[0.24em] text-parchment/55"
          >
            {suffix}
          </span>
        )}
      </div>
      {helper && (
        <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.28em] text-parchment/40">
          {helper}
        </p>
      )}
    </div>
  );
}
