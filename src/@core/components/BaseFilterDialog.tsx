"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  InputAdornment,
  Popover,
  Radio,
  Stack,
  Typography,
} from "@mui/material";
import { X } from "lucide-react";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { font, palette, padding, radius } from "@/theme/palette";
import BaseInput from "@core/form/BaseInput";
import type { BaseFilterType, BaseFilterValue } from "./BaseFilter";

/** One selectable preset in the period list — the parent owns the label,
 *  the `filterType` it maps to, and how its concrete date range is derived. */
export interface BaseFilterDialogOption {
  id: string;
  label: string;
  filterType: BaseFilterType;
  getDateRange: () => { from: string; to: string };
}

export interface BaseFilterDialogProps {
  open: boolean;
  onClose: () => void;
  value?: BaseFilterValue;
  onApply: (value: BaseFilterValue) => void;
  /** Preset period options — fully owned by the parent, so each usage can
   *  show a different set of ranges without touching this component. */
  options: BaseFilterDialogOption[];
  /** Option `id` selected by default when no filter (or "all") is active. Falls back to the first option. */
  defaultOptionId?: string;
  title?: string;
  subtitle?: string;
  sectionLabel?: string;
  /** Appends a "custom range" option with its own From/To date inputs. */
  showCustomOption?: boolean;
  /** Where the custom-range row sits relative to `options`. Default "end". */
  customOptionPosition?: "start" | "end";
  customOptionId?: string;
  customOptionLabel?: string;
  customPlaceholder?: string;
  cancelLabel?: string;
  applyLabel?: string;
  applyIcon?: React.ReactNode;
}

/** Same-year ranges drop the year off the start date ("1 Jun - 11 Jun 2026");
 *  ranges crossing a year boundary show it on both ends. */
function formatRangeText(from: string, to: string) {
  const start = dayjs(from);
  const end = dayjs(to);
  if (!start.isValid() || !end.isValid()) return "";
  const sameYear = start.year() === end.year();
  return `${start.format(sameYear ? "D MMM" : "D MMM YYYY")} - ${end.format("D MMM YYYY")}`;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type ActiveField = "from" | "to" | null;

function buildCalendarDays(month: Dayjs) {
  const startOfMonth = month.startOf("month");
  const gridStart = startOfMonth.subtract(startOfMonth.day(), "day");
  return Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
}

/**
 * Centered modal filter — a radio list of period presets (owned by the
 * caller via `options`) plus an optional custom date-range entry. Pairs with
 * `BaseFilter` (the anchored popover variant) for screens that want a modal
 * instead of a dropdown.
 */
export default function BaseFilterDialog({
  open,
  onClose,
  value,
  onApply,
  options,
  defaultOptionId,
  title = "Filter",
  subtitle,
  sectionLabel = "Period",
  showCustomOption = true,
  customOptionPosition = "end",
  customOptionId = "custom",
  customOptionLabel = "Custom range",
  customPlaceholder = "Pick start and end dates",
  cancelLabel = "Cancel",
  applyLabel = "Apply",
  applyIcon,
}: BaseFilterDialogProps) {
  const [selectedOption, setSelectedOption] = useState<string>(
    defaultOptionId ?? options[0]?.id ?? "",
  );
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [activeField, setActiveField] = useState<ActiveField>(null);
  const [viewMonth, setViewMonth] = useState<Dayjs>(() => dayjs().startOf("month"));
  const rangeRowRef = useRef<HTMLDivElement>(null);

  const customFromDay = customFrom ? dayjs(customFrom) : null;
  const customToDay = customTo ? dayjs(customTo) : null;
  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  const openCalendar = (field: Exclude<ActiveField, null>) => {
    setViewMonth((field === "from" ? customFromDay : customToDay) ?? dayjs().startOf("month"));
    setActiveField(field);
  };

  const closeCalendar = () => setActiveField(null);

  const pickDay = (day: Dayjs) => {
    if (activeField === "to" && customFromDay && day.isBefore(customFromDay, "day")) {
      setCustomFrom(day.format("YYYY-MM-DD"));
      setCustomTo("");
      return;
    }
    if (!customFromDay || activeField === "from") {
      setCustomFrom(day.format("YYYY-MM-DD"));
      setCustomTo("");
      setActiveField("to");
      return;
    }
    setCustomTo(day.format("YYYY-MM-DD"));
    closeCalendar();
  };

  // Jumping into "Custom range" opens the From calendar immediately; picking
  // any other preset closes it.
  useEffect(() => {
    if (!showCustomOption) return;
    if (selectedOption === customOptionId) {
      setViewMonth(dayjs().startOf("month"));
      setActiveField("from");
    } else {
      setActiveField(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOption]);

  useEffect(() => {
    if (!open) return;
    if (!value || value.type === "all") {
      setSelectedOption(defaultOptionId ?? options[0]?.id ?? "");
      return;
    }
    if (showCustomOption && value.type === "customDate") {
      if (value.from && value.to) {
        setCustomFrom(value.from);
        setCustomTo(value.to);
      }
      setSelectedOption(customOptionId);
      return;
    }
    const match = options.find((o) => o.filterType === value.type);
    // No preset in this dialog maps to the current filter (e.g. the page's
    // default is "last7Days" but this dialog only lists month-based presets)
    // — leave nothing selected rather than keeping whatever was picked last.
    setSelectedOption(match ? match.id : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, value]);

  const handleApply = () => {
    if (showCustomOption && selectedOption === customOptionId) {
      onApply({
        type: "customDate",
        from: customFrom || null,
        to: customTo || null,
      });
      onClose();
      return;
    }

    const selected = options.find((o) => o.id === selectedOption);
    if (!selected) {
      onApply({ type: "all", from: null, to: null });
      onClose();
      return;
    }

    const dates = selected.getDateRange();
    onApply({
      type: selected.filterType,
      from: dates.from,
      to: dates.to,
    });
    onClose();
  };

  const customRangeText =
    customFrom && customTo
      ? formatRangeText(customFrom, customTo)
      : customPlaceholder;

  const customOptionRow = showCustomOption && (
    <Box
      key={customOptionId}
      role="button"
      tabIndex={0}
      onClick={() => setSelectedOption(customOptionId)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          setSelectedOption(customOptionId);
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
        border:
          selectedOption === customOptionId
            ? "1.5px solid #1C64B4"
            : "1px solid #EDF2F7",
        bgcolor: selectedOption === customOptionId ? "#F0F7FF" : "#FFFFFF",
        cursor: "pointer",
        transition: "all 0.15s ease",
        "&:hover": {
          borderColor: selectedOption === customOptionId ? "#1C64B4" : "#CBD5E1",
          bgcolor: selectedOption === customOptionId ? "#EBF5FF" : "#F8FAFC",
        },
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Radio
          checked={selectedOption === customOptionId}
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
            fontWeight: selectedOption === customOptionId ? 600 : 500,
            color: "#0F172A",
          }}
        >
          {customOptionLabel}
        </Typography>
      </Stack>

      <Typography
        sx={{
          fontSize: 12.5,
          color: "#64748B",
          fontWeight: 400,
        }}
      >
        {customRangeText}
      </Typography>
    </Box>
  );

  const customDatePickers = showCustomOption && selectedOption === customOptionId && (
    <Stack ref={rangeRowRef} direction="row" spacing={1.5} sx={{ px: 0.5 }}>
      <Box sx={{ flex: 1 }} onClick={() => openCalendar("from")}>
        <BaseInput
          label="From"
          value={customFromDay ? customFromDay.format("DD MMM YYYY") : ""}
          placeholder="DD MMM YYYY"
          sx={{ cursor: "pointer" }}
          slotProps={{
            htmlInput: { readOnly: true, sx: { cursor: "pointer" } },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" tabIndex={-1}>
                    <CalendarTodayRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: `${radius.md}px`,
                "& fieldset": {
                  borderColor:
                    activeField === "from" ? palette.info[400] : palette.slate[200],
                },
              },
            },
          }}
        />
      </Box>

      <Box sx={{ flex: 1 }} onClick={() => openCalendar("to")}>
        <BaseInput
          label="To"
          value={customToDay ? customToDay.format("DD MMM YYYY") : ""}
          placeholder="DD MMM YYYY"
          sx={{ cursor: "pointer" }}
          slotProps={{
            htmlInput: { readOnly: true, sx: { cursor: "pointer" } },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" edge="end" tabIndex={-1}>
                    <CalendarTodayRoundedIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: `${radius.md}px`,
                "& fieldset": {
                  borderColor:
                    activeField === "to" ? palette.info[400] : palette.slate[200],
                },
              },
            },
          }}
        />
      </Box>
    </Stack>
  );

  const customCalendarPopover = showCustomOption && selectedOption === customOptionId && (
    <Popover
      open={Boolean(activeField)}
      anchorEl={rangeRowRef.current}
      onClose={closeCalendar}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 280,
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: `${radius.lg}px`,
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.16)",
            p: 2,
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 1.5 }}
      >
        <IconButton
          size="small"
          onClick={() => setViewMonth((m) => m.subtract(1, "month"))}
        >
          <ChevronLeftRoundedIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontWeight: 700, fontSize: font.size.md }}>
          {viewMonth.format("MMMM YYYY")}
        </Typography>
        <IconButton
          size="small"
          disabled={viewMonth.isSame(dayjs(), "month")}
          onClick={() => setViewMonth((m) => m.add(1, "month"))}
        >
          <ChevronRightRoundedIcon fontSize="small" />
        </IconButton>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 0.5,
          mb: 0.5,
        }}
      >
        {WEEKDAYS.map((d) => (
          <Typography
            key={d}
            variant="caption"
            sx={{ textAlign: "center", color: palette.slate[400], fontWeight: 600 }}
          >
            {d}
          </Typography>
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 0.5 }}>
        {calendarDays.map((day) => {
          const inMonth = day.isSame(viewMonth, "month");
          const isFrom = customFromDay && day.isSame(customFromDay, "day");
          const isTo = customToDay && day.isSame(customToDay, "day");
          const isToday = day.isSame(dayjs(), "day");
          const isFuture = day.isAfter(dayjs(), "day");
          const inRange =
            customFromDay &&
            customToDay &&
            day.isAfter(customFromDay, "day") &&
            day.isBefore(customToDay, "day");
          const selected = Boolean(isFrom || isTo);

          return (
            <Box
              key={day.toISOString()}
              component="button"
              type="button"
              disabled={isFuture}
              onClick={() => pickDay(day)}
              sx={{
                border: !selected && isToday ? `1px solid ${palette.navy[800]}` : 0,
                cursor: isFuture ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                height: 32,
                borderRadius: "50%",
                fontSize: font.size.sm,
                fontWeight: selected || isToday ? 700 : 500,
                bgcolor: selected
                  ? palette.navy[800]
                  : inRange
                    ? palette.info[50]
                    : "transparent",
                color: selected
                  ? palette.white
                  : isFuture
                    ? palette.slate[200]
                    : isToday
                      ? palette.navy[800]
                      : inMonth
                        ? "text.primary"
                        : palette.slate[300],
                "&:hover": {
                  bgcolor: isFuture
                    ? "transparent"
                    : selected
                      ? palette.navy[800]
                      : palette.slate[100],
                },
              }}
            >
              {day.date()}
            </Box>
          );
        })}
      </Box>
    </Popover>
  );

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
            p: `${padding.xxl}px`,
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
            mb: 6,
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
              {title}
            </Typography>
            {subtitle && (
              <Typography sx={{ fontSize: 13, color: "#64748B", mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
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
        <Box sx={{ mb: 2.5, }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: "#0F172A",
              mb: 1.5,
            }}
          >
            {sectionLabel}
          </Typography>

          <Stack spacing={1}>
            {customOptionPosition === "start" && (
              <>
                {customOptionRow}
                {customDatePickers}
              </>
            )}
            {options.map((opt) => {
              const isSelected = selectedOption === opt.id;
              const { from, to } = opt.getDateRange();
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
                    {formatRangeText(from, to)}
                  </Typography>
                </Box>
              );
            })}
            {customOptionPosition === "end" && (
              <>
                {customOptionRow}
                {customDatePickers}
              </>
            )}
          </Stack>
        </Box>

        {customCalendarPopover}

        {/* Footer Buttons */}
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            justifyContent: "flex-end",
            alignItems: "center",
            mt: 5,
            pt: 1,
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
            {cancelLabel}
          </Button>

          <Button
            variant="contained"
            onClick={handleApply}
            startIcon={applyIcon}
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
            {applyLabel}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
