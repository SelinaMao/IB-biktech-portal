"use client";

import React from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { Calendar } from "lucide-react";
import dayjs from "dayjs";

export type TransferScheduleValues = {
  enabled: boolean;
  frequency: "one-time" | "weekly" | "monthly" | string;
  timing?: "today" | "later" | "weekly" | string;
  startDate: string;
  endCondition?: "after-transfers" | "no-end-date" | string;
  afterTransfersCount?: number;
};

export const DEFAULT_SCHEDULE_VALUES: TransferScheduleValues = {
  enabled: false,
  frequency: "one-time",
  startDate: "",
};

export type TransferScheduleSectionProps = {
  values?: TransferScheduleValues;
  onChange?: (next: TransferScheduleValues) => void;
  // Fallbacks for individual prop binding
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  frequency?: "one-time" | "weekly" | "monthly" | string;
  onFrequencyChange?: (val: any) => void;
  timing?: "today" | "later" | "weekly" | string;
  onTimingChange?: (val: any) => void;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endCondition?: "after-transfers" | "no-end-date" | string;
  onEndConditionChange?: (val: any) => void;
  afterTransfersCount?: number;
  disabled?: boolean;
};

const radioSx = {
  color: "#CBD5E1",
  "&.Mui-checked": {
    color: "#2E937A",
  },
  p: 0.75,
};

export default function TransferScheduleSection(props: TransferScheduleSectionProps) {
  const {
    values,
    onChange,
    enabled = values?.enabled ?? false,
    onToggle,
    frequency = values?.frequency ?? "one-time",
    onFrequencyChange,
    startDate = values?.startDate ?? "",
    onStartDateChange,
    disabled = false,
  } = props;

  const dateInputRef = React.useRef<HTMLInputElement>(null);

  const handleToggle = (checked: boolean) => {
    if (onToggle) onToggle(checked);
    if (onChange && values) onChange({ ...values, enabled: checked });
  };

  const handleFrequency = (val: string) => {
    if (onFrequencyChange) onFrequencyChange(val);
    if (onChange && values) onChange({ ...values, frequency: val });
  };

  const handleStartDate = (val: string) => {
    if (onStartDateChange) onStartDateChange(val);
    if (onChange && values) onChange({ ...values, startDate: val });
  };

  const normalizedFrequency =
    frequency === "weekly"
      ? "weekly"
      : frequency === "monthly"
      ? "monthly"
      : "one-time";

  // Parse raw value for <input type="date"> (must be YYYY-MM-DD or empty)
  const rawDateValue = React.useMemo(() => {
    if (!startDate) return "";
    const cleaned = startDate.replace(/^Today,\s*/i, "").trim();
    const d = dayjs(cleaned);
    return d.isValid() ? d.format("YYYY-MM-DD") : "";
  }, [startDate]);

  // Display text formatted for the UI (e.g. "Select Date" or "18 Mar 2026")
  const displayDateText = React.useMemo(() => {
    if (!startDate) return "";
    const cleaned = startDate.replace(/^Today,\s*/i, "").trim();
    const d = dayjs(cleaned);
    return d.isValid() ? d.format("DD MMM YYYY") : startDate;
  }, [startDate]);

  const openDatePicker = () => {
    if (disabled) return;
    try {
      if (dateInputRef.current && "showPicker" in dateInputRef.current) {
        dateInputRef.current.showPicker();
        return;
      }
    } catch {
      // Fallback
    }
    dateInputRef.current?.focus();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      const formatted = dayjs(val).isValid() ? dayjs(val).format("DD MMM YYYY") : val;
      handleStartDate(formatted);
    } else {
      handleStartDate("");
    }
  };

  return (
    <Box>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", py: 0.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 15, color: "#0F172A" }}>
          Schedule
        </Typography>
        <Switch
          checked={enabled}
          disabled={disabled}
          onChange={(e) => handleToggle(e.target.checked)}
          sx={{
            width: 46,
            height: 28,
            p: 0,
            "& .MuiSwitch-switchBase": {
              p: 0,
              m: "3px",
              transitionDuration: "200ms",
              "&.Mui-checked": {
                transform: "translateX(18px)",
                color: "#FFFFFF",
                "& + .MuiSwitch-track": {
                  backgroundColor: "#2E937A",
                  opacity: 1,
                  border: 0,
                },
              },
            },
            "& .MuiSwitch-thumb": {
              boxSizing: "border-box",
              width: 22,
              height: 22,
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            },
            "& .MuiSwitch-track": {
              borderRadius: 14,
              backgroundColor: "#CBD5E1",
              opacity: 1,
              transition: "background-color 200ms",
            },
          }}
        />
      </Stack>

      {enabled && (
        <>
          <Box sx={{ borderBottom: "1px solid #EDEDEC", my: 2 }} />
          <Stack spacing={2.5}>
            {/* Frequency */}
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A", mb: 0.75 }}>
                Frequency
              </Typography>
              <RadioGroup
                row
                value={normalizedFrequency}
                onChange={(e) => handleFrequency(e.target.value)}
              >
                <FormControlLabel
                  value="one-time"
                  control={<Radio sx={radioSx} />}
                  label={<Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 400 }}>One-time</Typography>}
                  sx={{ mr: { xs: 2, sm: 3.5 } }}
                />
                <FormControlLabel
                  value="weekly"
                  control={<Radio sx={radioSx} />}
                  label={<Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 400 }}>Weekly</Typography>}
                  sx={{ mr: { xs: 2, sm: 3.5 } }}
                />
                <FormControlLabel
                  value="monthly"
                  control={<Radio sx={radioSx} />}
                  label={<Typography sx={{ fontSize: 14, color: "#334155", fontWeight: 400 }}>Monthly</Typography>}
                />
              </RadioGroup>
            </Box>

            {/* Start date */}
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#0F172A", mb: 1 }}>
                Start Date
              </Typography>
              <Box
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-label="Select Date"
                onClick={openDatePicker}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDatePicker();
                  }
                }}
                sx={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  height: 48,
                  borderRadius: "10px",
                  border: "1px solid #CBD5E1",
                  bgcolor: "#FFFFFF",
                  px: 2,
                  gap: 1.5,
                  cursor: disabled ? "default" : "pointer",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                  "&:hover": {
                    borderColor: disabled ? "#CBD5E1" : "#94A3B8",
                  },
                  "&:focus-visible, &:focus-within": {
                    borderColor: "#2764A5",
                    outline: "none",
                    boxShadow: "0 0 0 2px rgba(39, 100, 165, 0.15)",
                  },
                }}
              >
                <Calendar size={18} color="#0F172A" strokeWidth={1.75} style={{ flexShrink: 0 }} />
                <Typography
                  sx={{
                    fontSize: 14,
                    fontWeight: 400,
                    color: displayDateText ? "#0F172A" : "#64748B",
                    userSelect: "none",
                    flexGrow: 1,
                  }}
                >
                  {displayDateText || "Select Date"}
                </Typography>
                <input
                  ref={dateInputRef}
                  type="date"
                  disabled={disabled}
                  value={rawDateValue}
                  min={dayjs().format("YYYY-MM-DD")}
                  onChange={handleDateChange}
                  style={{
                    position: "absolute",
                    opacity: 0,
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    cursor: disabled ? "default" : "pointer",
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </>
      )}
    </Box>
  );
}
