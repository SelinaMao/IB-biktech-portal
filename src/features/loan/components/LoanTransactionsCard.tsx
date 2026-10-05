"use client";

import { useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { NorthEastRounded, SouthWestRounded } from "@mui/icons-material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";

import { palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseChip from "@core/components/BaseChip";
import BaseDownloadPanel, { type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import BaseFilter, { BASE_FILTER_TYPE_LABELS, type BaseFilterValue } from "@core/components/BaseFilter";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseSwitch from "@core/form/BaseSwitch";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import SectionCard from "@/features/dashboard/components/SectionCard";
import type { LoanTransaction, TxnStatus } from "../loan.types";

const ROWS_PER_PAGE = 5;

/** Matches BaseCard's padding — bled edge-to-edge so the header tint reaches the card border. */
const CARD_PADDING_PX = 20;

const DEFAULT_DATE_FILTER: BaseFilterValue = { type: "all", from: null, to: null };

export interface LoanTransactionsCardProps {
  transactions: LoanTransaction[];
  /** Show the Processed/Pending toggle. Default true. */
  showStatusToggle?: boolean;
}

export default function LoanTransactionsCard({
  transactions,
  showStatusToggle = true,
}: LoanTransactionsCardProps) {
  const [status, setStatus] = useState<TxnStatus>(() =>
    transactions.some((t) => t.status === "pending") ? "pending" : "processed",
  );
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>(DEFAULT_DATE_FILTER);
  const [rangeAnchor, setRangeAnchor] = useState<null | HTMLElement>(null);
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);

  const filtered = useMemo(() => {
    const byStatus = showStatusToggle
      ? transactions.filter((t) => t.status === status)
      : transactions;
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (t) => t.title.toLowerCase().includes(q) || t.ref.toLowerCase().includes(q),
    );
  }, [transactions, status, showStatusToggle, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(
    currentPage * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE + ROWS_PER_PAGE,
  );

  const columns: BaseTableColumn<LoanTransaction>[] = [
    {
      key: "detail",
      header: "Detail / Reference",
      headSx: { pl: `${CARD_PADDING_PX}px` },
      cellSx: { pl: `${CARD_PADDING_PX}px` },
      render: (t) => {
        const isIn = t.direction === "in";
        return (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                flexShrink: 0,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                bgcolor: isIn ? palette.navy[900] : palette.danger.bg,
                color: isIn ? palette.navy[100] : palette.danger.main,
              }}
            >
              {isIn ? (
                <SouthWestRounded sx={{ fontSize: 16 }} />
              ) : (
                <NorthEastRounded sx={{ fontSize: 16 }} />
              )}
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{t.title}</Typography>
              <Typography variant="caption">Ref: {t.ref}</Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      key: "date",
      header: "Transaction Date",
      render: (t) => <Typography variant="body2">{t.date}</Typography>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      headSx: { pr: `${CARD_PADDING_PX}px` },
      cellSx: { pr: `${CARD_PADDING_PX}px` },
      render: (t) => {
        const isIn = t.direction === "in";
        return (
          <Typography
            sx={{
              fontWeight: 600,
              color: isIn ? palette.navy[100] : palette.danger[500],
            }}
          >
            <BaseBlurText style={{ fontSize: 16 }}>{t.amount}</BaseBlurText>
          </Typography>
        );
      },
    },
  ];

  return (
    <SectionCard
      title="Repayment History"
      header={
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <BaseSearchButton
            value={query}
            onChange={(v) => {
              setQuery(v);
              setPage(0);
            }}
            placeholder="Search repayments…"
          />



          <Button
            variant="outlined"
            size="small"
            endIcon={<KeyboardArrowDownRoundedIcon />}
            onClick={(e) => setRangeAnchor(e.currentTarget)}
            sx={{ color: "text.primary", borderColor: palette.slate[200] }}
          >
            {BASE_FILTER_TYPE_LABELS[dateFilter.type]}
          </Button>
          <BaseFilter
            anchorEl={rangeAnchor}
            onClose={() => setRangeAnchor(null)}
            defaultValue={dateFilter}
            onApply={(value) => {
              setDateFilter(value);
              setRangeAnchor(null);
              setPage(0);
            }}
          />

          <Button
            variant="outlined"
            size="small"
            endIcon={<KeyboardArrowDownRoundedIcon />}
            startIcon={<DownloadRoundedIcon fontSize="small" />}
            onClick={(e) => setDownloadAnchor(e.currentTarget)}
            sx={{ color: "text.primary", borderColor: palette.slate[200] }}
          >
            Download Statement
          </Button>
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
        <BaseTable
          columns={columns}
          rows={pageItems}
          getRowKey={(t) => t.ref}
          headerBgColor={palette.slate[100]}
          headerBorderColor={palette.slate[200]}
          headerTextColor={palette.slate[400]}
          rounded={false}
          emptyTitle={`No ${showStatusToggle ? `${status} ` : ""}repayments in this period.`}
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
      </Box>


    </SectionCard>
  );
}
