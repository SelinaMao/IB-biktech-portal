"use client";

import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  IconButton,
  Slide,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { Check, Copy, Download, X } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import BaseButton from "@core/components/BaseButton";
import type { BorrowerProfile, LoanScheduleDetails, LoanStatus } from "../loan.types";

export interface LoanDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  borrower: BorrowerProfile;
  schedule: LoanScheduleDetails;
  onDownloadSchedule?: () => void;
  onDownloadRemainingInstallments?: () => void;
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

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

function formatCurrency(
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

const STATUS_CONFIG: Record<
  LoanStatus,
  { label: string; bg: string; color: string }
> = {
  active: { label: "Active", bg: "#E6F4EA", color: "#137333" },
  overdue: { label: "Overdue", bg: "#FCE8E6", color: "#C5221F" },
  closed: { label: "Closed", bg: "#F1F3F4", color: "#5F6368" },
};

export default function LoanDetailsPanel({
  open,
  onClose,
  borrower,
  schedule,
  onDownloadSchedule,
  onDownloadRemainingInstallments,
}: LoanDetailsPanelProps) {
  const ccy = schedule.currency || "USD";
  const statusInfo =
    STATUS_CONFIG[borrower.status] || STATUS_CONFIG.active;

  const rawAccountNumber = borrower.accountNumber || "";
  const formattedAccountNumber =
    formatAccountNumber(rawAccountNumber) || rawAccountNumber;

  const rawSettlementNumber = schedule.settlementAccountNumber || "";
  const formattedSettlementNumber =
    formatAccountNumber(rawSettlementNumber) || rawSettlementNumber;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
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
            p: { xs: 2.5, sm: "24px 20px" },
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Top Header Row */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "center",
            pb: 2,
            borderBottom: "1px solid #F1F5F9",
          }}
        >
          <Typography sx={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
            Loan Information
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              p: 0.75,
              color: "#64748B",
              bgcolor: "#F8FAFC",
              borderRadius: "50%",
              "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
            }}
          >
            <X size={20} />
          </IconButton>
        </Stack>

        {/* ───────── Section 1: Loan Overview ───────── */}
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Loan Overview
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow
              label="Account Status"
              value={
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 1.5,
                    py: 0.35,
                    borderRadius: "999px",
                    bgcolor: statusInfo.bg,
                    color: statusInfo.color,
                    fontSize: 12.5,
                    fontWeight: 600,
                  }}
                >
                  {statusInfo.label}
                </Box>
              }
            />
            <DetailRow label="Account Name" value={borrower.name || "-"} />
            <DetailRow
              label="Account Number"
              value={formattedAccountNumber}
              isCopyable={Boolean(rawAccountNumber)}
              rawCopyValue={rawAccountNumber}
            />
            <DetailRow
              label="Loan Type"
              value={schedule.accountType || "—"}
            />
            <DetailRow label="Currency" value={ccy} />
          </Stack>
        </Box>

        {/* ───────── Section 2: Loan Terms ───────── */}
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Loan Terms
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            {schedule.approvedLimit !== undefined && (
              <DetailRow
                label="Approved Limit"
                value={formatCurrency(schedule.approvedLimit, ccy)}
              />
            )}
            <DetailRow
              label="Outstanding Principal"
              value={formatCurrency(schedule.outstandingPrincipal, ccy)}
            />
            <DetailRow
              label="Interest Rate"
              value={
                schedule.interestRatePct !== undefined
                  ? `${schedule.interestRatePct}% p.a.`
                  : "—"
              }
            />
            {schedule.tenorLabel && (
              <DetailRow label="Tenor" value={schedule.tenorLabel} />
            )}
            {schedule.disbursementDate && (
              <DetailRow
                label="Disbursement Date"
                value={schedule.disbursementDate}
              />
            )}
            {schedule.maturityDate && (
              <DetailRow label="Maturity Date" value={schedule.maturityDate} />
            )}
            {schedule.repaymentFrequency && (
              <DetailRow
                label="Repayment Frequency"
                value={schedule.repaymentFrequency}
              />
            )}
            {schedule.repaymentMethod && (
              <DetailRow
                label="Repayment Method"
                value={schedule.repaymentMethod}
              />
            )}
            {(formattedSettlementNumber || schedule.settlementAccountName) && (
              <DetailRow
                label="Settlement Account"
                value={
                  schedule.settlementAccountName
                    ? `${schedule.settlementAccountName} - ${formattedSettlementNumber}`
                    : formattedSettlementNumber
                }
                isCopyable={Boolean(rawSettlementNumber)}
                rawCopyValue={rawSettlementNumber}
              />
            )}
          </Stack>
        </Box>

        {/* ───────── Section 3: Borrower Information ───────── */}
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Borrower Information
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow label="Borrower Name" value={borrower.name || "-"} />
            {borrower.businessSector && (
              <DetailRow
                label="Business Sector"
                value={borrower.businessSector}
              />
            )}
            {borrower.phone && (
              <DetailRow label="Contact Phone" value={borrower.phone} />
            )}
            {borrower.email && (
              <DetailRow label="Contact Email" value={borrower.email} />
            )}
            {borrower.address && (
              <DetailRow
                label="Registered Address"
                value={borrower.address}
                multiline
              />
            )}
          </Stack>
        </Box>

        {/* ───────── Bottom Action Buttons ───────── */}
        <Stack spacing={1.5} sx={{ mt: 3, pt: 1 }}>
          {onDownloadSchedule && (
            <BaseButton
              title="Download Loan Schedule (CSV)"
              variant="contained"
              fullWidth
              startIcon={<Download size={16} />}
              onClick={onDownloadSchedule}
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
          )}

          {onDownloadRemainingInstallments && (
            <BaseButton
              title="Download Remaining Installments (CSV)"
              variant="outlined"
              fullWidth
              startIcon={<Download size={16} />}
              onClick={onDownloadRemainingInstallments}
              sx={{
                borderColor: "#E2E8F0",
                color: "#0F172A",
                bgcolor: "#F8FAFC",
                borderRadius: "10px",
                textTransform: "none",
                fontSize: 14,
                fontWeight: 600,
                height: 44,
                boxShadow: "none",
                "&:hover": {
                  borderColor: "#CBD5E1",
                  bgcolor: "#F1F5F9",
                  boxShadow: "none",
                },
              }}
            />
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
