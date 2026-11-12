"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import { Box, Button, InputBase, Stack, Typography } from "@mui/material";
import { Download, Search, SlidersHorizontal } from "lucide-react";

import { font, padding, palette, radius } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import type { BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import type { BaseFilterValue } from "@core/components/BaseFilter";
import { DEFAULT_PIE_COLORS } from "@core/components/PieChart";
import {
  CardBorderAccent,
  StatementDownloadDialog,
  TransactionFilterDialog,
} from "@/features/account";
import type { LoanTransaction, TxnStatus } from "../loan.types";

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

export const LOAN_TRANSACTIONS: LoanTransaction[] = [
  {
    no: "01",
    title: "Monthly Repayment #1",
    ref: "RP-2026-0001",
    date: "2026-06-11",
    dueDate: "11 June 2026",
    principal: "$10,128.38",
    interest: "$898.14",
    total: "$11,036.52",
    balance: "$74,062.12",
    amount: "$11,036.52",
    direction: "out",
    status: "due",
  },
  {
    no: "02",
    title: "Monthly Repayment #2",
    ref: "RP-2026-0002",
    date: "2026-06-12",
    dueDate: "12 June 2026",
    principal: "$8,642.75",
    interest: "$795.50",
    total: "$9,438.25",
    balance: "$68,450.60",
    amount: "$9,438.25",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "03",
    title: "Monthly Repayment #3",
    ref: "RP-2026-0003",
    date: "2026-06-13",
    dueDate: "13 June 2026",
    principal: "$12,754.90",
    interest: "$1,150.00",
    total: "$13,904.90",
    balance: "$87,500.40",
    amount: "$13,904.90",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "04",
    title: "Monthly Repayment #4",
    ref: "RP-2026-0004",
    date: "2026-06-14",
    dueDate: "14 June 2026",
    principal: "$15,200.00",
    interest: "$1,200.00",
    total: "$16,400.00",
    balance: "$90,000.00",
    amount: "$16,400.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "05",
    title: "Monthly Repayment #5",
    ref: "RP-2026-0005",
    date: "2026-06-15",
    dueDate: "15 June 2026",
    principal: "$9,500.25",
    interest: "$650.00",
    total: "$10,150.25",
    balance: "$75,300.80",
    amount: "$10,150.25",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "06",
    title: "Monthly Repayment #6",
    ref: "RP-2026-0006",
    date: "2026-06-16",
    dueDate: "16 June 2026",
    principal: "$11,400.10",
    interest: "$1,050.25",
    total: "$12,450.35",
    balance: "$80,125.00",
    amount: "$12,450.35",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "07",
    title: "Monthly Repayment #7",
    ref: "RP-2026-06-17",
    date: "2026-06-17",
    dueDate: "17 June 2026",
    principal: "$10,500.00",
    interest: "$920.00",
    total: "$11,420.00",
    balance: "$70,500.00",
    amount: "$11,420.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "08",
    title: "Monthly Repayment #8",
    ref: "RP-2026-06-18",
    date: "2026-06-18",
    dueDate: "18 June 2026",
    principal: "$8,900.50",
    interest: "$810.20",
    total: "$9,710.70",
    balance: "$62,000.00",
    amount: "$9,710.70",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "09",
    title: "Monthly Repayment #9",
    ref: "RP-2026-06-19",
    date: "2026-06-19",
    dueDate: "19 June 2026",
    principal: "$13,100.00",
    interest: "$1,180.00",
    total: "$14,280.00",
    balance: "$82,000.00",
    amount: "$14,280.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "10",
    title: "Monthly Repayment #10",
    ref: "RP-2026-06-20",
    date: "2026-06-20",
    dueDate: "20 June 2026",
    principal: "$14,800.00",
    interest: "$1,190.00",
    total: "$15,990.00",
    balance: "$95,000.00",
    amount: "$15,990.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "11",
    title: "Monthly Repayment #11",
    ref: "RP-2026-06-21",
    date: "2026-06-21",
    dueDate: "21 June 2026",
    principal: "$7,800.00",
    interest: "$580.00",
    total: "$8,380.00",
    balance: "$54,000.00",
    amount: "$8,380.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "12",
    title: "Monthly Repayment #12",
    ref: "RP-2026-06-22",
    date: "2026-06-22",
    dueDate: "22 June 2026",
    principal: "$12,400.00",
    interest: "$950.00",
    total: "$13,350.00",
    balance: "$79,000.00",
    amount: "$13,350.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "13",
    title: "Monthly Repayment #13",
    ref: "RP-2026-06-23",
    date: "2026-06-23",
    dueDate: "23 June 2026",
    principal: "$9,200.00",
    interest: "$720.00",
    total: "$9,920.00",
    balance: "$61,000.00",
    amount: "$9,920.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "14",
    title: "Monthly Repayment #14",
    ref: "RP-2026-06-24",
    date: "2026-06-24",
    dueDate: "24 June 2026",
    principal: "$11,800.00",
    interest: "$890.00",
    total: "$12,690.00",
    balance: "$76,000.00",
    amount: "$12,690.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "15",
    title: "Monthly Repayment #15",
    ref: "RP-2026-06-25",
    date: "2026-06-25",
    dueDate: "25 June 2026",
    principal: "$10,900.00",
    interest: "$840.00",
    total: "$11,740.00",
    balance: "$71,000.00",
    amount: "$11,740.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "16",
    title: "Monthly Repayment #16",
    ref: "RP-2026-06-26",
    date: "2026-06-26",
    dueDate: "26 June 2026",
    principal: "$13,500.00",
    interest: "$1,120.00",
    total: "$14,620.00",
    balance: "$86,000.00",
    amount: "$14,620.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "17",
    title: "Monthly Repayment #17",
    ref: "RP-2026-06-27",
    date: "2026-06-27",
    dueDate: "27 June 2026",
    principal: "$8,400.00",
    interest: "$670.00",
    total: "$9,070.00",
    balance: "$58,000.00",
    amount: "$9,070.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "18",
    title: "Monthly Repayment #18",
    ref: "RP-2026-06-28",
    date: "2026-06-28",
    dueDate: "28 June 2026",
    principal: "$14,100.00",
    interest: "$1,160.00",
    total: "$15,260.00",
    balance: "$91,000.00",
    amount: "$15,260.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "19",
    title: "Monthly Repayment #19",
    ref: "RP-2026-06-29",
    date: "2026-06-29",
    dueDate: "29 June 2026",
    principal: "$9,800.00",
    interest: "$780.00",
    total: "$10,580.00",
    balance: "$65,000.00",
    amount: "$10,580.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "20",
    title: "Monthly Repayment #20",
    ref: "RP-2026-06-30",
    date: "2026-06-30",
    dueDate: "30 June 2026",
    principal: "$12,100.00",
    interest: "$880.00",
    total: "$12,980.00",
    balance: "$78,000.00",
    amount: "$12,980.00",
    direction: "out",
    status: "upcoming",
  },
];

export interface LoanTransactionsCardProps {
  transactions?: LoanTransaction[];
  /** Show the status filter toggle. Default false. */
  showStatusToggle?: boolean;
  accentColor?: string;
  accountName?: string;
  accountNumber?: string;
  isDownloading?: boolean;
  onDownload?: (value: BaseDownloadValue) => void;
}

export default function LoanTransactionsCard({
  transactions,
  showStatusToggle = false,
  accentColor = DEFAULT_PIE_COLORS[0],
  accountName = "",
  accountNumber = "",
  isDownloading = false,
  onDownload,
}: LoanTransactionsCardProps) {
  const dataSource = transactions ?? LOAN_TRANSACTIONS;
  const status: TxnStatus = useMemo(
    () => (dataSource.some((t) => t.status === "due") ? "due" : "upcoming"),
    [dataSource],
  );
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>({
    type: "all",
    from: null,
    to: null,
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [statementDownloadOpen, setStatementDownloadOpen] = useState(false);

  const hasActiveFilter = Boolean(dateFilter && dateFilter.type !== "all");

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
        bgcolor: "#FFFFFF",
        position: "relative",
        borderRadius: "20px",
        p: `${padding.xxl}px`,
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: `1px solid ${palette.slate[200]}`,
      }}
    >
      <CardBorderAccent color={accentColor} type="top-left" radius={20} length={28} />
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
          Repayment Schedule
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
          <Button
            variant="outlined"
            onClick={() => setFilterDialogOpen(true)}
            startIcon={<SlidersHorizontal size={15} />}
            sx={{
              height: 38,
              px: 4,
              borderRadius: "8px",
              borderColor: hasActiveFilter ? "#1C64B4" : palette.slate[200],
              bgcolor: hasActiveFilter ? "#F0F7FF" : "#FFFFFF",
              color: hasActiveFilter ? "#1C64B4" : palette.slate[900],
              textTransform: "none",
              fontSize: 13,
              fontWeight: 300,
              boxShadow: "none",
              "&:hover": {
                borderColor: hasActiveFilter ? "#1C64B4" : palette.slate[300],
                bgcolor: hasActiveFilter ? "#E5F0FD" : palette.slate[50],
              },
            }}
          >
            Filters
          </Button>

          {/* Download Statement Button */}
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
        </Stack>
      </Stack>

      {/* Table */}
      <BaseTable
        columns={columns}
        rows={pageItems}
        getRowKey={(t) => t.ref || String(t.no)}
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
            cursor: "default",
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
