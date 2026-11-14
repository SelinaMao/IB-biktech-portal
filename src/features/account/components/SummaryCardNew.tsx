"use client";

import React, { useEffect, useMemo } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseIconBadge from "@core/components/BaseIconBadge";
import BasePieChart, { DEFAULT_PIE_COLORS, type PieDatum } from "@core/components/PieChart";
import { font, palette } from "@/theme/palette";
import type { SummaryCardProps, CoreAccountEntry } from "../account.types";
import { useGetAccountSummaryMutation, useGetCashFlowMutation } from "../account.api";
import { DollarSign } from "lucide-react";
import CardBorderAccent from "./CardBorderAccent";
import BaseCard from "@/@core/components/BaseCard";

/** Formats dynamic amount as "293,000.00 USD" or "120,293,000.00 KHR" */
function formatCurrencySuffix(amount: number, ccy: "USD" | "KHR"): string {
    const formatted = amount.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${formatted} ${ccy}`;
}

/** Extract total income and expense from various potential API response shapes, matching Dashboard */
function extractIncomeAndExpense(raw: unknown): { income: number | null; expense: number | null } {
    if (!raw) return { income: null, expense: null };

    const rawObj = raw as Record<string, unknown>;
    const payload = (rawObj?.data ?? rawObj) as Record<string, any>;

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


// function renderAmount(val: string, color: string) {
//     const dotIndex = val.lastIndexOf(".");
//     if (dotIndex !== -1) {
//         const main = val.slice(0, dotIndex);
//         const decimals = val.slice(dotIndex);
//         return (
//             <Box
//                 component="span"
//                 sx={{ display: "inline-flex", alignItems: "flex-start", color }}
//             >
//                 <Typography
//                     component="span"
//                     sx={{
//                         fontSize: { xs: 15, sm: 20 },
//                         fontWeight: 700,
//                         color: "inherit",
//                         lineHeight: 1.25,
//                     }}
//                 >
//                     {main}
//                 </Typography>
//                 <Typography
//                     component="span"
//                     sx={{
//                         fontSize: 11,
//                         fontWeight: 700,
//                         color: "inherit",
//                         lineHeight: 1.25,
//                         ml: 0.1,
//                         mt: "1px",
//                     }}
//                 >
//                     {decimals}
//                 </Typography>
//             </Box>
//         );
//     }
//     return (
//         <Typography
//             component="span"
//             sx={{
//                 fontSize: { xs: 15, sm: 16 },
//                 fontWeight: 700,
//                 color,
//                 lineHeight: 1.25,
//             }}
//         >
//             {val}
//         </Typography>
//     );
// }

export default function SummaryCardNew({
    label = "Account Summary",
    value,
    sub,
    accounts = [],
    summary,
    chartData,
    expenseAmount,
    incomeAmount,
    accountSummary,
    transactions,
    currency = "USD",
    sx,
    showCashFlow = false,
}: SummaryCardProps & { showCashFlow?: boolean }) {
    // Target account for dynamic cash-flow and account summary fetching, matching Dashboard
    const activeAccount = useMemo(() => {
        const matchingCcyAccount =
            accounts.find((a: CoreAccountEntry) => a.ccy === currency && a.accountType === "CA") ??
            accounts.find((a: CoreAccountEntry) => a.ccy === currency) ??
            accounts.find((a: CoreAccountEntry) => a.accountType === "CA") ??
            accounts[0];
        return matchingCcyAccount;
    }, [accounts, currency]);

    const targetAccountNumber = activeAccount?.accountNumber;
    const targetType = activeAccount?.accountType ?? "CA";

    // Dashboard mutation hooks for live dynamic expense & income
    const [getAccountSummary, { data: summaryData }] = useGetAccountSummaryMutation();
    const [getCashFlow, { data: cashFlowData }] = useGetCashFlowMutation();

    useEffect(() => {
        if (!targetAccountNumber) return;

        // Trigger getAccountSummary mutation
        getAccountSummary({
            accountNumber: targetAccountNumber,
            type: targetType,
        });

        // Trigger getCashFlow mutation
        getCashFlow({
            accountNumber: targetAccountNumber,
            type: targetType,
        })
            .unwrap()
            .catch(() => {
                // Fallback silently if transactions/dashboard is not mounted
            });
    }, [targetAccountNumber, targetType, getAccountSummary, getCashFlow]);

    // Dynamic balances
    const displayUsd = useMemo(() => {
        if (value) {
            if (value.toUpperCase().includes("USD")) return value;
            return `${value} USD`;
        }
        if (summary?.totalBalanceUSD !== undefined) {
            return formatCurrencySuffix(summary.totalBalanceUSD, "USD");
        }
        const sum = accounts
            .filter((a) => a.ccy === "USD" || !a.ccy)
            .reduce((total, a) => total + (Number(a.availableBalance) || 0), 0);
        return sum > 0 ? formatCurrencySuffix(sum, "USD") : "293,000.00 USD";
    }, [value, summary, accounts]);

    const displayKhr = useMemo(() => {
        if (sub) {
            if (sub.toUpperCase().includes("KHR")) return sub;
            return `${sub} KHR`;
        }
        if (summary?.totalBalanceKHR !== undefined) {
            return formatCurrencySuffix(summary.totalBalanceKHR, "KHR");
        }
        const sum = accounts
            .filter((a) => a.ccy === "KHR")
            .reduce((total, a) => total + (Number(a.availableBalance) || 0), 0);
        return sum > 0 ? formatCurrencySuffix(sum, "KHR") : "120,293,000.00 KHR";
    }, [sub, summary, accounts]);

    // Dynamic 4-color donut chart
    // Dynamic 4-color donut chart
    const pieData = useMemo<PieDatum[]>(() => {
        if (chartData && chartData.length > 0) return chartData;   // <- this line makes chartData work

        if (!accounts || accounts.length === 0) {
            return [
                { name: "Savings", value: 1, color: DEFAULT_PIE_COLORS[0] },
                // ...
            ];
        }

        return accounts.map((acc, index) => ({
            name: acc.accountName || `Account ${index + 1}`,
            value: 1,
            color: DEFAULT_PIE_COLORS[index % DEFAULT_PIE_COLORS.length],
        }));
    }, [chartData, accounts]);

    const totalAccountCount = useMemo(() => {
        if (accounts.length > 0) return accounts.length;
        return pieData.reduce((sum, d) => sum + d.value, 0);
    }, [accounts, pieData]);

    // Dynamic Expense & Income like Dashboard
    const { displayExpense, displayIncome } = useMemo(() => {
        // 1. Explicit string or number prop
        if (typeof expenseAmount === "string" && typeof incomeAmount === "string") {
            return { displayExpense: expenseAmount, displayIncome: incomeAmount };
        }

        // 2. Extract from live getCashFlow or getAccountSummary data (like dashboard)
        let res = extractIncomeAndExpense(cashFlowData);
        if (res.income === null || res.expense === null) {
            res = extractIncomeAndExpense(summaryData);
        }
        if (res.income === null || res.expense === null) {
            res = extractIncomeAndExpense(accountSummary);
        }

        // 3. Fallback to direct props or summary
        let finalExpenseNum: number | null = res.expense;
        let finalIncomeNum: number | null = res.income;

        if (finalExpenseNum === null) {
            if (typeof expenseAmount === "number") finalExpenseNum = expenseAmount;
            else if (summary?.totalExpense !== undefined) finalExpenseNum = summary.totalExpense;
        }
        if (finalIncomeNum === null) {
            if (typeof incomeAmount === "number") finalIncomeNum = incomeAmount;
            else if (summary?.totalIncome !== undefined) finalIncomeNum = summary.totalIncome;
        }

        // 4. From transactions prop if passed
        if ((finalExpenseNum === null || finalIncomeNum === null) && transactions && transactions.length > 0) {
            let tOut = 0;
            let tIn = 0;
            for (const t of transactions) {
                const amt = Math.abs(Number(t.transactionAmount ?? 0) || 0);
                const type = t.transactionType ?? "";
                if (type === "D" || Number(t.transactionAmount ?? 0) < 0) {
                    tOut += amt;
                } else if (type === "C" || Number(t.transactionAmount ?? 0) > 0) {
                    tIn += amt;
                }
            }
            if (finalExpenseNum === null && tOut > 0) finalExpenseNum = tOut;
            if (finalIncomeNum === null && tIn > 0) finalIncomeNum = tIn;
        }

        // Format like Dashboard
        const symbol = currency === "KHR" ? "៛" : "$";
        const formatValue = (num: number | null, fallback: string, isExpense: boolean) => {
            if (num !== null && num !== undefined && !isNaN(num) && num > 0) {
                const formatted = num.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                });
                return isExpense ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
            }
            return fallback;
        };

        const expStr =
            typeof expenseAmount === "string"
                ? expenseAmount
                : formatValue(finalExpenseNum, "-$23,000.90", true);

        const incStr =
            typeof incomeAmount === "string"
                ? incomeAmount
                : formatValue(finalIncomeNum, "$3,000.90", false);

        return { displayExpense: expStr, displayIncome: incStr };
    }, [
        expenseAmount,
        incomeAmount,
        cashFlowData,
        summaryData,
        accountSummary,
        summary,
        transactions,
        currency,
    ]);

    return (
        <BaseCard
            sx={[
                {
                    height: "196px",
                    borderRadius: "20px",
                    p: { xs: 2.5, sm: "20px 24px" },
                    bgcolor: "#FFFFFF",
                    position: "relative",
                    // border: `1px solid ${palette.slate[200]}`,
                    boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
                },
                ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
            ]}
        >
            {/* <CardBorderAccent
                color="#74C0A8"
                type="bottom-left"
                width={95.89}
                height={98.77}
                top={-16.73}
                left={-13.32}
            /> */}
            <CardBorderAccent color="#74C0A8" type="bottom-left" strokeWidth={2.5} tailLength={60} width={90} height={80} top={0} left={0} />

            <Typography
                sx={{
                    fontSize: { xs: 20, md: 24 },
                    fontWeight: 700,
                    color: "#0F172A",
                    lineHeight: 1.25,
                    mb: 2.5,
                }}
            >
                {label || "Account Summary"}
            </Typography>

            <Stack
                marginTop={5}
                direction={{ xs: "column", lg: "row" }}
                alignItems={{ xs: "flex-start", lg: "center" }}
                justifyContent="space-between"
                spacing={{ xs: 2.5, lg: 4 }}
            >
                {/* Left Section: 4-Color Donut Chart + Available Balance (KHR & USD) */}
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    spacing={{ xs: 2.5, sm: 4, md: 7 }}
                    sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
                >
                    {/* 4-Color Donut Chart with '4 accounts' centered */}
                    <BasePieChart
                        data={pieData}
                        size={110}
                        thickness={16}
                        startAngle={-45}
                        centerValue={totalAccountCount}
                        centerLabel={totalAccountCount === 1 ? "account" : "accounts"}
                        centerColor={palette.slate[900]}
                    />

                    {/* Balances stack */}
                    <Stack
                        direction={{ xs: "column", sm: "row" }}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        spacing={{ xs: 2, sm: 5, md: 7 }}
                    >
                        {/* KHR Item */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <BaseIconBadge
                                direction="income"
                                bgColor="#FFF4E8"
                                icon={
                                    <svg width="24" height="24" viewBox="0 0 28 28" aria-hidden="true">
                                        <text
                                            x="50%"
                                            y="50%"
                                            textAnchor="middle"
                                            dominantBaseline="central"
                                            fontSize="24"
                                            fontWeight={font.weight.medium}
                                            fill={palette.orange}
                                        >
                                            ៛
                                        </text>
                                    </svg>
                                }
                            />
                            <Box>
                                <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 400, lineHeight: 1.2 }}>
                                    KHR
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: { xs: 17, sm: 19 },
                                        fontWeight: 700,
                                        color: "#0F172A",
                                        mt: 0.5,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    <BaseBlurText>{displayKhr}</BaseBlurText>
                                </Typography>
                            </Box>
                        </Stack>

                        {/* USD Item */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                            <BaseIconBadge
                                direction="income"
                                bgColor="#EAF6EE"
                                icon={<DollarSign color="#16A34A" size={20} />}
                            />
                            <Box>
                                <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 400, lineHeight: 1.2 }}>
                                    USD
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: { xs: 17, sm: 19 },
                                        fontWeight: 700,
                                        color: "#0F172A",
                                        mt: 0.5,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    <BaseBlurText>{displayUsd}</BaseBlurText>
                                </Typography>
                            </Box>
                        </Stack>
                    </Stack>
                </Stack>

                {/* Right Section: Divider + Cash Flow (Expense & Income) */}
                {showCashFlow && (
                    <Stack
                        direction="row"
                        alignItems="center"
                        spacing={{ xs: 2.5, sm: 8 }}
                        sx={{
                            alignSelf: { xs: "stretch", lg: "center" },
                            justifyContent: { xs: "space-between", lg: "flex-end" },
                            pt: { xs: 1, lg: 6 },
                            borderTop: { xs: `1px solid ${palette.slate[100]}`, lg: "none" },
                        }}
                    >
                        <Divider
                            orientation="vertical"
                            flexItem
                            sx={{
                                borderColor: palette.slate[200],
                                height: 70,
                                alignSelf: "center",
                                display: { xs: "none", lg: "block" },
                                mr: { lg: 3 },
                            }}
                        />

                        {/* Expense Item */}
                        <Stack direction="row" alignItems="center" spacing={2.5}>
                            <BaseIconBadge
                                direction="expense"
                                iconSrc="/assets/icons/expense-icon.svg"
                                size={36}
                                iconSize={18}
                            />
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 15,
                                        color: palette.slate[500],
                                        fontWeight: 300,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Expense
                                </Typography>
                                <Box sx={{ mt: 0.25, color: "#DC2626", fontSize: "20px", fontWeight: 600 }}>
                                    <BaseBlurText>
                                        {displayExpense}
                                    </BaseBlurText>
                                </Box>
                            </Box>
                        </Stack>

                        {/* Income Item */}
                        <Stack direction="row" alignItems="center" spacing={2.5}>
                            <BaseIconBadge
                                direction="income"
                                iconSrc="/assets/icons/income-icon.svg"
                                size={36}
                                iconSize={18}
                            />
                            <Box>
                                <Typography
                                    sx={{
                                        fontSize: 15,
                                        color: palette.slate[500],
                                        fontWeight: 300,
                                        lineHeight: 1.2,
                                    }}
                                >
                                    Income
                                </Typography>
                                <Box sx={{ mt: 0.25, color: "#16A34A", fontSize: "20px", fontWeight: 600 }}>
                                    <BaseBlurText>
                                        {displayIncome}
                                    </BaseBlurText>
                                </Box>
                            </Box>
                        </Stack>
                    </Stack>
                )}
            </Stack>
        </BaseCard>
    );
}
