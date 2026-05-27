# @strate/sdk

Off-chain TypeScript SDK for **Strate** — a Pendle-style yield-stripping protocol on Stellar Soroban.

The SDK is the layer between your Next.js / React dApp and the Strate Soroban contracts (YieldStripping, AMM, Oracle, PT, YT, Factory). It builds unsigned transactions for Freighter to sign, simulates read-only views, and exposes React Query hooks for the UI.

## Install

```bash
pnpm add @strate/sdk @stellar/stellar-sdk @stellar/freighter-api @tanstack/react-query react
```

ESM only. Requires Node 20+ and a bundler that handles native ESM (Next.js 14+, Vite, etc.).

## Quickstart

```ts
import { rpc } from "@stellar/stellar-sdk";
import { StrateClient, Network, asAddress } from "@strate/sdk";

const server = new rpc.Server("https://soroban-testnet.stellar.org");
const client = new StrateClient({
  network: Network.Testnet,
  server,
  factoryAddress: asAddress("CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"),
});
```

## Building a mint transaction

```ts
import { isConnected, signTransaction, getAddress } from "@stellar/freighter-api";

const user = asAddress((await getAddress()).address);
const source = await server.getAccount(user);

const tx = await client.buildMint({
  market: marketAddress,
  user,
  underlyingAmount: 100_000_000n, // 10 bUSDC (7 decimals)
  source,
});

const { signedTxXdr } = await signTransaction(tx.toXDR(), { networkPassphrase: "Test SDF Network ; September 2015" });
await server.sendTransaction(/* parse signedTxXdr */);
```

## Claim YT yield

```ts
const tx = await client.buildClaimYield({ market, user, source });
// sign with Freighter, submit
```

## Redeem (pre-maturity vs at-maturity)

```ts
const tx = await client.buildRedeem({
  market,
  user,
  ptAmount: 50_000_000n,
  atMaturity: false, // burns equal PT+YT pre-maturity
  source,
});
```

## Swap PT <-> bUSDC

```ts
const market = await client.readMarket(marketAddress);
const tx = await client.buildSwap({
  amm: market.amm,
  user,
  tokenIn: "PT",
  amountIn: 10_000_000n,
  minAmountOut: 9_700_000n, // slippage check
  source,
});
```

## React hooks

Wrap your app once:

```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrateClientProvider } from "@strate/sdk/hooks";

const qc = new QueryClient();

export function Providers({ children, client }) {
  return (
    <QueryClientProvider client={qc}>
      <StrateClientProvider client={client}>{children}</StrateClientProvider>
    </QueryClientProvider>
  );
}
```

Then in any component:

```tsx
"use client";
import { useMarket, useUserPosition, useYieldCurve } from "@strate/sdk/hooks";
import { formatApy, formatUnderlying } from "@strate/sdk";

export function MarketCard({ market, user }) {
  const { data: m } = useMarket(market);
  const { data: pos } = useUserPosition(market, user);
  const { data: curve } = useYieldCurve(market);

  if (!m || !pos || !curve) return <p>Loading...</p>;

  return (
    <div>
      <h2>Implied APY: {formatApy(curve.impliedApy)}</h2>
      <p>Your PT: {formatUnderlying(pos.ptBalance)}</p>
      <p>Your YT: {formatUnderlying(pos.ytBalance)}</p>
      <p>Claimable yield: {formatUnderlying(pos.claimableYield)}</p>
    </div>
  );
}
```

## Architecture

```
StrateClient
  |
  +- transactions/ ----- build*Tx(): Server.prepareTransaction()
  |                      returns unsigned Transaction; Freighter signs.
  |
  +- views/ ------------ read*(): Server.simulateTransaction()
  |                      parses ScVal -> bigint / typed struct.
  |
  +- hooks/ ------------ React Query wrappers (tree-shakable subpath)
```

All amounts are `bigint`. WAD-scaled values are `1e18`. Underlying (bUSDC) is 7 decimals.

## Regenerating bindings

When the blockchain-developer publishes new contract WASM, run:

```bash
stellar contract bindings typescript --network testnet \
  --contract-id <addr> --output-dir bindings/yield-stripping
```

then update `src/transactions/*.ts` and `src/views/*.ts` argument lists. The encoding helpers in `src/utils/bigint.ts` rarely change.

## Scripts

```bash
pnpm install
pnpm test       # vitest
pnpm build      # tsup -> dist/ (ESM + .d.ts)
pnpm typecheck  # tsc --noEmit
```

## License

MIT
