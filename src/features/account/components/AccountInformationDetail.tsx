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
import { Check, Copy, Download, Settings, X } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseButton from "@core/components/BaseButton";
import type { CoreAccountEntry, IAccountDetailResponses } from "../account.types";

export interface AccountDetailsProps {
  open: boolean;
  onClose: () => void;
  info?: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  isFixedDeposit?: boolean;
  selectedAccount?: CoreAccountEntry;
  onDownloadCertificate?: () => void | Promise<void>;
  onChangeRollover?: () => void;
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
      <Typography sx={{ fontSize: 13.5, color: "#64748B", fontWeight: 400 }}>
        {label}
      </Typography>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{
          alignItems: "center",
          maxWidth: "65%",
          justifyContent: "flex-end",
        }}
      >
        <Typography
          sx={{
            fontSize: 13.5,
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
  onDownloadCertificate,
  onChangeRollover,
}: AccountDetailsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadClick = async () => {
    if (!onDownloadCertificate || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownloadCertificate();
    } finally {
      setIsDownloading(false);
    }
  };

  const target = fixedDeposit || info;
  const rawType = (
    target?.accountType ||
    info?.accountType ||
    selectedAccount?.accountType ||
    ""
  ).toUpperCase();
  const desc = (
    target?.productDesc ||
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
    "000067898";
  const formattedAccNumber =
    formatAccountNumber(rawAccNumber) || rawAccNumber;

  const accountTitle = isTD
    ? selectedAccount?.accountName || info?.accountName || target?.accountName || "Fixed Account"
    : selectedAccount?.accountName || info?.accountName || target?.accountName || "Shiping co., ltd.";

  const accountTypeDisplay = (() => {
    if (isTD) return target?.productDesc || info?.productDesc || "Fixed Deposit Account";
    if (rawType === "SA") return "Savings";
    if (rawType === "CA") return "Current";
    if (info?.productDesc) return info.productDesc;
    return "Savings";
  })();

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
  const interestRate =
    target?.interestRate !== undefined
      ? `${Number(target.interestRate).toFixed(1)}% p.a.`
      : "6.0% p.a.";

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
            borderRadius: "20px",
            bgcolor: "#FFFFFF",
            width: { xs: "calc(100vw - 32px)", sm: 420 },
            maxWidth: 440,
            maxHeight: "calc(100vh - 32px)",
            p: { xs: 2.5, sm: "24px 20px" },
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
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
            mb: 2,
          }}
        >
          <Typography
            sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A", lineHeight: 1.25 }}
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
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              Account Overview
            </Typography>
            <Box
              sx={{
                px: 1.5,
                py: 0.35,
                borderRadius: "999px",
                bgcolor: "#E0F4E7",
                color: "#166D35",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {target?.status || info?.status || selectedAccount?.status || "Active"}
            </Box>
          </Stack>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
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

        {/* ───────── Section 2: Account Information (Deposit) vs Account Holder Information (CA/SA) ───────── */}
        {isTD ? (
          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
              Account Information
            </Typography>

            <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
              <DetailRow label="Account Type" value={accountTypeDisplay} />
              <DetailRow label="Opening Date" value={openingDate} />
              <DetailRow label="Effective Date" value={effectiveDate} />
              <DetailRow label="Maturity Date" value={maturityDate} />
              <DetailRow label="Tenor" value={tenor} />
              <DetailRow
                label="Interest Rate"
                value={interestRate}
                valueColor="#10B981"
              />
            </Stack>
          </Box>
        ) : (
          <Box sx={{ mt: 2.5 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
              Account Holder Information
            </Typography>

            <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
              <DetailRow label="Company Name" value={companyName} />
              <DetailRow label="Authorized Representative" value={representativeName} />
              <DetailRow label="Contact Email" value={contactEmail} />
              <DetailRow label="Phone Number" value={phoneNumber} />
              <DetailRow label="Billing Address" value={billingAddress} multiline />
            </Stack>
          </Box>
        )}

        {/* ───────── Section 3: Account Settings ───────── */}
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Account Settings
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow label="Daily Transaction Limit" value={dailyLimit} />
            <DetailRow label="Notification Preferences" value={notificationPreferences} />
            <DetailRow
              label={isTD ? "Settlement Account" : "Linked Master Accounts"}
              value={settlementAccount}
            />
          </Stack>

          {isTD ? (
            <Box sx={{ mt: 1.5 }}>
              <Box
                component="button"
                type="button"
                onClick={onChangeRollover}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  px: 2,
                  py: 0.85,
                  borderRadius: "999px",
                  bgcolor: "#EDF0F4",
                  color: "#334155",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    bgcolor: "#DFE5F0",
                    color: "#0F172A",
                  },
                }}
              >
                <Settings size={15} />
                Change Rollover
              </Box>
            </Box>
          ) : (
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
          )}
        </Box>

        {/* ───────── Bottom Action Button: Download certificate ───────── */}
        {isTD && (
          <Box sx={{ mt: 3, pt: 1 }}>
            <BaseButton
              title={isDownloading ? "Downloading..." : "Download certificate"}
              variant="contained"
              fullWidth
              startIcon={<Download size={16} />}
              onClick={handleDownloadClick}
              disabled={isDownloading}
              sx={{
                bgcolor: "#1C64B4",
                color: "#FFFFFF",
                borderRadius: "10px",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                height: 44,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#154F91",
                  boxShadow: "none",
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
