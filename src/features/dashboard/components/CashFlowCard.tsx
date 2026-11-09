"use client";

import React, { useEffect, useMemo, useState } from "react";
import CashFlowChart, { type CashFlowPoint } from "@core/components/CashFlowChart";
import { useAppSelector } from "@/store/hooks";
import {
  selectAccountsResponse,
  useGetAccountSummaryMutation,
  useGetCashFlowMutation,
  mapCashFlowPoints,
  type CoreAccountEntry,
} from "@/features/account";

/**
 * Fallback baseline timeline points when an account has no recorded
 * transactions yet or while connecting to the core banking API.
 */
const DEFAULT_CASH_FLOW_CHART_USD: CashFlowPoint[] = [
  { date: "22", inflow: 1100, outflow: 800, fullDate: "22 Jun 2026" },
  { date: " ", inflow: 2000, outflow: 1350, fullDate: "24 Jun 2026" },
  { date: "  ", inflow: 1100, outflow: 1050, fullDate: "25 Jun 2026" },
  { date: "27", inflow: 3400, outflow: 2000, fullDate: "27 Jun 2026" },
  { date: "   ", inflow: 1900, outflow: 600, fullDate: "29 Jun 2026" },
  { date: "02", inflow: 2500, outflow: 1800, fullDate: "02 Jul 2026" },
  { date: "    ", inflow: 600, outflow: 1000, fullDate: "04 Jul 2026" },
  { date: "07", inflow: 2800, outflow: 1900, fullDate: "07 Jul 2026" },
  { date: "     ", inflow: 1400, outflow: 1600, fullDate: "09 Jul 2026" },
  { date: "12", inflow: 3000, outflow: 1200, fullDate: "12 Jul 2026" },
  { date: "      ", inflow: 2000, outflow: 2200, fullDate: "14 Jul 2026" },
  { date: "17", inflow: 1000, outflow: 800, fullDate: "17 Jul 2026" },
  { date: "       ", inflow: 1800, outflow: 1500, fullDate: "19 Jul 2026" },
  { date: "        ", inflow: 3500, outflow: 2400, fullDate: "21 Jul 2026" },
];

const DEFAULT_CASH_FLOW_CHART_KHR: CashFlowPoint[] = [
  { date: "22", inflow: 4_400_000, outflow: 3_200_000, fullDate: "22 Jun 2026" },
  { date: " ", inflow: 8_000_000, outflow: 5_400_000, fullDate: "24 Jun 2026" },
  { date: "  ", inflow: 4_400_000, outflow: 4_200_000, fullDate: "25 Jun 2026" },
  { date: "27", inflow: 13_600_000, outflow: 8_000_000, fullDate: "27 Jun 2026" },
  { date: "   ", inflow: 7_600_000, outflow: 2_400_000, fullDate: "29 Jun 2026" },
  { date: "02", inflow: 10_000_000, outflow: 7_200_000, fullDate: "02 Jul 2026" },
  { date: "    ", inflow: 2_400_000, outflow: 4_000_000, fullDate: "04 Jul 2026" },
  { date: "07", inflow: 11_200_000, outflow: 7_600_000, fullDate: "07 Jul 2026" },
  { date: "     ", inflow: 5_600_000, outflow: 6_400_000, fullDate: "09 Jul 2026" },
  { date: "12", inflow: 12_000_000, outflow: 4_800_000, fullDate: "12 Jul 2026" },
  { date: "      ", inflow: 8_000_000, outflow: 8_800_000, fullDate: "14 Jul 2026" },
  { date: "17", inflow: 4_000_000, outflow: 3_200_000, fullDate: "17 Jul 2026" },
  { date: "       ", inflow: 7_200_000, outflow: 6_000_000, fullDate: "19 Jul 2026" },
  { date: "        ", inflow: 14_000_000, outflow: 9_600_000, fullDate: "21 Jul 2026" },
];

/** Extract total income and expense from various potential API response shapes. */
function extractIncomeAndExpense(raw: any): { income: number | null; expense: number | null } {
  if (!raw) return { income: null, expense: null };

  const payload = raw?.data ?? raw;

  // 1. Direct summary fields on the response or envelope
  const directIncome =
    payload.income ??
    payload.totalIncome ??
    payload.inflow ??
    payload.totalInflow ??
    payload.cashIn ??
    payload.totalCashIn;

  const directExpense =
    payload.expense ??
    payload.totalExpense ??
    payload.outflow ??
    payload.totalOutflow ??
    payload.cashOut ??
    payload.totalCashOut;

  if (typeof directIncome === "number" || typeof directExpense === "number") {
    return {
      income: typeof directIncome === "number" ? directIncome : 0,
      expense: typeof directExpense === "number" ? directExpense : 0,
    };
  }

  // 2. Transaction summary list (e.g. transactionSummary.data from POST accounts/summary)
  const list =
    payload.transactionSummary?.data ??
    payload.data ??
    payload.transactions ??
    (Array.isArray(payload) ? payload : null);

  if (Array.isArray(list) && list.length > 0) {
    let sumIn = 0;
    let sumOut = 0;
    let hasCount = false;

    for (const item of list) {
      const inVal = Number(
        item.transactionIn ??
          item.inflow ??
          item.cashIn ??
          item.amountIn ??
          (item.transactionType === "C" ? item.transactionAmount : 0) ??
          0,
      );
      const outVal = Number(
        item.transactionOut ??
          item.outflow ??
          item.cashOut ??
          item.amountOut ??
          (item.transactionType === "D" ? Math.abs(item.transactionAmount) : 0) ??
          0,
      );
      if (!isNaN(inVal)) sumIn += inVal;
      if (!isNaN(outVal)) sumOut += outVal;
      if (inVal > 0 || outVal > 0) hasCount = true;
    }

    if (hasCount || list.length > 0) {
      return { income: sumIn, expense: sumOut };
    }
  }

  return { income: null, expense: null };
}

export interface CashFlowCardProps {
  accountNumber?: string;
  type?: string;
  currency?: "USD" | "KHR";
  onCurrencyChange?: (currency: "USD" | "KHR") => void;
  height?: number;
  data?: CashFlowPoint[];
  title?: string;
  showCard?: boolean;
}

export default function CashFlowCard({
  accountNumber: propAccountNumber,
  type: propType,
  currency: propCurrency,
  onCurrencyChange: propOnCurrencyChange,
  height = 200,
  data: propData,
  title,
  showCard,
}: CashFlowCardProps = {}) {
  const [internalCcy, setInternalCcy] = useState<"USD" | "KHR">(propCurrency ?? "USD");
  const ccy = propCurrency ?? internalCcy;

  const accountsResponse = useAppSelector(selectAccountsResponse);
  const bankAccounts = accountsResponse?.accounts ?? [];

  // Match the active account for the selected currency (prioritize Current Account "CA")
  const activeAccount = useMemo(() => {
    // If propAccountNumber matches the current currency, use it
    if (propAccountNumber) {
      const found = bankAccounts.find((a) => a.accountNumber === propAccountNumber);
      if (found && (!ccy || found.ccy === ccy)) return found;
    }
    // Otherwise find the account matching the current currency
    const matchingCcyAccount =
      bankAccounts.find((a: CoreAccountEntry) => a.ccy === ccy && a.accountType === (propType ?? "CA")) ??
      bankAccounts.find((a: CoreAccountEntry) => a.ccy === ccy);

    if (matchingCcyAccount) return matchingCcyAccount;

    if (propAccountNumber) {
      const found = bankAccounts.find((a) => a.accountNumber === propAccountNumber);
      if (found) return found;
    }

    return (
      bankAccounts.find((a: CoreAccountEntry) => a.accountType === (propType ?? "CA")) ??
      bankAccounts[0]
    );
  }, [bankAccounts, ccy, propAccountNumber, propType]);

  const targetAccountNumber = activeAccount?.accountNumber;
  const targetType = propType ?? activeAccount?.accountType ?? "CA";

  const [getAccountSummary, { data: summaryData, isLoading: isSummaryLoading }] =
    useGetAccountSummaryMutation();
  const [getCashFlow, { data: cashFlowData, isLoading: isCashFlowLoading }] =
    useGetCashFlowMutation();

  const isLoading = isSummaryLoading || isCashFlowLoading;

  useEffect(() => {
    if (!targetAccountNumber) return;

    // Fetch live account summary from API (accounts/summary)
    getAccountSummary({
      accountNumber: targetAccountNumber,
      type: targetType,
    });

    // Also call transactions/dashboard endpoint if available
    getCashFlow({
      accountNumber: targetAccountNumber,
      type: targetType,
    })
      .unwrap()
      .catch(() => {
        // Fallback silently if transactions/dashboard is not mounted
      });
  }, [targetAccountNumber, targetType, getAccountSummary, getCashFlow]);

  // Compute dynamic chart data points from API responses or props
  const chartData = useMemo<CashFlowPoint[]>(() => {
    // 0. Explicit data prop passed in
    if (propData && propData.length > 0) return propData;

    // 1. Try transactions/dashboard endpoint data
    const fromCashFlow = mapCashFlowPoints(cashFlowData);
    if (fromCashFlow.length > 0) return fromCashFlow;

    // 2. Try accounts/summary endpoint data
    const fromSummary = mapCashFlowPoints(summaryData);
    if (fromSummary.length > 0) return fromSummary;

    // 3. Fallback when API returns empty or while connecting
    if (ccy === "KHR") {
      return DEFAULT_CASH_FLOW_CHART_KHR;
    }

    return DEFAULT_CASH_FLOW_CHART_USD;
  }, [propData, cashFlowData, summaryData, ccy]);

  // Extract dynamic Expense and Income from the API response or chart points
  const { dynamicExpense, dynamicIncome } = useMemo(() => {
    let res = extractIncomeAndExpense(cashFlowData);
    if (res.income === null || res.expense === null) {
      res = extractIncomeAndExpense(summaryData);
    }

    if ((res.income === null || res.expense === null) && chartData.length > 0) {
      const sumIn = chartData.reduce((acc, p) => acc + (p.inflow || 0), 0);
      const sumOut = chartData.reduce((acc, p) => acc + (p.outflow || 0), 0);
      res = { income: sumIn, expense: sumOut };
    }

    if (res.income !== null && res.expense !== null) {
      const expFormatted =
        ccy === "USD"
          ? `-$${Math.abs(res.expense).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : `-៛ ${Math.abs(res.expense).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;

      const incFormatted =
        ccy === "USD"
          ? `$${Math.abs(res.income).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : `៛ ${Math.abs(res.income).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;

      return {
        dynamicExpense: expFormatted,
        dynamicIncome: incFormatted,
      };
    }

    // Default fallback values matching the design when API has no data or is loading
    return {
      dynamicExpense: ccy === "USD" ? "-$0.00" : "-៛ 0.00",
      dynamicIncome: ccy === "USD" ? "$0.00" : "៛ 0.00",
    };
  }, [cashFlowData, summaryData, chartData, ccy]);

  const handleCurrencyChange = (newCcy: string) => {
    const val = newCcy as "USD" | "KHR";
    setInternalCcy(val);
    propOnCurrencyChange?.(val);
  };

  return (
    <CashFlowChart
      title={title}
      data={chartData}
      expenseAmount={dynamicExpense}
      incomeAmount={dynamicIncome}
      activeCurrency={ccy}
      onCurrencyChange={handleCurrencyChange}
      height={height}
      isLoading={isLoading}
      accountNumber={targetAccountNumber}
      showCard={showCard}
    />
  );
}
