"use client";

import React, { useEffect, useMemo } from "react";
import { Box, Grid, Stack } from "@mui/material";
import {
  statCards,
  StatCard,
  TransactionsCard,
  ScheduleCard,
  ExchangeRatesCard,
  Banner,
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
        value: formatCCY(accountsSummary.totalBalanceUSD, "USD"),
        sub: formatCCY(accountsSummary.totalBalanceKHR, "KHR"),
      },
      ...rest,
    ];
  }, [accountsSummary]);

  const SAMPLE_CASH_FLOW: CashFlowPoint[] = [
    { date: "Jul 12", inflow: 2_500, outflow: 1_960 },
    { date: "Jul 13", inflow: 2_870, outflow: 2_420 },
    { date: "Jul 14", inflow: 1_964, outflow: 2_090 },
    { date: "Jul 15", inflow: 3_356, outflow: 2_648 },
    { date: "Jul 16", inflow: 3_086, outflow: 2_998 },
    { date: "Jul 17", inflow: 3_792, outflow: 2_824 },
    { date: "Jul 18", inflow: 3_442, outflow: 3_134 },
  ];

  return (
    <Box sx={{ width: "100%" }}>
      <Grid container spacing={2.5}>
        {/* KPI row */}
        {kpiCards.map((c) => (
          <Grid key={c.label} size={{ xs: 12, sm: 6, lg: 4 }}>
            <StatCard {...c} />
          </Grid>
        ))}

      </Grid>

      {/* Row: cash flow chart | payment schedule — stretched to equal height */}
      <Grid container spacing={2.5} sx={{ mt: 2.5, alignItems: "stretch" }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <CashFlowChart
            data={SAMPLE_CASH_FLOW}
            height={160}
            onCurrencyChange={() => {
              // TODO(api): refetch DASHBOARD.INFLOW_OUTFLOW with the selected ccy.
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <ScheduleCard />
        </Grid>
      </Grid>

      {/* Row: latest transactions | exchange rates + banner — stretched to equal height */}
      <Grid container spacing={2.5} sx={{ mt: 2.5, alignItems: "stretch" }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <TransactionsCard accountNumber={defaultAccount?.accountNumber} type={defaultAccount?.accountType} />
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2.5} >
            <ExchangeRatesCard
              data={exchangeRatesData}
              isLoading={isExchangeRatesLoading}
              isError={isExchangeRatesError}
            />
            <Banner />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
