"use client";

import React, { useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Download, MoveDownLeft, MoveUpRight } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import type { BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import StatementDownloadDialog from "./StatementDownloadDialog";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseFilterByDay, { type BaseFilterByDayValue } from "@core/components/BaseFilterByDay";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import SectionCard from "@/features/dashboard/components/SectionCard";
import type { BaseFilterValue } from "@core/components/BaseFilter";
import { formatTransactionAmount, isIncomingTransaction } from "../account.slice";
import type { TTransactionDetailResponse } from "../account.types";
import { formatAccountNumber } from "@/utils";
import { palette } from "@/theme/palette";

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

const CARD_PADDING_PX = 20;

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
  accountName = "",
  accountNumber = "",
}: TransactionsListProps) {
  const [statementDownloadOpen, setStatementDownloadOpen] = useState(false);

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

  const columns: BaseTableColumn<TTransactionDetailResponse>[] = [
    {
      key: "detail",
      header: isFixedDeposit ? "Reference" : "To/From",
      headSx: { pl: `${CARD_PADDING_PX}px`, py: 1.8 },
      cellSx: { pl: `${CARD_PADDING_PX}px`, py: 3 },
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
                <Box
                  component="img"
                  src="/assets/icons/move-up-right.svg"
                  alt="Transfer"
                  sx={{ width: 18, height: 18 }}
                />
              ) : (
                <Box
                  component="img"
                  src="/assets/icons/move-down-right.svg"
                  alt="Transfer"
                  sx={{ width: 18, height: 18 }}
                />
              )}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14, color: "#0F172A", lineHeight: 1.3 }}>
                {t.transactionDescription}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#94A3B8", mt: 0.25 }}>
                Ref: {t.transactionReferenceCode || "-"}
              </Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      key: "date",
      header: "Transaction Date",
      headSx: { py: 1.8 },
      cellSx: { py: 3 },
      render: (t) => (
        <Typography sx={{ color: palette.slate[700], fontSize: 14 }}>
          {t.transactionDate}
        </Typography>
      ),
    },
    {
      key: "accountOrRemark",
      header: isFixedDeposit ? "Remark" : "Account",
      headSx: { py: 1.8 },
      cellSx: { py: 3 },
      render: (t) => {
        const isIn = isIncomingTransaction(t);
        const isTax = t.transactionDescription?.toLowerCase().includes("tax") || !isIn;
        return (
          <Typography sx={{ color: palette.slate[700], fontSize: 14 }}>
            {isFixedDeposit
              ? t.transactionMemo || "-"
              : t.toAccountNumber || (accountNumber ? formatAccountNumber(accountNumber) : "-")}
          </Typography>
        );
      },
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      headSx: { pr: `${CARD_PADDING_PX}px`, py: 1.8 },
      cellSx: { pr: `${CARD_PADDING_PX}px`, py: 3 },
      render: (t) => {
        const isIn = isIncomingTransaction(t);
        const isInterest = t.transactionDescription?.toLowerCase().includes("interest") || isIn;
        const isCredit = isFixedDeposit ? isInterest : isIn;
        return (
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: 15,
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
    <SectionCard
      title="Transactions"
      header={
        showDownload ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <BaseButton
              title="Download Statements"
              variant="contained"
              onClick={() => setStatementDownloadOpen(true)}
              startIcon={<Download size={16} />}
              sx={{
                bgcolor: "#EBF3FA",
                color: "#0F172A",
                borderRadius: "999px",
                textTransform: "none",
                fontSize: 13.5,
                fontWeight: 600,
                px: 4.5,
                py: 0.85,
                height: 38,
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#DFEAF6", boxShadow: "none", border: "none" },
              }}
            />
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
          </Stack>
        ) : null
      }
      showBorder={false}
    >
      <Box
        sx={{
          width: `calc(100% + ${CARD_PADDING_PX * 2}px)`,
          mx: `-${CARD_PADDING_PX}px`,
        }}
      >
        <Stack sx={{ px: 2.5, py: 1.5 }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "column", md: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              gap: 1.5,
              paddingTop: 6,
              borderTop: "1px solid",
              borderTopColor: palette.secondary[100],
            }}
          >
            <BaseSearchButton
              value={query}
              onChange={(v) => {
                onQueryChange(v);
                onPageChange(0);
              }}
              placeholder="Search transactions…"
              tooltip="Search"
              width={240}
            />
            <BaseFilterByDay
              value={filterByDayValue}
              onChange={(v) => {
                handleDayFilterChange(v);
                onPageChange(0);
              }}
            />
          </Box>

          <BaseTable
            columns={columns}
            rows={transactions}
            getRowKey={(t) => t.transactionId}
            skeletonRows={rowsPerPage}
            onRowClick={onSelectTransaction}
            isLoading={isLoading}
            headerBgColor="#FFFFFF"
            headerBorderColor="#E2E8F0"
            headerTextColor={palette.slate[500]}
            headerBorderTop={false}
            rounded={false}
            emptyTitle={error ? "Could not load transactions." : "No transactions in this period."}
            emptyDescription={error ? "Please try again." : undefined}
            getRowSx={() => ({
              cursor: onSelectTransaction ? "pointer" : "default",
              "& .MuiTableCell-root, & td": {
                borderBottom: "none",
                py: 3,
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
            paginationSx={{
              pr: `${CARD_PADDING_PX}px`,
              pl: `${CARD_PADDING_PX}px`,
            }}
            paginationVariant="compact"
          />
        </Stack>
      </Box>
    </SectionCard>
  );
}
