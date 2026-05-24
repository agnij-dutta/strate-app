# strate-app

The Strate dApp. Yield-stripping for Stellar RWAs.

## Status

Pre-testnet. All chain calls route through a mock data layer (`lib/mocks.ts`)
until the protocol contracts are deployed to testnet via the Factory. UI
flows are complete and clickable end-to-end; the sign + broadcast step in
`components/TxDrawer.tsx` is a stub that simulates the wallet round-trip.

## Stack

- Next.js 14 (App Router) + Tailwind + Framer Motion
- `@strate/sdk` linked locally via `file:../strate-sdk`
- `@stellar/freighter-api` for wallet
- TanStack Query for cache
- Zustand for wallet + tx state
- Vercel Analytics

## Routes

| Path | What |
| --- | --- |
| `/` | Redirects to `/markets` |
| `/markets` | Index of yield-stripping markets |
| `/markets/[id]` | Market detail with Mint / Redeem / Swap tabs + yield curve |
| `/portfolio` | User positions + claim yield |

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000.

To connect Freighter, install the extension and switch its network selector
to "Testnet."

## Going live (post-testnet deploy)

1. Set `NEXT_PUBLIC_FACTORY_ADDRESS` in `.env.local` to the deployed Factory
   contract address (the deterministic one produced by `factory init`).
2. Toggle `USE_MOCKS = false` in `lib/mocks.ts`.
3. Swap mock call sites for SDK hooks:
   - `MOCK_MARKETS` → `useMarkets()` (to be added in SDK)
   - `MOCK_POSITION` → `useUserPosition({ market, user })`
   - mock chart data → `useYieldCurve({ market })`
4. Replace the stub in `TxDrawer.onSign` with:
   - `const xdr = await client.build<Mint|Redeem|Swap>(...)`
   - `const signed = await adapter.signTransaction(xdr.toXDR(), { networkPassphrase })`
   - `const result = await client.server.sendTransaction(signed)`
   - Poll `getTransaction(result.hash)` until SUCCESS, then `setSuccess(hash)`.

## Brand

Treasury Ink `#0B2545` · Foil Gold `#C9A961` · Parchment `#F5F1E8`.
Fraunces (display) + JetBrains Mono (numbers). Same palette as the landing
site at usestrate.app so the brand carries across.
