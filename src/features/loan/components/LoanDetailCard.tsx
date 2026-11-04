"use client";

import React, { useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Check, Copy, Info } from "lucide-react";
import dayjs from "dayjs";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import type { BaseDownloadValue } from "@core/components/BaseDownloadPanel";
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
function formatAmountSuffix(
  amount: number | string | undefined | null,
  ccy: string = "USD",
): string {
  const num = Number(amount ?? 0);
  const formatted = (isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${ccy}`;
}

function formatMaturityDate(dateStr?: string): string {
  if (!dateStr || dateStr === "-") return "-";
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : dateStr;
}

export default function LoanDetailCard({
  borrower,
  schedule,
  loanName,
  accountNumber,
  loanType,
  outstandingAmount,
  currency = "USD",
  maturityDate,
  onOpenDetails,
  onOpenAccountInfo,
}: LoanDetailCardProps) {
  const [copied, setCopied] = useState(false);

  // Resolve data from props and borrower/schedule
  const name = loanName || borrower?.name || "Car Loan";
  const rawAccNumber = accountNumber || borrower?.accountNumber || "";
  const formattedAccNumber =
    formatAccountNumber(rawAccNumber) || rawAccNumber || "000 067 898";
  const type = loanType || schedule?.accountType || "Loan";
  const ccy = currency || schedule?.currency || "USD";
  const outstanding = outstandingAmount ?? schedule?.outstandingPrincipal ?? 0;
  const rawMatDate = maturityDate || schedule?.maturityDate || "-";
  const formattedMatDate = formatMaturityDate(rawMatDate);

  const accountTypeSubtitle = `${
    type.toLowerCase().includes("loan") ? "Loan" : type
  } · ${ccy}`;

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = (rawAccNumber || formattedAccNumber).replace(/\s+/g, "");
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "24px",
         p: { xs: 2.5, sm: "16px 16px" },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "stretch" },
        }}
      >
        {/* ───────── Left Section: Account Header & Info ───────── */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            minWidth: 0,
            flex: 1,
            pr: { md: 2 },
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: 20, md: 22 },
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
              }}
            >
              {name}
            </Typography>

            {/* Account Number + Copy */}
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mt: 3 }}
            >
              <Typography
                sx={{ fontSize: 14, color: "#334155", fontWeight: 500 }}
              >
                {formattedAccNumber}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy account number"}>
                <IconButton
                  size="small"
                  onClick={handleCopyAccount}
                  sx={{
                    p: 1.25,
                    color: copied ? "#166D35" : "#475569",
                    "&:hover": { color: "#0F172A" },
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography sx={{ fontSize: 13, color: "#64748B", mt: 3 }}>
              {accountTypeSubtitle}
            </Typography>
          </Box>

          {/* Bottom Button: Account Information */}
          <Box sx={{ mt: { xs: 4.5, md: 5.5 } }}>
            <BaseButton
              title="Account Information"
              variant="contained"
              startIcon={<Info size={16} />}
              onClick={onOpenAccountInfo || onOpenDetails}
              sx={{
                bgcolor: "#EBF3FA",
                color: "#0F172A",
                borderRadius: "999px",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                px: 4.5,
                py: 0.9,
                height: 38,
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#DCE8F5" },
              }}
            />
          </Box>
        </Box>

        {/* ───────── Right Section: Metric Cards ───────── */}
        <Box
          sx={{
            width: { xs: "100%", md: 360, lg: 233 },
            minWidth: { md: 240 },
            flexShrink: 0,
          }}
        >
          <Stack spacing={4}>
            {/* Outstanding Balance */}
            <Box
              sx={{
                bgcolor: "#F4F7FB",
                borderRadius: "14px",
                p: "14px 20px",
              }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  color: "#64748B",
                  fontWeight: 400,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}
              >
                Outstanding Balance
              </Typography>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0D4984",
                  lineHeight: 1.3,
                  fontfamily: "latin",
                }}
              >
                <BaseBlurText>
                  {formatAmountSuffix(outstanding, ccy)}
                </BaseBlurText>
              </Typography>
            </Box>

            {/* Maturity Date */}
            <Box
              sx={{
                bgcolor: "#F4F7FB",
                borderRadius: "14px",
                p: "14px 20px",
              }}
            >
              <Typography
                 sx={{
                  fontSize: 14,
                  color: "#64748B",
                  fontWeight: 400,
                  mb: 0.5,
                  lineHeight: 1.2,
                }}              >
                Maturity Date
              </Typography>
              <Typography
                 sx={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#0F172A",
                  lineHeight: 1.3,
                }}
              >
                {formattedMatDate}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
