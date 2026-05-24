/**
 * Display formatters for the UI. Mirrors a few shapes from @strate/sdk's
 * utils/format but works on plain numbers (which is what the mocks emit).
 * Once live, swap UI call sites to formatApy / formatTokenAmount from the SDK.
 */

export function fmtApy(value: number, digits = 2): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function fmtPrice(value: number, digits = 4): string {
  return value.toFixed(digits);
}

export function fmtUsd(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(value >= 10_000_000 ? 1 : 2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/**
 * 130d, 8mo, 1y 2mo. Compact form for tables; pair with fmtMaturityDate for
 * the longer disclosure variant in detail pages.
 */
export function fmtTimeToMaturity(unixSec: number): string {
  const now = Math.floor(Date.now() / 1000);
  let s = unixSec - now;
  if (s <= 0) return "matured";
  const day = 86400;
  const month = 30 * day;
  const year = 365 * day;
  if (s < 60 * day) {
    return `${Math.round(s / day)}d`;
  }
  if (s < year) {
    const months = Math.round(s / month);
    return `${months}mo`;
  }
  const years = Math.floor(s / year);
  const months = Math.round((s - years * year) / month);
  return months > 0 ? `${years}y ${months}mo` : `${years}y`;
}

export function fmtMaturityDate(unixSec: number): string {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function shortAddr(addr: string, head = 4, tail = 4): string {
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
