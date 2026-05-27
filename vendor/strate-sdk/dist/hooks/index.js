import {
  StrateNotConfiguredError
} from "../chunk-M2UWPFZV.js";

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
    queryKey: ["strate", "market", client.network, marketAddress],
    queryFn: async () => {
      if (!marketAddress) throw new Error("marketAddress is required");
      return client.readMarket(marketAddress);
    },
    enabled: Boolean(marketAddress) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 3e4
  });
}

// src/hooks/use-user-position.ts
import { useQuery as useQuery2 } from "@tanstack/react-query";
function useUserPosition(marketAddress, userAddress, options = {}) {
  const client = useStrateClient();
  return useQuery2({
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
import { useQuery as useQuery3 } from "@tanstack/react-query";
function useYieldCurve(marketAddress, options = {}) {
  const client = useStrateClient();
  return useQuery3({
    queryKey: ["strate", "yield-curve", client.network, marketAddress],
    queryFn: async () => {
      if (!marketAddress) throw new Error("marketAddress is required");
      return client.readYieldCurvePoint(marketAddress);
    },
    enabled: Boolean(marketAddress) && (options.enabled ?? true),
    staleTime: options.staleTime ?? 6e4
  });
}
export {
  StrateClientProvider,
  useMarket,
  useStrateClient,
  useStrateClientOptional,
  useUserPosition,
  useYieldCurve
};
