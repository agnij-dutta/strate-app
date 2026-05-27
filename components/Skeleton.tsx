"use client";

import { motion } from "framer-motion";

type Props = {
  className?: string;
  /** Width/height as Tailwind classes via className; this is a styling
   *  primitive, not a measurement utility. */
  rounded?: boolean;
  /** Set to false to use a static (non-shimmer) variant. */
  shimmer?: boolean;
};

/**
 * Editorial-style skeleton block. Foil-tinted, faint shimmer. Designed
 * to read as "this position will fill in" rather than "loading spinner."
 */
export default function Skeleton({
  className = "h-4 w-24",
  rounded = false,
  shimmer = true,
}: Props) {
  return (
    <span
      className={`inline-block relative overflow-hidden bg-parchment/[0.06] ${
        rounded ? "rounded-full" : ""
      } ${className}`}
      aria-hidden="true"
    >
      {shimmer && (
        <motion.span
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 1.6,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop",
          }}
          className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-foil/15 to-transparent"
        />
      )}
    </span>
  );
}

/** Pre-composed market list row skeleton. */
export function MarketRowSkeleton() {
  return (
    <div className="grid grid-cols-[2.4fr_1fr_1fr_1fr_1fr_1fr_0.6fr] items-center gap-4 border-b border-parchment/8 px-6 py-5">
      <div>
        <Skeleton className="h-6 w-20" />
        <Skeleton className="mt-2 h-3 w-32" />
      </div>
      <Skeleton className="h-4 w-12 justify-self-end" />
      <Skeleton className="h-4 w-16 justify-self-end" />
      <Skeleton className="h-4 w-14 justify-self-end" />
      <Skeleton className="h-4 w-14 justify-self-end" />
      <Skeleton className="h-4 w-16 justify-self-end" />
      <Skeleton className="h-3 w-10 justify-self-end" />
    </div>
  );
}

/** Pre-composed action panel skeleton. */
export function ActionPanelSkeleton() {
  return (
    <div className="border border-parchment/12 bg-ink-deep/55 p-6">
      <Skeleton className="h-6 w-32" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
