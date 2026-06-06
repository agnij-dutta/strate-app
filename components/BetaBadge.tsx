"use client";

import Link from "next/link";

/**
 * "Unaudited beta" badge. Shown on every market detail page and the
 * markets index. Links to the disclosure section in the docs.
 *
 * Restrained styling: tight foil border on a parchment surface, mono
 * caps copy. Reads as a regulatory disclosure tag, not a marketing
 * banner.
 */
export default function BetaBadge() {
  return (
    <Link
      href="#disclosure"
      className="group inline-flex items-center gap-2 border border-foil/40 bg-foil/[0.06] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.32em] text-foil/90 transition-colors hover:border-foil/70 hover:text-foil"
      style={{ borderRadius: 2 }}
      title="Unaudited beta. Hard TVL cap per market. Read the disclosure."
    >
      <span aria-hidden="true" className="block h-1.5 w-1.5 bg-foil" />
      <span>Unaudited beta · TVL-capped</span>
    </Link>
  );
}
