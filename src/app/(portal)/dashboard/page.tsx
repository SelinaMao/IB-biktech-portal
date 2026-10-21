"use client";

import React, { useEffect, useMemo } from "react";
import { Box, Grid, Stack } from "@mui/material";
import {
  statCards,
  StatCard,
  TransactionsCard,
  ScheduleCard,
  ExchangeRatesCard,
  PendingRequestsCard,
} from "@/features/dashboard";
import { selectAccountsResponse, useListAccountsMutation, type CoreAccountEntry } from "@/features/account";
import { useGetExchangeRatesQuery } from "@/features/meta";
import { useAppSelector } from "@/store/hooks";
import { formatCCY } from "@/utils/format-ccy";
import CashFlowChart, { CashFlowPoint } from "@/@core/components/CashFlowChart";

export default function ClientDashboardPage() {
  // `listAccounts` is a mutation with no fetch-on-mount of its own — trigger
  // it manually and read the response back from the slice, same pattern as
  // account/page.tsx. Only "Available Balance" is replaced with live data.
  const [listAccounts] = useListAccountsMutation();
  useEffect(() => {
    listAccounts();
  }, [listAccounts]);

  const accountsResponse = useAppSelector(selectAccountsResponse);
  const accountsSummary = accountsResponse?.summary;

  const {
    data: exchangeRatesData,
    isLoading: isExchangeRatesLoading,
    isError: isExchangeRatesError,
  } = useGetExchangeRatesQuery();

  // "Latest Transactions" needs one account to query — default to the first
  // current account, same preference as account/page.tsx.
  const bankAccounts = accountsResponse?.accounts ?? [];
  const defaultAccount =
    bankAccounts.find((account: CoreAccountEntry) => account.accountType === "CA") ??
    bankAccounts[0];

  const kpiCards = useMemo(() => {
    if (!accountsSummary) return statCards;
    const [availableBalance, ...rest] = statCards;
    return [
      {
        ...availableBalance,
        value: `${Number(accountsSummary.totalBalanceUSD).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} USD`,
        sub: `${Number(accountsSummary.totalBalanceKHR).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} KHR`,
      },
      ...rest,
    ];
  }, [accountsSummary]);

  const SAMPLE_CASH_FLOW: CashFlowPoint[] = [
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

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <Stack spacing={2.5}>
        {/* Full-width Top Card: Available Balance */}
        {kpiCards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}

        {/* Two-Column Grid: Left (Cash Flow, Transactions) & Right (Pending Request, Schedule, Exchange rate) */}
        <Grid container spacing={2.5}>
          {/* Left Column (8 cols) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2.5}>
              <CashFlowChart
                data={SAMPLE_CASH_FLOW}
                height={200}
                onCurrencyChange={() => {
                  // TODO(api): refetch DASHBOARD.INFLOW_OUTFLOW with the selected ccy.
                }}
              />

              <TransactionsCard
                accountNumber={defaultAccount?.accountNumber}
                type={defaultAccount?.accountType}
              />
            </Stack>
          </Grid>

          {/* Right Column (4 cols) */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.5}>
              <PendingRequestsCard />
              <ScheduleCard />
              <ExchangeRatesCard
                data={exchangeRatesData}
                isLoading={isExchangeRatesLoading}
                isError={isExchangeRatesError}
              />
            </Stack>
          </Grid>
        </Grid>
      </Stack>
    </Box>
  );
}
