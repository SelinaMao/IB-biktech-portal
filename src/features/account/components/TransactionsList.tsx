"use client";

import { useState } from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { NorthEastRounded, SouthWestRounded } from "@mui/icons-material";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { InputAdornment, TextField } from "@mui/material";
import { palette } from "@/theme/palette";
import SearchIcon from "@mui/icons-material/Search";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseDownloadPanel, { type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import BaseFilter, { BASE_FILTER_TYPE_LABELS, type BaseFilterValue } from "@core/components/BaseFilter";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseTable, { type BaseTableColumn } from "@core/components/BaseTable";
import SectionCard from "@/features/dashboard/components/SectionCard";
import { formatTransactionAmount, isIncomingTransaction } from "../account.slice";
import type { TTransactionDetailResponse } from "../account.types";

/** Matches BaseCard's padding — bled edge-to-edge so the header tint reaches the card border. */
const CARD_PADDING_PX = 20;

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
  /** Rows across all pages (server total) — drives Previous/Next. */
  total: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
  showDownload?: boolean;
  isDownloading?: boolean;
  onDownload?: (value: BaseDownloadValue) => void;
  /** Fired with the chosen format when a "View Certificate" format option is picked. */
  onViewCertificate?: (format: "pdf" | "image") => void;
  /** Fired with the chosen format when a certificate download option is picked. */
  onDownloadCertificate?: (format: "pdf" | "image") => void;
}
const CERTIFICATE_FORMATS: Array<{ value: "pdf" | "image"; label: string }> = [
  { value: "pdf", label: "PDF" },
  { value: "image", label: "Image" },
];

export default function TransactionsList({
  transactions,
  isLoading = false,
  error = false,
  onSelectTransaction,
  query,
  onQueryChange,
  showDateFilter = false,
  dateFilter,
  onDateFilterChange,
  page,
  total,
  rowsPerPage,
  onPageChange,
  showDownload = false,
  isDownloading = false,
  onDownload,
  onViewCertificate,
  onDownloadCertificate,
}: TransactionsListProps) {
  const [rangeAnchor, setRangeAnchor] = useState<null | HTMLElement>(null);
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);

  const columns: BaseTableColumn<TTransactionDetailResponse>[] = [
    {
      key: "detail",
      header: "Detail / Reference",
      headSx: { pl: `${CARD_PADDING_PX}px` },
      cellSx: { pl: `${CARD_PADDING_PX}px` },
      render: (t) => {
        const isIn = isIncomingTransaction(t);
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
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{t.transactionDescription}</Typography>
              <Typography variant="caption">Ref: {t.transactionReferenceCode}</Typography>
            </Box>
          </Stack>
        );
      },
    },
    {
      key: "date",
      header: "Transaction Date",
      render: (t) => <Typography variant="body2">{t.transactionDate}</Typography>,
    },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      headSx: { pr: `${CARD_PADDING_PX}px` },
      cellSx: { pr: `${CARD_PADDING_PX}px` },
      render: (t) => {
        const isIn = isIncomingTransaction(t);
        return (
          <Typography
            sx={{
              fontWeight: 600,
              color: isIn ? palette.navy[100] : palette.danger[500],
            }}
          >
            <BaseBlurText style={{ fontSize: 16 }}>{formatTransactionAmount(t)}</BaseBlurText>
          </Typography>
        );
      },
    },
  ];

  return (
    <>
      <SectionCard
        title="Latest Transactions"
        // header={
        //   <Stack
        //     direction="row"
        //     spacing={1.5}
        //     sx={{ alignItems: "center", flexWrap: "wrap" }}
        //   >
        //     <BaseSearchButton
        //       value={query}
        //       onChange={onQueryChange}
        //       placeholder="Search transactions…"
        //     />

        //     {showDateFilter && (
        //       <>
        //         <Button
        //           variant="outlined"
        //           size="small"
        //           endIcon={<KeyboardArrowDownRoundedIcon />}
        //           onClick={(e) => setRangeAnchor(e.currentTarget)}
        //           sx={{ color: "text.primary", borderColor: palette.slate[200] }}
        //         >
        //           {BASE_FILTER_TYPE_LABELS[dateFilter.type]}
        //         </Button>
        //         <BaseFilter
        //           anchorEl={rangeAnchor}
        //           onClose={() => setRangeAnchor(null)}
        //           defaultValue={dateFilter}
        //           onApply={(value) => {
        //             onDateFilterChange(value);
        //             setRangeAnchor(null);
        //           }}
        //         />
        //       </>
        //     )}

        //     {showDownload && (
        //       <>
        //         <Button
        //           variant="outlined"
        //           size="small"
        //           disabled={isDownloading}
        //           endIcon={<KeyboardArrowDownRoundedIcon />}
        //           startIcon={isDownloading ? <CircularProgress size={16} color="inherit" /> : <DownloadRoundedIcon fontSize="small" />}
        //           onClick={(e) => setDownloadAnchor(e.currentTarget)}
        //           sx={{ color: "text.primary", borderColor: palette.slate[200] }}
        //         >
        //           Download
        //         </Button>
        //         <BaseDownloadPanel
        //           anchorEl={downloadAnchor}
        //           onClose={() => setDownloadAnchor(null)}
        //           onDownload={(value) => {
        //             setDownloadAnchor(null);
        //             onDownload?.(value);
        //           }}
        //         />
        //       </>
        //     )}
        //   </Stack>
        // }
        showBorder={false}
      >
        <Box
          sx={{
            width: `calc(100% + ${CARD_PADDING_PX * 2}px)`,
            mx: `-${CARD_PADDING_PX}px`,
            padding:"10px"
          }}
        >
          <Box sx={{ fontFamily: "Poppins, sans-serif", width: "100%" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <BaseSearchButton
              value={query}
              onChange={onQueryChange}
              placeholder="Search transactions…"
            />

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                <Button variant="outlined" sx={{
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: 15,
                  color: "#4B5563",
                  borderColor: "#DDE3F0",
                  borderRadius: "10px",
                  height: 38,
                  px: 2.25,
                  backgroundColor: "#fff",
                  "&:hover": { borderColor: "#B8C2DB", backgroundColor: "#F8FAFF" },
                }}>Last 7days</Button>

                <Button variant="outlined" sx={{
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: 15,
                  color: "#4B5563",
                  borderColor: "#DDE3F0",
                  borderRadius: "10px",
                  height: 38,
                  px: 2.25,
                  backgroundColor: "#fff",
                  "&:hover": { borderColor: "#B8C2DB", backgroundColor: "#F8FAFF" },
                }}>Last 30days</Button>
                {/* <Button variant="outlined" sx={{display: "flex", gap: 1.5, flexWrap: "wrap" }}> */}
                <Button variant="outlined" sx={{
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: 15,
                  color: "#4B5563",
                  borderColor: "#DDE3F0",
                  borderRadius: "10px",
                  height: 38,
                  px: 2.25,
                  backgroundColor: "#fff",
                  "&:hover": { borderColor: "#B8C2DB", backgroundColor: "#F8FAFF" },
                }}>Custom date</Button>
              </Box>
            </Box>
          </Box>
        <BaseTable
          columns={columns}
          rows={transactions}
          getRowKey={(t) => t.transactionId}
          onRowClick={onSelectTransaction}
          isLoading={isLoading}
          headerBgColor={palette.slate[100]}
          headerBorderColor={palette.slate[200]}
          headerTextColor={palette.slate[400]}
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
      </Box>
    </SectionCard >
    </>
  );
}
