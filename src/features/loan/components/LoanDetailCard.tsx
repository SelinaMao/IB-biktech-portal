"use client";

import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import { Info, ReceiptText } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseButton from "@core/components/BaseButton";
import BaseDownloadPanel, { type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import type { BorrowerProfile, LoanScheduleDetails } from "../loan.types";

export interface LoanDetailCardProps {
  borrower?: BorrowerProfile;
  schedule?: LoanScheduleDetails;
  loanName?: string;
  accountNumber?: string;
  loanReference?: string;
  loanType?: string;
  outstandingAmount?: number;
  currency?: string;
  nextPaymentAmount?: number;
  nextPaymentDate?: string;
  interestRatePct?: number;
  repaymentFrequency?: string;
  maturityDate?: string;
  approvedLimit?: number;
  disbursementDate?: string;
  overdueCount?: number;
  onPayNow?: () => void;
  onOpenDetails?: () => void;
  onOpenAccountInfo?: () => void;
  onOpenStatements?: (e: React.MouseEvent<HTMLElement>) => void;
  onExportStatements?: (value: BaseDownloadValue) => void;
}

/** Formats as "6,700,000.00 USD" (suffix currency code) */
function formatAmountSuffix(amount: number | string | undefined | null, ccy: string = "USD"): string {
  const num = Number(amount ?? 0);
  const formatted = (isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${ccy}`;
}

export default function LoanDetailCard({
  borrower,
  schedule,
  loanName,
  accountNumber,
  loanReference,
  loanType,
  outstandingAmount,
  currency = "USD",
  nextPaymentAmount,
  nextPaymentDate,
  interestRatePct,
  repaymentFrequency,
  maturityDate,
  approvedLimit,
  disbursementDate,
  overdueCount,
  onPayNow,
  onOpenDetails,
  onOpenAccountInfo,
  onOpenStatements,
  onExportStatements,
}: LoanDetailCardProps) {
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);

  // Resolve data with sensible fallbacks matching the design
  const name = loanName || borrower?.name || "Car Loan";
  const accNum = accountNumber || borrower?.accountNumber || "000 067 898";
  const ref = loanReference || "CLN-2024-001892";
  const type = loanType || schedule?.accountType || "Car Loan";
  const outstanding = outstandingAmount ?? schedule?.outstandingPrincipal ?? 6_700_000;
  const ccy = currency || schedule?.currency || "USD";
  const rate = interestRatePct ?? schedule?.interestRatePct ?? 5.25;
  const frequency = repaymentFrequency || schedule?.repaymentMethod || "Monthly";
  const matDate = maturityDate || schedule?.maturityDate || "08 Sep 2030";
  const limit = approvedLimit ?? schedule?.approvedLimit ?? 100_000;
  const disbDate = disbursementDate || schedule?.disbursementDate || "08 Sep 2024";

  const detailRows = [
    { label: name, value: ref },
    { label: "Loan Type", value: type },
    { label: "Repayment Frequency", value: frequency },
    {
      label: "Approved Limit",
      value: formatAmountSuffix(limit, ccy),
      color: "#0F5196",
    },
    { label: "Disbursement Date", value: disbDate },
  ];

  const statCards = [
    {
      label: "Outstanding amount",
      value: formatAmountSuffix(outstanding, ccy),
      color: "#0F5196",
    },
    {
      label: "Maturity Date",
      value: matDate,
      color: "#0F172A",
    },
    {
      label: "Interest Rate",
      value: `${typeof rate === "number" ? rate.toFixed(2) : rate}% p.a.`,
      color: "#166D35",
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        width: "100%",
        boxSizing: "border-box",
        p: { xs: "16px", sm: "20px", md: "20px 24px" },
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        gridTemplateAreas: {
          xs: `"header" "detail" "cards" "buttons"`,
          md: `"header cards" "detail cards" "buttons buttons"`,
        },
        gridTemplateRows: { md: "auto auto 1fr" },
        columnGap: { md: "26px" },
        rowGap: "20px",
      }}
    >
      {/* ───────── Header (left, top) ───────── */}
      <Box sx={{ gridArea: "header" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Typography
            sx={{
              fontSize: { xs: "16px", md: "18px" },
              fontWeight: 600,
              color: "#0F172A",
              lineHeight: 1.3,
              m: 0,
            }}
          >
            {name}
          </Typography>
          <Box
            sx={{
              px: "10px",
              py: "2px",
              borderRadius: "20px",
              bgcolor: "#E0EEFF",
              color: "#0F5196",
              fontSize: "12px",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            Loan
          </Box>
        </Box>
        <Typography
          sx={{
            color: "#475569",
            fontSize: "13px",
            lineHeight: 1.4,
            mt: "6px",
          }}
        >
          {formatAccountNumber(accNum) || "000 067 898"}
        </Typography>
      </Box>

      {/* ───────── Account Details (left column) ───────── */}
      <Box sx={{ gridArea: "detail" }}>
        <Typography
          sx={{
            fontSize: "16px",
            fontWeight: 700,
            color: "#0F172A",
            m: 0,
            mb: "8px",
            lineHeight: 1.4,
          }}
        >
          Account Details
        </Typography>

        <Box>
          {detailRows.map((row) => (
            <Box
              key={row.label}
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr auto",
                alignItems: "center",
                columnGap: "12px",
                py: "14px",
                borderBottom: "1px solid #E5E9F0",
                "&:last-of-type": { borderBottom: "none" },
              }}
            >
              <Typography sx={{ fontSize: "13px", color: "#64748B" }}>
                {row.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: row.color || "#0F172A",
                  textAlign: "right",
                }}
              >
                {row.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* ───────── Stat cards (right column) ───────── */}
      <Box
        sx={{
          gridArea: "cards",
          display: "grid",
          gridAutoRows: "min-content",
          rowGap: "9px",
          width: "100%",
          minWidth: 0,
          alignContent: "start",
          alignSelf: "start",
        }}
      >
        {statCards.map((card) => (
          <Box
            key={card.label}
            sx={{
              bgcolor: "#F4F7FB",
              borderRadius: "10px",
              p: "12px 14px",
              display: "grid",
              rowGap: "6px",
              minWidth: 0,
            }}
          >
            <Typography sx={{ fontSize: "11px", color: "#64748B", lineHeight: 1.4 }}>
              {card.label}
            </Typography>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 600,
                color: card.color,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
              }}
            >
              {card.value}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* ───────── Buttons (bottom-left) ───────── */}
      <Box
        sx={{
          gridArea: "buttons",
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(2, max-content)" },
          justifyContent: "start",
          gap: "12px",
        }}
      >
        <BaseButton
          sx={{
            p: "8px 16px",
            bgcolor: "#E8EEF5",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 500,
            textTransform: "none",
            color: "#0F172A",
            boxShadow: "none",
            "&:hover": { bgcolor: "#DCE5F0" },
          }}
          // onClick={onOpenAccountInfo || onOpenDetails}
          startIcon={<Info size={16} />}
          title="Account Information"
        />
        <BaseButton
          sx={{
            p: "8px 16px",
            bgcolor: "#E8EEF5",
            borderRadius: "999px",
            fontSize: "13px",
            fontWeight: 500,
            textTransform: "none",
            color: "#0F172A",
            boxShadow: "none",
            "&:hover": { bgcolor: "#DCE5F0" },
          }}
          onClick={(e) => {
            setDownloadAnchor(e.currentTarget);
            onOpenStatements?.(e);
          }}
          startIcon={<ReceiptText size={16} />}
          title="Statements"
        />
      </Box>

      <BaseDownloadPanel
        anchorEl={downloadAnchor}
        onClose={() => setDownloadAnchor(null)}
        onDownload={(value) => {
          setDownloadAnchor(null);
          onExportStatements?.(value);
        }}
      />
    </Box>
  );
}
