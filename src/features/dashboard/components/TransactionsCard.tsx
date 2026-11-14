"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Typography } from "@mui/material";
import { Search } from "lucide-react";

import { font, palette, radius, padding } from "@/theme/palette";
import { useAppSelector } from "@/store/hooks";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseFilterButton from "@core/components/BaseFilterButton";
import BaseIconBadge from "@core/components/BaseIconBadge";
import {
  selectAccountsResponse,
  selectTransactionsResponse,
  TransactionFilterDialog,
  useListTransactionsMutation,
  type CoreAccountEntry,
  type TxnStatus,
} from "@/features/account";
import type { TxnDirection } from "../dashboard.types";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import { resolveBaseFilterRange, BASE_FILTER_TYPE_LABELS, type BaseFilterValue } from "@core/components/BaseFilter";

export interface TransactionItem {
  id?: string;
  title: string;
  ref: string;
  date: string;
  rawDate?: string;
  time: string;
  account: string;
  amount: number;
  currency?: string;
  direction: TxnDirection;
  status: TxnStatus;
}

/** Pill label → the `status` value it filters the list down to. */
const STATUS_TABS = {
  Processed: "processed",
  Pending: "pending",
} as const satisfies Record<string, TxnStatus>;

type StatusTab = keyof typeof STATUS_TABS;

const FETCH_LIMIT = 50;
const ROWS_PER_PAGE = 5;

/** Column widths, as the share of the table each one takes. To/From takes the
 *  slack — Account stays narrow so it sits near the amount instead of leaving a
 *  gap between them. */
const COLUMN_WIDTHS = ["46%", "23%", "17%", "14%"] as const;

/** The card's inner gutter. Columns butt up against each other, so only the
 *  outer edges carry horizontal padding — the rest sit flush. */
const TABLE_PX = 1.75;

const HEAD_CELL_SX = {
  pt: 0,
  pb: 2,
  fontSize: 15,
  fontWeight: font.weight.regular,
} as const;
const BODY_CELL_SX = { py: 2.75 } as const;

const formatTxnAmount = (amount: number, currency = "USD") => {
  const sign = amount < 0 ? "-" : "";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (currency.toUpperCase() === "KHR") {
    return `${sign}${formatted} KHR`;
  }
  return `${sign}$${formatted}`;
};

/**
 * Splits "Savings - 000 067 898" into the two lines the Account column shows:
 * the product name on top, the masked number below. Only the first and last
 * three digits stay readable — everything between them becomes asterisks.
 */
const splitAccount = (account: string) => {
  if (!account || account === "-") {
    return { label: "-", masked: "" };
  }
  const [label, ...rest] = account.split(" - ");
  const rawNum = rest.join(" - ").trim();
  const digits = rawNum.replace(/\D/g, "");
  const masked =
    digits.length > 6
      ? `${digits.slice(0, 3)}${"*".repeat(digits.length - 6)}${digits.slice(-3)}`
      : rawNum || "";
  return { label: label || "Account", masked };
};

export interface TransactionsCardProps {
  accounts?: CoreAccountEntry[];
  accountNumber?: string;
  type?: string;
}

export default function TransactionsCard({
  accounts: externalAccounts,
  accountNumber,
  type,
}: TransactionsCardProps) {
  const [statusTab, setStatusTab] = useState<StatusTab>("Processed");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>({
    type: "last7Days",
    from: null,
    to: null,
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [allTransactions, setAllTransactions] = useState<TransactionItem[]>([]);
  const [isFetching, setIsFetching] = useState(false);

  const accountsResponse = useAppSelector(selectAccountsResponse);
  const [listTransactions] = useListTransactionsMutation();

  useEffect(() => {
    const targetAccounts =
      externalAccounts && externalAccounts.length > 0
        ? externalAccounts
        : accountNumber
        ? [
            {
              accountNumber,
              accountType: type ?? "CA",
              accountName: type === "CA" ? "Current Account" : "Savings Account",
              ccy: "USD",
            } as CoreAccountEntry,
          ]
        : (accountsResponse?.accounts ?? []);

    if (targetAccounts.length === 0) {
      setAllTransactions([]);
      return;
    }

    let isMounted = true;
    setIsFetching(true);

    const range = resolveBaseFilterRange(dateFilter);
    const fetchPromises = targetAccounts.map(async (acc) => {
      try {
        const res = await listTransactions({
          accountNumber: acc.accountNumber,
          type: acc.accountType ?? acc.type ?? "",
          startedDate: range?.start.toISOString(),
          endedDate: range?.end.toISOString(),
          limit: FETCH_LIMIT,
          offset: 0,
        }).unwrap();
        return { account: acc, rows: res.rows };
      } catch {
        return { account: acc, rows: [] };
      }
    });

    Promise.all(fetchPromises)
      .then((results) => {
        if (!isMounted) return;
        const mapped: TransactionItem[] = [];
        results.forEach(({ account: acc, rows }) => {
          rows.forEach((entry) => {
            const isNegative =
              entry.transactionType === "D" || entry.transactionAmount < 0;
            const accountLabel =
              acc.accountName ||
              acc.accountClassDescription ||
              (acc.accountType === "CA" ? "Current Account" : "Savings Account");
            mapped.push({
              id: entry.transactionId,
              title:
                entry.transactionDescription ||
                entry.transactionCode ||
                entry.toAccountName ||
                "Transaction",
              ref: entry.transactionReferenceCode || entry.transactionId || "-",
              date: entry.transactionDate
                ? dayjs(entry.transactionDate).format("DD MMM YYYY")
                : "-",
              rawDate: entry.transactionDate,
              time:
                entry.transactionTime ||
                (entry.transactionDate
                  ? dayjs(entry.transactionDate).format("h:mm A")
                  : "-"),
              account: `${accountLabel} - ${acc.accountNumber}`,
              amount: entry.transactionAmount,
              currency: entry.transactionCurrency || acc.ccy || "USD",
              direction: isNegative ? "out" : "in",
              status: "processed",
            });
          });
        });

        mapped.sort((a, b) => {
          const timeA = a.rawDate ? dayjs(a.rawDate).valueOf() : 0;
          const timeB = b.rawDate ? dayjs(b.rawDate).valueOf() : 0;
          return timeB - timeA;
        });

        setAllTransactions(mapped);
      })
      .finally(() => {
        if (isMounted) setIsFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, [
    externalAccounts,
    accountNumber,
    type,
    dateFilter,
    accountsResponse?.accounts,
    listTransactions,
  ]);

  useEffect(() => {
    setPage(0);
  }, [externalAccounts, accountNumber]);

  const allRows = allTransactions;

  const filteredRows = useMemo(() => {
    const wantedStatus = STATUS_TABS[statusTab];
    const q = search.trim().toLowerCase();
    return allRows.filter((r) => {
      if (r.status !== wantedStatus) return false;
      if (!q) return true;
      return (
        r.title.toLowerCase().includes(q) ||
        r.ref.toLowerCase().includes(q) ||
        r.account.toLowerCase().includes(q)
      );
    });
  }, [allRows, search, statusTab]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);

  const columns: BaseTableColumn<TransactionItem>[] = [
    {
      key: "toFrom",
      header: "To/From",
      width: COLUMN_WIDTHS[0],
      headSx: { ...HEAD_CELL_SX, pl: TABLE_PX, pr: 0 },
      cellSx: { ...BODY_CELL_SX, pl: TABLE_PX, pr: 0 },
      render: (t) => {
        const isNegative = t.direction === "out" || t.amount < 0;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2.75 }}>
            {/* Circular arrow icon — out is debit-red, in is credit-green. */}
            <BaseIconBadge
              direction={isNegative ? "expense" : "income"}
              iconSrc={
                isNegative
                  ? "/assets/icons/expense-icon.svg"
                  : "/assets/icons/income-icon.svg"
              }
            />

            <Box>
              <Typography
                sx={{
                  fontSize: 15,
                  color: palette.slate[900],
                  lineHeight: 1.25,
                }}
              >
                {t.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: palette.slate[450],
                  lineHeight: 1.5,
                  mt: 0.5,
                }}
              >
                Ref: {t.ref}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      key: "date",
      header: "Transaction Date",
      width: COLUMN_WIDTHS[1],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      // Date over time.
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              color: palette.slate[900],
              lineHeight: 1.5,
            }}
          >
            {t.date}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: palette.slate[450],
              lineHeight: 1.25,
              mt: 0.5,
            }}
          >
            {t.time}
          </Typography>
        </Box>
      ),
    },
    {
      key: "account",
      header: "Account",
      width: COLUMN_WIDTHS[2],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      // Product name over the masked number.
      render: (t) => {
        const account = splitAccount(t.account);
        return (
          <Box>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 500,
                color: palette.slate[900],
                lineHeight: 1.5,
              }}
            >
              {account.label}
            </Typography>
            <Typography
              sx={{
                fontSize: 12,
                color: palette.slate[450],
                lineHeight: 1.25,
                mt: 0.5,
              }}
            >
              {account.masked}
            </Typography>
          </Box>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      width: COLUMN_WIDTHS[3],
      headSx: { ...HEAD_CELL_SX, fontWeight: font.weight.medium, pl: 0, pr: TABLE_PX },
      cellSx: { ...BODY_CELL_SX, pl: 0, pr: TABLE_PX },
      render: (t) => (
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: palette.slate[900],
          }}
        >
          <BaseBlurText>{formatTxnAmount(t.amount, t.currency)}</BaseBlurText>
        </Typography>
      ),
    },
  ];

  return (
    <BaseCard >
      {/* ---------- Header Row: title + status pills + search + date filter ---------- */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 4,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            color: palette.slate[900],
            lineHeight: 1.2,
          }}
        >
          Transactions
        </Typography>

        {/* Every control shares the title's line, grouped to the right.
            Each is 40px tall so they line up with each other. */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          {/* Search Input */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              height: 40,
              borderRadius: `${radius.md}px`,
              border: `1px solid ${palette.slate[200]}`,
              bgcolor: "#FFFFFF",
              width: { xs: "100%", sm: 220 },
            }}
          >
            <Search size={18} color={palette.slate[400]} />
            <Box
              component="input"
              type="text"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                border: "none",
                outline: "none",
                fontSize: 14,
                color: palette.slate[900],
                bgcolor: "transparent",
                width: "100%",
                "&::placeholder": {
                  color: palette.slate[400],
                },
              }}
            />
          </Box>

          {/* Date Filter */}
          <BaseFilterButton
            active={dateFilter.type !== "all" && dateFilter.type !== "last7Days"}
            open={filterDialogOpen}
            label={BASE_FILTER_TYPE_LABELS[dateFilter.type] ?? "Last 7 days"}
            onClick={() => setFilterDialogOpen((prev) => !prev)}
          />
        </Box>
      </Box>

      {/* ---------- Table + Pagination ---------- */}
      {/* BaseTable slices `filteredRows` itself from the pagination props. */}
      <BaseTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(t) => `${t.id || t.ref}-${t.account}`}
        minWidth={640}
        rounded={false}
        headerBgColor={palette.white}
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[500]}
        headerBorderTop={false}
        isLoading={isFetching}
        emptyTitle={`No ${statusTab.toLowerCase()} transactions`}
        getRowSx={() => ({
          "&:hover": {
            bgcolor: palette.slate[50],
            borderRadius: `${radius.md}px`,
          },
          "& td": { borderBottom: `1px solid ${palette.slate[50]}` },
        })}
        pagination={{
          count: filteredRows.length,
          page: currentPage,
          rowsPerPage: ROWS_PER_PAGE,
          onPageChange: setPage,
        }}
        paginationVariant="compact"
        // BaseTable spaces the pager 40px off the table; this card wants 16px.
        paginationSx={{ mt: -3 }}
      />

      {/* Date Filter Dialog */}
      <TransactionFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        value={dateFilter}
        onApply={(newVal) => {
          setDateFilter(newVal);
          setPage(0);
        }}
      />
    </BaseCard>
  );
}
