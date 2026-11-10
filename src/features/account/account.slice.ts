import dayjs from "dayjs";
import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";

import type { RootReducerState } from "@/store/root-reducer";
import type { CashFlowPoint } from "@core/components/CashFlowChartPanel";
import type {
  CoreAccountSummaryEntry,
  CoreAccountsResponse,
  CoreTransactionEntry,
  CoreTransactionField,
  IAccountDetailResponses,
  TTransactionDetailResponse,
} from "./account.types";


export const mapCoreTransaction = (
  entry: CoreTransactionEntry,
  selfAccount?: { name?: string; number?: string },
): TTransactionDetailResponse => {
  const isIn = isIncomingTransaction(entry);
  const counterpartyName = entry.toAccountName || undefined;
  const counterpartyAccount = entry.toAccountNumber || undefined;
  return {
    ...entry,
    transactionDescription: entry.transactionDescription || entry.transactionCode,
    fromAccountName: (isIn ? counterpartyName : selfAccount?.name) ?? "",
    fromAccountNumber: (isIn ? counterpartyAccount : selfAccount?.number) ?? "",
    toAccountName: (isIn ? selfAccount?.name : counterpartyName) ?? "",
    toAccountNumber: (isIn ? selfAccount?.number : counterpartyAccount) ?? "",
  };
};

export const isIncomingTransaction = (transaction: { transactionType: string }): boolean =>
  transaction.transactionType === "C";

export const formatTransactionAmount = (transaction: TTransactionDetailResponse): string => {
  const formatted = Math.abs(transaction.transactionAmount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isIncomingTransaction(transaction) ? "+" : "-"}${formatted} ${transaction.transactionCurrency}`;
};

export const findTransactionField = (
  fields: CoreTransactionField[] | undefined,
  key: string,
): string | undefined => fields?.find((field) => field.key === key)?.value;

export const mapCashFlowPoints = (entry?: CoreAccountSummaryEntry | any): CashFlowPoint[] => {
  if (!entry) return [];
  const payload =
    entry?.data && (entry.data.transactionSummary || Array.isArray(entry.data))
      ? entry.data
      : entry;

  const rawList = Array.isArray(payload)
    ? payload
    : (payload.transactionSummary?.data ??
      payload.data ??
      payload.transactions ??
      payload.cashFlow ??
      []);

  if (!Array.isArray(rawList)) return [];

  const pointsMap = new Map<
    string,
    { date: string; inflow: number; outflow: number; fullDate?: string; timestamp: number }
  >();

  rawList.forEach((point: any, index: number) => {
    const rawDate = point.date || point.transactionDate || point.createdDate || "";
    const parsed = dayjs(rawDate);
    const dateLabel = parsed.isValid() ? parsed.format("DD") : String(rawDate || index + 1);
    const fullDate = parsed.isValid() ? parsed.format("DD MMM YYYY") : undefined;
    const timestamp = parsed.isValid() ? parsed.valueOf() : index;

    const inVal = Number(
      point.transactionIn ??
        point.inflow ??
        point.cashIn ??
        point.amountIn ??
        (point.transactionType === "C" ? point.transactionAmount : 0) ??
        0,
    );
    const outVal = Number(
      point.transactionOut ??
        point.outflow ??
        point.cashOut ??
        point.amountOut ??
        (point.transactionType === "D" ? Math.abs(point.transactionAmount) : 0) ??
        0,
    );

    const key = parsed.isValid() ? parsed.format("YYYY-MM-DD") : String(rawDate || index);

    if (pointsMap.has(key)) {
      const existing = pointsMap.get(key)!;
      existing.inflow += isNaN(inVal) ? 0 : inVal;
      existing.outflow += isNaN(outVal) ? 0 : outVal;
    } else {
      pointsMap.set(key, {
        date: dateLabel,
        inflow: isNaN(inVal) ? 0 : inVal,
        outflow: isNaN(outVal) ? 0 : outVal,
        fullDate,
        timestamp,
      });
    }
  });

  return Array.from(pointsMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(({ date, inflow, outflow, fullDate }) => ({
      date,
      inflow,
      outflow,
      fullDate,
    }));
};


export interface AccountState {
  data: CoreAccountsResponse | null;
  detail: IAccountDetailResponses | null;
  summary: { accountNumber: string; data: CoreAccountSummaryEntry } | null;

  transactions: {
    accountNumber: string;
    requestId: string;
    status: "loading" | "loaded" | "failed";
    /** This page's rows. */
    data: CoreTransactionEntry[];
    /** Rows across all pages. */
    total: number;
  } | null;
}

const initialState: AccountState = {
  data: null,
  detail: null,
  summary: null,
  transactions: null,

};

const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setAccounts(state, action: PayloadAction<CoreAccountsResponse>) {
      state.data = action.payload;
    },
    setAccountDetail(state, action: PayloadAction<IAccountDetailResponses>) {
      state.detail = action.payload;

    },
    setAccountSummary(
      state,
      action: PayloadAction<{ accountNumber: string; data: CoreAccountSummaryEntry }>,
    ) {
      state.summary = action.payload;
    },
    transactionsRequested(
      state,
      action: PayloadAction<{ accountNumber: string; requestId: string }>,
    ) {
      // Keep the account's last total so the pager holds still while the next page loads.
      const previous = state.transactions;
      const total = previous?.accountNumber === action.payload.accountNumber ? previous.total : 0;
      state.transactions = { ...action.payload, status: "loading", data: [], total };
    },
    setTransactions(
      state,
      action: PayloadAction<{ requestId: string; data: CoreTransactionEntry[]; total: number }>,
    ) {
      // Only the latest request may land — an older response arriving late is dropped.
      const current = state.transactions;
      if (!current || current.requestId !== action.payload.requestId) return;
      current.status = "loaded";
      current.data = action.payload.data;
      current.total = action.payload.total;
    },
    transactionsFailed(state, action: PayloadAction<{ requestId: string }>) {
      const current = state.transactions;
      if (!current || current.requestId !== action.payload.requestId) return;
      current.status = "failed";
    },
  },
});

export const {
  setAccounts,
  setAccountDetail,
  setAccountSummary,
  transactionsRequested,
  setTransactions,
  transactionsFailed,
} = accountSlice.actions;

export const selectAccountsResponse = (state: RootReducerState) => state.account.data;

export const selectAccountDetailResponse = (state: RootReducerState) => state.account.detail;

const selectAccountNumberProp = (_state: RootReducerState, accountNumber?: string) => accountNumber;

export const selectAccountInfoDetail = createSelector(
  [selectAccountDetailResponse, selectAccountNumberProp],
  (detail, accountNumber) => (detail && detail.accountNumber === accountNumber ? detail : undefined),
);

export const selectFixedDepositDetail = createSelector(
  [selectAccountDetailResponse, selectAccountNumberProp],
  (detail, accountNumber) =>
    detail && detail.accountNumber === accountNumber && detail.accountType === "TD"
      ? detail
      : undefined,
);

export const selectAccountSummaryResponse = (state: RootReducerState) => state.account.summary;

export const selectTransactionsResponse = (state: RootReducerState) => state.account.transactions;

export const selectTransactionsForAccount = createSelector(
  [selectTransactionsResponse, selectAccountNumberProp],
  (transactions, accountNumber) =>
    transactions && transactions.accountNumber === accountNumber ? transactions : undefined,
);

const selectSelfAccountNameProp = (
  _state: RootReducerState,
  _accountNumber?: string,
  selfAccountName?: string,
) => selfAccountName;

export const selectAccountTransactions = createSelector(
  [selectTransactionsForAccount, selectAccountNumberProp, selectSelfAccountNameProp],
  (transactions, accountNumber, selfAccountName): TTransactionDetailResponse[] | undefined =>
    transactions?.data.map((entry) =>
      mapCoreTransaction(entry, { name: selfAccountName, number: accountNumber }),
    ),
);

export default accountSlice.reducer;
