"use client";

import React, { useEffect, useMemo, useState } from "react";
import CashFlowChart, { type CashFlowPoint } from "@core/components/CashFlowChart";
import { useAppSelector } from "@/store/hooks";
import {
  selectAccountsResponse,
  useGetAccountSummaryMutation,
  useGetCashFlowMutation,
  type CoreAccountEntry,
} from "@/features/account";

/**
 * Fixed chart timeline points ensuring the chart visualization
 * (curves, Y-axis ticks, X-axis labels) remains completely stable and does not change.
 */
const FIXED_CASH_FLOW_CHART: CashFlowPoint[] = [
  { date: "22", inflow: 1100, outflow: 800 },
  { date: " ", inflow: 2000, outflow: 1350 },
  { date: "  ", inflow: 1100, outflow: 1050 },
  { date: "27", inflow: 3400, outflow: 2000 },
  { date: "   ", inflow: 1900, outflow: 600 },
  { date: "02", inflow: 2500, outflow: 1800 },
  { date: "    ", inflow: 600, outflow: 1000 },
  { date: "07", inflow: 2800, outflow: 1900 },
  { date: "     ", inflow: 1400, outflow: 1600 },
  { date: "12", inflow: 3000, outflow: 1200 },
  { date: "      ", inflow: 2000, outflow: 2200 },
  { date: "17", inflow: 1000, outflow: 800 },
  { date: "       ", inflow: 1800, outflow: 1500 },
  { date: "        ", inflow: 3500, outflow: 2400 },
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
}

export default function CashFlowCard({
  accountNumber: propAccountNumber,
  type: propType,
  currency: propCurrency,
  onCurrencyChange: propOnCurrencyChange,
  height = 200,
}: CashFlowCardProps = {}) {
  const [internalCcy, setInternalCcy] = useState<"USD" | "KHR">(propCurrency ?? "USD");
  const ccy = propCurrency ?? internalCcy;

  const accountsResponse = useAppSelector(selectAccountsResponse);
  const bankAccounts = accountsResponse?.accounts ?? [];
  const found = bankAccounts.find((a) => a.accountNumber === propAccountNumber);
  // Match the active account for the selected currency (prioritize Current Account "CA")
  const activeAccount = useMemo(() => {
    if (propAccountNumber) {
      const found = bankAccounts.find((a) => a.accountNumber === propAccountNumber);
      if (found) return found;
    }
    const matchingCcyAccount =
      bankAccounts.find((a: CoreAccountEntry) => a.ccy === ccy && a.accountType === "CA") ??
      bankAccounts.find((a: CoreAccountEntry) => a.ccy === ccy);

    if (matchingCcyAccount) return matchingCcyAccount;

    return (
      bankAccounts.find((a: CoreAccountEntry) => a.accountType === "CA") ??
      bankAccounts[0]
    );
  }, [bankAccounts, ccy, propAccountNumber]);

  const targetAccountNumber = activeAccount?.accountNumber;
  const targetType = propType ?? activeAccount?.accountType ?? "CA";

  const [getAccountSummary, { data: summaryData }] = useGetAccountSummaryMutation();
  const [getCashFlow, { data: cashFlowData }] = useGetCashFlowMutation();

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

  // Extract dynamic Expense and Income from the API response
  const { dynamicExpense, dynamicIncome } = useMemo(() => {
    let res = extractIncomeAndExpense(cashFlowData);
    if (res.income === null || res.expense === null) {
      res = extractIncomeAndExpense(summaryData);
    }

    if (res.income !== null && res.expense !== null) {
      const expFormatted =
        ccy === "USD"
          ? `-$${Math.abs(res.expense).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : `-${Math.abs(res.expense).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} KHR`;

      const incFormatted =
        ccy === "USD"
          ? `$${Math.abs(res.income).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`
          : `${Math.abs(res.income).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} KHR`;

      return {
        dynamicExpense: expFormatted,
        dynamicIncome: incFormatted,
      };
    }

    // Default fallback values matching the design when API has no data or is loading
    return {
      dynamicExpense: ccy === "USD" ? "-$0.00" : "-0.00 KHR",
      dynamicIncome: ccy === "USD" ? "$0.00" : "0.00 KHR",
    };
  }, [cashFlowData, summaryData, ccy]);

  const handleCurrencyChange = (newCcy: string) => {
    const val = newCcy as "USD" | "KHR";
    setInternalCcy(val);
    propOnCurrencyChange?.(val);
  };

  return (
    <CashFlowChart
      data={ FIXED_CASH_FLOW_CHART}
      expenseAmount={dynamicExpense}
      incomeAmount={dynamicIncome}
      activeCurrency={ccy}
      onCurrencyChange={handleCurrencyChange}
      height={height}
      accountNumber={targetAccountNumber}
    />
  );
}
