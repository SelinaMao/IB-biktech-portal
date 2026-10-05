import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { transformResponse } from "@/utils/transform-response";

import type { LimitRowIdentity, OwnerLimits, UpdateLimitRow } from "./transaction-limit.types";

/**
 * Corporate-side limits. There is no organization id in any of these calls — the core takes it
 * from the caller's token, so one company can never address another's users.
 */
const bank = (path: string) => `bank/${path}`;
const withParams = (path: string, values: Record<string, string>) =>
  Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, encodeURIComponent(value)),
    path,
  );

export const transactionLimitApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyLimits: build.query<OwnerLimits, void>({
      query: () => bank(adminApi.TRANSACTION_LIMIT.ME),
      transformResponse,
      providesTags: [
        { type: "TransactionLimit" as const, id: "ME" },
        { type: "TransactionLimit" as const, id: "LIST" },
      ],
    }),

    getOrganizationLimits: build.query<OwnerLimits, void>({
      query: () => bank(adminApi.TRANSACTION_LIMIT.ORGANIZATION),
      transformResponse,
      providesTags: [
        { type: "TransactionLimit" as const, id: "ORGANIZATION" },
        { type: "TransactionLimit" as const, id: "LIST" },
      ],
    }),

    getUserLimits: build.query<OwnerLimits, string>({
      query: (userId) => bank(withParams(adminApi.TRANSACTION_LIMIT.USER, { userId })),
      transformResponse,
      providesTags: (_result, _error, userId) => [
        { type: "TransactionLimit" as const, id: userId },
        { type: "TransactionLimit" as const, id: "LIST" },
      ],
    }),

    updateUserLimits: build.mutation<OwnerLimits, { userId: string; rows: UpdateLimitRow[] }>({
      query: ({ userId, rows }) => ({
        url: bank(withParams(adminApi.TRANSACTION_LIMIT.USER_UPDATE, { userId })),
        method: "PUT",
        body: { rows },
      }),
      transformResponse,
      invalidatesTags: [{ type: "TransactionLimit", id: "LIST" }],
    }),

    resetUserLimitRow: build.mutation<OwnerLimits, { userId: string } & LimitRowIdentity>({
      query: ({ userId, functionCode, method }) => ({
        url: bank(
          withParams(adminApi.TRANSACTION_LIMIT.USER_RESET, { userId }) +
            `?${new URLSearchParams({ functionCode, method })}`,
        ),
        method: "DELETE",
      }),
      transformResponse,
      invalidatesTags: [{ type: "TransactionLimit", id: "LIST" }],
    }),
  }),
  overrideExisting: process.env.NODE_ENV !== "production",
});

export const {
  useGetMyLimitsQuery,
  useGetOrganizationLimitsQuery,
  useGetUserLimitsQuery,
  useUpdateUserLimitsMutation,
  useResetUserLimitRowMutation,
} = transactionLimitApi;
