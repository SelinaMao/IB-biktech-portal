"use client";

import { useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { padding, palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import BaseDownloadPanel, { type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import SectionCard from "@/features/dashboard/components/SectionCard";
import type { LoanTransaction, TxnStatus } from "../loan.types";
import BaseFilterByDay, {
  type BaseFilterByDayValue,
  isDateWithinFilter,
} from "@/@core/components/BaseFilterByDay";

const ROWS_PER_PAGE = 5;

/** Matches BaseCard's padding — bled edge-to-edge so the header tint reaches the card border. */
const CARD_PADDING_PX = 20;

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
    balance: "$88,500.00",
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
    principal: "$9,800.00",
    interest: "$670.00",
    total: "$10,470.00",
    balance: "$73,000.00",
    amount: "$10,470.00",
    direction: "out",
    status: "upcoming",
  },
  {
    no: "12",
    title: "Monthly Repayment #12",
    ref: "RP-2026-06-22",
    date: "2026-06-22",
    dueDate: "22 June 2026",
    principal: "$11,900.00",
    interest: "$1,080.00",
    total: "$12,980.00",
    balance: "$0.00",
    amount: "$12,980.00",
    direction: "out",
    status: "upcoming",
  },
];

export interface LoanTransactionsCardProps {
  transactions?: LoanTransaction[];
  /** Show the status filter toggle. Default false. */
  showStatusToggle?: boolean;
}

export default function LoanTransactionsCard({
  transactions,
  showStatusToggle = false,
}: LoanTransactionsCardProps) {
  const dataSource =
    transactions && transactions.length > 0 ? transactions : LOAN_TRANSACTIONS;
  const [status, setStatus] = useState<TxnStatus>(() =>
    dataSource.some((t) => t.status === "due") ? "due" : "upcoming",
  );
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterByDayValue | null>(null);
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);

  const filtered = useMemo(() => {
    const byStatus = showStatusToggle
      ? dataSource.filter((t) => t.status === status)
      : dataSource;

    const byDate = dateFilter
      ? byStatus.filter((t) =>
          isDateWithinFilter(t.dueDate || t.date, dateFilter),
        )
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
      headSx: { pl: `${CARD_PADDING_PX}px`, py: 1.8, width: 60 },
      cellSx: { pl: `${CARD_PADDING_PX}px`, py: 3 },
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
      headSx: { py: 1.8 },
      cellSx: { py: 3 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[700] }}>
          {t.dueDate ?? t.date}
        </Typography>
      ),
    },
    {
      key: "principal",
      header: "Principal",
      headSx: { py: 1.8 },
      cellSx: { py: 3 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[700] }}>
          <BaseBlurText>{t.principal}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "interest",
      header: "Interest",
      headSx: { py: 1.8 },
      cellSx: { py: 3 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[700] }}>
          <BaseBlurText>{t.interest}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "total",
      header: "Total",
      headSx: { py: 1.8 },
      cellSx: { py: 3 },
      render: (t) => (
        <Typography
          sx={{
            fontSize: 15,
            fontWeight: 700,
            color: "#000000",
          }}
        >
          <BaseBlurText>{t.total}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      headSx: { py: 1.8 },
      cellSx: { py: 3 },
      render: (t) => (
        <Typography sx={{ fontSize: 14, color: palette.slate[700] }}>
          <BaseBlurText>{t.balance}</BaseBlurText>
        </Typography>
      ),
    },
    {
      key: "status",
      header: "Status",
      headSx: { pr: `${CARD_PADDING_PX}px`, py: 1.8 },
      cellSx: { pr: `${CARD_PADDING_PX}px`, py: 3 },
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
              px: 1.8,
              py: 0.45,
              borderRadius: "9999px",
              bgcolor: bg,
              color: color,
              fontSize: 12,
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
    <SectionCard
      title="Repayment Schedule"
      header={
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <BaseButton
            title="Export Schedule"
            variant="outlined"
            onClick={(e) => setDownloadAnchor(e.currentTarget)}
            sx={{
              color: "#ffffff",
              bgcolor: "#2764A5",
              padding: "6px 14px",
              borderRadius: "50px",
              fontSize: "13px",
              fontWeight: 500,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "white",
                color: "black",
              },
            }}
          />
          <BaseDownloadPanel
            anchorEl={downloadAnchor}
            onClose={() => setDownloadAnchor(null)}
            onDownload={(value: BaseDownloadValue) => {
              setDownloadAnchor(null);
            }}
          />
        </Stack>
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
                setQuery(v);
                setPage(0);
              }}
              placeholder="Search repayments…"
              tooltip="Search"
              width={240}
            />
            <BaseFilterByDay
              value={dateFilter}
              onChange={(v) => {
                setDateFilter(v);
                setPage(0);
              }}
            />
          </Box>
        </Stack>
        <BaseTable
          columns={columns}
          rows={pageItems}
          getRowKey={(t) => t.ref || String(t.no)}
          headerBgColor="#FFFFFF"
          headerBorderColor="#E2E8F0"
          headerTextColor={palette.slate[500]}
          headerBorderTop={false}
          rounded={false}
          emptyTitle={`No ${showStatusToggle ? `${status} ` : ""}repayments in this period.`}
          getRowSx={(row) => {
            const isDue = (row.status || "").toLowerCase() === "due";
            return isDue
              ? {
                  bgcolor: "#FFF5EA",
                  "&:hover": { bgcolor: "#FFEED8" },
                  "& .MuiTableCell-root, & td": {
                    bgcolor: "transparent",
                    borderBottom: "none",
                    py: 3,
                  },
                }
              : {
                  "& .MuiTableCell-root, & td": {
                    borderBottom: "none",
                    py: 3,
                  },
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
          paginationSx={{
            pr: `${CARD_PADDING_PX}px`,
            pl: `${CARD_PADDING_PX}px`,
            py: 1.5,
          }}
          paginationVariant="compact"
        />
        
      </Box>
    </SectionCard>
  );
}
