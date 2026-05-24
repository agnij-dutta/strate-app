"use client";

type Props = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

export default function PrimaryButton({ label, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group inline-flex h-12 w-full items-center justify-center gap-3 bg-foil px-7 font-mono text-[11px] uppercase tracking-[0.28em] text-ink transition-all duration-300 hover:bg-foil-deep disabled:cursor-not-allowed disabled:bg-parchment/15 disabled:text-parchment/40"
      style={{ borderRadius: 2 }}
    >
      <span>{label}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 14 14"
        fill="none"
        aria-hidden="true"
        className="transition-transform duration-300 group-hover:translate-x-1 group-disabled:translate-x-0"
      >
        <path
          d="M2 7h10M8 3l4 4-4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}
