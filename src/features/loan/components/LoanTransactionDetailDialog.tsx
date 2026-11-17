"use client";

import React from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Slide,
  Stack,
  Typography,
} from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { CheckCircle2, Download, FileSpreadsheet, X } from "lucide-react";

import { formatAccountNumber } from "@/utils/format-account-number";
import { downloadBlob } from "@/utils/download-file";
import BaseBlurText from "@core/components/BaseBlurText";
import type { LoanTransaction } from "../loan.types";

/** Slide in from the right transition matching AccountInformationDetail & Account transaction detail */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

/** Row with dotted divider used in loan repayment details modal */
function SummaryRow({
  label,
  value,
  valueColor = "#0F172A",
  valueWeight = 600,
  isLast = false,
  py = 2.4,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
  valueWeight?: number;
  isLast?: boolean;
  py?: number | string;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <Box
      sx={{
        py,
        borderBottom: isLast ? "none" : "1px dotted #CBD5E1",
      }}
    >
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Typography
          sx={{
            fontSize: 13.5,
            color: "#64748B",
            fontWeight: 400,
            flexShrink: 0,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: 13.5,
            color: valueColor,
            fontWeight: valueWeight,
            textAlign: "right",
            wordBreak: "break-word",
          }}
        >
          {value}
        </Typography>
      </Stack>
    </Box>
  );
}

export interface LoanTransactionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  transaction: LoanTransaction | null;
  borrowerName?: string;
  borrowerAccountNumber?: string;
}

export default function LoanTransactionDetailDialog({
  open,
  onClose,
  transaction,
  borrowerName,
  borrowerAccountNumber,
}: LoanTransactionDetailDialogProps) {
  if (!transaction) return null;

  const rawAccNumber = borrowerAccountNumber || "0098 1122 3344";
  const formattedAccountNumber = formatAccountNumber(rawAccNumber) || rawAccNumber;
  const accountDisplayName = borrowerName || "Payroll account";

  const totalAmount = transaction.total || transaction.amount || "KHR 8,240,000";

  const handleDownloadCsv = () => {
    const csv = [
      "Employee ID,Beneficiary Name,Account Number,Bank,Amount,Currency,Status",
      "EMP-0101,Dara Vann,0098 1100 2233,Canadia Bank,520000,KHR,Success",
      "EMP-0102,Mony Keo,0098 2211 3344,ABA Bank,380000,KHR,Success",
      "EMP-0103,Sok Pisey,0098 4455 6677,Wing Bank,420000,KHR,Success",
      "EMP-0104,Rithy Keo,0098 3322 1100,ACLEDA Bank,450000,KHR,Success",
      "EMP-0107,Chan Vuthy,0098 7766 5511,ABA Bank,360000,KHR,Success",
    ].join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "payroll_oct_2026.csv");
  };

  const handleDownloadExcel = () => {
    handleDownloadCsv();
  };

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
            p: { xs: 2.5, sm: "28px 24px" },
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
          }}
        >
          {/* Completed Badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              bgcolor: "#0D7A5F",
              color: "#FFFFFF",
              borderRadius: "8px",
              px: 1.8,
              py: 1.5,
              fontSize: 12.5,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            <CheckCircle2 size={13} strokeWidth={2.5} color="#FFFFFF" />
            <span>Completed</span>
          </Box>

          {/* Simple Close X Icon Button (No background) */}
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="close"
            sx={{
              color: "#64748B",
              p: 0.5,
              "&:hover": { color: "#0F172A", bgcolor: "transparent" },
            }}
          >
            <X size={18} />
          </IconButton>
        </Stack>

        {/* Transaction Subtitle / Type · Ref */}
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 500,
            color: "#64748B",
            lineHeight: 1.3,
            mt: 4,
            mb: 0.5,
          }}
        >
          Bakong Payment · {transaction.ref || "2819700093P2429"}
        </Typography>

        {/* Large Bold Amount */}
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0F172A",
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
            mb: 0.5,
            mt:1.5
          }}
        >
          <BaseBlurText>{totalAmount}</BaseBlurText>
        </Typography>

        {/* File name / Memo */}
        <Typography
          sx={{
            fontSize: 13,
            color: "#64748B",
            lineHeight: 1.4,
            mb: 3,
            mt:3
          }}
        >
          payroll_oct_2026.xlsx
        </Typography>

        {/* Section 1: Payroll summary */}
        <Typography
          sx={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "#0F172A",
            mb: 1.5,
            mt: 1,
          }}
        >
          Payroll summary
        </Typography>

        <Stack sx={{ mb: 4 }}>
          <SummaryRow
            label="Source account"
            value={`${accountDisplayName} · ${formattedAccountNumber}`}
          />
          <SummaryRow
            label="Number of records"
            value={24}
          />
          <SummaryRow
            label="Total payroll amount"
            value={<BaseBlurText>{totalAmount}</BaseBlurText>}
          />
          <SummaryRow
            label="Processing date"
            value="14 Oct 2026 · Immediate"
            isLast
          />
        </Stack>

        {/* Middle Card: List of payroll */}
        <Box
          sx={{
            border: "1px solid #E2E8F0",
            borderRadius: "14px",
            p: 2,
            my: 1.5,
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                bgcolor: "#EFF6FF",
                color: "#1C64B4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileSpreadsheet size={18} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.3,
                }}
              >
                List of payroll
              </Typography>
              <Typography
                sx={{
                  fontSize: 12,
                  color: "#64748B",
                  lineHeight: 1.3,
                  mt: 0.35,
                }}
              >
                All 24 employees with amounts and status
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download size={14} />}
              onClick={handleDownloadCsv}
              sx={{
                height: 38,
                borderRadius: "8px",
                borderColor: "#E2E8F0",
                color: "#0F172A",
                bgcolor: "#FFFFFF",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#CBD5E1",
                  bgcolor: "#F8FAFC",
                },
              }}
            >
              CSV
            </Button>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Download size={14} />}
              onClick={handleDownloadExcel}
              sx={{
                height: 38,
                borderRadius: "8px",
                bgcolor: "#2E9A74",
                color: "#FFFFFF",
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                boxShadow: "none",
                "&:hover": {
                  bgcolor: "#247E5F",
                  boxShadow: "none",
                },
              }}
            >
              Excel
            </Button>
          </Stack>
        </Box>

        {/* Section 2: Transaction summary */}
        <Typography
          sx={{
            fontSize: 14.5,
            fontWeight: 700,
            color: "#0F172A",
            mt: 4.5,
            mb: 0.5,
          }}
        >
          Transaction summary
        </Typography>

        <Stack>
          <SummaryRow
            label="Payroll amount"
            value={<BaseBlurText>{totalAmount}</BaseBlurText>}
          />
          <SummaryRow label="Fee" value="KHR 24,000" />
          <SummaryRow
            label="Total debit amount"
            value={<BaseBlurText>{totalAmount === "KHR 8,240,000" ? "KHR 8,264,000" : totalAmount}</BaseBlurText>}
            valueColor="#1C64B4"
            valueWeight={700}
            isLast
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
