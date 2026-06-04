/**
 * Wallet-kit metadata that's safe to import at module top level — pure
 * strings, no @creit.tech runtime dependency. Anything that needs the
 * kit's runtime (init, connect, sign, list) must dynamic-import
 * `./kit.ts` so the wallet bundle stays out of the initial JS payload.
 *
 * The IDs here MUST stay in sync with the WALLET_IDS map in kit.ts.
 * The runtime mapping (WalletId → kit's internal id) happens inside the
 * kit module; this file only ships display strings.
 */

export type WalletId = "freighter" | "xbull" | "albedo" | "lobstr";

export const WALLET_DISPLAY: Record<WalletId, { name: string; tagline: string }> = {
  freighter: {
    name: "Freighter",
    tagline: "Browser extension by SDF. The default.",
  },
  xbull: {
    name: "xBull",
    tagline: "Browser extension + mobile. Multi-account.",
  },
  albedo: {
    name: "Albedo",
    tagline: "Web-based. No install needed.",
  },
  lobstr: {
    name: "Lobstr Signer",
    tagline: "Mobile wallet. Read-only sessions.",
  },
};
