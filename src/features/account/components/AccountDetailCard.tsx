"use client";

import React, { useState } from "react";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Check, Copy, Info } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseButton from "@core/components/BaseButton";
import type { BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import type {
  CoreAccountEntry,
  CoreAccountSummaryEntry,
  IAccountDetailResponses,
} from "../account.types";
import AccountDetails from "./AccountDetails";
import StatementDownloadDialog from "./StatementDownloadDialog";
import { getAccountIndicatorColor } from "./AccountsSidebar";
import CardBorderAccent from "./CardBorderAccent";
import BaseCard from "@/@core/components/BaseCard";

export interface AccountDetailsProps {
  open?: boolean;
  accounts?: CoreAccountEntry[];
  selectedAccount?: CoreAccountEntry;
  accentColor?: string;
  stats?: IAccountDetailResponses;
  onClose?: () => void;
  info?: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  isFixedDeposit?: boolean;
  isSaving?: boolean;
  summary?: CoreAccountSummaryEntry;
  onOpenAccountInfo?: () => void;
  onOpenStatements?: (e?: React.MouseEvent<HTMLElement>) => void;
  onExportStatements?: (value: BaseDownloadValue) => void;
  onDownloadCertificate?: () => void | Promise<void>;
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

export default function AccountDetailCard({
  open = false,
  onClose,
  selectedAccount,
  accentColor,
  stats,
  info,
  fixedDeposit,
  isFixedDeposit = false,
  isSaving = false,
  onOpenAccountInfo,
  onExportStatements,
  onDownloadCertificate,
}: AccountDetailsProps) {
  const [copied, setCopied] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);

  const cardAccentColor = accentColor || (selectedAccount ? getAccountIndicatorColor(selectedAccount, 0) : "#8DD4BE");

  const target = fixedDeposit || info;
  const ccy = (
    selectedAccount?.ccy ??
    target?.currencyCode ??
    target?.ccy ??
    info?.ccy ??
    "USD"
  ).toUpperCase();

  const rawType = (
    target?.accountType ||
    stats?.accountType ||
    info?.accountType ||
    selectedAccount?.accountType ||
    ""
  ).toUpperCase();

  const desc = (
    target?.productDesc ||
    stats?.productDesc ||
    info?.productDesc ||
    selectedAccount?.accountClassDescription ||
    ""
  ).toLowerCase();

  const isTD =
    isFixedDeposit ||
    rawType === "TD" ||
    rawType === "FD" ||
    desc.includes("fixed") ||
    desc.includes("deposit") ||
    desc.includes("term") ||
    (selectedAccount?.accountName || "").toLowerCase().includes("fixed");

  const isCL = rawType === "CL" || desc.includes("loan");

  const rawAccountNumber =
    target?.accountNumber ||
    info?.accountNumber ||
    selectedAccount?.accountNumber ||
    "";
  const formattedAccNumber =
    formatAccountNumber(rawAccountNumber) || rawAccountNumber;

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rawAccountNumber) {
      navigator.clipboard.writeText(rawAccountNumber.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Subtitle Type Label (e.g. "Current account · USD", "Savings account · USD", "Fixed account · USD")
  const accountTypeName = (() => {
    if (isTD) return "Fixed account";
    if (rawType === "CA") return "Current account";
    if (rawType === "SA" || isSaving) return "Savings account";
    if (isCL) return "Loan account";
    if (desc.includes("current") || desc.includes("ca")) return "Current account";
    if (desc.includes("saving") || desc.includes("sa")) return "Savings account";
    if (desc.includes("fixed") || desc.includes("deposit") || desc.includes("term")) return "Fixed account";
    if (info?.productDesc) return info.productDesc;
    if (selectedAccount?.accountClassDescription) return selectedAccount.accountClassDescription;
    return "Current account";
  })();

  const accountTypeSubtitle = `${accountTypeName} · ${ccy}`;

  // Title name
  const accountTitleName =
    selectedAccount?.accountName ||
    target?.accountName ||
    info?.accountName ||
    "-";

  // TD Metrics
  const depositAmount =
    target?.placementAmt ??
    info?.placementAmt ??
    info?.availableBalance ??
    selectedAccount?.availableBalance ??
    0;
  const maturityAmount =
    target?.totalAmountToReceive ?? info?.totalAmountToReceive ?? 0;

  // Progress calculation for TD (20 segments matching mockup)
  // const totalSegments = 20;
  // const percentage = (() => {
  //   if (
  //     target?.totalMaturityDays &&
  //     target.totalMaturityDays > 0 &&
  //     target.onGoingMaturityDays !== undefined
  //   ) {
  //     return Math.min(
  //       100,
  //       Math.max(
  //         0,
  //         Math.round((target.onGoingMaturityDays / target.totalMaturityDays) * 100),
  //       ),
  //     );
  //   }
  //   if (maturityAmount > 0 && depositAmount > 0) {
  //     return Math.min(
  //       100,
  //       Math.max(
  //         0,
  //         Math.round((Number(depositAmount) / Number(maturityAmount)) * 100),
  //       ),
  //     );
  //   }
  //   return 0;
  // })();
  // const activeSegments = Math.max(
  //   0,
  //   Math.round((percentage / 100) * totalSegments),
  // );

  // CA / SA Metrics (100% dynamic from API / selectedAccount)
  const accountInfo =
    info?.accountNumber === selectedAccount?.accountNumber ? info : undefined;
  const accountStats =
    stats?.accountNumber === selectedAccount?.accountNumber ? stats : undefined;

  const availableBal =
    selectedAccount?.availableBalance ??
    accountInfo?.availableBalance ??
    accountStats?.availableBalance ??
    0;

  const selectedAccountRecord = selectedAccount as unknown as
    | Record<string, unknown>
    | undefined;

  const totalBal =
    accountInfo?.ledgerBalance ??
    accountStats?.ledgerBalance ??
    accountInfo?.currentBalance ??
    accountStats?.currentBalance ??
    (typeof selectedAccountRecord?.ledgerBalance === "number"
      ? selectedAccountRecord.ledgerBalance
      : undefined) ??
    (typeof selectedAccountRecord?.currentBalance === "number"
      ? selectedAccountRecord.currentBalance
      : undefined) ??
    (typeof selectedAccountRecord?.totalBalance === "number"
      ? selectedAccountRecord.totalBalance
      : undefined) ??
    selectedAccount?.availableBalance ??
    0;

  // CL Metrics
  const approvedLimit =
    ((info as unknown as Record<string, unknown>)?.approvedLimit as number) ??
    0;
  const outstandingAmount =
    info?.loanAmount ??
    info?.availableBalance ??
    selectedAccount?.availableBalance ??
    0;

  const metric1Label = isTD
    ? "Deposit Amount"
    : isCL
      ? "Approved Limit"
      : "Available Balance";
  const metric1Value = isTD
    ? depositAmount
    : isCL
      ? approvedLimit
      : availableBal;

  const metric2Label = isTD
    ? "Amount on Maturity"
    : isCL
      ? "Outstanding amount"
      : "Total Balance";
  const metric2Value = isTD
    ? maturityAmount
    : isCL
      ? outstandingAmount
      : totalBal;

  return (
    <BaseCard
      sx={{
        position: "relative",

        height: "196px",
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: { xs: 2.5, sm: "20px 24px" },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        // border: "1px solid #EDF2F7",
      }}
    >
      <CardBorderAccent color={accentColor} type="bottom-left" strokeWidth={2.5} tailLength={60} width={90} height={80} top={0} left={0} />
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
            {/* Account Title Name */}
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

            {/* Subtitle: Type · Currency */}
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

          {/* Bottom Action: Account Information (+ Progress Bar if Fixed Deposit) */}
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
                onClick={onOpenAccountInfo}
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
                  "&:hover": { bgcolor: "#DFEAF6", boxShadow: "none" },
                }}
              />

              {/* Segmented Progress Bar directly beside Account Information for Fixed Deposit */}
              {/* {isTD && maturityAmount > 0 && (
                <Box
                  sx={{
                    minWidth: 200,
                    maxWidth: 240,
                    width: "100%",
                    pt: { xs: 0.5, sm: 0 },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={0.35}
                    sx={{ alignItems: "center", mb: 0.5 }}
                  >
                    {Array.from({ length: totalSegments }).map((_, i) => (
                      <Box
                        key={i}
                        sx={{
                          flex: 1,
                          height: 18,
                          borderRadius: "3px",
                          bgcolor: i < activeSegments ? "#20A678" : "#DCE8F4",
                          transition: "background-color 0.2s",
                        }}
                      />
                    ))}
                  </Stack>
                  <Stack
                    direction="row"
                    sx={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      sx={{ fontSize: 11.5, color: "#475569", fontWeight: 500 }}
                    >
                      <BaseBlurText>
                        {formatCurrencyPrefix(depositAmount, ccy)} of{" "}
                        {formatCurrencyPrefix(maturityAmount, ccy)}
                      </BaseBlurText>
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, fontWeight: 700, color: "#20A678" }}
                    >
                      {percentage}%
                    </Typography>
                  </Stack>
                </Box>
              )} */}
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
            {/* Metric 1 - Available Balance */}
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
                {metric1Label}
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
                  {formatCurrencyPrefix(metric1Value, ccy)}
                </BaseBlurText>
              </Typography>
            </Box>

            {/* Metric 2 - Total Balance */}
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
                {metric2Label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 500,
                  color: "#0F172A",
                  lineHeight: 1.3,
                }}
              >
                <BaseBlurText>
                  {formatCurrencyPrefix(metric2Value, ccy)}
                </BaseBlurText>
              </Typography>
            </Box>
          </Stack>
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

      {/* Statement download dialog */}
      <StatementDownloadDialog
        open={statementDialogOpen}
        onClose={() => setStatementDialogOpen(false)}
        accountName={accountTitleName}
        accountNumber={rawAccountNumber}
        onDownload={(val) => {
          onExportStatements?.(val);
        }}
      />
    </BaseCard>
  );
}
