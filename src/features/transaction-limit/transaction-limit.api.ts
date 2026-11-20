import { adminApi } from "@/config/api.config";
import { baseApi } from "@/store/baseApi";
import { type TransformResponse } from "@/utils/transform-response";
import type { AuthenticatorRequest } from "@/features/authenticator";

import type {
  LimitField,
  LimitFieldSetting,
  LimitRowIdentity,
  LimitValueSource,
  OwnerLimits,
  TransactionLimitRow,
  UpdateLimitRow,
} from "./transaction-limit.types";

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

type LimitFigure = number | null | LimitFieldSetting;
type LimitRowResponse = Omit<Partial<TransactionLimitRow>, LimitField> &
  LimitRowIdentity & {
    maxAmountPerTransaction?: LimitFigure;
    maxAmountPerDay?: LimitFigure;
    maxNumberTransactionPerDay?: LimitFigure;
  };
type OwnerLimitsResponse = Omit<OwnerLimits, "rows"> & {
  rows: LimitRowResponse[];
};
type UpdateUserLimitsResponse = {
  authenticator?: AuthenticatorRequest | null;
};

function normalizeLimitValue(
  value: LimitFigure | undefined,
  source: LimitValueSource | undefined,
) {
  if (typeof value === "object" && value !== null) {
    return { value: value.value, source: value.source };
  }
  return { value: value ?? null, source: source ?? "INHERITED" };
}

function normalizeLimitRow(row: LimitRowResponse): TransactionLimitRow {
  const perTransaction = normalizeLimitValue(
    row.maxAmountPerTransaction,
    row.srcMaxAmountPerTransaction,
  );
  const perDay = normalizeLimitValue(row.maxAmountPerDay, row.srcMaxAmountPerDay);
  const transactionsPerDay = normalizeLimitValue(
    row.maxNumberTransactionPerDay,
    row.srcMaxNumberTransactionPerDay,
  );

  return {
    ...row,
    maxAmountPerTransaction: perTransaction.value,
    srcMaxAmountPerTransaction: perTransaction.source,
    maxAmountPerDay: perDay.value,
    srcMaxAmountPerDay: perDay.source,
    maxNumberTransactionPerDay: transactionsPerDay.value,
    srcMaxNumberTransactionPerDay: transactionsPerDay.source,
    code: row.code ?? (row.functionCode === "TRANSFER:INTERNATIONAL" ? "INTERNATIONAL" : ""),
    name:
      row.functionCode === "TRANSFER:INTERNATIONAL"
        ? "International Transfer"
        : row.name ?? row.functionCode,
    sequence: row.sequence ?? null,
    parentMaxAmountPerTransaction: row.parentMaxAmountPerTransaction ?? null,
    parentMaxAmountPerDay: row.parentMaxAmountPerDay ?? null,
    parentMaxNumberTransactionPerDay: row.parentMaxNumberTransactionPerDay ?? null,
    minTransactionAmount: row.minTransactionAmount ?? null,
    minTransactionAmountKhr: row.minTransactionAmountKhr ?? null,
    hardMaxAmountPerTransaction: row.hardMaxAmountPerTransaction ?? null,
    hardMaxAmountPerDay: row.hardMaxAmountPerDay ?? null,
    hardMaxNumberTransactionPerDay: row.hardMaxNumberTransactionPerDay ?? null,
    validatePerTransactionType: row.validatePerTransactionType ?? false,
  };
}

function normalizeOwnerLimits(response: TransformResponse<OwnerLimitsResponse>): OwnerLimits {
  return {
    ...response.data,
    rows: response.data.rows.map(normalizeLimitRow),
  };
}

export const transactionLimitApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getMyLimits: build.query<OwnerLimits, void>({
      query: () => bank(adminApi.TRANSACTION_LIMIT.ME),
      transformResponse: normalizeOwnerLimits,
      providesTags: [
        { type: "TransactionLimit" as const, id: "ME" },
        { type: "TransactionLimit" as const, id: "LIST" },
      ],
    }),

    getOrganizationLimits: build.query<OwnerLimits, void>({
      query: () => bank(adminApi.TRANSACTION_LIMIT.ORGANIZATION),
      transformResponse: normalizeOwnerLimits,
      providesTags: [
        { type: "TransactionLimit" as const, id: "ORGANIZATION" },
        { type: "TransactionLimit" as const, id: "LIST" },
      ],
    }),

    getUserLimits: build.query<OwnerLimits, string>({
      query: (userId) => bank(withParams(adminApi.TRANSACTION_LIMIT.USER, { userId })),
      transformResponse: normalizeOwnerLimits,
      providesTags: (_result, _error, userId) => [
        { type: "TransactionLimit" as const, id: userId },
        { type: "TransactionLimit" as const, id: "LIST" },
      ],
    }),

    updateUserLimits: build.mutation<
      UpdateUserLimitsResponse,
      { userId: string; rows: UpdateLimitRow[] }
    >({
      query: ({ userId, rows }) => ({
        url: bank(withParams(adminApi.TRANSACTION_LIMIT.USER_UPDATE, { userId })),
        method: "PUT",
        body: { rows },
      }),
      transformResponse: (response: TransformResponse<UpdateUserLimitsResponse>) => response.data,
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
      transformResponse: normalizeOwnerLimits,
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
