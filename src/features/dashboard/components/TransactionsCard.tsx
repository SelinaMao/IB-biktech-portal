"use client";

import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, Typography } from "@mui/material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import { ArrowDownLeft, ArrowUpRight, Search } from "lucide-react";

import { font, palette, radius, padding } from "@/theme/palette";
import { useAppSelector } from "@/store/hooks";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import {
  selectTransactionsResponse,
  useListTransactionsMutation,
  type TxnStatus,
} from "@/features/account";
import type { TxnDirection } from "../dashboard.types";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import BaseFilterByDay from "@/@core/components/BaseFilterByDay";
import BaseFilter, {
  BASE_FILTER_TYPE_LABELS,
  type BaseFilterTypeOption,
  type BaseFilterValue,
} from "@/@core/components/BaseFilter";

export interface TransactionItem {
  id?: string;
  title: string;
  ref: string;
  date: string;
  time: string;
  account: string;
  amount: number;
  direction: TxnDirection;
  status: TxnStatus;
}

/** Pill label → the `status` value it filters the list down to. */
const STATUS_TABS = {
  Processed: "processed",
  Pending: "pending",
} as const satisfies Record<string, TxnStatus>;

type StatusTab = keyof typeof STATUS_TABS;

const defaultTransactions: TransactionItem[] = [
  {
    id: "1",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    time: "3:48 PM",
    amount: -25.0,
    direction: "out",
    status: "processed",
  },
  {
    id: "2",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    time: "3:48 PM",
    amount: 25.0,
    direction: "in",
    status: "processed",
  },
  {
    id: "3",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    time: "3:48 PM",
    amount: -25.0,
    direction: "out",
    status: "pending",
  },
  {
    id: "4",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    time: "3:48 PM",
    amount: -25.0,
    direction: "out",
    status: "processed",
  },
  {
    id: "5",
    title: "Bakong Payment",
    ref: "2819700093P2429",
    date: "11 Jun 2026",
    account: "Savings - 000 067 898",
    time: "3:48 PM",
    amount: 25.0,
    direction: "in",
    status: "pending",
  },
];

const FETCH_LIMIT = 20;
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

/** This card offers All plus short rolling windows — not BaseFilter's full month list. */
const DATE_FILTER_OPTIONS: BaseFilterTypeOption[] = [
  { value: "all", label: "All" },
  { value: "last7Days", label: "Last 7 days" },
  { value: "last30Days", label: "Last 30 days" },
  { value: "customDate", label: "Custom Date" },
];

const formatTxnAmount = (amount: number) => {
  const sign = amount < 0 ? "-" : "";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}$${formatted}`;
};

/**
 * Splits "Savings - 000 067 898" into the two lines the Account column shows:
 * the product name on top, the masked number below. Only the first and last
 * three digits stay readable — everything between them becomes asterisks.
 */
const splitAccount = (account: string) => {
  const [label, ...rest] = account.split(" - ");
  const digits = rest.join(" - ").replace(/\D/g, "");
  const masked =
    digits.length > 6
      ? `${digits.slice(0, 3)}${"*".repeat(digits.length - 6)}${digits.slice(-3)}`
      : digits;
  return { label, masked };
};

export interface TransactionsCardProps {
  accountNumber?: string;
  type?: string;
}

export default function TransactionsCard({
  accountNumber,
  type,
}: TransactionsCardProps) {
  const [statusTab, setStatusTab] = useState<StatusTab>("Processed");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>({
    type: "last7Days",
    from: null,
    to: null,
  });
  const [rangeAnchor, setRangeAnchor] = useState<HTMLElement | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const [listTransactions] = useListTransactionsMutation();
  useEffect(() => {
    if (!accountNumber) return;
    listTransactions({
      accountNumber,
      type: type ?? "",
      limit: FETCH_LIMIT,
      offset: 0,
    });
  }, [accountNumber, type, listTransactions]);

  useEffect(() => {
    setPage(0);
  }, [accountNumber]);

  const transactionsResponse = useAppSelector(selectTransactionsResponse);
  const apiTransactions = useMemo(
    () =>
      transactionsResponse && transactionsResponse.accountNumber === accountNumber
        ? transactionsResponse.data.map(
          (entry): TransactionItem => ({
            id: entry.transactionId,
            title: entry.transactionDescription || entry.transactionCode || "Bakong Payment",
            ref: entry.transactionId || "2819700093P2429",
            date: entry.transactionDate
              ? dayjs(entry.transactionDate).format("DD MMM YYYY")
              : "11 Jun 2026",
            time: entry.transactionDate
              ? dayjs(entry.transactionDate).format("h:mm A")        // 3:48 PM
              : "3:48 PM",
            account: `Savings - ${accountNumber ?? "000 067 898"}`,
            amount: entry.transactionAmount,
            direction: entry.transactionAmount >= 0 ? "in" : "out",
            // `CoreTransactionEntry` carries no status — the statement endpoint
            // only returns posted rows, so everything it sends is processed.
            // Swap this for the real field once the core exposes one.
            status: "processed",
          }),
        )
        : undefined,
    [transactionsResponse, accountNumber],
  );

  const allRows = apiTransactions && apiTransactions.length > 0
    ? apiTransactions
    : defaultTransactions;

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
            {/* Circular arrow icon — out is debit-red, in is credit-green. */}
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: isNegative ? "#FEE8E8" : "#E6F4EA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isNegative ? "#E11D48" : "#16A34A",
                flexShrink: 0,
              }}
            >
              {isNegative ? (
                <ArrowUpRight size={18} strokeWidth={1.8} />
              ) : (
                <ArrowDownLeft size={18} strokeWidth={1.8} />
              )}
            </Box>

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
          <BaseBlurText>{formatTxnAmount(t.amount)}</BaseBlurText>
        </Typography>
      ),
    },
  ];

  return (
    <BaseCard
      sx={{
        p: `${padding.xxl}px`,
        borderRadius: `${radius.xl}px`,
        border: `1px solid ${palette.slate[200]}`,
        bgcolor: "#FFFFFF",
      }}
    >
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
          <Button
            variant="outlined"
            endIcon={<KeyboardArrowDownRoundedIcon />}
            onClick={(e) => setRangeAnchor(e.currentTarget)}
            sx={{
              height: 40,
              borderRadius: `${radius.md}px`,
              color: "text.primary",
              borderColor: palette.slate[200],
            }}
          >
            {BASE_FILTER_TYPE_LABELS[dateFilter.type]}
          </Button>
          <BaseFilter
            anchorEl={rangeAnchor}
            onClose={() => setRangeAnchor(null)}
            defaultValue={dateFilter}
            typeOptions={DATE_FILTER_OPTIONS}
            onApply={(value) => {
              setDateFilter(value);
              setRangeAnchor(null);
            }}
          />


        </Box>
      </Box>

      {/* ---------- Table + Pagination ---------- */}
      {/* BaseTable slices `filteredRows` itself from the pagination props. */}
      <BaseTable
        columns={columns}
        rows={filteredRows}
        getRowKey={(t) => t.id ?? t.ref}
        minWidth={640}
        rounded={false}
        headerBgColor={palette.white}
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[500]}
        headerBorderTop={false}
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
    </BaseCard>
  );
}
