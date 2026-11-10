"use client";

import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, InputBase, Stack, Typography } from "@mui/material";
import { ArrowUpDown, Download, Search, SlidersHorizontal } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseFlowIcon from "@core/components/BaseFlowIcon";
import type { BaseFilterValue } from "@core/components/BaseFilter";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import StatementDownloadDialog from "./StatementDownloadDialog";
import TransactionFilterDialog from "./TransactionFilterDialog";
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
];

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
      header: (
        <Typography sx={{ color: "#64748B", fontSize: 13.5, fontWeight: 500 }}>
          {isFixedDeposit ? "Reference" : "To/From"}
        </Typography>
      ),
      headSx: { pl: 2.5, py: 1.75 },
      cellSx: { pl: 2.5, py: 2 },
      render: (t) => {
        const isIn = isIncomingTransaction(t) || (t.transactionAmount ?? 0) > 0;
        const isInterest =
          t.transactionDescription?.toLowerCase().includes("interest") || isIn;
        const isCredit = isFixedDeposit ? isInterest : isIn;

        return (
          <Stack direction="row" spacing={1.75} sx={{ alignItems: "center" }}>
            <BaseFlowIcon
              direction={isCredit ? "income" : "expense"}
              size={40}
              iconSize={22}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: 14.5,
                  color: "#0F172A",
                  lineHeight: 1.3,
                }}
              >
                {t.transactionDescription || "Bakong Payment"}
              </Typography>
              <Typography
                sx={{
                  fontSize: 12.5,
                  color: "#64748B",
                  mt: 0.25,
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
      header: (
        <Typography sx={{ color: "#64748B", fontSize: 13.5, fontWeight: 500 }}>
          Transaction Date
        </Typography>
      ),
      headSx: { py: 1.75 },
      cellSx: { py: 2 },
      render: (t) => (
        <Typography sx={{ color: "#334155", fontSize: 14 }}>
          {formatDateDisplay(t.transactionDate)}
        </Typography>
      ),
    },
    {
      key: "account",
      header: (
        <Typography sx={{ color: "#64748B", fontSize: 13.5, fontWeight: 500 }}>
          {isFixedDeposit ? "Remark" : "Account"}
        </Typography>
      ),
      headSx: { py: 1.75 },
      cellSx: { py: 2 },
      render: (t) => (
        <Typography sx={{ color: "#64748B", fontSize: 14 }}>
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
            "&:hover .sort-icon": { color: "#0F172A" },
          }}
        >
          <Typography sx={{ color: "#64748B", fontSize: 13.5, fontWeight: 500 }}>
            Amount
          </Typography>
          <ArrowUpDown
            size={14}
            className="sort-icon"
            style={{
              color: sortDirection ? "#1C64B4" : "#64748B",
              transition: "color 0.15s ease",
            }}
          />
        </Box>
      ),
      align: "right",
      headSx: { pr: 2.5, py: 1.75 },
      cellSx: { pr: 2.5, py: 2 },
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
              color: isCredit ? "#10B981" : "#0F172A",
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
        borderRadius: "24px",
        p: { xs: 2.5, sm: 3 },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: "1px solid #EDF2F7",
      }}
    >
      {/* Top Header Row */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 2.5,
        }}
      >
        <Typography
          sx={{
            fontSize: 20,
            fontWeight: 700,
            color: "#0F172A",
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
            gap: { xs: 1, sm: 0 },
          }}
        >
          {/* Search Box */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 1.5,
              height: 38,
              borderRadius: "8px",
              border: "1px solid #E2E8F0",
              bgcolor: "#FFFFFF",
              width: { xs: 140, sm: 200 },
              transition: "border-color 0.15s ease",
              "&:focus-within": {
                borderColor: "#1C64B4",
              },
            }}
          >
            <Search size={16} color="#64748B" style={{ flexShrink: 0 }} />
            <InputBase
              placeholder="Search"
              value={query}
              onChange={(e) => {
                onQueryChange(e.target.value);
                onPageChange(0);
              }}
              sx={{
                fontSize: 13.5,
                color: "#0F172A",
                width: "100%",
                "& input": { p: 0 },
                "& input::placeholder": {
                  color: "#94A3B8",
                  opacity: 1,
                },
              }}
            />
          </Box>

          {/* Filters Button */}
          {showDateFilter && (
            <Button
              variant="outlined"
              onClick={() => setFilterDialogOpen(true)}
              startIcon={<SlidersHorizontal size={15} />}
              sx={{
                height: 38,
                px: 2,
                borderRadius: "8px",
                borderColor: hasActiveFilter ? "#1C64B4" : "#E2E8F0",
                bgcolor: hasActiveFilter ? "#F0F7FF" : "#FFFFFF",
                color: hasActiveFilter ? "#1C64B4" : "#0F172A",
                textTransform: "none",
                fontSize: 13.5,
                fontWeight: 500,
                boxShadow: "none",
                "&:hover": {
                  borderColor: hasActiveFilter ? "#1C64B4" : "#CBD5E1",
                  bgcolor: hasActiveFilter ? "#E5F0FD" : "#F8FAFC",
                },
              }}
            >
              Filters
            </Button>
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
                px: 2.25,
                borderRadius: "8px",
                bgcolor: "#1C64B4",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: 13.5,
                fontWeight: 600,
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": {
                  bgcolor: "#154F91",
                  boxShadow: "none",
                },
              }}
            >
              Download Statement
            </Button>
          )}
        </Stack>
      </Stack>

      <Box
        sx={{
          mx: { xs: -2.5, sm: -3 },
        }}
      >
        <BaseTable
          columns={columns}
          rows={displayTransactions}
          getRowKey={(t) => t.transactionId}
          skeletonRows={rowsPerPage}
          onRowClick={onSelectTransaction}
          isLoading={isLoading}
          headerBgColor="#FFFFFF"
          headerBorderColor="#EDF2F7"
          headerBorderTop={true}
          rounded={false}
          emptyTitle={error ? "Could not load transactions." : "No transactions in this period."}
          emptyDescription={error ? "Please try again." : undefined}
          getRowSx={() => ({
            cursor: onSelectTransaction ? "pointer" : "default",
            "& .MuiTableCell-root, & td": {
              borderBottom: "none",
              py: 2,
            },
            "&:hover": {
              bgcolor: "#F8FAFC",
            },
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
      </Box>

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
