import { baseApi } from "@/store/baseApi";
import { adminApi } from "@/config/api.config";
import { transformResponse } from "@/utils/transform-response";
import type { ExchangeRatesResponse, MetaResponse } from "./meta.types";

/**
 * Meta endpoint, injected into the single root `baseApi` (one cache, one
 * middleware — see src/store/baseApi.ts). Follows the feature pattern:
 * src/features/<feature>/<feature>.api.ts + injectEndpoints.
 *
 * No dedicated BFF route exists for meta yet, so this rides the transparent
 * passthrough at `/api/bank/[...path]` — hence the `bank/` prefix. The core
 * envelope (`{ success, data, ... }`) is unwrapped to its `data` by
 * `transformResponse`.
 */

const bank = (path: string) => `bank/${path}`;

export const metaApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * GET bank/meta — every dropdown category (province, gender, ...) in one
     * payload. Called with `void`, so RTK Query treats every call site as
     * the same cache entry: the first mount fetches, every later
     * `useGetMetaQuery()` anywhere in the app reuses it instead of
     * re-fetching.
     */
    getMeta: build.query<MetaResponse, void>({
      query: () => bank(adminApi.META.GET),
      transformResponse,
      providesTags: [{ type: "Meta", id: "ALL" }],
    }),

    /** GET bank/meta/exchange-rates — currency list + the current buy/sell/mid rate. */
    getExchangeRates: build.query<ExchangeRatesResponse, void>({
      query: () => bank(adminApi.META.EXCHANGE_RATES),
      transformResponse,
      providesTags: [{ type: "Meta", id: "EXCHANGE_RATES" }],
    }),
  }),
});

export const { useGetMetaQuery, useLazyGetMetaQuery, useGetExchangeRatesQuery } = metaApi;
