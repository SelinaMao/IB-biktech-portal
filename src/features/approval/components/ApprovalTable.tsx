"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import InputBase from "@mui/material/InputBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import { ArrowUpDown, Search } from "lucide-react";

import { font, palette, radius } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseFilter, { type BaseFilterValue } from "@core/components/BaseFilter";
import BaseFilterButton from "@core/components/BaseFilterButton";
import BaseFilterTypeContent from "@core/components/BaseFilterTypeContent";
import type { BaseFilterByDayValue } from "@core/components/BaseFilterByDay";
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
  dateFilter?: BaseFilterValue | BaseFilterByDayValue | null;
  onDateFilterChange?: (filter: any) => void;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  title?: string;
  sx?: SxProps<Theme>;
};

/** Proportional column width distribution */
const COLUMN_WIDTHS = ["15%", "25%", "20%", "18%", "12%", "10%"] as const;

/** The card's inner gutter matching dashboard TransactionsCard.
 *  Columns butt up against each other, so only outer edges carry horizontal padding — the rest sit flush. */
const TABLE_PX = 1.75;

/** Shared header cell styling matching dashboard TransactionsCard */
const HEAD_CELL_SX = {
  pt: 0,
  pb: 2,
  fontSize: 13.5,
  fontWeight: font.weight.medium,
  color: palette.slate[500],
} as const;

/** Shared body cell styling matching dashboard TransactionsCard */
const BODY_CELL_SX = {
  py: 2.75,
} as const;

interface HeaderWithSortProps {
  label: string;
  sortable?: boolean;
  align?: "left" | "right";
}

function HeaderWithSort({ label, sortable = true, align = "left" }: HeaderWithSortProps) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.5,
        justifyContent: align === "right" ? "flex-end" : "flex-start",
        width: align === "right" ? "100%" : "auto",
      }}
    >
      <span>{label}</span>
      {sortable && <ArrowUpDown size={13} style={{ color: "#64748B", opacity: 0.85 }} />}
    </Box>
  );
}

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

  // Date filter Popover state (using BaseFilter)
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);
  const [internalDateFilter, setInternalDateFilter] = useState<BaseFilterValue>({
    type: "all",
    from: null,
    to: null,
  });
  const dateFilter =
    externalDateFilter !== undefined ? externalDateFilter : internalDateFilter;
  const handleDateFilterChange = (filter: BaseFilterValue) => {
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

  // Type-Safe columns with dashboard TransactionsCard padding pattern
  const columns: BaseTableColumn<ApprovalEntry>[] = [
    {
      key: "date",
      header: <HeaderWithSort label="Date" sortable />,
      width: COLUMN_WIDTHS[0],
      headSx: { ...HEAD_CELL_SX, pl: TABLE_PX, pr: 0 },
      cellSx: { ...BODY_CELL_SX, pl: TABLE_PX, pr: 0 },
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
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
              mt: 0.35,
            }}
          >
            {formatDate(t.creationDate, "hh:mm A")}
          </Typography>
        </Box>
      ),
    },
    {
      key: "transactionType",
      header: <HeaderWithSort label="Transaction type & reference" sortable />,
      width: COLUMN_WIDTHS[1],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
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
              mt: 0.35,
            }}
          >
            {t.refNo}
          </Typography>
        </Box>
      ),
    },
    {
      key: "payTo",
      header: <HeaderWithSort label="Pay to" sortable={false} />,
      width: COLUMN_WIDTHS[2],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
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
              mt: 0.35,
            }}
          >
            {t.payToAccountNo}
          </Typography>
        </Box>
      ),
    },
    {
      key: "fromAccount",
      header: <HeaderWithSort label="From account" sortable={false} />,
      width: COLUMN_WIDTHS[3],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Box>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
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
              mt: 0.35,
            }}
          >
            {t.sourceAccountNo}
          </Typography>
        </Box>
      ),
    },
    {
      key: "amount",
      header: <HeaderWithSort label="Amount" sortable align="right" />,
      align: "right",
      width: COLUMN_WIDTHS[4],
      headSx: { ...HEAD_CELL_SX, px: 0, textAlign: "right" },
      cellSx: { ...BODY_CELL_SX, px: 0, textAlign: "right" },
      render: (t) => (
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 600,
            color: "#0F172A",
            textAlign: "right",
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
      header: <HeaderWithSort label="Status" sortable align="right" />,
      align: "right",
      width: COLUMN_WIDTHS[5],
      headSx: { ...HEAD_CELL_SX, pl: 0, pr: TABLE_PX, textAlign: "right" },
      cellSx: { ...BODY_CELL_SX, pl: 0, pr: TABLE_PX, textAlign: "right" },
      render: (t) => (
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <ApprovalStatusChip status={t.status} />
        </Box>
      ),
    },
  ];

  const hasActiveFilter = Boolean(
    dateFilter && (dateFilter.type !== "all" || dateFilter.from || dateFilter.to),
  );

  const dialogFilterValue: BaseFilterValue = dateFilter
    ? {
        type: (dateFilter.type as any) ?? "all",
        from: dateFilter.from ?? null,
        to: dateFilter.to ?? null,
      }
    : { type: "all", from: null, to: null };

  return (
    <BaseCard sx={sx}>
      {/* Top Header Row: Transactions on left, Search & Filters on right */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: 4,
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
          {title}
        </Typography>

        <Stack
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 1, sm: 1.5 },
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
              width: { xs: "100%", sm: 200 },
              transition: "border-color 0.15s ease",
              "&:focus-within": {
                borderColor: "#1C64B4",
              },
            }}
          >
            <Search size={16} color={palette.slate[400]} style={{ flexShrink: 0 }} />
            <InputBase
              placeholder="Search"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
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
          <BaseFilterButton
            active={hasActiveFilter}
            onClick={(e) => setFilterAnchorEl(e.currentTarget)}
            inactiveTextColor={palette.slate[700]}
          />

          {/* BaseFilter Dropdown */}
          <BaseFilter anchorEl={filterAnchorEl} onClose={() => setFilterAnchorEl(null)}>
            <BaseFilterTypeContent
              onClose={() => setFilterAnchorEl(null)}
              defaultValue={dialogFilterValue}
              onApply={(newVal) => {
                handleDateFilterChange(newVal);
                setFilterAnchorEl(null);
                handlePageChange(0);
              }}
            />
          </BaseFilter>
        </Stack>
      </Stack>

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
        paginationSx={{ mt: -3, ...paginationSx }}
      />
    </BaseCard>
  );
}
