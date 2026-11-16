"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Check, Download, FileText, X } from "lucide-react";

import { palette } from "@/theme/palette";
import { showToast } from "@core/components/AppToast";
import type { PayrollItem } from "../payroll.types";

export interface PayrollHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  item: PayrollItem | null;
}

export default function PayrollHistoryDrawer({
  open,
  onClose,
  item,
}: PayrollHistoryDrawerProps) {
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
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460, md: 480 },
          p: { xs: 2.5, sm: 3.5 },
          boxSizing: "border-box",
          bgcolor: "#FFFFFF",
          borderRadius: { xs: 0, sm: "20px 0 0 20px" },
        },
      }}
    >
      {/* Top Header: Status Chip + Close Button */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 0.6,
            borderRadius: "6px",
            bgcolor: "#16A34A",
            color: "#FFFFFF",
            fontSize: 12.5,
            fontWeight: 600,
          }}
        >
          <Check size={14} strokeWidth={2.5} />
          {item.status}
        </Box>

        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "#64748B", "&:hover": { bgcolor: "#F1F5F9" } }}
        >
          <X size={20} />
        </IconButton>
      </Box>

      {/* Subtitle & Big Amount */}
      <Typography sx={{ fontSize: 13.5, color: "#64748B", mb: 0.5 }}>
        {item.title || "October payroll"} · {item.referenceNo}
      </Typography>

      <Typography
        sx={{
          fontSize: { xs: 28, sm: 32 },
          fontWeight: 700,
          color: "#0F172A",
          letterSpacing: "-0.5px",
          lineHeight: 1.2,
          mb: 0.5,
        }}
      >
        {totalAmountStr}
      </Typography>

      <Typography sx={{ fontSize: 13, color: "#64748B", mb: 3.5 }}>
        {item.fileName}
      </Typography>

      {/* Section 1: Payroll Summary */}
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 2 }}>
        Payroll summary
      </Typography>

      <Stack spacing={1.75} sx={{ mb: 3.5 }}>
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
          mb: 3.5,
          bgcolor: "#FFFFFF",
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "10px",
              bgcolor: "#F0F7FF",
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
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
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
      <Typography sx={{ fontSize: 15, fontWeight: 700, color: "#0F172A", mb: 2 }}>
        Transaction summary
      </Typography>

      <Stack spacing={1.75}>
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

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 0.5 }}>
          <Typography sx={{ fontSize: 13.5, color: "#64748B" }}>
            Total debit amount
          </Typography>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: "#1B5299" }}>
            {totalDebitStr}
          </Typography>
        </Box>
      </Stack>
    </Drawer>
  );
}
