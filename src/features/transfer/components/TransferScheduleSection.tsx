"use client";

import React from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

export type TransferScheduleValues = {
  enabled: boolean;
  frequency: "one-time" | "recurring";
  timing: "today" | "later" | "weekly";
  startDate: string;
  endCondition: "after-transfers" | "no-end-date";
  afterTransfersCount?: number;
};

export const DEFAULT_SCHEDULE_VALUES: TransferScheduleValues = {
  enabled: false,
  frequency: "one-time",
  timing: "today",
  startDate: "Today, 14 Mar 2026",
  endCondition: "after-transfers",
  afterTransfersCount: 3,
};

export type TransferScheduleSectionProps = {
  values?: TransferScheduleValues;
  onChange?: (next: TransferScheduleValues) => void;
  // Fallbacks for individual prop binding
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  frequency?: "one-time" | "recurring";
  onFrequencyChange?: (val: "one-time" | "recurring") => void;
  timing?: "today" | "later" | "weekly";
  onTimingChange?: (val: "today" | "later" | "weekly") => void;
  startDate?: string;
  onStartDateChange?: (val: string) => void;
  endCondition?: "after-transfers" | "no-end-date";
  onEndConditionChange?: (val: "after-transfers" | "no-end-date") => void;
  afterTransfersCount?: number;
  disabled?: boolean;
};

const radioSx = {
  color: "#CBD5E1",
  "&.Mui-checked": {
    color: "#0D9488",
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
    timing = values?.timing ?? "today",
    onTimingChange,
    startDate = values?.startDate ?? "Today, 14 Mar 2026",
    onStartDateChange,
    endCondition = values?.endCondition ?? "after-transfers",
    onEndConditionChange,
    afterTransfersCount = values?.afterTransfersCount ?? 3,
    disabled = false,
  } = props;

  const handleToggle = (checked: boolean) => {
    if (onToggle) onToggle(checked);
    if (onChange && values) onChange({ ...values, enabled: checked });
  };

  const handleFrequency = (val: "one-time" | "recurring") => {
    if (onFrequencyChange) onFrequencyChange(val);
    if (onChange && values) onChange({ ...values, frequency: val });
  };

  const handleTiming = (val: "today" | "later" | "weekly") => {
    if (onTimingChange) onTimingChange(val);
    if (onChange && values) onChange({ ...values, timing: val });
  };

  const handleStartDate = (val: string) => {
    if (onStartDateChange) onStartDateChange(val);
    if (onChange && values) onChange({ ...values, startDate: val });
  };

  const handleEndCondition = (val: "after-transfers" | "no-end-date") => {
    if (onEndConditionChange) onEndConditionChange(val);
    if (onChange && values) onChange({ ...values, endCondition: val });
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
        <Stack spacing={2} sx={{ mt: 1.5 }}>
          {/* Frequency */}
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#334155", mb: 0.5 }}>
              Frequency
            </Typography>
            <RadioGroup
              row
              value={frequency}
              onChange={(e) => handleFrequency(e.target.value as "one-time" | "recurring")}
            >
              <FormControlLabel
                value="one-time"
                control={<Radio sx={radioSx} />}
                label={<Typography sx={{ fontSize: 14, color: "#334155" }}>One-time</Typography>}
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="recurring"
                control={<Radio sx={radioSx} />}
                label={<Typography sx={{ fontSize: 14, color: "#334155" }}>Recurring</Typography>}
              />
            </RadioGroup>
          </Box>

          {/* Transfer timing */}
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#334155", mb: 0.5 }}>
              Transfer timing
            </Typography>
            <RadioGroup
              row
              value={timing}
              onChange={(e) => handleTiming(e.target.value as "today" | "later" | "weekly")}
            >
              <FormControlLabel
                value="today"
                control={<Radio sx={radioSx} />}
                label={<Typography sx={{ fontSize: 14, color: "#334155" }}>Today</Typography>}
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="later"
                control={<Radio sx={radioSx} />}
                label={<Typography sx={{ fontSize: 14, color: "#334155" }}>Later</Typography>}
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="weekly"
                control={<Radio sx={radioSx} />}
                label={<Typography sx={{ fontSize: 14, color: "#334155" }}>Weekly</Typography>}
              />
            </RadioGroup>
          </Box>

          {/* Start date */}
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#334155", mb: 0.75 }}>
              Start date
            </Typography>
            <OutlinedInput
              fullWidth
              value={startDate}
              onChange={(e) => handleStartDate(e.target.value)}
              placeholder="Today, 14 Mar 2026"
              sx={{
                borderRadius: "14px",
                bgcolor: "#FFFFFF",
                height: 48,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#CBD5E1",
                  borderWidth: "1px",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#94A3B8",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#0D9488",
                  borderWidth: "1.5px",
                },
                "& .MuiInputBase-input": {
                  px: 2,
                  py: 0,
                  fontSize: 15,
                  fontWeight: 400,
                  color: "#5C6B82",
                  "&::placeholder": {
                    color: "#5C6B82",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* End condition */}
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: "#334155", mb: 0.5 }}>
              End condition
            </Typography>
            <RadioGroup
              row
              value={endCondition}
              onChange={(e) => handleEndCondition(e.target.value as "after-transfers" | "no-end-date")}
            >
              <FormControlLabel
                value="after-transfers"
                control={<Radio sx={radioSx} />}
                label={
                  <Typography sx={{ fontSize: 14, color: "#334155" }}>
                    After {afterTransfersCount} transfers
                  </Typography>
                }
                sx={{ mr: 3 }}
              />
              <FormControlLabel
                value="no-end-date"
                control={<Radio sx={radioSx} />}
                label={<Typography sx={{ fontSize: 14, color: "#334155" }}>No end date</Typography>}
              />
            </RadioGroup>
          </Box>
        </Stack>
      )}
    </Box>
  );
}
