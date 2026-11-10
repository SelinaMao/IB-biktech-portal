"use client";

import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { Eye, X } from "lucide-react";

import type { BaseFilterType, BaseFilterValue } from "@core/components/BaseFilter";

export interface TransactionFilterDialogProps {
  open: boolean;
  onClose: () => void;
  value?: BaseFilterValue;
  onApply: (value: BaseFilterValue) => void;
}

interface PeriodOption {
  id: string;
  label: string;
  rangeText: string;
  filterType: BaseFilterType;
  getDateRange: () => { from: string; to: string };
}

export default function TransactionFilterDialog({
  open,
  onClose,
  value,
  onApply,
}: TransactionFilterDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>("last1Month");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const today = dayjs();

  const periodOptions: PeriodOption[] = [
    {
      id: "thisMonth",
      label: "This month",
      rangeText: `${today.startOf("month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
      filterType: "thisMonth",
      getDateRange: () => ({
        from: today.startOf("month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last1Month",
      label: "Last 1 month",
      rangeText: `${today.subtract(1, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
      filterType: "last1Month",
      getDateRange: () => ({
        from: today.subtract(1, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last2Months",
      label: "Last 2 months",
      rangeText: `${today.subtract(2, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
      filterType: "last2Months",
      getDateRange: () => ({
        from: today.subtract(2, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last3Months",
      label: "Last 3 months",
      rangeText: `${today.subtract(3, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
      filterType: "last3Months",
      getDateRange: () => ({
        from: today.subtract(3, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last6Months",
      label: "Last 6 months",
      rangeText: `${today.subtract(6, "month").format("D MMM")} - ${today.format("D MMM YYYY")}`,
      filterType: "last6Months",
      getDateRange: () => ({
        from: today.subtract(6, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "last12Months",
      label: "Last 12 months",
      rangeText: `${today.subtract(12, "month").format("D MMM YYYY")} - ${today.format("D MMM YYYY")}`,
      filterType: "customDate",
      getDateRange: () => ({
        from: today.subtract(12, "month").format("YYYY-MM-DD"),
        to: today.format("YYYY-MM-DD"),
      }),
    },
    {
      id: "custom",
      label: "Custom range",
      rangeText:
        customFrom && customTo
          ? `${dayjs(customFrom).format("D MMM")} - ${dayjs(customTo).format("D MMM YYYY")}`
          : "Pick start and end dates",
      filterType: "customDate",
      getDateRange: () => ({
        from: customFrom,
        to: customTo,
      }),
    },
  ];

  useEffect(() => {
    if (!open) return;
    if (!value || value.type === "all") {
      setSelectedOption("last1Month");
      return;
    }
    if (value.type === "customDate") {
      if (value.from && value.to) {
        setCustomFrom(value.from);
        setCustomTo(value.to);
      }
      setSelectedOption("custom");
      return;
    }
    const match = periodOptions.find((p) => p.filterType === value.type);
    if (match) {
      setSelectedOption(match.id);
    }
  }, [open, value]);

  const handleApply = () => {
    const selected = periodOptions.find((p) => p.id === selectedOption);
    if (!selected) {
      onApply({ type: "all", from: null, to: null });
      onClose();
      return;
    }

    if (selected.id === "custom") {
      onApply({
        type: "customDate",
        from: customFrom || null,
        to: customTo || null,
      });
    } else {
      const dates = selected.getDateRange();
      onApply({
        type: selected.filterType,
        from: dates.from,
        to: dates.to,
      });
    }
    onClose();
  };

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
            p: { xs: 2.5, sm: 3 },
            width: { xs: "calc(100vw - 32px)", sm: 460 },
            maxWidth: 480,
            boxSizing: "border-box",
            boxShadow: "0px 20px 40px rgba(15, 23, 42, 0.16)",
          },
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Stack
          direction="row"
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2.5,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0F172A",
                lineHeight: 1.25,
              }}
            >
              Filter
            </Typography>
            <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.5 }}>
              Transaction Filter
            </Typography>
          </Box>
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

        {/* Period Section */}
        <Box sx={{ mb: 1 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: "#0F172A",
              mb: 1.5,
            }}
          >
            Period
          </Typography>

          <Stack spacing={1}>
            {periodOptions.map((opt) => {
              const isSelected = selectedOption === opt.id;
              return (
                <Box
                  key={opt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedOption(opt.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedOption(opt.id);
                    }
                  }}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.75,
                    py: 1.15,
                    minHeight: 44,
                    borderRadius: "10px",
                    border: isSelected
                      ? "1.5px solid #1C64B4"
                      : "1px solid #EDF2F7",
                    bgcolor: isSelected ? "#F0F7FF" : "#FFFFFF",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: isSelected ? "#1C64B4" : "#CBD5E1",
                      bgcolor: isSelected ? "#EBF5FF" : "#F8FAFC",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Radio
                      checked={isSelected}
                      size="small"
                      sx={{
                        p: 0,
                        color: "#CBD5E1",
                        "&.Mui-checked": {
                          color: "#1C64B4",
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 13.5,
                        fontWeight: isSelected ? 600 : 500,
                        color: "#0F172A",
                      }}
                    >
                      {opt.label}
                    </Typography>
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: 12.5,
                      color: "#64748B",
                      fontWeight: 400,
                    }}
                  >
                    {opt.rangeText}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {/* Custom Date Pickers when 'custom' is active */}
          {selectedOption === "custom" && (
            <Stack direction="row" spacing={1.5} sx={{ mt: 1.5, px: 0.5 }}>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                  From
                </Typography>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    padding: "0 10px",
                    fontSize: 13,
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 12, color: "#64748B", mb: 0.5 }}>
                  To
                </Typography>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  style={{
                    width: "100%",
                    height: 38,
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    padding: "0 10px",
                    fontSize: 13,
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </Box>
            </Stack>
          )}
        </Box>

        {/* Footer Buttons */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 3,
            pt: 0.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{
              height: 38,
              px: 3,
              borderRadius: "8px",
              borderColor: "#E2E8F0",
              color: "#0F172A",
              textTransform: "none",
              fontSize: 13.5,
              fontWeight: 600,
              "&:hover": {
                borderColor: "#CBD5E1",
                bgcolor: "#F8FAFC",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleApply}
            startIcon={<Eye size={16} />}
            sx={{
              height: 38,
              px: 2.5,
              borderRadius: "8px",
              bgcolor: "#1C64B4",
              color: "#FFFFFF",
              textTransform: "none",
              fontSize: 13.5,
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#154F91",
                boxShadow: "none",
              },
            }}
          >
            View Transaction
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
