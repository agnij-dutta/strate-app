/**
 * Wallet adapter contract. Implemented by FreighterAdapter for now.
 * xBull, Albedo, Lobstr can drop in as additional implementations later.
 *
 * Methods return plain values, not promises wrapped in custom result types.
 * Callers handle rejection by catching the thrown error directly, which
 * matches how the underlying wallet APIs behave.
 */
export type WalletId = "freighter" | "xbull" | "albedo" | "lobstr";

export interface WalletAdapter {
  readonly id: WalletId;
  readonly displayName: string;

  /** True if the wallet extension is installed and reachable. */
  isAvailable(): Promise<boolean>;

  /** Request connection. Returns the user's G... address. */
  connect(): Promise<string>;

  /** Best-effort disconnect. Some wallets ignore this; we still clear local state. */
  disconnect(): Promise<void>;

  /** Currently connected address, or null if not connected. */
  getAddress(): Promise<string | null>;

  /**
   * Sign a base64-encoded XDR transaction envelope.
   * Returns the signed XDR (also base64).
   */
  signTransaction(xdr: string, opts: { networkPassphrase: string }): Promise<string>;
}
