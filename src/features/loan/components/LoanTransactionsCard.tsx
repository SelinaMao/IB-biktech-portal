"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, InputBase, Stack, Typography } from "@mui/material";
import { Download, Search } from "lucide-react";

import { font, padding, palette, radius } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseDownloadPanel, { type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import BaseFilterButton from "@core/components/BaseFilterButton";
import CardBorderAccent from "@core/components/CardBorderAccent";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import { BASE_FILTER_TYPE_LABELS, type BaseFilterValue } from "@core/components/BaseFilter";
import { TransactionFilterDialog } from "@/features/account";
import type { LoanTransaction, TxnStatus } from "../loan.types";
import LoanTransactionDetailDialog from "./LoanTransactionDetailDialog";

const ROWS_PER_PAGE = 5;

/** Column widths as shares of table. Matches account/dashboard transaction tables style. */
const COLUMN_WIDTHS = ["8%", "18%", "14%", "13%", "15%", "16%", "16%"] as const;

/** Card inner gutter padding on first and last columns. */
const TABLE_PX = 1.75;

const HEAD_CELL_SX = {
  pt: 0,
  pb: 2,
  fontSize: 15,
  fontWeight: font.weight.regular,
} as const;
const BODY_CELL_SX = { py: 2.75 } as const;

export interface LoanTransactionsCardProps {
  transactions?: LoanTransaction[];
  /** Show the status filter toggle. Default false. */
  showStatusToggle?: boolean;
  accentColor?: string;
  title?: string;
  borrowerName?: string;
  borrowerAccountNumber?: string;
  onSelectTransaction?: (transaction: LoanTransaction) => void;
}

export default function LoanTransactionsCard({
  transactions,
  showStatusToggle = false,
  accentColor = "#5AC0A0",
  title = "Repayment Schedule",
  borrowerName,
  borrowerAccountNumber,
  onSelectTransaction,
}: LoanTransactionsCardProps) {
  const dataSource = transactions ?? [];
  const [selectedTransaction, setSelectedTransaction] = useState<LoanTransaction | null>(null);
  const [status, setStatus] = useState<TxnStatus>(() =>
    dataSource.some((t) => t.status === "due") ? "due" : "upcoming",
  );
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>({
    type: "thisMonth",
    from: null,
    to: null,
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);

  const hasActiveFilter = Boolean(dateFilter && dateFilter.type !== "all" && dateFilter.type !== "thisMonth");

  const filtered = useMemo(() => {
    const byStatus = showStatusToggle
      ? dataSource.filter((t) => t.status === status)
      : dataSource;

    const byDate = dateFilter && (dateFilter.from || dateFilter.to)
      ? byStatus.filter((t) => {
          const raw = t.dueDate || t.date;
          if (!raw) return true;
          const d = dayjs(raw);
          if (!d.isValid()) return true;
          if (dateFilter.from && d.isBefore(dayjs(dateFilter.from).startOf("day"))) return false;
          if (dateFilter.to && d.isAfter(dayjs(dateFilter.to).endOf("day"))) return false;
          return true;
        })
      : byStatus;

    const q = query.trim().toLowerCase();
    if (!q) return byDate;
    return byDate.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.ref?.toLowerCase().includes(q) ||
        String(t.no ?? "").toLowerCase().includes(q) ||
        t.date?.toLowerCase().includes(q) ||
        t.dueDate?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q) ||
        t.principal?.toLowerCase().includes(q) ||
        t.interest?.toLowerCase().includes(q) ||
        t.total?.toLowerCase().includes(q) ||
        t.balance?.toLowerCase().includes(q),
    );
  }, [dataSource, status, showStatusToggle, query, dateFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    currentPage * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE,
  );

  const columns: BaseTableColumn<LoanTransaction>[] = [
    {
      key: "no",
      header: "#",
      width: COLUMN_WIDTHS[0],
      headSx: { ...HEAD_CELL_SX, pl: TABLE_PX, pr: 0 },
      cellSx: { ...BODY_CELL_SX, pl: TABLE_PX, pr: 0 },
      render: (t) => (
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: palette.slate[900],
          }}
        >
          {t.no ? String(t.no).padStart(2, "0") : t.ref}
        </Typography>
      ),
    },
    {
      key: "dueDate",
      header: "Due Date",
      width: COLUMN_WIDTHS[1],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[900] }}>
          {t.dueDate ?? t.date}
        </Typography>
      ),
    },
    {
      key: "principal",
      header: "Principal",
      width: COLUMN_WIDTHS[2],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[700] }}>
          <BaseBlurText>{t.principal}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "interest",
      header: "Interest",
      width: COLUMN_WIDTHS[3],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[700] }}>
          <BaseBlurText>{t.interest}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "total",
      header: "Total",
      width: COLUMN_WIDTHS[4],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: palette.slate[900],
          }}
        >
          <BaseBlurText>{t.total}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      width: COLUMN_WIDTHS[5],
      headSx: { ...HEAD_CELL_SX, px: 0 },
      cellSx: { ...BODY_CELL_SX, px: 0 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[700] }}>
          <BaseBlurText>{t.balance}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: COLUMN_WIDTHS[6],
      headSx: { ...HEAD_CELL_SX, pl: 0, pr: TABLE_PX },
      cellSx: { ...BODY_CELL_SX, pl: 0, pr: TABLE_PX },
      render: (t) => {
        const s = (t.status || "").toLowerCase();
        let bg = "#F1F5F9";
        let color = "#475569";
        let label = "Upcoming";

        if (s === "due") {
          bg = "#FDEFD9";
          color = "#92400E";
          label = "Due";
        } else if (s === "upcoming") {
          bg = "#EDF2F7";
          color = "#475569";
          label = "Upcoming";
        } else if (s === "paid" || s === "processed") {
          bg = palette.success.bg ?? "#DEF7EC";
          color = palette.success[700] ?? "#03543F";
          label = "Paid";
        } else if (s === "overdue") {
          bg = palette.danger.bg ?? "#FDE8E8";
          color = palette.danger[600] ?? "#9B1C1C";
          label = "Overdue";
        } else if (s === "pending") {
          bg = "#FDEFD9";
          color = "#92400E";
          label = "Pending";
        }

        return (
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              px: 2,
              py: 0.75,
              borderRadius: "9999px",
              bgcolor: bg,
              color: color,
              fontSize: 12.5,
              fontWeight: 600,
              lineHeight: 1.2,
              minWidth: 72,
              textAlign: "center",
            }}
          >
            {label}
          </Box>
        );
      },
    },
  ];

  return (
    <Box
      sx={{
        position: "relative",
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: `${padding.xxl}px`,
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: `1px solid ${palette.slate[200]}`,
      }}
    >
      <CardBorderAccent
        color={accentColor}
        type="top-left"
        strokeWidth={2.5}
        tailLength={40}
        width={90}
        height={80}
        top={0}
        left={0}
      />
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
          {title}
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
                setQuery(e.target.value);
                setPage(0);
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
          <BaseFilterButton
            active={hasActiveFilter}
            open={filterDialogOpen}
            label={BASE_FILTER_TYPE_LABELS[dateFilter.type] ?? "This Month"}
            onClick={() => setFilterDialogOpen((prev) => !prev)}
          />

          {/* Download Button */}
          <Button
            variant="contained"
            onClick={(e) => setDownloadAnchor(e.currentTarget)}
            startIcon={<Download size={15} />}
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
          <BaseDownloadPanel
            anchorEl={downloadAnchor}
            onClose={() => setDownloadAnchor(null)}
            onDownload={(_value: BaseDownloadValue) => {
              setDownloadAnchor(null);
            }}
          />
        </Stack>
      </Stack>

      {/* Table */}
      <BaseTable
        columns={columns}
        rows={filtered}
        getRowKey={(t) => t.ref || String(t.no)}
        onRowClick={(row) => {
          setSelectedTransaction(row);
          onSelectTransaction?.(row);
        }}
        minWidth={720}
        rounded={false}
        headerBgColor={palette.white}
        headerBorderColor={palette.slate[200]}
        headerTextColor={palette.slate[500]}
        headerBorderTop={false}
        emptyTitle={`No ${showStatusToggle ? `${status} ` : ""}repayments in this period.`}
        getRowSx={(row) => {
          const isDue = (row.status || "").toLowerCase() === "due";
          return {
            cursor: "pointer",
            bgcolor: isDue ? "#FFF8EE" : "transparent",
            "&:hover": {
              bgcolor: isDue ? "#FFF0DD" : palette.slate[50],
              borderRadius: `${radius.md}px`,
            },
            "& td": { borderBottom: `1px solid ${palette.slate[200]}` },
          };
        }}
        pagination={
          filtered.length > 0
            ? {
                count: filtered.length,
                page: currentPage,
                rowsPerPage: ROWS_PER_PAGE,
                onPageChange: setPage,
              }
            : undefined
        }
        paginationVariant="compact"
      />

      {/* Repayment Detail Dialog */}
      <LoanTransactionDetailDialog
        open={Boolean(selectedTransaction)}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        borrowerName={borrowerName}
        borrowerAccountNumber={borrowerAccountNumber}
      />

      {/* Filter Dialog */}
      <TransactionFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        value={dateFilter}
        onApply={(newVal) => {
          setDateFilter(newVal);
          setPage(0);
        }}
      />
    </Box>
  );
}
