"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import { font, palette, radius } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseFilterByDay, { type BaseFilterByDayValue } from "@core/components/BaseFilterByDay";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import { formatDate } from "@/utils/date-time";
import type { ApprovalEntry } from "../approval.types";
import ApprovalStatusChip from "./ApprovalStatusChip";

export type ApprovalTableProps = {
  entries: ApprovalEntry[];
  isLoading?: boolean;
  totalCount?: number;
  /** Backward-compatible pagination prop */
  pagination?: {
    count: number;
    page: number;
    rowsPerPage: number;
    onPageChange: (page: number) => void;
  };
  paginationSx?: SxProps<Theme>;
  onRowClick?: (entry: ApprovalEntry) => void;
  search?: string;
  onSearchChange?: (val: string) => void;
  dateFilter?: BaseFilterByDayValue | null;
  onDateFilterChange?: (filter: BaseFilterByDayValue | null) => void;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  title?: string;
  sx?: SxProps<Theme>;
};

/** Proportional column width distribution across screen sizes */
const COLUMN_WIDTHS = ["15%", "25%", "20%", "18%", "12%", "10%"] as const;

/** Shared header cell styling */
const HEAD_CELL_SX = {
  fontSize: 13,
  fontWeight: 500,
  color: palette.slate[500],
  py: 1.75,
  px: 2,
} as const;

/** Shared body cell styling */
const BODY_CELL_SX = {
  py: 2.25,
  px: 2,
} as const;

export default function ApprovalTable({
  entries,
  isLoading = false,
  totalCount,
  pagination,
  onRowClick,
  search: externalSearch,
  onSearchChange: externalOnSearchChange,
  dateFilter: externalDateFilter,
  onDateFilterChange: externalOnDateFilterChange,
  page: externalPage,
  rowsPerPage: externalRowsPerPage,
  onPageChange: externalOnPageChange,
  title = "Transactions",
  paginationSx,
  sx,
}: ApprovalTableProps) {
  // Search state (controlled or local fallback)
  const [internalSearch, setInternalSearch] = useState("");
  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const handleSearchChange = (val: string) => {
    if (externalOnSearchChange) {
      externalOnSearchChange(val);
    } else {
      setInternalSearch(val);
    }
  };

  // Date filter state (controlled or local fallback)
  const [internalDateFilter, setInternalDateFilter] = useState<BaseFilterByDayValue | null>(null);
  const dateFilter =
    externalDateFilter !== undefined ? externalDateFilter : internalDateFilter;
  const handleDateFilterChange = (filter: BaseFilterByDayValue | null) => {
    if (externalOnDateFilterChange) {
      externalOnDateFilterChange(filter);
    } else {
      setInternalDateFilter(filter);
    }
  };

  // Pagination resolution (supports both direct props and nested pagination prop)
  const effectiveTotal = pagination?.count ?? totalCount ?? 0;
  const page = pagination?.page ?? externalPage ?? 0;
  const ROWS_PER_PAGE = pagination?.rowsPerPage ?? externalRowsPerPage ?? 5;

  const handlePageChange = (newPage: number) => {
    if (pagination?.onPageChange) {
      pagination.onPageChange(newPage);
    } else if (externalOnPageChange) {
      externalOnPageChange(newPage);
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    if ((currency || "").toUpperCase() === "KHR") {
      return `${currency} ${amount.toLocaleString("en-US")}`;
    }
    return `${currency} ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Type-Safe columns with consistent width distribution & flexible headers
  const columns: BaseTableColumn<ApprovalEntry>[] = [
    {
      key: "date",
      header: "Date",
      width: COLUMN_WIDTHS[0],
      headSx: { ...HEAD_CELL_SX, pl: 0.5 },
      cellSx: { ...BODY_CELL_SX, pl: 0.5 },
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {formatDate(t.creationDate, "D MMM YYYY")}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {formatDate(t.creationDate, "hh:mm A")}
          </Typography>
        </Box>
      ),
    },
    {
      key: "transactionType",
      header: "Transaction type & reference",
      width: COLUMN_WIDTHS[1],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: font.weight.regular,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {t.transactionType}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {t.refNo}
          </Typography>
        </Box>
      ),
    },
    {
      key: "payTo",
      header: "Pay to",
      width: COLUMN_WIDTHS[2],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: font.weight.regular,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {t.payToName}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {t.payToAccountNo}
          </Typography>
        </Box>
      ),
    },
    {
      key: "fromAccount",
      header: "From account",
      width: COLUMN_WIDTHS[3],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {t.sourceAccountName}
          </Typography>
          <Typography
            sx={{
              fontSize: 12,
              color: "#64748B",
              lineHeight: 1.3,
              mt: 0.4,
            }}
          >
            {t.sourceAccountNo}
          </Typography>
        </Box>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      width: COLUMN_WIDTHS[4],
      headSx: HEAD_CELL_SX,
      cellSx: BODY_CELL_SX,
      render: (t) => (
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: font.weight.medium,
            color: "#0F172A",
          }}
        >
          <BaseBlurText>
            {formatAmount(t.amount, t.currency)}
          </BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "status",
      header: "Status",
      align: "right",
      width: COLUMN_WIDTHS[5],
      headSx: { ...HEAD_CELL_SX, pr: 0.5 },
      cellSx: { ...BODY_CELL_SX, pr: 0.5 },
      render: (t) => <ApprovalStatusChip status={t.status} />,
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        border: `1px solid ${palette.slate[200]}`,
        p: { xs: 2.5, sm: "20px 24px" },
        boxShadow: "none",
        ...sx,
      }}
    >
      {/* Title */}
      <Typography
        sx={{
          fontSize: { xs: 18, sm: 20 },
          fontWeight: 700,
          color: "#0F172A",
          mb: 6,
        }}
      >
        {title}
      </Typography>

      {/* Filter Row: BaseSearchButton (left) & BaseFilterByDay (right) */}
      <Box
        sx={{
          borderTop: "1px solid ",
          pt: 6,
          borderTopColor: palette.secondary[100],
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          marginTop: 6,
          mb: 3,
        }}
      >
        <BaseSearchButton
          value={search}
          onChange={handleSearchChange}
          placeholder="Search"
          width={240}
        />

        <BaseFilterByDay
          value={dateFilter}
          onChange={handleDateFilterChange}
        />
      </Box>

      {/* BaseTable with built-in compact pagination */}
      <BaseTable
        columns={columns}
        rows={entries}
        getRowKey={(t) => t.id}
        minWidth={800}
        rounded={false}
        headerBgColor={palette.white}
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[500]}
        headerBorderTop={false}
        emptyTitle="Nothing to approve"
        emptyDescription="When your team submits a transaction for approval, it shows up here."
        isLoading={isLoading}
        onRowClick={onRowClick}
        getRowSx={() => ({
          cursor: onRowClick ? "pointer" : "default",
          transition: "background-color 0.15s ease",
          "&:hover": {
            bgcolor: palette.slate[50],
            borderRadius: `${radius.md}px`,
          },
          "& td": { borderBottom: `1px solid ${palette.slate[50]}` },
        })}
        pagination={{
          count: effectiveTotal,
          page: page,
          rowsPerPage: ROWS_PER_PAGE,
          onPageChange: handlePageChange,
        }}
        paginationVariant="compact"
        // BaseTable spaces the pager 40px off the table; this card wants 16px.
        paginationSx={{ mt: -3, ...paginationSx }}
      />
    </Box>
  );
}
