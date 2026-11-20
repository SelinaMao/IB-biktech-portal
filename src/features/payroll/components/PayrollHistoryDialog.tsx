"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { TransitionProps } from "@mui/material/transitions";
import { Check, Download, FileText, X } from "lucide-react";

import { palette } from "@/theme/palette";
import { showToast } from "@core/components/AppToast";
import type { PayrollItem } from "../payroll.types";

/** Slide in from the right transition matching Account TransactionDetails */
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="left" ref={ref} {...props} />;
});

export interface PayrollHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  item: PayrollItem | null;
}

export default function PayrollHistoryDialog({
  open,
  onClose,
  item,
}: PayrollHistoryDialogProps) {
  if (!item) return null;

  const totalAmountStr =
    item.currency === "KHR"
      ? `KHR ${item.totalAmount.toLocaleString("en-US")}`
      : `USD ${item.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const feeAmount = item.fee ?? 24000;
  const feeStr =
    item.currency === "KHR"
      ? `KHR ${feeAmount.toLocaleString("en-US")}`
      : `USD ${(feeAmount / 4000).toFixed(2)}`;

  const totalDebit = item.totalDebitAmount ?? (item.totalAmount + feeAmount);
  const totalDebitStr =
    item.currency === "KHR"
      ? `KHR ${totalDebit.toLocaleString("en-US")}`
      : `USD ${totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const handleDownload = (format: "CSV" | "Excel") => {
    showToast("success", {
      title: "Download Started",
      message: `Exporting ${item.referenceNo} as ${format}...`,
    });
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
            width: { xs: "calc(100vw - 16px)", sm: 440, md: 460 },
            maxWidth: 460,
            height: {
              xs: "calc(100vh - 16px)",
              sm: "calc(100vh - 16px)",
              md: "calc(100vh - 28px)",
            },
            borderRadius: "24px",
            bgcolor: "#FFFFFF",
            p: { xs: 2.5, sm: "24px 22px" },
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
            overflowY: "auto",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Top Header: Status Chip + Close Button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.5,
              py: 0.5,
              borderRadius: "6px",
              bgcolor: "#0F8259",
              color: "#FFFFFF",
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Check size={14} strokeWidth={2.5} />
            <span>{item.status}</span>
          </Box>

          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: "#0F172A",
              p: 0.5,
              bgcolor: "#F1F5F9",
              borderRadius: "8px",
              "&:hover": { bgcolor: "#E2E8F0" },
            }}
          >
            <X size={18} />
          </IconButton>
        </Box>

        {/* Subtitle */}
        <Typography sx={{ fontSize: 13.5, color: "#64748B", mb: 0.5 }}>
          {item.title || "October payroll"} · {item.referenceNo}
        </Typography>

        {/* Big Amount */}
        <Typography
          sx={{
            fontSize: { xs: 28, sm: 32 },
            fontWeight: 800,
            color: "#0F172A",
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
            mb: 0.5,
          }}
        >
          {totalAmountStr}
        </Typography>

        {/* File name */}
        <Typography sx={{ fontSize: 12.5, color: "#64748B", mb: 3 }}>
          {item.fileName}
        </Typography>

        {/* Section 1: Payroll Summary */}
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A", mb: 1.75 }}>
          Payroll summary
        </Typography>

        <Stack spacing={1.5} sx={{ mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
              Source account
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
              {item.sourceAccountName} · {item.sourceAccountNumber}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
              Number of records
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
              {item.records}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
              Total payroll amount
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
              {totalAmountStr}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
              Processing date
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: "#0F172A" }}>
              {item.processingDate} · {item.processingType || "Immediate"}
            </Typography>
          </Box>
        </Stack>

        {/* Middle Box: List of Payroll Download Card */}
        <Box
          sx={{
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: "14px",
            p: 2,
            mb: 3,
            bgcolor: "#FFFFFF",
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.75 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: "#EFF6FF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#1B5299",
                flexShrink: 0,
              }}
            >
              <FileText size={20} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                List of payroll
              </Typography>
              <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                All {item.records} employees with amounts and status
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={() => handleDownload("CSV")}
              startIcon={<Download size={15} />}
              sx={{
                flex: 1,
                height: 38,
                borderRadius: "8px",
                borderColor: palette.slate[200],
                color: "#0F172A",
                fontSize: 13.5,
                fontWeight: 500,
                textTransform: "none",
                "&:hover": { borderColor: palette.slate[300], bgcolor: "#F8FAFC" },
              }}
            >
              CSV
            </Button>

            <Button
              variant="contained"
              onClick={() => handleDownload("Excel")}
              startIcon={<Download size={15} />}
              sx={{
                flex: 1,
                height: 38,
                borderRadius: "8px",
                bgcolor: "#2E9D68",
                color: "#FFFFFF",
                fontSize: 13.5,
                fontWeight: 500,
                textTransform: "none",
                boxShadow: "none",
                "&:hover": { bgcolor: "#248356", boxShadow: "none" },
              }}
            >
              Excel
            </Button>
          </Stack>
        </Box>

        {/* Section 2: Transaction Summary */}
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#0F172A", mb: 1.75 }}>
          Transaction summary
        </Typography>

        <Stack spacing={1.5}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
              Payroll amount
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
              {totalAmountStr}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>Fee</Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: "#0F172A" }}>
              {feeStr}
            </Typography>
          </Box>

          {/* Dotted divider matching screenshot */}
          <Box sx={{ borderBottom: "1px dotted #CBD5E1", my: 0.5 }} />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
              Total debit amount
            </Typography>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#1B5299" }}>
              {totalDebitStr}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
