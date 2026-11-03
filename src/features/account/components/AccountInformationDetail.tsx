"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Check, Copy, X } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import type { CoreAccountEntry, IAccountDetailResponses } from "../account.types";

export interface AccountDetailsProps {
  open: boolean;
  onClose: () => void;
  info?: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  isFixedDeposit?: boolean;
  selectedAccount?: CoreAccountEntry;
  onDownloadCertificate?: () => void | Promise<void>;
}

function DetailRow({
  label,
  value,
  isCopyable = false,
  rawCopyValue,
  valueColor = "#0F172A",
}: {
  label: string;
  value: React.ReactNode;
  isCopyable?: boolean;
  rawCopyValue?: string;
  valueColor?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rawCopyValue) {
      navigator.clipboard.writeText(rawCopyValue.replace(/\s+/g, ""));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Stack
      direction="row"
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        py: 1.5,
      }}
    >
      <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 400 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: valueColor,
            textAlign: "right",
          }}
        >
          {value}
        </Typography>
        {isCopyable && (
          <Tooltip title={copied ? "Copied!" : "Copy"}>
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{ p: 0.25, color: copied ? "#166D35" : "#64748B" }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </IconButton>
          </Tooltip>
        )}
      </Stack>
    </Stack>
  );
}

export default function AccountInformationDetail({
  open,
  onClose,
  info,
  fixedDeposit,
  isFixedDeposit = false,
  selectedAccount,
}: AccountDetailsProps) {
  const target = fixedDeposit || info;
  const rawType = (target?.accountType || info?.accountType || selectedAccount?.accountType || "").toUpperCase();
  const desc = (target?.productDesc || info?.productDesc || "").toLowerCase();
  const isTD = isFixedDeposit || rawType === "TD" || desc.includes("fixed") || desc.includes("deposit");

  const currency = target?.currencyCode || info?.ccy || info?.currencyCode || selectedAccount?.ccy || "USD";
  const rawAccNumber = target?.accountNumber || info?.accountNumber || selectedAccount?.accountNumber || "000067898";
  const formattedAccNumber = formatAccountNumber(rawAccNumber) || rawAccNumber;

  const accountTitle = isTD
    ? target?.accountName || info?.accountName || selectedAccount?.accountName || "Fixed Account"
    : info?.accountName || selectedAccount?.accountName || "Shiping co., ltd.";

  const accountTypeDisplay = (() => {
    if (isTD) return "Fixed Deposit Account";
    if (rawType === "SA") return "Savings";
    if (rawType === "CA") return "Current";
    if (info?.productDesc) return info.productDesc;
    return "Savings";
  })();

  const companyName = info?.fullName || info?.accountName || "Shiping co., ltd.";
  const representativeName = info?.joinHolderDto?.[0]?.accountName || "Anna Smith";
  const settlementAccount = target?.accountSettlementNumber
    ? `Savings - ${formatAccountNumber(target.accountSettlementNumber)}`
    : "Savings - 000 067 898";

  const dailyLimit =
    info?.transactionLimitPerDay !== undefined
      ? `${info.transactionLimitPerDay.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${currency}`
      : `250,000.00 ${currency}`;

  // Fixed Deposit Dates & Tenor
  const openingDate = target?.openedDate
    ? dayjs(target.openedDate).format("DD MMM YYYY")
    : "15 Mar 2026";
  const effectiveDate = target?.openedDate
    ? dayjs(target.openedDate).format("DD MMM YYYY")
    : "15 Mar 2026";
  const maturityDate = target?.maturityDate
    ? dayjs(target.maturityDate).format("DD MMM YYYY")
    : "15 Mar 2027";
  const tenor = target?.tenorMonths ? `${target.tenorMonths} months` : "12 months";
  const interestRate = target?.interestRate ? `${target.interestRate}% p.a.` : "6.0% p.a.";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          sx: { bgcolor: "rgba(15, 23, 42, 0.4)" },
        },
        paper: {
          sx: {
            position: "fixed",
            right: { xs: 8, sm: 20, md: 24 },
            top: { xs: 8, sm: 20, md: 24 },
            bottom: { xs: 8, sm: 20, md: 24 },
            m: 0,
            width: { xs: "calc(100vw - 16px)", sm: 460, md: 480 },
            height: { xs: "calc(100vh - 16px)", sm: "calc(100vh - 40px)", md: "calc(100vh - 48px)" },
            maxHeight: "none",
            borderRadius: "28px",
            bgcolor: "#FFFFFF",
            p: { xs: 2.5, sm: 3.5, md: 4 },
            boxSizing: "border-box",
            overflowY: "auto",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* ───────── Header ───────── */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3.5,
          }}
        >
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
            Account Information
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "#64748B",
              bgcolor: "#F1F5F9",
              borderRadius: "8px",
              p: 0.75,
              "&:hover": { bgcolor: "#E2E8F0" },
            }}
          >
            <X size={18} />
          </IconButton>
        </Stack>

        <Stack spacing={3}>
          {/* ───────── Section 1: Account Overview ───────── */}
          <Box>
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
                Account Overview
              </Typography>
              <Box
                sx={{
                  px: 1.5,
                  py: 1.25,
                  borderRadius: "999px",
                  bgcolor: "#E0F4E7",
                  color: "#166D35",
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {info?.status || "Active"}
              </Box>
            </Stack>

            <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" ,padding:1}} />}>
              <DetailRow label="Account Name" value={accountTitle} />
              <DetailRow
                label="Account Number"
                value={formattedAccNumber}
                isCopyable
                rawCopyValue={rawAccNumber}
              />
              {!isTD && <DetailRow label="Account Type" value={accountTypeDisplay} />}
              <DetailRow label="Currency" value={currency} />
            </Stack>
          </Box>

          {/* ───────── Section 2: Account Information (for Fixed Deposit) OR Account Holder Information ───────── */}
          {isTD ? (
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
                Account Information
              </Typography>

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9",padding:1 }} />}>
                <DetailRow label="Account Type" value="Fixed Deposit Account" />
                <DetailRow label="Opening Date" value={openingDate} />
                <DetailRow label="Effective Date" value={effectiveDate} />
                <DetailRow label="Maturity Date" value={maturityDate} />
                <DetailRow label="Tenor" value={tenor} />
                <DetailRow
                  label="Interest Rate"
                  value={interestRate}
                  valueColor="#16A34A"
                />
              </Stack>
            </Box>
          ) : (
            <Box>
              <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
                Account Holder Information
              </Typography>

              <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" ,padding:1}} />}>
                <DetailRow label="Company Name" value={companyName} />
                <DetailRow label="Authorized Representative" value={representativeName} />
                <DetailRow label="Contact Email" value="ops@shipingcoltd.com" />
                <DetailRow label="Phone Number" value="+1 (555) 234-5678" />
                <DetailRow label="Billing Address" value="Suite 402, Maritime Tower, Boston MA" />
              </Stack>
            </Box>
          )}

          {/* ───────── Section 3: Account Settings ───────── */}
          <Box>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
              Account Settings
            </Typography>

            <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" ,padding:1}} />}>
              <DetailRow label="Daily Transaction Limit" value={dailyLimit} />
              <DetailRow label="Notification Preferences" value="SMS & Email Alerts" />
              <DetailRow
                label={isTD ? "Settlement Account" : "Linked Master Accounts"}
                value={settlementAccount}
              />
            </Stack>

            <Typography
              sx={{
                fontSize: 13,
                fontWeight: 600,
                color: "#64748B",
                mt: 2.5,
                cursor: "pointer",
                "&:hover": { color: "#0F172A" },
              }}
            >
              Quick Limit Update (Authorized Only)
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
