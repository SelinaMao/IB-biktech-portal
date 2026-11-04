"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Stack,
  Typography,
} from "@mui/material";
import { Download, MoveDownLeft, MoveUpRight } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import BaseSearchByDay, { type BaseFilterByDayValue } from "@core/components/BaseSearchByDay";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import type { BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import type { BaseFilterValue } from "@core/components/BaseFilter";
import { formatTransactionAmount, isIncomingTransaction } from "../account.slice";
import type { TTransactionDetailResponse } from "../account.types";
import StatementDownloadDialog from "./StatementDownloadDialog";
import { padding, palette } from "@/theme/palette";

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
}

const CARD_PADDING_PX = 8;

export default function TransactionsList({
  transactions,
  isLoading = false,
  error = false,
  onSelectTransaction,
  query,
  onQueryChange,
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
  accountName = "Operating account",
  accountNumber = "",
}: TransactionsListProps) {
  const [statementOpen, setStatementOpen] = useState(false);

  // Map parent BaseFilterValue to BaseFilterByDayValue
  const filterByDayValue: BaseFilterByDayValue | null = useMemo(() => {
    if (!dateFilter || dateFilter.type === "all") return null;
    if (dateFilter.type === "last7Days") {
      return { type: "7days", label: "Last 7days", from: dateFilter.from, to: dateFilter.to };
    }
    if (dateFilter.type === "last30Days") {
      return { type: "30days", label: "Last 30days", from: dateFilter.from, to: dateFilter.to };
    }
    if (dateFilter.type === "customDate") {
      return {
        type: "custom",
        label: dateFilter.from && dateFilter.to ? `${dateFilter.from} - ${dateFilter.to}` : "Custom date",
        from: dateFilter.from,
        to: dateFilter.to,
      };
    }
    return null;
  }, [dateFilter]);

  // Handle changes from BaseFilterByDay back to parent BaseFilterValue
  const handleDayFilterChange = (val: BaseFilterByDayValue | null) => {
    if (!val) {
      onDateFilterChange({ type: "all", from: null, to: null });
      return;
    }
    if (val.type === "7days") {
      onDateFilterChange({ type: "last7Days", from: val.from, to: val.to });
    } else if (val.type === "30days") {
      onDateFilterChange({ type: "last30Days", from: val.from, to: val.to });
    } else if (val.type === "custom") {
      onDateFilterChange({ type: "customDate", from: val.from, to: val.to });
    }
  };

  // Table Columns
  const columns: BaseTableColumn<TTransactionDetailResponse>[] = [
    {
      key: "detail",
      header: isFixedDeposit ? "Reference" : "To/From",
      headSx: { pl: `${CARD_PADDING_PX}px`, color: "#64748B", fontSize: 13, fontWeight: 500 },
      cellSx: { pl: `${CARD_PADDING_PX}px`, py: 2 },
      render: (t) => {
        const isIn = isIncomingTransaction(t);
        const isInterest = t.transactionDescription?.toLowerCase().includes("interest") || isIn;
        const isCredit = isFixedDeposit ? isInterest : isIn;
        return (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: isCredit ? "#E8F8EE" : "#FFF4EB",
              }}
            >
              {isCredit ? (
                <MoveDownLeft size={16} color="#16A34A" />
              ) : (
                <MoveUpRight size={16} color="#EA580C" />
              )}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#0F172A", lineHeight: 1.3 }}>
                {t.transactionDescription}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#94A3B8", mt: 0.25 }}>
                Ref: {t.transactionReferenceCode || "2819700093P2429"}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      key: "date",
      header: "Transaction Date",
      headSx: { color: "#64748B", fontSize: 13, fontWeight: 500 },
      cellSx: { py: 2 },
      render: (t) => (
        <Typography sx={{ color: "#0F172A", fontSize: 13 }}>
          {t.transactionDate}
        </Typography>
      ),
    },
    {
      key: "accountOrRemark",
      header: isFixedDeposit ? "Remark" : "Account",
      headSx: { color: "#64748B", fontSize: 13, fontWeight: 500 },
      cellSx: { py: 2 },
      render: (t) => {
        const isIn = isIncomingTransaction(t);
        const isTax = t.transactionDescription?.toLowerCase().includes("tax") || !isIn;
        return (
          <Typography sx={{ color: "#475569", fontSize: 13 }}>
            {isFixedDeposit
              ? t.transactionMemo || (isTax ? "6% tax on interest" : "Monthly interest - Oct")
              : t.toAccountNumber || `Savings - ${accountNumber || "000 067 898"}`}
          </Typography>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      headSx: { pr: `${CARD_PADDING_PX}px`, color: "#64748B", fontSize: 13, fontWeight: 500 },
      cellSx: { pr: `${CARD_PADDING_PX}px`, py: 2 },
      render: (t) => {
        const isIn = isIncomingTransaction(t);
        const isInterest = t.transactionDescription?.toLowerCase().includes("interest") || isIn;
        const isCredit = isFixedDeposit ? isInterest : isIn;
        return (
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 14,
              color: isCredit ? "#16A34A" : isFixedDeposit ? "#EA580C" : "#0F172A",
            }}
          >
            <BaseBlurText>
              {isCredit && !formatTransactionAmount(t).startsWith("+")
                ? `+${formatTransactionAmount(t)}`
                : formatTransactionAmount(t)}
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
        borderRadius: "16px",
        p: `${padding.xxl}px`,
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      {/* ───────── Top Row: Transactions Title & Download Statements Button ───────── */}
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2.5,
        }}
      >
        <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
          Transactions
        </Typography>

        {showDownload && (
          <BaseButton
            title="Download Statements"
            variant="contained"
            startIcon={<Download size={16} />}
            onClick={() => setStatementOpen(true)}
            sx={{
              bgcolor: "#EBF3FA",
              color: "#0F172A",
              borderRadius: "999px",
              textTransform: "none",
              fontSize: 13,
              fontWeight: 600,
              px: 3.5,
              py: 1,
              height: 40,
              boxShadow: "none",
              whiteSpace: "nowrap",
              "&:hover": { bgcolor: "#DCE8F5" },
            }}
          />
        )}
      </Stack>

      {/* Filter Row: BaseSearchByDay */}
      <Box
        sx={{
          mb: 3,
          mt: 6,
          borderTop: "1px solid",
          pt: 6,
          borderTopColor: palette.secondary[100],
        }}
      >
        <BaseSearchByDay
          search={query}
          onSearchChange={(val) => {
            onQueryChange(val);
            onPageChange(0);
          }}
          dateFilter={filterByDayValue}
          onDateFilterChange={(filter) => {
            handleDayFilterChange(filter);
            onPageChange(0);
          }}
        />
      </Box>

      {/* ───────── BaseTable with built-in BasePagination compact ───────── */}
      <BaseTable
        columns={columns}
        rows={transactions}
        getRowKey={(t) => t.transactionId}
        skeletonRows={rowsPerPage}
        onRowClick={onSelectTransaction}
        isLoading={isLoading}
        headerBgColor="white"
        headerBorderColor="#F1F5F9"
        headerBorderTop={false}
        rounded={false}
        emptyTitle={error ? "Could not load transactions." : "No transactions in this period."}
        emptyDescription={error ? "Please try again." : undefined}
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

      {/* ───────── Statement Download Dialog ───────── */}
      <StatementDownloadDialog
        open={statementOpen}
        onClose={() => setStatementOpen(false)}
        accountName={accountName}
        accountNumber={accountNumber}
        onDownload={(val) => {
          onDownload?.(val);
        }}
        isDownloading={isDownloading}
      />
    </Box>
  );
}
