"use client";

import React, { useState } from "react";
import { Box, Divider, IconButton, Stack, Typography } from "@mui/material";
import { EllipsisVertical, Info, ReceiptText } from "lucide-react";

import { font, palette } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import { formatCCY } from "@/utils";
import BaseBlurText from "@core/components/BaseBlurText";
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
  const nextPayment = nextPaymentAmount ?? schedule?.nextInstallmentAmount ?? 560.86;
  const nextDate = nextPaymentDate || schedule?.nextInstallmentDate || "1 October 2026";
  const rate = interestRatePct ?? schedule?.interestRatePct ?? 5.0;
  const frequency = repaymentFrequency || schedule?.repaymentMethod || "Monthly";
  const matDate = maturityDate || schedule?.maturityDate || "08 Sep 2030";
  const limit = approvedLimit ?? schedule?.approvedLimit ?? 100_000;
  const disbDate = disbursementDate || schedule?.disbursementDate || "08 Sep 2024";
  const overdue = overdueCount ?? schedule?.overdueCount ?? 3;

  const detailRows = [
    { label: name, value: ref },
    { label: "Loan Type", value: type },
    {
      label: "Interest Rate",
      value: `${rate.toFixed(2)}% p.a.`,
      color: "#166D35",
    },
    { label: "Repayment Frequency", value: frequency },
    { label: "Maturity Date", value: matDate },
    {
      label: "Approved Limit",
      value: formatCCY(limit, ccy),
      color: "#2589BD",
    },
    { label: "Disbursement Date", value: disbDate },
    {
      label: "No. of Overdue",
      value: overdue.toString(),
      color: overdue > 0 ? "#E11D48" : "#0F172A",
    },
  ];

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: { xs: 2.5, sm: 3.5 },
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      {/* Header Row: Loan Name, Badge, Account Number & 3-dots */}
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              {name}
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.25,
                borderRadius: "20px",
                bgcolor: "#E6EEF8",
                color: "#257DCF",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Loan
            </Box>
          </Stack>
          <Typography sx={{ fontSize: 14, color: "#64748B", mt: 0.5 }}>
            {formatAccountNumber(accNum)}
          </Typography>
        </Box>

        <IconButton
          onClick={onOpenDetails}
          aria-label="More options"
          sx={{
            width: 36,
            height: 36,
            bgcolor: "#F1F5F9",
            color: "#0F172A",
            "&:hover": { bgcolor: "#E2E8F0" },
          }}
        >
          <EllipsisVertical size={18} />
        </IconButton>
      </Stack>

      {/* Outstanding Amount */}
      <Box sx={{ mt: 3 }}>
        <Typography sx={{ fontSize: 13, color: "#64748B", mb: 0.5 }}>
          Outstanding amount
        </Typography>
        <Typography sx={{ fontSize: { xs: 24, sm: 28 }, fontWeight: 800, color: "#0F172A", lineHeight: 1.2 }}>
          <BaseBlurText>{formatCCY(outstanding, ccy)}</BaseBlurText>
        </Typography>
      </Box>

      {/* Next Payment Due Banner */}
      <Box
        sx={{
          bgcolor: "#FFF6ED",
          borderRadius: "16px",
          p: { xs: 2, sm: 2.5 },
          mt: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 13, color: "#64748B", mb: 0.25 }}>
            Next Payment due
          </Typography>
          <Typography sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 800, color: "#0F172A" }}>
            <BaseBlurText>{formatCCY(nextPayment, ccy)}</BaseBlurText>
          </Typography>
          <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.25 }}>
            {nextDate}
          </Typography>
        </Box>

        <BaseButton
          title="Pay now"
          variant="contained"
          onClick={onPayNow}
          sx={{
            borderRadius: "999px",
            bgcolor: "#2764A5",
            color: "#FFFFFF",
            fontSize: 14,
            fontWeight: 600,
            px: 3,
            py: 1,
            textTransform: "none",
            boxShadow: "none",
            "&:hover": { bgcolor: "#1E5289" },
          }}
        />
      </Box>

      {/* Account Details Box */}
      <Box
        sx={{
          bgcolor: "#F8FAFC",
          borderRadius: "16px",
          p: { xs: 2.5, sm: 3 },
          mt: 2.5,
        }}
      >
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 1 }}>
          Account Details
        </Typography>

        <Stack divider={<Divider flexItem sx={{ borderColor: "#F1F5F9" }} />} spacing={0}>
          {detailRows.map((row) => (
            <Stack
              key={row.label}
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
            >
              <Typography sx={{ fontSize: 14, color: "#64748B" }}>
                {row.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: row.color || "#0F172A",
                  textAlign: "right",
                }}
              >
                {row.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* Bottom Action Pill Buttons */}
      <Stack direction={{ xs: 'column', sm: 'row' }}
        spacing={1.75}
        sx={{ mt: 3 }}>
        <BaseButton
          sx={{
            padding: "8px 20px",
            bgcolor: "#EBF3FC",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 500,
            textTransform: "none",
            color: "#1E293B",
            boxShadow: "none",
            "&:hover": { bgcolor: "#E2EDF9" },
          }}
          onClick={onOpenAccountInfo}
          startIcon={<Info size={17} />}
          title="Account Information"
        />
        <BaseButton
          sx={{
            padding: "8px 20px",
            bgcolor: "#EBF3FC",
            borderRadius: "999px",
            fontSize: "14px",
            fontWeight: 500,
            textTransform: "none",
            color: "#1E293B",
            boxShadow: "none",
            "&:hover": { bgcolor: "#E2EDF9" },
          }}
          onClick={(e) => {
            setDownloadAnchor(e.currentTarget);
            onOpenStatements?.(e);
          }}
          startIcon={<ReceiptText size={17} />}
          title="Statements"
        />
      </Stack>

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
