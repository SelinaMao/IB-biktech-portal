"use client";

import React, { useState } from "react";
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
  multiline = false,
}: {
  label: string;
  value: React.ReactNode;
  isCopyable?: boolean;
  rawCopyValue?: string;
  valueColor?: string;
  multiline?: boolean;
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
        alignItems: multiline ? "flex-start" : "center",
        py: 1.5,
      }}
    >
      <Typography sx={{ fontSize: 14, color: "#64748B", fontWeight: 400 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          alignItems: "center",
          maxWidth: "60%",
          justifyContent: "flex-end",
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: valueColor,
            textAlign: "right",
            whiteSpace: multiline ? "pre-line" : "normal",
            lineHeight: 1.35,
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
  const rawType = (
    target?.accountType ||
    info?.accountType ||
    selectedAccount?.accountType ||
    ""
  ).toUpperCase();
  const desc = (target?.productDesc || info?.productDesc || "").toLowerCase();
  const isTD =
    isFixedDeposit ||
    rawType === "TD" ||
    desc.includes("fixed") ||
    desc.includes("deposit");

  const currency =
    target?.currencyCode ||
    info?.ccy ||
    info?.currencyCode ||
    selectedAccount?.ccy ||
    "USD";
  const rawAccNumber =
    target?.accountNumber ||
    info?.accountNumber ||
    selectedAccount?.accountNumber ||
    "000190068";
  const formattedAccNumber =
    formatAccountNumber(rawAccNumber) || rawAccNumber;

  const accountTitle =
    selectedAccount?.accountName ||
    info?.accountName ||
    target?.accountName ||
    "Shiping co., ltd.";

  const accountTypeDisplay = (() => {
    if (isTD) return "Fixed Deposit";
    if (rawType === "SA") return "Savings";
    if (rawType === "CA") return "Current";
    if (info?.productDesc) return info.productDesc;
    return "Savings";
  })();

  const companyName =
    info?.fullName ||
    info?.accountName ||
    selectedAccount?.accountName ||
    "Shiping co., ltd.";
  const representativeName =
    info?.joinHolderDto?.[0]?.accountName || "Anna Smith";
  const contactEmail =
    (info as unknown as Record<string, string>)?.email ||
    (info as unknown as Record<string, string>)?.contactEmail ||
    "ops@shipingcoltd.com";
  const phoneNumber =
    (info as unknown as Record<string, string>)?.phone ||
    (info as unknown as Record<string, string>)?.phoneNumber ||
    "+1 (555) 234-5678";
  const billingAddress =
    (info as unknown as Record<string, string>)?.address ||
    (info as unknown as Record<string, string>)?.billingAddress ||
    "Suite 402, Maritime Tower,\nBoston MA";

  const dailyLimit =
    info?.transactionLimitPerDay !== undefined
      ? `${info.transactionLimitPerDay.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })} ${currency}`
      : `250,000.00 ${currency}`;

  const notificationPreferences =
    (info as unknown as Record<string, string>)?.notificationPreferences ||
    "SMS & Email Alerts";

  const settlementAccount = target?.accountSettlementNumber
    ? `Savings - ${formatAccountNumber(target.accountSettlementNumber)}`
    : "Savings - 000 067 898";

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
            top: { xs: 8, sm: 8, md: 14 },
            right: { xs: 8, sm: 8, md: 14 },
            bottom: { xs: 8, sm: 8, md: 14 },
            m: 0,
            width: { xs: "calc(100vw - 16px)", sm: 429 },
            maxWidth: 429,
            height: {
              xs: "calc(100vh - 16px)",
              sm: "calc(100vh - 16px)",
              md: "calc(100vh - 28px)",
            },
            maxHeight: 976,
            borderRadius: "24px",
            bgcolor: "#FFFFFF",
            p: { xs: 2.5, sm: "20px 20px" },
            boxSizing: "border-box",
            overflow: "hidden", // "we can't scroll"
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0, overflow: "hidden" }}>
        {/* ───────── Header ───────── */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography
            sx={{ fontSize: 20, fontWeight: 700, color: "#0F172A", lineHeight: 1.25 }}
          >
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

        <Divider sx={{ borderColor: "#F1F5F9", mb: 2.5 }} />

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
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
              Account Overview
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 1.35,
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

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9",mt:2 }} />}>
            <DetailRow label="Account Name" value={accountTitle} />
            <DetailRow
              label="Account Number"
              value={formattedAccNumber}
              isCopyable
              rawCopyValue={rawAccNumber}
            />
            <DetailRow label="Account Type" value={accountTypeDisplay} />
            <DetailRow label="Currency" value={currency} />
          </Stack>
        </Box>

        {/* ───────── Section 2: Account Holder Information ───────── */}
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Account Holder Information
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9",mt:2 }} />}>
            <DetailRow label="Company Name" value={companyName} />
            <DetailRow label="Authorized Representative" value={representativeName} />
            <DetailRow label="Contact Email" value={contactEmail} />
            <DetailRow label="Phone Number" value={phoneNumber} />
            <DetailRow
              label="Billing Address"
              value={billingAddress}
              multiline
            />
          </Stack>
        </Box>

        {/* ───────── Section 3: Account Settings ───────── */}
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Account Settings
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9",mt:2 }} />}>
            <DetailRow label="Daily Transaction Limit" value={dailyLimit} />
            <DetailRow label="Notification Preferences" value={notificationPreferences} />
            <DetailRow
              label={isTD ? "Settlement Account" : "Linked Master Accounts"}
              value={settlementAccount}
            />
          </Stack>

          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "#5B6B82",
              mt: 3,
              cursor: "pointer",
              "&:hover": { color: "#0F172A" },
            }}
          >
            Quick Limit Update (Authorized Only)
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
