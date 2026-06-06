import {
  StrateNotConfiguredError,
  listMarkets,
  readMarket,
  readMarketMetaFromFactory,
  readPendingYield
} from "../chunk-QH42Y5BV.js";

// src/hooks/use-strate-client.ts
import {
  createContext,
  createElement,
  useContext
} from "react";
var StrateClientContext = createContext(null);
function StrateClientProvider(props) {
  return createElement(
    StrateClientContext.Provider,
    { value: props.client },
    props.children
  );
}
function useStrateClient() {
  const client = useContext(StrateClientContext);
  if (!client) {
    throw new StrateNotConfiguredError(
      "useStrateClient: no StrateClientProvider found in the tree."
    );
  }
  return client;
}
function useStrateClientOptional() {
  return useContext(StrateClientContext);
}

// src/hooks/use-market.ts
import { useQuery } from "@tanstack/react-query";
function useMarket(marketAddress, options = {}) {
  const client = useStrateClient();
  return useQuery({
    queryKey: [
      "strate",
      "market",
      client.network,
      marketAddress,
      options.amm ?? "auto"
    ],
    queryFn: async () => {
      if (!marketAddress) throw new Error("marketAddress is required");
      let amm = options.amm;
      if (!amm) {
        const meta = await readMarketMetaFromFactory({
          server: client.server,
          network: client.network,
          factory: client.factoryAddress,
          ys: marketAddress
        });
        if (!meta) {
          throw new Error(
            `Factory has no record of YS ${marketAddress}. Pass options.amm explicitly if this market was deployed outside the factory.`
          );
        }
        amm = meta.amm;
      }
      return readMarket({
        server: client.server,
        network: client.network,
        market: marketAddress,
        amm
      });
    },
    enabled: Boolean(marketAddress) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 3e4
  });
}

// src/hooks/use-markets.ts
import { useQuery as useQuery2 } from "@tanstack/react-query";
function useMarkets(options = {}) {
  const client = useStrateClient();
  return useQuery2({
    queryKey: ["strate", "markets", client.network, client.factoryAddress],
    queryFn: async () => listMarkets({
      server: client.server,
      network: client.network,
      factory: client.factoryAddress
    }),
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 5 * 6e4
  });
}

// src/hooks/use-user-position.ts
import { useQuery as useQuery3 } from "@tanstack/react-query";
function useUserPosition(marketAddress, userAddress, options = {}) {
  const client = useStrateClient();
  return useQuery3({
    queryKey: [
      "strate",
      "user-position",
      client.network,
      marketAddress,
      userAddress
    ],
    queryFn: async () => {
      if (!marketAddress || !userAddress) {
        throw new Error("marketAddress and userAddress are required");
      }
      return client.readUserPosition(marketAddress, userAddress);
    },
    enabled: Boolean(marketAddress) && Boolean(userAddress) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 1e4,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? true
  });
}

// src/hooks/use-yield-curve.ts
import { useQuery as useQuery4 } from "@tanstack/react-query";
function useYieldCurve(marketAddress, options = {}) {
  const client = useStrateClient();
  return useQuery4({
    queryKey: ["strate", "yield-curve", client.network, marketAddress],
    queryFn: async () => {
      if (!marketAddress) throw new Error("marketAddress is required");
      return client.readYieldCurvePoint(marketAddress);
    },
    enabled: Boolean(marketAddress) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 6e4
  });
}

// src/hooks/use-accrued-yield.ts
import { useQuery as useQuery5 } from "@tanstack/react-query";
function useAccruedYield(marketAddress, userAddress, options = {}) {
  const client = useStrateClient();
  return useQuery5({
    queryKey: [
      "strate",
      "accrued-yield",
      client.network,
      marketAddress,
      userAddress
    ],
    queryFn: async () => {
      if (!marketAddress) throw new Error("marketAddress is required");
      if (!userAddress) throw new Error("userAddress is required");
      return readPendingYield({
        server: client.server,
        network: client.network,
        market: marketAddress,
        user: userAddress
      });
    },
    enabled: Boolean(marketAddress) && Boolean(userAddress) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 15e3
  });
}
export {
  StrateClientProvider,
  useAccruedYield,
  useMarket,
  useMarkets,
  useStrateClient,
  useStrateClientOptional,
  useUserPosition,
  useYieldCurve
};
