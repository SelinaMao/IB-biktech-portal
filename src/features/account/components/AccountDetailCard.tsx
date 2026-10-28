"use client";

import React, { useState } from "react";
import { Box, Divider, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { Check, Copy, Info, ReceiptText } from "lucide-react";
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
      fixedDeposit?.interestRate ?? info?.interestRate ?? 3.5;
    const tenureMonths =
      fixedDeposit?.tenorMonths ?? info?.tenorMonths ?? 12;
    const maturityDateVal =
      fixedDeposit?.maturityDate ?? info?.maturityDate;
    const formattedMaturityDate = maturityDateVal
      ? dayjs(maturityDateVal).format("DD MMM YYYY")
      : "08 Sep 2027";
    const depositType =
      rawType === "TD"
        ? "Fixed Term Deposit"
        : (fixedDeposit?.productDesc || info?.productDesc || "Fixed Term Deposit");
    const fdAccountNumber =
      info?.accountNumber || fixedDeposit?.accountNumber || "FD-2024-001892";
    const linkedAccountNumber =
      fixedDeposit?.accountSettlementNumber ||
      info?.accountSettlementNumber ||
      "000 190 068";

    const card3Label =
      interestEarned !== undefined && interestEarned !== maturityAmount && interestEarned > 0
        ? "Interest Earned"
        : "Maturity Amount";
    const card3Value =
      interestEarned !== undefined && interestEarned !== maturityAmount && interestEarned > 0
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
    ];

    const fdDetailRows = [
      { label: "FD Account Number", value: fdAccountNumber },
      { label: "Deposit Type", value: depositType },
      { label: "Tenure", value: `${tenureMonths} Months` },
      { label: "Interest Rate", value: `${interestRateVal}% p.a.`, color: "#166D35" },
      { label: "Maturity Date", value: formattedMaturityDate },
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
          <Typography
            sx={{
              fontSize: { xs: "16px", md: "18px" },
              fontWeight: 600,
              color: "#0F172A",
              lineHeight: 1.3,
              m: 0,
            }}
          >
            {info?.accountName || "Shiiping co., ltd."}
          </Typography>
          <Typography
            sx={{
              color: "#475569",
              fontSize: "13px",
              lineHeight: 1.4,
              mt: "6px",
            }}
          >
            {formatAccountNumber(linkedAccountNumber) || "000 190 068"}
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
            {fdDetailRows.map((row) => (
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
          {fdStatCards.map((card, idx) => (
            <Box
              key={idx}
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
            alignSelf: "start",
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
            onClick={onOpenAccountInfo}
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
  // Loan UI
  // ==========================================
  const isCL = rawType === "CL" || rawType === "LOAN" || desc.includes("loan");
  if (isCL) {
    const loanName = info?.productDesc || info?.accountName || "Car Loan";
    const accNum = info?.accountNumber || "000 067 898";
    const ref = (info as unknown as Record<string, unknown>)?.loanReference as string || info?.accountNumber || "CLN-2024-001892";
    const loanType = info?.productDesc || "Car Loan";
    const outstanding = info?.loanAmount ?? info?.currentBalance ?? info?.availableBalance ?? 6_700_000;
    const rate = info?.interestRate ?? 5.25;
    const frequency = info?.installmentFrequency || "Monthly";
    const matDate = info?.maturityDate ? dayjs(info.maturityDate).format("DD MMM YYYY") : "08 Sep 2030";
    const limit = (info as unknown as Record<string, unknown>)?.approvedLimit as number ?? info?.loanAmount ?? 100_000;
    const disbDate = info?.disbursementDate ? dayjs(info.disbursementDate).format("DD MMM YYYY") : "08 Sep 2024";

    const detailRows = [
      { label: loanName, value: ref },
      { label: "Loan Type", value: loanType },
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
              {loanName}
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
            onClick={onOpenAccountInfo}
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
    const type = (info?.accountType || fixedDeposit?.accountType || stats?.accountType || "").toUpperCase();
    if (type === "TD") return "Fixed Term Deposit";
    if (type === "CA") return "Current account";
    if (type === "SA") return "Savings account";
    if (type === "CL") return "Loan account";
    if (info?.productDesc) {
      const lower = info.productDesc.toLowerCase();
      if (lower.includes("current")) return "Current account";
      if (lower.includes("saving")) return "Savings account";
      return info.productDesc;
    }
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
  //  UI for AccountDetailCard
  // ==========================================
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
    <Typography
      sx={{
        fontSize: { xs: "16px", md: "18px" },
        fontWeight: 600,
        color: "#0F172A",
        lineHeight: 1.3,
        m: 0,
      }}
    >
      {info?.accountName || "Shiiping co., ltd."}
    </Typography>

    {/* account number + copy icon */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto auto",
        justifyContent: "start",
        alignItems: "center",
        columnGap: "8px",
        mt: "8px",
      }}
    >
      <Typography sx={{ color: "#475569", fontSize: "13px", lineHeight: 1.4 }}>
        {formattedAccountNumber || "000 190 068"}
      </Typography>
      <Tooltip title={copied ? "Copied!" : "Copy account number"}>
        <IconButton
          onClick={handleCopyAccount}
          size="small"
          sx={{
            p: "2px",
            color: copied ? "#166D35" : "#475569",
            "&:hover": { color: "#0F172A", bgcolor: "transparent" },
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </IconButton>
      </Tooltip>
    </Box>

    <Typography sx={{ color: "#64748B", fontSize: "11px", mt: "8px", lineHeight: 1.4 }}>
      {accountTypeLabel} &middot; {ccy}
    </Typography>
  </Box>

  {/* ───────── Account Detail (left, below header) ───────── */}
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
      Account Detail
    </Typography>

    <Box>
      {[
        { label: "Account Name", value: info?.accountName || "Shiiping co., ltd." },
        { label: "Account Number", value: formattedAccountNumber || "000 190 068" },
        { label: "Account Type", value: isSA ? "Savings" : accountTypeLabel },
        { label: "Currency", value: ccy },
      ].map((row) => (
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
            sx={{ fontSize: "13px", fontWeight: 500, color: "#0F172A", textAlign: "right" }}
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
      onClick={onOpenAccountInfo}
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


