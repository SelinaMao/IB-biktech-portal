"use client";

import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Box,
  IconButton,
  Popover,
  Stack,
  TextField,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";

import BaseButton from "./BaseButton";
import { palette, radius } from "@/theme/palette";

export type FilterDayType = "7days" | "30days" | "custom" | "all" | string;

export interface BaseFilterByDayValue {
  type: FilterDayType;
  label: string;
  from: string | null; // "YYYY-MM-DD"
  to: string | null;   // "YYYY-MM-DD"
}

export interface DayFilterOption {
  label: string;
  value: FilterDayType;
  days?: number;
}

export const DEFAULT_DAY_FILTER_OPTIONS: DayFilterOption[] = [
  { label: "Last 7days", value: "7days", days: 7 },
  { label: "Last 30days", value: "30days", days: 30 },
  { label: "Custom date", value: "custom" },
];

export interface BaseFilterByDayProps {
  value?: BaseFilterByDayValue | null;
  defaultValue?: BaseFilterByDayValue | null;
  onChange?: (value: BaseFilterByDayValue | null) => void;
  options?: DayFilterOption[];
  allowClear?: boolean;
  activeVariant?: "primary" | "subtle";
  sx?: SxProps<Theme>;
}

/**
 * Resolves standard range boundaries for quick options like 7 days, 30 days, or custom.
 */
export function resolveFilterRange(
  type: FilterDayType,
  customFrom?: string | null,
  customTo?: string | null,
): { from: string | null; to: string | null } {
  const today = dayjs();
  switch (type) {
    case "7days":
      return {
        from: today.subtract(7, "day").startOf("day").format("YYYY-MM-DD"),
        to: today.endOf("day").format("YYYY-MM-DD"),
      };
    case "30days":
      return {
        from: today.subtract(30, "day").startOf("day").format("YYYY-MM-DD"),
        to: today.endOf("day").format("YYYY-MM-DD"),
      };
    case "custom":
      return {
        from: customFrom ?? null,
        to: customTo ?? null,
      };
    case "all":
    default:
      return { from: null, to: null };
  }
}

/**
 * Helper to check if a date string/Dayjs falls within the given filter range.
 * Supports multiple date formats e.g. "11 June 2026", "2026-06-11", Dayjs objects.
 */
export function isDateWithinFilter(
  dateValue: string | Date | Dayjs | undefined | null,
  filter: BaseFilterByDayValue | null | undefined,
): boolean {
  if (!filter || filter.type === "all" || (!filter.from && !filter.to)) {
    return true;
  }
  if (!dateValue) return false;

  const d = dayjs(dateValue);
  if (!d.isValid()) return true;

  const target = d.startOf("day");

  if (filter.from && filter.to) {
    const start = dayjs(filter.from).startOf("day");
    const end = dayjs(filter.to).endOf("day");
    return (target.isAfter(start) || target.isSame(start)) &&
           (target.isBefore(end) || target.isSame(end));
  }

  if (filter.from) {
    const start = dayjs(filter.from).startOf("day");
    return target.isAfter(start) || target.isSame(start);
  }

  if (filter.to) {
    const end = dayjs(filter.to).endOf("day");
    return target.isBefore(end) || target.isSame(end);
  }

  return true;
}

export default function BaseFilterByDay({
  value,
  defaultValue = null,
  onChange,
  options = DEFAULT_DAY_FILTER_OPTIONS,
  allowClear = true,
  activeVariant = "primary",
  sx,
}: BaseFilterByDayProps) {
  const [internalValue, setInternalValue] = useState<BaseFilterByDayValue | null>(defaultValue);
  const activeValue = value !== undefined ? value : internalValue;

  // Custom date Popover state
  const [customAnchorEl, setCustomAnchorEl] = useState<HTMLElement | null>(null);
  const [customFrom, setCustomFrom] = useState<string>(activeValue?.from ?? "");
  const [customTo, setCustomTo] = useState<string>(activeValue?.to ?? "");

  const handleSelectOption = (opt: DayFilterOption, targetEl: HTMLElement) => {
    // If clicking "Custom date", open the popover anchor
    if (opt.value === "custom") {
      setCustomAnchorEl(targetEl);
      setCustomFrom(activeValue?.type === "custom" ? (activeValue.from ?? "") : "");
      setCustomTo(activeValue?.type === "custom" ? (activeValue.to ?? "") : "");
      return;
    }

    // Toggle off if clicking the currently active filter
    if (allowClear && activeValue?.type === opt.value) {
      if (value === undefined) setInternalValue(null);
      onChange?.(null);
      return;
    }

    const range = resolveFilterRange(opt.value);
    const newValue: BaseFilterByDayValue = {
      type: opt.value,
      label: opt.label,
      from: range.from,
      to: range.to,
    };

    if (value === undefined) setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleApplyCustom = () => {
    const newValue: BaseFilterByDayValue = {
      type: "custom",
      label: customFrom && customTo
        ? `${dayjs(customFrom).format("DD MMM")} - ${dayjs(customTo).format("DD MMM")}`
        : "Custom date",
      from: customFrom || null,
      to: customTo || null,
    };

    if (value === undefined) setInternalValue(newValue);
    onChange?.(newValue);
    setCustomAnchorEl(null);
  };

  const handleClearCustom = () => {
    setCustomFrom("");
    setCustomTo("");
    if (value === undefined) setInternalValue(null);
    onChange?.(null);
    setCustomAnchorEl(null);
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          flexWrap: "wrap",
          ...sx,
        }}
      >
        {options.map((opt) => {
          const isActive = activeValue?.type === opt.value;
          const displayLabel =
            opt.value === "custom" && isActive && activeValue?.label
              ? activeValue.label
              : opt.label;

          const activeBg = activeVariant === "primary" ? "#2764A5" : palette.slate[100];
          const activeText = activeVariant === "primary" ? "#FFFFFF" : palette.slate[900];
          const activeBorder = activeVariant === "primary" ? "#2764A5" : palette.slate[300];

          return (
            <Box
              key={opt.value}
              component="button"
              type="button"
              onClick={(e) => handleSelectOption(opt, e.currentTarget)}
              sx={{
                appearance: "none",
                outline: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                px: 2,
                py: 2,
                borderRadius: `${radius.sm}px`,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                border: "1px solid",
                borderColor: isActive ? activeBorder : palette.slate[200],
                bgcolor: isActive ? activeBg : "#FFFFFF",
                color: isActive ? activeText : palette.slate[500],
                boxShadow: "none",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: isActive
                    ? activeVariant === "primary"
                      ? "#1E5289"
                      : palette.slate[200]
                    : palette.slate[50],
                  borderColor: isActive ? activeBorder : palette.slate[300],
                },
              }}
            >
              {/* {opt.value === "custom" && (
                <CalendarTodayRoundedIcon
                  sx={{
                    fontSize: 14,
                    color: isActive && activeVariant === "primary" ? "#FFFFFF" : palette.slate[400],
                  }}
                />
              )} */}
              <span>{displayLabel}</span>
            </Box>
          );
        })}
      </Stack>

      {/* Custom Date Range Popover */}
      <Popover
        open={Boolean(customAnchorEl)}
        anchorEl={customAnchorEl}
        onClose={() => setCustomAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              p: 2.5,
              mt: 1,
              width: 310,
              borderRadius: "14px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              border: `1px solid ${palette.slate[200]}`,
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: palette.slate[900] }}>
              Select Date Range
            </Typography>
            <IconButton size="small" onClick={() => setCustomAnchorEl(null)}>
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Stack>

          <Stack spacing={1.5}>
            <TextField
              label="From"
              type="date"
              size="small"
              fullWidth
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              fullWidth
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Stack>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", pt: 0.5 }}>
            <BaseButton
              title="Reset"
              variant="outlined"
              size="small"
              onClick={handleClearCustom}
              sx={{ borderRadius: "999px", textTransform: "none", fontSize: 12, px: 2 }}
            />
            <BaseButton
              title="Apply"
              variant="contained"
              size="small"
              onClick={handleApplyCustom}
              disabled={!customFrom && !customTo}
              sx={{
                borderRadius: "999px",
                textTransform: "none",
                fontSize: 12,
                px: 2,
                bgcolor: "#2764A5",
                "&:hover": { bgcolor: "#1E5289" },
              }}
            />
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
