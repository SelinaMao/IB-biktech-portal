import { baseApi } from "@/store/baseApi";
import { adminApi } from "@/config/api.config";
import type { TransformResponse } from "@/utils/transform-response";
import {
  setAccountDetail,
  setAccounts,
  setAccountSummary,
  setTransactions,
  transactionsFailed,
  transactionsRequested,
} from "./account.slice";
import type {
  AccountDetailRequest,
  AccountDownloadRequest,
  AccountListRequest,
  AccountSummaryRequest,
  CoreAccountSummaryEntry,
  CoreAccountsResponse,
  CorePageInfo,
  CoreTransactionEntry,
  IAccountDetailResponses,
  TransactionDownloadDetailRequest,
  TransactionDownloadRequest,
  TransactionListPage,
  TransactionListRequest,
} from "./account.types";

const bank = (path: string) => `bank/${path}`;

export const accountApi = baseApi.injectEndpoints({
  overrideExisting: process.env.NODE_ENV === "development",
  endpoints: (build) => ({
    listAccounts: build.mutation<CoreAccountsResponse, AccountListRequest | void>({
      query: (body) => ({ url: bank(adminApi.ACCOUNT.LIST), method: "POST", body: body || undefined }),
      transformResponse: (response: TransformResponse<CoreAccountsResponse>) =>
        response.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAccounts(data));
        } catch {
          // Handled by caller
        }
      },
    }),
    getAccountDetail: build.mutation<IAccountDetailResponses, AccountDetailRequest>({
      query: (body) => ({
        url: bank(adminApi.ACCOUNT.DETAIL),
        method: "POST",
        body,
      }),
      transformResponse: (response: TransformResponse<IAccountDetailResponses>) => response.data,
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAccountDetail(data));
        } catch {
          // Handled by caller
        }
      },
    }),

    getAccountSummary: build.mutation<CoreAccountSummaryEntry, AccountSummaryRequest>({
      query: (body) => ({
        url: bank(adminApi.ACCOUNT.SUMMARY),
        method: "POST",
        body,
      }),
      transformResponse: (response: TransformResponse<CoreAccountSummaryEntry>) => response.data,
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setAccountSummary({ accountNumber: arg.accountNumber, data }));
        } catch {
          // Handled by caller
        }
      },
    }),
    listTransactions: build.mutation<TransactionListPage, TransactionListRequest>({
      query: (body) => ({
        url: bank(adminApi.TRANSACTION.LIST),
        method: "POST",
        body,
      }),
      transformResponse: (response: TransformResponse<CoreTransactionEntry[] | null> & { page?: CorePageInfo }) => {
        // Core can omit `data` entirely for an empty statement.
        const rows = response.data ?? [];
        // Without `page` (a core that doesn't page yet) all there is, is this page.
        return { rows, total: response.page?.total ?? rows.length };
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled, requestId }) {
        dispatch(transactionsRequested({ accountNumber: arg.accountNumber, requestId }));
        try {
          const { data } = await queryFulfilled;
          dispatch(setTransactions({ requestId, data: data.rows, total: data.total }));
        } catch {
          dispatch(transactionsFailed({ requestId }));
        }
      },
    }),
  }),
});

export const {
  useListAccountsMutation,
  useGetAccountDetailMutation,
  useGetAccountSummaryMutation,
  useListTransactionsMutation,
} = accountApi;


export async function downloadAccountCertificate(body: AccountDownloadRequest): Promise<Blob> {
  const response = await fetch(`/api/${bank(adminApi.ACCOUNT.DOWNLOAD)}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to download certificate (${response.status})`);
  }
  return response.blob();
}


export async function downloadTransactionStatement(body: TransactionDownloadRequest): Promise<Blob> {
  const response = await fetch(`/api/${bank(adminApi.TRANSACTION.DOWNLOAD)}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to download statement (${response.status})`);
  }
  return response.blob();
}

export async function downloadTransactionDetail(
  body: TransactionDownloadDetailRequest,
): Promise<Blob> {
  const response = await fetch(`/api/${bank(adminApi.TRANSACTION.DOWNLOAD_DETAIL)}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Failed to download transaction detail (${response.status})`);
  }
  return response.blob();
}
