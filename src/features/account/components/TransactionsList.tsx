"use client";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, InputBase, Stack, Typography } from "@mui/material";
import { ArrowUpDown, Download, Search } from "lucide-react";

import { font, palette, radius, padding } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseIconBadge from "@core/components/BaseIconBadge";
import BaseFilterButton from "@core/components/BaseFilterButton";
import type { BaseFilterValue } from "@core/components/BaseFilter";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import StatementDownloadDialog from "./StatementDownloadDialog";
import TransactionFilterDialog from "./TransactionFilterDialog";
import CardBorderAccent from "./CardBorderAccent";
import type { BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import { isIncomingTransaction } from "../account.slice";
import type { TTransactionDetailResponse } from "../account.types";
import { formatAccountNumber } from "@/utils/format-account-number";

export interface TransactionsListProps {
  transactions: TTransactionDetailResponse[];
  isLoading?: boolean;
  error?: boolean;
  onSelectTransaction?: (transaction: TTransactionDetailResponse) => void;
  query: string;
  onQueryChange: (value: string) => void;
  showDateFilter?: boolean;
  dateFilter: BaseFilterValue;
  onDateFilterChange: (value: BaseFilterValue) => void;
  page: number;
  total: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  showDownload?: boolean;
  isDownloading?: boolean;
  onDownload?: (value: BaseDownloadValue) => void;
  onViewCertificate?: (format: "pdf" | "image") => void;
  onDownloadCertificate?: (format: "pdf" | "image") => void;
  isFixedDeposit?: boolean;
  accountName?: string;
  accountNumber?: string;
  accountType?: string;
  accentColor?: string;
}

/** Fallback mock data matching design mockup */
const DEFAULT_MOCK_TRANSACTIONS: TTransactionDetailResponse[] = [
  {
    transactionId: "2819700093P2429-1",
    transactionCode: "BAKONG",
    transactionType: "D",
    transactionAmount: -25.0,
    transactionCurrency: "USD",
    transactionDate: "2026-06-11",
    transactionTime: "15:48:00",
    transactionDescription: "Bakong Payment",
    transactionReferenceCode: "2819700093P2429",
    fromAccountName: "Savings",
    fromAccountNumber: "000067898",
    toAccountName: "Bakong Merchant",
    toAccountNumber: "000067898",
    amountBalance: 2475.0,
    fields: [],
  },
  {
    transactionId: "2819700093P2429-2",
    transactionCode: "BAKONG",
    transactionType: "C",
    transactionAmount: 25.0,
    transactionCurrency: "USD",
    transactionDate: "2026-06-11",
    transactionTime: "15:48:00",
    transactionDescription: "Bakong Payment",
    transactionReferenceCode: "2819700093P2429",
    fromAccountName: "Bakong Sender",
    fromAccountNumber: "000067898",
    toAccountName: "Savings",
    toAccountNumber: "000067898",
    amountBalance: 2500.0,
    fields: [],
  },
  {
    transactionId: "2819700093P2429-3",
    transactionCode: "BAKONG",
    transactionType: "D",
    transactionAmount: -25.0,
    transactionCurrency: "USD",
    transactionDate: "2026-06-11",
    transactionTime: "15:48:00",
    transactionDescription: "Bakong Payment",
    transactionReferenceCode: "2819700093P2429",
    fromAccountName: "Savings",
    fromAccountNumber: "000067898",
    toAccountName: "Bakong Merchant",
    toAccountNumber: "000067898",
    amountBalance: 2475.0,
    fields: [],
  },
  {
    transactionId: "2819700093P2428-4",
    transactionCode: "BAKONG",
    transactionType: "D",
    transactionAmount: -25.0,
    transactionCurrency: "USD",
    transactionDate: "2026-06-11",
    transactionTime: "15:48:00",
    transactionDescription: "Bakong Payment",
    transactionReferenceCode: "2819700093P2428",
    fromAccountName: "Savings",
    fromAccountNumber: "000067898",
    toAccountName: "Bakong Merchant",
    toAccountNumber: "000067898",
    amountBalance: 2475.0,
    fields: [],
  },
  {
    transactionId: "2819700093P2429-5",
    transactionCode: "BAKONG",
    transactionType: "C",
    transactionAmount: 25.0,
    transactionCurrency: "USD",
    transactionDate: "2026-06-11",
    transactionTime: "15:48:00",
    transactionDescription: "Bakong Payment",
    transactionReferenceCode: "2819700093P2429",
    fromAccountName: "Bakong Sender",
    fromAccountNumber: "000067898",
    toAccountName: "Savings",
    toAccountNumber: "000067898",
    amountBalance: 2500.0,
    fields: [],
  },
];

/** Column widths, as the share of the table each one takes. Matches dashboard TransactionsCard. */
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

function formatDateDisplay(dateStr?: string) {
  if (!dateStr) return "-";
  const parsed = dayjs(dateStr);
  if (!parsed.isValid()) return dateStr;
  return parsed.format("D MMMM YYYY");
}

function formatAmountDisplay(t: TTransactionDetailResponse, isCredit: boolean) {
  const ccy = (t.transactionCurrency || "USD").toUpperCase();
  const symbol = ccy === "USD" ? "$" : `${ccy} `;
  const num = Math.abs(t.transactionAmount ?? 0);
  const formatted = num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (isCredit) {
    return `${symbol}${formatted}`;
  }
  return `-${symbol}${formatted}`;
}

function getAccountLabel(
  t: TTransactionDetailResponse,
  fallbackAccountNum?: string,
  accountType?: string,
  isFixedDeposit?: boolean,
) {
  if (isFixedDeposit && t.transactionMemo) {
    return t.transactionMemo;
  }

  const rawType = (accountType || "").toUpperCase();
  const typeLabel = (() => {
    if (isFixedDeposit || rawType === "TD" || rawType === "FD") return "Fixed Deposit";
    if (rawType === "CA") return "Current";
    if (rawType === "SA") return "Savings";
    return "Savings";
  })();

  const rawNum =
    t.toAccountNumber ||
    t.fromAccountNumber ||
    fallbackAccountNum ||
    "000067898";
  const formattedNum = formatAccountNumber(rawNum) || rawNum;
  return `${typeLabel} - ${formattedNum}`;
}

export default function TransactionsList({
  transactions,
  isLoading = false,
  error = false,
  onSelectTransaction,
  query,
  onQueryChange,
  showDateFilter = true,
  dateFilter,
  onDateFilterChange,
  page,
  total,
  rowsPerPage,
  onPageChange,
  showDownload = true,
  isDownloading = false,
  onDownload,
  isFixedDeposit = false,
  accountName = "",
  accountNumber = "",
  accountType,
  accentColor = "#74C0A8",
}: TransactionsListProps) {
  const [statementDownloadOpen, setStatementDownloadOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null);

  const hasActiveFilter = Boolean(dateFilter && dateFilter.type !== "all");

  const displayTransactions = useMemo(() => {
    const list =
      transactions && transactions.length > 0
        ? transactions
        : DEFAULT_MOCK_TRANSACTIONS;
    if (!sortDirection) return list;
    return [...list].sort((a, b) => {
      const amtA = Number(a.transactionAmount) || 0;
      const amtB = Number(b.transactionAmount) || 0;
      return sortDirection === "asc" ? amtA - amtB : amtB - amtA;
    });
  }, [transactions, sortDirection]);

  const columns: BaseTableColumn<TTransactionDetailResponse>[] = [
    {
      key: "detail",
      header: isFixedDeposit ? "Reference" : "To/From",
      width: COLUMN_WIDTHS[0],
      headSx: { ...HEAD_CELL_SX, pl: TABLE_PX, pr: 0 },
      cellSx: { ...BODY_CELL_SX, pl: TABLE_PX, pr: 0 },
      render: (t) => {
        const isIn = isIncomingTransaction(t) || (t.transactionAmount ?? 0) > 0;
        const isInterest =
          t.transactionDescription?.toLowerCase().includes("interest") || isIn;
        const isCredit = isFixedDeposit ? isInterest : isIn;

        return (
          <Stack direction="row" spacing={2.75} sx={{ alignItems: "center" }}>
            <BaseIconBadge
              direction={isCredit ? "income" : "expense"}
              iconSrc={
                isCredit
                  ? "/assets/icons/income-icon.svg"
                  : "/assets/icons/expense-icon.svg"
              }
              size={40}
              iconSize={24}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 15,
                  color: palette.slate[900],
                  lineHeight: 1.25,
                }}
              >
                {t.transactionDescription || "Bakong Payment"}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: palette.slate[450],
                  lineHeight: 1.5,
                  mt: 0.5,
                }}
              >
                Ref: {t.transactionReferenceCode || t.transactionId || "-"}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      key: "date",
      header: "Transaction Date",
      width: COLUMN_WIDTHS[1],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Typography
          sx={{
            fontSize: 14,
            color: palette.slate[900],
            lineHeight: 1.5,
          }}
        >
          {formatDateDisplay(t.transactionDate)}
        </Typography>
      ),
    },
    {
      key: "account",
      header: isFixedDeposit ? "Remark" : "Account",
      width: COLUMN_WIDTHS[2],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Typography
          sx={{
            fontSize: 14,
            color: palette.slate[500],
            lineHeight: 1.5,
          }}
        >
          {getAccountLabel(t, accountNumber, accountType, isFixedDeposit)}
        </Typography>
      ),
    },
    {
      key: "amount",
      header: (
        <Box
          component="button"
          type="button"
          onClick={() =>
            setSortDirection((prev) =>
              prev === "asc" ? "desc" : prev === "desc" ? null : "asc"
            )
          }
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            border: "none",
            bgcolor: "transparent",
            cursor: "pointer",
            p: 0,
            ml: "auto",
            color: "inherit",
            font: "inherit",
            fontSize: "inherit",
            "&:hover .sort-icon": { color: palette.slate[900] },
          }}
        >
          <span>Amount</span>
          <ArrowUpDown
            size={14}
            className="sort-icon"
            style={{
              color: sortDirection ? "#1C64B4" : "currentColor",
              transition: "color 0.15s ease",
            }}
          />
        </Box>
      ),
      align: "right",
      width: COLUMN_WIDTHS[3],
      headSx: { ...HEAD_CELL_SX, fontWeight: font.weight.medium, pl: 0, pr: TABLE_PX },
      cellSx: { ...BODY_CELL_SX, pl: 0, pr: TABLE_PX },
      render: (t) => {
        const isIn = isIncomingTransaction(t) || (t.transactionAmount ?? 0) > 0;
        const isInterest =
          t.transactionDescription?.toLowerCase().includes("interest") || isIn;
        const isCredit = isFixedDeposit ? isInterest : isIn;

        return (
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 15,
              color: isCredit ? "#10B981" : palette.slate[900],
              textAlign: "right",
            }}
          >
            <BaseBlurText>
              {formatAmountDisplay(t, isCredit)}
            </BaseBlurText>
          </Typography>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        position: "relative",
        borderRadius: "20px",
        p: `${padding.xxl}px`,
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: `1px solid ${palette.slate[200]}`,
      }}
    >
    <CardBorderAccent color={accentColor} type="top-left" strokeWidth={2.5} tailLength={40} width={90} height={80} top={0} left={0} />
      {/* Top Header Row */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            color: palette.slate[900],
            lineHeight: 1.25,
          }}
        >
          Transactions
        </Typography>

        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 1, sm: 2 },
          }}
        >
          {/* Search Box */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              px: 1.5,
              height: 38,
              borderRadius: "8px",
              border: `1px solid ${palette.slate[200]}`,
              bgcolor: "#FFFFFF",
              width: { xs: 140, sm: 200 },
              transition: "border-color 0.15s ease",
              "&:focus-within": {
                borderColor: "#1C64B4",
              },
            }}
          >
            <Search size={16} color={palette.slate[400]} style={{ flexShrink: 0 }} />
            <InputBase
              placeholder="Search"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                onPageChange(0);
              }}
              sx={{
                fontSize: 13.5,
                color: palette.slate[900],
                width: "100%",
                "& input": { p: 0 },
                "& input::placeholder": {
                  color: palette.slate[400],
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Filters Button */}
          {showDateFilter && (
            <BaseFilterButton
              active={hasActiveFilter}
              onClick={() => setFilterDialogOpen(true)}
            />
          )}

          {/* Download Statement Button */}
          {showDownload && (
            <Button
              variant="contained"
              onClick={() => setStatementDownloadOpen(true)}
              startIcon={<Download size={15} />}
              disabled={isDownloading}
              sx={{
                height: 38,
                px: 4,
                borderRadius: "8px",
                bgcolor: "#1C64B4",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 300,
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "#154F91",
                  boxShadow: "none",
                },
              }}
            >
              Download
            </Button>
          )}
        </Stack>
      </Stack>

      <BaseTable
        columns={columns}
        rows={displayTransactions}
        getRowKey={(t) => t.transactionId}
        skeletonRows={rowsPerPage}
        onRowClick={onSelectTransaction}
        isLoading={isLoading}
        minWidth={640}
        rounded={false}
        headerBgColor={palette.white}
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[500]}
        headerBorderTop={false}
        emptyTitle={error ? "Could not load transactions." : "No transactions in this period."}
        emptyDescription={error ? "Please try again." : undefined}
        getRowSx={() => ({
          cursor: onSelectTransaction ? "pointer" : "default",
          "&:hover": {
            bgcolor: palette.slate[50],
            borderRadius: `${radius.md}px`,
          },
          "& td": { borderBottom: `1px solid ${palette.slate[200]}` },
        })}
        pagination={
          total > 0 && !error
            ? {
              count: total,
              page,
              rowsPerPage,
              onPageChange,
            }
            : undefined
        }
        paginationVariant="compact"
      />

      {/* Date Filter Dialog */}
      <TransactionFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(newVal) => {
          onDateFilterChange(newVal);
          onPageChange(0);
        }}
        value={dateFilter}
      />

      {/* Statement Download Dialog */}
      <StatementDownloadDialog
        open={statementDownloadOpen}
        onClose={() => setStatementDownloadOpen(false)}
        accountName={accountName}
        accountNumber={accountNumber}
        onDownload={(value: BaseDownloadValue) => {
          onDownload?.(value);
        }}
        isDownloading={isDownloading}
      />
    </Box>
  );
}
