"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrateClientProvider } from "@strate/sdk/hooks";
import { useState, type ReactNode } from "react";
import { getStrateClient } from "@/lib/client";

export default function Providers({ children }: { children: ReactNode }) {
  // Stable singletons across renders. QueryClient holds cache; StrateClient
  // holds the RPC server + factory address binding.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Markets refresh on a 30s cadence by default; individual hooks can
            // override. Soroban ledger close is ~5s so 30s is comfortably stale.
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );
  const [strateClient] = useState(() => getStrateClient());

  return (
    <QueryClientProvider client={queryClient}>
      <StrateClientProvider client={strateClient}>
        {children}
      </StrateClientProvider>
    </QueryClientProvider>
  );
}
