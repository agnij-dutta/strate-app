import Link from "next/link";

export const metadata = {
  title: "404 · Strate",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-[1400px] flex-col items-start justify-center px-6 py-16 lg:px-10">
      <div className="flex items-baseline gap-4 font-mono text-[10px] uppercase tracking-[0.36em] text-foil/80">
        <span>§ 404</span>
        <span className="block h-px w-32 bg-foil/25" />
        <span className="text-parchment/40">Not on the ledger</span>
      </div>

      <h1
        className="mt-8 font-display font-medium text-parchment"
        style={{
          fontSize: "clamp(56px, 9vw, 144px)",
          lineHeight: 0.94,
          letterSpacing: "-0.028em",
        }}
      >
        Page not{" "}
        <span
          className="italic text-foil-gradient"
          style={{ fontWeight: 400 }}
        >
          recorded.
        </span>
      </h1>

      <p
        className="mt-6 max-w-[60ch] text-[17px] leading-[1.6] text-parchment/65"
        style={{ fontFamily: "var(--font-fraunces), serif" }}
      >
        The route you asked for is not in any registry. It may have moved, been
        renamed, or never existed in the first place. The markets page is
        usually a reasonable next step.
      </p>

      <div className="mt-12 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/markets"
          className="group inline-flex h-12 items-center justify-center gap-3 bg-foil px-7 font-mono text-[11px] uppercase tracking-[0.28em] text-ink transition-all duration-300 hover:bg-foil-deep"
          style={{ borderRadius: 2 }}
        >
          <span>Back to markets</span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            className="transition-transform duration-300 group-hover:translate-x-1"
          >
            <path
              d="M2 7h10M8 3l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
        </Link>
        <Link
          href="/portfolio"
          className="inline-flex h-12 items-center justify-center gap-3 border border-parchment/30 px-7 font-mono text-[11px] uppercase tracking-[0.28em] text-parchment/90 transition-all duration-300 hover:border-parchment/60"
          style={{ borderRadius: 2 }}
        >
          Your portfolio
        </Link>
      </div>

      <p className="mt-16 font-mono text-[9.5px] uppercase tracking-[0.32em] text-parchment/30">
        Serial · 404-MMXXVI · this page intentionally absent
      </p>
    </div>
  );
}
