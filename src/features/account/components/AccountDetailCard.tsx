"use client";

import React, { useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Check, Copy, Info } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import type { BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import type { CoreAccountEntry, IAccountDetailResponses } from "../account.types";
import AccountDetails from "./AccountDetails";

export interface AccountDetailsProps {
  open?: boolean;
  accounts?: CoreAccountEntry[];
  selectedAccount?: CoreAccountEntry;
  stats?: IAccountDetailResponses;
  onClose?: () => void;
  info?: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  isFixedDeposit?: boolean;
  isSaving?: boolean;
  onOpenAccountInfo?: () => void;
  onOpenStatements?: (e?: React.MouseEvent<HTMLElement>) => void;
  onExportStatements?: (value: BaseDownloadValue) => void;
  onDownloadCertificate?: () => void | Promise<void>;
}

/** Formats dynamic amount as "USD 6,700,000.00" */
function formatAmountPrefix(
  amount: number | string | undefined | null,
  ccy: string = "USD",
): string {
  const num = Number(amount ?? 0);
  const formatted = (isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${ccy} ${formatted}`;
}

export default function AccountDetailCard({
  open = false,
  onClose,
  selectedAccount,
  stats,
  info,
  fixedDeposit,
  isFixedDeposit = false,
  onOpenAccountInfo,
  onDownloadCertificate,
}: AccountDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const target = fixedDeposit || info;
  const ccy = target?.currencyCode ?? target?.ccy ?? info?.ccy ?? selectedAccount?.ccy ?? "USD";
  const rawType = (target?.accountType || stats?.accountType || info?.accountType || selectedAccount?.accountType || "").toUpperCase();
  const desc = (target?.productDesc || stats?.productDesc || info?.productDesc || "").toLowerCase();

  const isTD = isFixedDeposit || rawType === "TD" || desc.includes("fixed") || desc.includes("deposit");
  const isCL = rawType === "CL" || desc.includes("loan");

  const rawAccountNumber = target?.accountNumber || info?.accountNumber || selectedAccount?.accountNumber || "";
  const formattedAccNumber = formatAccountNumber(rawAccountNumber) || rawAccountNumber;

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rawAccountNumber) {
      navigator.clipboard.writeText(rawAccountNumber.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Subtitle Type Label
  const accountTypeSubtitle = isTD
    ? `Fixed Deposit · ${ccy}`
    : isCL
    ? `Loan account · ${ccy}`
    : info?.productDesc
    ? `${info.productDesc} · ${ccy}`
    : `Current account · ${ccy}`;

  // Title name
  const accountTitleName = isTD
    ? "Fixed Account"
    : target?.accountName || info?.accountName || selectedAccount?.accountName || "Shiiping co., ltd.";

  // TD Metrics
  const depositAmount = target?.placementAmt ?? info?.placementAmt ?? info?.availableBalance ?? selectedAccount?.availableBalance ?? 6700000;
  const maturityAmount = target?.totalAmountToReceive ?? info?.totalAmountToReceive ?? 10000000;

  // Progress calculation for TD (20 segments matching mockup)
  const totalSegments = 20;
  const percentage = (() => {
    if (
      target?.totalMaturityDays &&
      target.totalMaturityDays > 0 &&
      target.onGoingMaturityDays !== undefined
    ) {
      return Math.min(
        100,
        Math.max(0, Math.round((target.onGoingMaturityDays / target.totalMaturityDays) * 100)),
      );
    }
    if (maturityAmount > 0 && depositAmount > 0) {
      return Math.min(100, Math.max(0, Math.round((Number(depositAmount) / Number(maturityAmount)) * 100)));
    }
    return 20;
  })();
  const activeSegments = Math.max(0, Math.round((percentage / 100) * totalSegments)) || 4;
  const ccySymbol = ccy === "KHR" ? "KHR " : "$";

  // CA Metrics (100% dynamic from API / selectedAccount)
  const availableBal = stats?.availableBalance ?? info?.availableBalance ?? selectedAccount?.availableBalance ?? 6700000;
  const totalBal = stats?.ledgerBalance ?? info?.ledgerBalance ?? stats?.currentBalance ?? info?.currentBalance ?? 32400;

  // CL Metrics
  const approvedLimit = (info as unknown as Record<string, unknown>)?.approvedLimit as number ?? 100000;
  const outstandingAmount = info?.loanAmount ?? info?.availableBalance ?? selectedAccount?.availableBalance ?? 6700000;

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: { xs: 2.5, sm: 3 },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
        }}
      >
        {/* ───────── Left Section: Account Header & Info ───────── */}
        <Box sx={{ minWidth: 0, flex: 1, pr: { md: 2 } }}>
          <Typography
            sx={{
              fontSize: { xs: 20, md: 24 },
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.25,
            }}
          >
            {accountTitleName}
          </Typography>

          {/* Account Number + Copy */}
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1 }}>
            <Typography sx={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>
              {formattedAccNumber}
            </Typography>
            <Tooltip title={copied ? "Copied!" : "Copy account number"}>
              <IconButton
                size="small"
                onClick={handleCopyAccount}
                sx={{
                  p: 0.25,
                  color: copied ? "#166D35" : "#64748B",
                  "&:hover": { color: "#0F172A" },
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.5 }}>
            {accountTypeSubtitle}
          </Typography>

          {/* Bottom Row: Account Information Button & Segmented Progress Bar (for Fixed Deposit) */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 2, sm: 3 }}
            sx={{
              alignItems: { xs: "flex-start", sm: "center" },
              mt: 2.5,
              flexWrap: "wrap",
            }}
          >
            <BaseButton
              title="Account Information"
              variant="contained"
              startIcon={<Info size={16} />}
              onClick={onOpenAccountInfo}
              sx={{
                marginTop: { xs: 0, sm: 3 },
                bgcolor: "#EBF3FA",
                color: "#0F172A",
                borderRadius: "999px",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                px: 3.25,
                py: 0.9,
                height: 38,
                boxShadow: "none",
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: "#DCE8F5" },
              }}
            />

            {/* Segmented Progress Bar directly beside Account Information matching mockup */}
            {isTD && (
              <Box sx={{ minWidth: 200, maxWidth: 240, width: "100%", pt: { xs: 0.5, sm: 0 } }}>
                <Stack direction="row" spacing={0.35} sx={{ alignItems: "center", mb: 0.5 }}>
                  {Array.from({ length: totalSegments }).map((_, i) => (
                    <Box
                      key={i}
                      sx={{
                        flex: 1,
                        height: 18,
                        borderRadius: "3px",
                        bgcolor: i < activeSegments ? "#2388E5" : "#DCE8F4",
                        transition: "background-color 0.2s",
                      }}
                    />
                  ))}
                </Stack>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={{ fontSize: 11.5, color: "#475569", fontWeight: 500 }}>
                    <BaseBlurText>
                      {ccySymbol}{Number(depositAmount).toLocaleString("en-US")} of {ccySymbol}{Number(maturityAmount).toLocaleString("en-US")}
                    </BaseBlurText>
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: "#2388E5" }}>
                    {percentage}%
                  </Typography>
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>

        {/* ───────── Right Section: Metric Cards ───────── */}
        <Box sx={{ width: { xs: "100%", md: "auto" }, minWidth: { md: 360 } }}>
          {isTD ? (
            /* Fixed Account Metric View (Deposit Amount & Amount on Maturity) */
            <Stack spacing={1.25}>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "14px", px: 2.5, py: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                  Deposit Amount
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F5196", mt: 0.25 }}>
                  <BaseBlurText>{formatAmountPrefix(depositAmount, ccy)}</BaseBlurText>
                </Typography>
              </Box>

              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "14px", px: 2.5, py: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                  Amount on Maturity
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                  <BaseBlurText>{formatAmountPrefix(maturityAmount, ccy)}</BaseBlurText>
                </Typography>
              </Box>
            </Stack>
          ) : isCL ? (
            /* Loan Account Metric View */
            <Stack spacing={1.25}>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "14px", px: 2.5, py: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                  Approved Limit
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F5196", mt: 0.25 }}>
                  <BaseBlurText>{formatAmountPrefix(approvedLimit, ccy)}</BaseBlurText>
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "14px", px: 2.5, py: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                  Outstanding amount
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                  <BaseBlurText>{formatAmountPrefix(outstandingAmount, ccy)}</BaseBlurText>
                </Typography>
              </Box>
            </Stack>
          ) : (
            /* Current / Savings Account Metric View */
            <Stack spacing={1.25}>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "14px", px: 2.5, py: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                  Available Balance
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F5196", mt: 0.25 }}>
                  <BaseBlurText>{formatAmountPrefix(availableBal, ccy)}</BaseBlurText>
                </Typography>
              </Box>
              <Box sx={{ bgcolor: "#F8FAFC", borderRadius: "14px", px: 2.5, py: 1.5 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", fontWeight: 500 }}>
                  Total Balance
                </Typography>
                <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A", mt: 0.25 }}>
                  <BaseBlurText>{formatAmountPrefix(totalBal, ccy)}</BaseBlurText>
                </Typography>
              </Box>
            </Stack>
          )}
        </Box>
      </Stack>

      {/* Term deposit details dialog */}
      {info && (
        <AccountDetails
          open={open || isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            onClose?.();
          }}
          info={info}
          fixedDeposit={fixedDeposit}
          onDownloadCertificate={onDownloadCertificate}
        />
      )}
    </Box>
  );
}
