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
  accentColor?: string;
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

/** Formats amount as "USD 6,700,000.00" or "KHR 120,293,000.00" */
function formatCurrencyPrefix(
  amount: number | string | undefined | null,
  ccy: string = "USD",
): string {
  const num = Number(amount ?? 0);
  const formatted = (isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${(ccy || "USD").toUpperCase()} ${formatted}`;
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
  accentColor,
  maturityDate,
  onOpenDetails,
  onOpenAccountInfo,
}: LoanDetailCardProps) {
  const [copied, setCopied] = useState(false);
  const cardAccentColor = accentColor || "#5CAFE4";

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
        border: "1px solid #EDF2F7",
        borderLeft: `4px solid ${cardAccentColor}`,
        transition: "border-left-color 0.2s ease-in-out",
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
                fontSize: { xs: 20, md: 24 },
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
              }}
            >
              {name}
            </Typography>

            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mt: 3 }}
            >
              <Typography
                sx={{
                  fontSize: 14,
                  color: "#334155",
                  fontWeight: 500,
                  letterSpacing: "0.01em",
                }}
              >
                {formattedAccNumber}
              </Typography>
              <Tooltip title={copied ? "Copied!" : "Copy account number"}>
                <IconButton
                  size="small"
                  onClick={handleCopyAccount}
                  sx={{
                    p: 1.25,
                    color: copied ? "#166D35" : "#64748B",
                    "&:hover": { color: "#0F172A" },
                  }}
                >
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                </IconButton>
              </Tooltip>
            </Stack>

            <Typography
              sx={{
                fontSize: 13.5,
                color: "#64748B",
                mt: 3,
                fontWeight: 400,
              }}
            >
              {accountTypeSubtitle}
            </Typography>
          </Box>

          <Box sx={{ mt: { xs: 4.5, md: 5.5 } }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2.5}
              sx={{
                alignItems: { xs: "flex-start", sm: "center" },
                flexWrap: "wrap",
              }}
            >
              <BaseButton
                title="Account Information"
                variant="contained"
                startIcon={<Info size={16} />}
                onClick={onOpenDetails || onOpenAccountInfo}
                sx={{
                  bgcolor: "#EBF3FA",
                  color: "#0F172A",
                  borderRadius: "999px",
                  textTransform: "none",
                  fontSize: 13.5,
                  fontWeight: 600,
                  px: 4.5,
                  py: 0.85,
                  height: 38,
                  boxShadow: "none",
                  whiteSpace: "nowrap",
                  "&:hover": {
                    bgcolor: "#DFEAF6",
                    boxShadow: "none",
                  },
                }}
              />
            </Stack>
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
            {/* Metric 1: Outstanding Amount */}
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
                Outstanding amount
              </Typography>
              <Typography
                sx={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#0D4984",
                  lineHeight: 1.3,
                }}
              >
                <BaseBlurText>
                  {formatCurrencyPrefix(outstanding, ccy)}
                </BaseBlurText>
              </Typography>
            </Box>

            {/* Metric 2: Maturity Date */}
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
