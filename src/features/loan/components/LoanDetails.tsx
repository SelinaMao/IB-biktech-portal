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

import BaseButton from "@core/components/BaseButton";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import type { BorrowerProfile, LoanScheduleDetails, LoanStatus } from "../loan.types";

const STATUS_STYLES: Record<LoanStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#166D35", bg: "#E0F4E7" },
  overdue: { label: "Overdue", color: "#DC2626", bg: "#FEE8E8" },
  closed: { label: "Closed", color: "#475569", bg: "#F1F5F9" },
};

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
    children: React.ReactElement<unknown>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

/** Floating right-side drawer triggered by "Account Information" on LoanDetailCard —
 *  matches AccountInformationDetail's layout and styling. */
export default function LoanDetailsPanel({
  open,
  onClose,
  borrower,
  schedule,
  onDownloadSchedule,
  onDownloadRemainingInstallments,
}: LoanDetailsPanelProps) {
  const ccy = (schedule.currency ?? "USD").toUpperCase();
  const statusStyle = STATUS_STYLES[borrower.status] ?? STATUS_STYLES.active;
  const formattedAccNumber =
    formatAccountNumber(borrower.accountNumber) || borrower.accountNumber;
  const settlementDisplay = [
    schedule.settlementAccountName,
    schedule.settlementAccountNumber
      ? formatAccountNumber(schedule.settlementAccountNumber)
      : undefined,
  ]
    .filter(Boolean)
    .join("\n");

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
                bgcolor: statusStyle.bg,
                color: statusStyle.color,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {statusStyle.label}
            </Box>
          </Stack>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow label="Account Name" value={borrower.name} />
            <DetailRow
              label="Account Number"
              value={formattedAccNumber}
              isCopyable
              rawCopyValue={borrower.accountNumber}
            />
            {schedule.accountType && (
              <DetailRow label="Account Type" value={schedule.accountType} />
            )}
            <DetailRow label="Currency" value={ccy} />
          </Stack>
        </Box>

        {/* ───────── Section 2: Loan Information ───────── */}
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Loan Information
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            <DetailRow
              label="Approved Limit"
              value={formatCCY(schedule.approvedLimit, ccy)}
            />
            <DetailRow
              label="Outstanding Principal"
              value={formatCCY(schedule.outstandingPrincipal, ccy)}
            />
            <DetailRow label="Disbursement Date" value={schedule.disbursementDate} />
            <DetailRow label="Maturity Date" value={schedule.maturityDate} />
            {schedule.tenorLabel && (
              <DetailRow label="Tenor" value={schedule.tenorLabel} />
            )}
            <DetailRow
              label="Interest Rate"
              value={`${schedule.interestRatePct.toFixed(1)}% p.a.`}
              valueColor="#10B981"
            />
            <DetailRow label="Repayment Method" value={schedule.repaymentMethod} />
            <DetailRow
              label="Next Installment"
              value={formatCCY(schedule.nextInstallmentAmount, ccy)}
            />
            <DetailRow label="Next Payment Date" value={schedule.nextInstallmentDate} />
          </Stack>
        </Box>

        {/* ───────── Section 3: Loan Settings ───────── */}
        <Box sx={{ mt: 2.5 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 1.5 }}>
            Loan Settings
          </Typography>

          <Stack divider={<Divider sx={{ borderColor: "#F1F5F9" }} />}>
            {settlementDisplay && (
              <DetailRow
                label="Settlement Account"
                value={settlementDisplay}
                multiline
              />
            )}
            <DetailRow
              label="Remaining Installments"
              value={`${schedule.remainingInstallments} / ${schedule.totalInstallments}`}
            />
            <DetailRow
              label="Overdue Installments"
              value={String(schedule.overdueCount)}
              valueColor={schedule.overdueCount > 0 ? "#DC2626" : "#0F172A"}
            />
          </Stack>
        </Box>

        {/* ───────── Bottom Action Buttons ───────── */}
        <Stack spacing={1.5} sx={{ mt: 3, pt: 1 }}>
          <BaseButton
            title="Download Loan Schedule"
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
          <BaseButton
            title="Download Remaining Installments"
            variant="contained"
            fullWidth
            startIcon={<Download size={16} />}
            onClick={onDownloadRemainingInstallments}
            sx={{
              bgcolor: "#EBF3FA",
              color: "#0F172A",
              borderRadius: "10px",
              textTransform: "none",
              fontSize: 14,
              fontWeight: 600,
              height: 44,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#DFEAF6",
                boxShadow: "none",
              },
            }}
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
