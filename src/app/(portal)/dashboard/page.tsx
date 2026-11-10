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
  CashFlowCard,
} from "@/features/dashboard";
import { selectAccountsResponse, useListAccountsMutation, type CoreAccountEntry } from "@/features/account";
import { useGetExchangeRatesQuery } from "@/features/meta";
import { useAppSelector } from "@/store/hooks";

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

  // Left/right columns are independent Stacks inside the same Grid row, so
  // MUI already stretches both Grid cells to match the taller one — but the
  // Stack itself doesn't fill that height. Letting the last card grow into
  // the leftover space keeps both columns' bottoms aligned no matter how
  // much data each side renders (fewer transactions, fewer schedule rows...).
  const stretchLastCardSx = {
    height: "100%",
    "& > *:last-child": { flexGrow: 1 },
  } as const;

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

  return (
    <Box sx={{ width: "100%", pb: 4 }}>
      <Stack spacing={2.5}>
        {/* Full-width Top Card: Available Balance */}

        {/* Two-Column Grid: Left (Available Balance, Cash Flow, Transactions) & Right (Pending Request, Schedule, Exchange rate) */}
        <Grid container spacing={2.5}>
          {/* Left Column (8 cols) */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2.5} sx={stretchLastCardSx}>
              {/* Top Card: Available Balance */}
              {kpiCards.map((c) => (
                <StatCard key={c.label} {...c} />
              ))}

              <CashFlowCard
                accountNumber={defaultAccount?.accountNumber}
                type={defaultAccount?.accountType}
              />

              <TransactionsCard
                accountNumber={defaultAccount?.accountNumber}
                type={defaultAccount?.accountType}
              />
            </Stack>
          </Grid>

          {/* Right Column (4 cols) */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2.5} sx={stretchLastCardSx}>
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
