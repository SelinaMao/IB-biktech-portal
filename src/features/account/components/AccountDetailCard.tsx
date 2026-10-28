"use client";

import React, { useState } from "react";
import { Box, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Check, Copy, EllipsisVertical, Info, ReceiptText, Settings } from "lucide-react";
import dayjs from "dayjs";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseButton from "@core/components/BaseButton";
import BaseDownloadPanel, { type BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import type { CoreAccountEntry, IAccountDetailResponses } from "../account.types";
import AccountDetails from "./AccountDetails";

export interface AccountDetailsProps {
  open?: boolean;
  accounts?: CoreAccountEntry[];
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

/** Formats as "USD 6,700,000.00" (prefix currency code) */
function formatAmountPrefix(amount: number | string | undefined | null, ccy: string = "USD"): string {
  const num = Number(amount ?? 0);
  const formatted = (isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${ccy} ${formatted}`;
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

export default function AccountDetailsCard({
  open = false,
  onClose,
  stats,
  info,
  fixedDeposit,
  isFixedDeposit = false,
  isSaving = false,
  onOpenAccountInfo,
  onOpenStatements,
  onExportStatements,
  onDownloadCertificate,
}: AccountDetailsProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [downloadAnchor, setDownloadAnchor] = useState<null | HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const ccy = fixedDeposit?.ccy ?? fixedDeposit?.currencyCode ?? info?.ccy ?? info?.currencyCode ?? "USD";
  const isTD = isFixedDeposit || info?.accountType === "TD" || fixedDeposit?.accountType === "TD";
  const rawType = (info?.accountType || stats?.accountType || "").toUpperCase();
  const desc = (info?.productDesc || stats?.productDesc || "").toLowerCase();
  const isSA = Boolean(
    isSaving ||
    rawType === "SA" ||
    rawType === "SAVING" ||
    rawType === "SAVINGS" ||
    desc.includes("saving")
  );

  // ==========================================
  // Fixed Term Deposit UI
  // ==========================================
  if (isTD) {
    const principalAmount =
      fixedDeposit?.placementAmt ?? info?.placementAmt ?? info?.availableBalance ?? 6700000;
    const maturityAmount =
      fixedDeposit?.totalAmountToReceive ?? info?.totalAmountToReceive ?? 7051500;
    const interestEarned =
      fixedDeposit?.interestAmount ?? info?.interestAmount;
    const interestRateVal =
      fixedDeposit?.interestRate ?? info?.interestRate ?? 5.25;
    const tenureMonths =
      fixedDeposit?.tenorMonths ?? info?.tenorMonths ?? 12;
    const maturityDateVal =
      fixedDeposit?.maturityDate ?? info?.maturityDate;
    const formattedMaturityDate = maturityDateVal
      ? dayjs(maturityDateVal).format("DD MMM YYYY")
      : "08 Sep 2027";
    const depositType =
      fixedDeposit?.productDesc || info?.productDesc || "Fixed Term Deposit";
    const fdAccountNumber =
      info?.accountNumber || fixedDeposit?.accountNumber || "FD-2024-001892";
    const linkedAccountNumber =
      fixedDeposit?.accountSettlementNumber ||
      info?.accountSettlementNumber ||
      info?.accountNumber ||
      "000 190 068";

    const card3Label =
      interestEarned !== undefined && interestEarned !== maturityAmount
        ? "Interest Earned"
        : "Maturity Amount";
    const card3Value =
      interestEarned !== undefined && interestEarned !== maturityAmount
        ? formatAmountSuffix(interestEarned, ccy)
        : formatAmountSuffix(maturityAmount, ccy);

    const fdStatCards = [
      {
        label: "Principal Deposit Amount",
        value: formatAmountSuffix(principalAmount, ccy),
        color: "#0F5196",
      },
      {
        label: "Maturity Amount",
        value: formatAmountSuffix(maturityAmount, ccy),
        color: "#0F172A",
      },
      {
        label: card3Label,
        value: card3Value,
        color: "#0F172A",
      },
      {
        label: "Interest Rate",
        value: `${interestRateVal}% p.a.`,
        color: "#166D35",
      },
    ];

    return (
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "20px",
          p: { xs: 2.5, sm: 3, md: 3.5 },
          width: "100%",
        }}
      >
        {/* Top 4 Stat Boxes */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(4, 1fr)",
            },
            gap: 2,
            width: "100%",
          }}
        >
          {fdStatCards.map((card, idx) => (
            <Box
              key={idx}
              sx={{
                bgcolor: "#F4F7FB",
                borderRadius: "14px",
                p: { xs: "16px 18px", sm: "18px 20px" },
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: "6px",
                minWidth: 0,
              }}
            >
              <Typography
                sx={{
                  fontSize: "14px",
                  color: "#64748B",
                  fontWeight: 400,
                  lineHeight: 1.4,
                }}
              >
                {card.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: "17px", sm: "18px", md: "19px" },
                  fontWeight: 700,
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

        {/* Account Name, Linked Account Number and Action Icons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mt: 3.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: { xs: "18px", sm: "20px", md: "22px" },
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
              }}
            >
              {info?.accountName || "Shiiping co., ltd."}
            </Typography>
            <Typography sx={{ color: "#475569", fontSize: "14px", fontWeight: 400, mt: 0.5 }}>
              {formatAccountNumber(linkedAccountNumber) || "000 190 068"}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={() => setIsDetailsOpen(true)}
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#F4F7FB",
                color: "#0F172A",
                borderRadius: "50%",
                "&:hover": { bgcolor: "#E2E8F0" },
              }}
            >
              <EllipsisVertical size={18} />
            </IconButton>
            <IconButton
              sx={{
                width: 36,
                height: 36,
                bgcolor: "#F4F7FB",
                color: "#0F172A",
                borderRadius: "50%",
                "&:hover": { bgcolor: "#E2E8F0" },
              }}
            >
              <Settings size={18} />
            </IconButton>
          </Stack>
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

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />} spacing={0}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
            >
              <Typography sx={{ fontSize: 14, color: "#64748B" }}>FD Account Number</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {fdAccountNumber}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
            >
              <Typography sx={{ fontSize: 14, color: "#64748B" }}>Deposit Type</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {depositType}
              </Typography>
            </Stack>

            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
            >
              <Typography sx={{ fontSize: 14, color: "#64748B" }}>Tenure</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {tenureMonths} Months
              </Typography>
            </Stack>

            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
            >
              <Typography sx={{ fontSize: 14, color: "#64748B" }}>Maturity Date</Typography>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
                {formattedMaturityDate}
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Bottom Action Pill Buttons */}
        <Stack direction="row" spacing={1.5} sx={{ mt: 3, flexWrap: "wrap", gap: 1.5 }}>
          <BaseButton
            sx={{
              padding: "8px 20px",
              bgcolor: "#EBF3FC",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "none",
              color: "#0F172A",
              boxShadow: "none",
              "&:hover": { bgcolor: "#DFEAF7" },
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
              color: "#0F172A",
              boxShadow: "none",
              "&:hover": { bgcolor: "#DFEAF7" },
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

  // ==========================================
  // Default Current Account UI
  // ==========================================
  const availableBalance = stats?.availableBalance ?? info?.availableBalance ?? 0;
  const ledgerBalance = stats?.ledgerBalance ?? info?.ledgerBalance ?? 0;
  const overdraftLimit =
    stats?.overdraftLimit ??
    (stats as unknown as Record<string, unknown>)?.odLimit as number ??
    info?.overdraftLimit ??
    (info as unknown as Record<string, unknown>)?.odLimit as number ??
    0;
  const blockedBalance =
    stats?.blockedBalance ??
    (stats as unknown as Record<string, unknown>)?.amountBlock as number ??
    info?.blockedBalance ??
    (info as unknown as Record<string, unknown>)?.amountBlock as number ??
    0;

  const statCards = [
    {
      label: "Available balance",
      value: formatAmountPrefix(availableBalance, ccy),
      color: "#0F5196",
    },
    {
      label: "Ledger balance",
      value: formatAmountPrefix(ledgerBalance, ccy),
      color: "#0F172A",
    },
    {
      label: "OD limit",
      value: formatAmountPrefix(overdraftLimit, ccy),
      color: "#0F172A",
    },
    {
      label: "Amount blocked",
      value: formatAmountPrefix(blockedBalance, ccy),
      color: "#0F172A",
    },
  ];

  const accountTypeLabel = (() => {
    if (info?.productDesc) {
      const lower = info.productDesc.toLowerCase();
      if (lower.includes("current")) return "Current account";
      if (lower.includes("saving")) return "Savings account";
      return info.productDesc;
    }
    const type = (info?.accountType || "").toUpperCase();
    if (type === "CA") return "Current account";
    if (type === "SA") return "Savings account";
    if (type === "TD") return "Fixed Term Deposit";
    if (type === "CL") return "Loan account";
    return info?.accountType || "Current account";
  })();

  const rawAccountNumber = info?.accountNumber || "";
  const formattedAccountNumber = formatAccountNumber(rawAccountNumber) || rawAccountNumber;

  const handleCopyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rawAccountNumber) {
      navigator.clipboard.writeText(rawAccountNumber.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ==========================================
  // Savings Account UI
  // ==========================================
  if (isSA) {
    return (
      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "20px",
          p: { xs: 2.5, sm: 3, md: 3.5 },
          width: "100%",
        }}
      >
        {/* Top Header Section */}
        <Box sx={{ mb: 3.5 }}>
          <Typography
            sx={{
              fontSize: { xs: "18px", sm: "20px", md: "22px" },
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.25,
            }}
          >
            {info?.accountName || "Shiiping co., ltd."}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.75 }}>
            <Typography sx={{ color: "#475569", fontSize: "14px", fontWeight: 400 }}>
              {formattedAccountNumber || "000 190 068"}
            </Typography>
            <Tooltip title={copied ? "Copied!" : "Copy account number"}>
              <IconButton
                onClick={handleCopyAccount}
                size="small"
                sx={{
                  p: 0.25,
                  color: copied ? "#166D35" : "#475569",
                  "&:hover": { color: "#0F172A", bgcolor: "transparent" },
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Typography sx={{ color: "#64748B", fontSize: "13px", mt: 0.75 }}>
            {accountTypeLabel} &middot; {ccy}
          </Typography>
        </Box>

        {/* Two-Column Section: Account Detail (Left) and 4 Stat Cards (Right) */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: { xs: 3, md: 4 },
            alignItems: "start",
          }}
        >
          {/* Left Column: Account Detail table + Action Buttons */}
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#0F172A",
                mb: 2,
              }}
            >
              Account Detail
            </Typography>

            <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />} spacing={0}>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
              >
                <Typography sx={{ fontSize: "14px", color: "#64748B" }}>Account Name</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                  {info?.accountName || "Shiping co., ltd."}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
              >
                <Typography sx={{ fontSize: "14px", color: "#64748B" }}>Account Number</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                  {formattedAccountNumber || "000 190 068"}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
              >
                <Typography sx={{ fontSize: "14px", color: "#64748B" }}>Account Type</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                  Savings
                </Typography>
              </Stack>

              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", py: 1.5 }}
              >
                <Typography sx={{ fontSize: "14px", color: "#64748B" }}>Currency</Typography>
                <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                  {ccy}
                </Typography>
              </Stack>
            </Stack>

            {/* Bottom Action Pill Buttons */}
            <Stack direction="row" spacing={1.5} sx={{ mt: { xs: 3, md: 4 }, flexWrap: "wrap", gap: 1.5 }}>
              <BaseButton
                sx={{
                  padding: "8px 20px",
                  bgcolor: "#EBF3FC",
                  borderRadius: "999px",
                  fontSize: "14px",
                  fontWeight: 500,
                  textTransform: "none",
                  color: "#0F172A",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#DFEAF7" },
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
                  color: "#0F172A",
                  boxShadow: "none",
                  "&:hover": { bgcolor: "#DFEAF7" },
                }}
                onClick={(e) => {
                  setDownloadAnchor(e.currentTarget);
                  onOpenStatements?.(e);
                }}
                startIcon={<ReceiptText size={17} />}
                title="Statements"
              />
            </Stack>
          </Box>

          {/* Right Column: 4 Stat Cards Stacked Vertically */}
          <Stack spacing={1.5} sx={{ width: "100%" }}>
            {statCards.map((card) => (
              <Box
                key={card.label}
                sx={{
                  bgcolor: "#F4F7FB",
                  borderRadius: "14px",
                  p: { xs: "14px 18px", sm: "16px 20px" },
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  gap: "6px",
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#64748B",
                    fontWeight: 400,
                    lineHeight: 1.4,
                  }}
                >
                  {card.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: "16px", sm: "17px", md: "18px" },
                    fontWeight: 700,
                    color: card.color,
                    lineHeight: 1.3,
                    whiteSpace: "nowrap",
                  }}
                >
                  {card.value}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <BaseDownloadPanel
          anchorEl={downloadAnchor}
          onClose={() => setDownloadAnchor(null)}
          onDownload={(value) => {
            setDownloadAnchor(null);
            onExportStatements?.(value);
          }}
        />

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

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        p: { xs: 2.5, sm: 3, md: 3.5 },
        width: "100%",
      }}
    >
      {/* Top 4 Stat Boxes */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
          width: "100%",
        }}
      >
        {statCards.map((card) => (
          <Box
            key={card.label}
            sx={{
              bgcolor: "#F4F7FB",
              borderRadius: "14px",
              p: { xs: "16px 18px", sm: "18px 20px" },
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: "6px",
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                color: "#64748B",
                fontWeight: 400,
                lineHeight: 1.4,
              }}
            >
              {card.label}
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: "17px", sm: "18px", md: "19px" },
                fontWeight: 700,
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

      {/* Bottom Section: Account info on left, Actions on right */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "flex-end" },
          gap: 2.5,
          mt: 3.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: "18px", sm: "20px", md: "22px" },
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.25,
            }}
          >
            {info?.accountName || "Shiiping co., ltd."}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 0.75 }}>
            <Typography sx={{ color: "#475569", fontSize: "14px", fontWeight: 400 }}>
              {formattedAccountNumber || "000 190 068"}
            </Typography>
            <Tooltip title={copied ? "Copied!" : "Copy account number"}>
              <IconButton
                onClick={handleCopyAccount}
                size="small"
                sx={{
                  p: 0.25,
                  color: copied ? "#166D35" : "#475569",
                  "&:hover": { color: "#0F172A", bgcolor: "transparent" },
                }}
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </IconButton>
            </Tooltip>
          </Stack>

          <Typography sx={{ color: "#64748B", fontSize: "13px", mt: 0.75 }}>
            {accountTypeLabel} &middot; {ccy}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
          <BaseButton
            sx={{
              padding: "8px 20px",
              bgcolor: "#EBF3FC",
              borderRadius: "999px",
              fontSize: "14px",
              fontWeight: 500,
              textTransform: "none",
              color: "#0F172A",
              boxShadow: "none",
              "&:hover": { bgcolor: "#DFEAF7" },
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
              color: "#0F172A",
              boxShadow: "none",
              "&:hover": { bgcolor: "#DFEAF7" },
            }}
            onClick={(e) => {
              setDownloadAnchor(e.currentTarget);
              onOpenStatements?.(e);
            }}
            startIcon={<ReceiptText size={17} />}
            title="Statements"
          />
        </Stack>
      </Stack>

      <BaseDownloadPanel
        anchorEl={downloadAnchor}
        onClose={() => setDownloadAnchor(null)}
        onDownload={(value) => {
          setDownloadAnchor(null);
          onExportStatements?.(value);
        }}
      />

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
