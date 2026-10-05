"use client";

import { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Stack, Typography } from "@mui/material";
import { NorthEastRounded, SouthWestRounded } from "@mui/icons-material";

import { palette } from "@/theme/palette";
import { useAppSelector } from "@/store/hooks";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import BaseSwitch from "@core/form/BaseSwitch";
import { selectTransactionsResponse, useListTransactionsMutation } from "@/features/account";
import { USD_TO_KHR_RATE } from "../dashboard.data";
import type { TxnDirection } from "../dashboard.types";
import SectionCard from "./SectionCard";

type Transaction = {
  title: string;
  ref: string;
  date: string;
  amount: number;
  direction: TxnDirection;
};

// How many rows to fetch from the server vs. show per page — mirrors
// TransactionsList's client-side pagination over a larger fetched list.
const FETCH_LIMIT = 20;
const ROWS_PER_PAGE = 5;

const formatAmount = (amount: number, ccy: string) => {
  const sign = amount >= 0 ? "+" : "-";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted} ${ccy}`;
};

export interface TransactionsCardProps {
  /** Account whose latest transactions are shown — omitted while `listAccounts` is still loading. */
  accountNumber?: string;
  type?: string;
}

export default function TransactionsCard({ accountNumber, type }: TransactionsCardProps) {
  const [currency, setCurrency] = useState("USD");
  const currencies = ["USD", "KHR"];
  const [page, setPage] = useState(0);

  // Same pattern as account/page.tsx: `listTransactions` is a mutation with
  // no fetch-on-mount/caching of its own — trigger it manually and read the
  // response back from the shared account slice.
  const [listTransactions] = useListTransactionsMutation();
  useEffect(() => {
    if (!accountNumber) return;
    // No startedDate/endedDate — this widget has no date filter of its own,
    // so it asks for the latest rows with no date bounds.
    listTransactions({
      accountNumber,
      type: type ?? "",
      limit: FETCH_LIMIT,
      offset: 0,
    });
  }, [accountNumber, type, listTransactions]);
  // Reset to page 1 whenever the fetched list changes underneath it.
  useEffect(() => {
    setPage(0);
  }, [accountNumber]);

  const transactionsResponse = useAppSelector(selectTransactionsResponse);
  const apiTransactions = useMemo(
    () =>
      transactionsResponse && transactionsResponse.accountNumber === accountNumber
        ? transactionsResponse.data.map(
            (entry): Transaction => ({
              title: entry.transactionDescription || entry.transactionCode,
              ref: entry.transactionId,
              date: entry.transactionDate ? dayjs(entry.transactionDate).format("DD MMM YYYY") : "",
              amount: entry.transactionAmount,
              direction: entry.transactionAmount >= 0 ? "in" : "out",
            }),
          )
        : undefined,
    [transactionsResponse, accountNumber],
  );
  // Loading until this account's latest request lands; a failed one shows as an error.
  const transactionsStatus =
    transactionsResponse && transactionsResponse.accountNumber === accountNumber ? transactionsResponse.status : "loading";
  const isLoading = Boolean(accountNumber) && transactionsStatus === "loading";
  const rows = apiTransactions ?? [];
  const pageCount = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = rows.slice(currentPage * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE);

  const columns: BaseTableColumn<Transaction>[] = [
    {
      key: "detail",
      header: "Detail / Reference",
      width: "50%",
      render: (t) => {
        const isIn = t.direction === "in";
        return (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: isIn ? palette.navy[900] : palette.danger.bg,
                color: isIn ? palette.navy[100] : palette.danger.main,
              }}
            >
              {isIn ? <SouthWestRounded sx={{ fontSize: 16 }} /> : <NorthEastRounded sx={{ fontSize: 16 }} />}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{t.title}</Typography>
              <Typography variant="caption">Ref: {t.ref}</Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      key: "date",
      header: "Transaction Date",
      render: (t) => <Typography variant="body2">{t.date}</Typography>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (t) => {
        const isIn = t.direction === "in";
        return (
          <Typography
            sx={{
              fontWeight: 600,
              color: isIn ? palette.navy[100] : palette.danger[500],
            }}
          >
            <BaseBlurText style={{ fontSize: 16 }}>{formatAmount(currency === "KHR" ? t.amount * USD_TO_KHR_RATE : t.amount, currency)}</BaseBlurText>
          </Typography>
        );
      },
    },
  ];

  return (
    <SectionCard
      title="Latest Transactions"
      header={
        <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
          {/* <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
            {accountNumber}
          </Typography> */}

          <BaseSwitch value={currency} onChange={setCurrency} options={currencies.map((ccy) => ({ value: ccy, label: ccy }))} />
        </Stack>
      }
      showBorder={false}
    >
      <BaseTable
        columns={columns}
        rows={pageItems}
        getRowKey={(t) => t.ref}
        isLoading={isLoading}
        emptyTitle={transactionsStatus === "failed" ? "Could not load transactions." : undefined}
        emptyDescription={transactionsStatus === "failed" ? "Please try again." : undefined}
        headerBgColor={palette.slate[50]}
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[400]}
        rounded={false}
        pagination={
          rows.length > 0
            ? {
                count: rows.length,
                page: currentPage,
                rowsPerPage: ROWS_PER_PAGE,
                onPageChange: setPage,
              }
            : undefined
        }
        paginationVariant="compact"
      />
    </SectionCard>
  );
}
