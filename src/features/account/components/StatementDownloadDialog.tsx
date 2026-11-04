"use client";

import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { Download, X } from "lucide-react";
import dayjs from "dayjs";

import BaseButton from "@core/components/BaseButton";
import type { BaseDownloadFormat, BaseDownloadRange, BaseDownloadValue } from "@core/components/BaseDownloadPanel";
import { formatAccountNumber } from "@/utils/format-account-number";
import { palette } from "@/theme/palette";

export interface StatementDownloadDialogProps {
  open: boolean;
  onClose: () => void;
  accountName?: string;
  accountNumber?: string;
  onDownload: (value: BaseDownloadValue) => void;
  isDownloading?: boolean;
}

interface PeriodOption {
  value: BaseDownloadRange | "custom";
  label: string;
  getDateRange: () => string;
}

export default function StatementDownloadDialog({
  open,
  onClose,
  accountName = "",
  accountNumber = "",
  onDownload,
  isDownloading = false,
}: StatementDownloadDialogProps) {
  const [format, setFormat] = useState<BaseDownloadFormat>("pdf");
  const [period, setPeriod] = useState<BaseDownloadRange | "custom">("last1months");

  const today = dayjs();

  const periodOptions: PeriodOption[] = [
    {
      value: "thisMonth",
      label: "This month",
      getDateRange: () =>
        `${today.startOf("month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
    },
    {
      value: "last1months",
      label: "Last 1 month",
      getDateRange: () =>
        `${today.subtract(1, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
    },
    {
      value: "last2months",
      label: "Last 2 months",
      getDateRange: () =>
        `${today.subtract(2, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
    },
    {
      value: "last3months",
      label: "Last 3 months",
      getDateRange: () =>
        `${today.subtract(3, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
    },
    {
      value: "last6months",
      label: "Last 6 months",
      getDateRange: () =>
        `${today.subtract(6, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
    },
    {
      value: "last12months",
      label: "Last 12 months",
      getDateRange: () =>
        `${today.subtract(12, "month").format("D MMM YYYY")} - ${today.format("D MMM YYYY")}`,
    },
    {
      value: "custom",
      label: "Custom range",
      getDateRange: () => "Pick start and end dates",
    },
  ];

  const handleDownload = () => {
    const chosenRange = period === "custom" ? "thisMonth" : period;
    onDownload({ range: chosenRange, format });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "12px",
            p: 5.5,
            bgcolor: "#FFFFFF",
            boxShadow: "0px 20px 30px rgba(15, 23, 42, 0.16)",
          },
        },
      }}
    >
      {/* ───────── Header ───────── */}
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 20, fontWeight: 700, color: "#0F172A", lineHeight: 1.3 }}>
            Statement
          </Typography>
          {(accountName || accountNumber) && (
            <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.5 }}>
              {[accountName, accountNumber ? formatAccountNumber(accountNumber) : ""].filter(Boolean).join(" · ")}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: "#64748B",
            bgcolor: "#F1F5F9",
            p: 0.75,
            "&:hover": { bgcolor: "#E2E8F0" },
          }}
        >
          <X size={18} />
        </IconButton>
      </Stack>

      <DialogContent sx={{ p: 1 }}>
        <Stack spacing={3}>
          {/* ───────── File format Section ───────── */}
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mb: 1.5 }}>
              File format
            </Typography>
            <RadioGroup
              row
              value={format}
              onChange={(e) => setFormat(e.target.value as BaseDownloadFormat)}
              sx={{ gap: 3 }}
            >
              <FormControlLabel
                value="pdf"
                control={<Radio size="small" sx={{ color: "#94A3B8", "&.Mui-checked": { color: "#0F5196" } }} />}
                label={<Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>PDF</Typography>}
              />
              <FormControlLabel
                value="excel"
                control={<Radio size="small" sx={{ color: "#94A3B8", "&.Mui-checked": { color: "#0F5196" } }} />}
                label={<Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>Excel</Typography>}
              />
              <FormControlLabel
                value="csv"
                control={<Radio size="small" sx={{ color: "#94A3B8", "&.Mui-checked": { color: "#0F5196" } }} />}
                label={<Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>CSV</Typography>}
              />
            </RadioGroup>
          </Box>

          {/* ───────── Period Section ───────── */}
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#0F172A", mb: 1.5 }}>
              Period
            </Typography>
            <Stack spacing={1.25}>
              {periodOptions.map((opt) => {
                const isSelected = period === opt.value;
                return (
                  <Box
                    key={opt.value}
                    onClick={() => setPeriod(opt.value)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: "10px 16px",
                      borderRadius: "12px",
                      border: isSelected ? "1.5px solid #0F5196" : "1px solid #E2E8F0",
                      bgcolor: isSelected ? "#F0F7FF" : "#FFFFFF",
                      cursor: "pointer",
                      transition: "all 0.15s ease-in-out",
                      "&:hover": {
                        bgcolor: isSelected ? "#F0F7FF" : "#F8FAFC",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                      <Radio
                        checked={isSelected}
                        size="small"
                        sx={{
                          p: 0,
                          color: "#94A3B8",
                          "&.Mui-checked": { color: "#0F5196" },
                        }}
                      />
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: isSelected ? 600 : 500,
                          color: "#0F172A",
                        }}
                      >
                        {opt.label}
                      </Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 12, color: "#64748B" }}>
                      {opt.getDateRange()}
                    </Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>

          {/* ───────── Footer Action Buttons ───────── */}
          <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", pt: 2, alignItems: "center" }}>
            <BaseButton
              title="Cancel"
              variant="text"
              onClick={onClose}
              sx={{
                color: "#000000",
                textTransform: "none",
                fontWeight: 400,
                fontSize: 14,
                px: 2.5,
                bgcolor: "#F8FAFC",
                borderRadius: "10px",
                border: "1px solid #E2E8F0",
                "&:hover": { bgcolor: "#ffffff" },
              }}
            />
            <BaseButton
              title="Download statement"
              variant="contained"
              startIcon={<Download size={16} />}
              onClick={handleDownload}
              disabled={isDownloading}
              sx={{
                bgcolor: "#0F5196",
                color: "#FFFFFF",
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 400,
                fontSize: 14,
                px: 3,
                py: 1.25,
                boxShadow: "none",
                "&:hover": { bgcolor: "#0C417A" },
              }}
            />
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
