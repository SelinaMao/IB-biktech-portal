"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import dayjs, { type Dayjs } from "dayjs";

import { font, palette, radius } from "@/theme/palette";
import BaseButton from "./BaseButton";
import BaseInput from "@core/form/BaseInput";

export type BaseFilterType =
  | "all"
  | "last7Days"
  | "last30Days"
  | "thisMonth"
  | "last1Month"
  | "last2Months"
  | "last3Months"
  | "last6Months"
  | "customDate";

export type BaseFilterTypeOption = { value: BaseFilterType; label: string };

export type BaseFilterValue = {
  type: BaseFilterType;
  /** "YYYY-MM-DD", null when not (yet) picked. */
  from: string | null;
  to: string | null;
};

export type BaseFilterProps = {
  /** Element the panel is anchored to. Panel is closed when null. */
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onApply: (value: BaseFilterValue) => void;
  /** Preselects a type / range when the panel opens. */
  defaultValue?: Partial<BaseFilterValue>;
  typeOptions?: BaseFilterTypeOption[];
};

const DEFAULT_TYPE_OPTIONS: BaseFilterTypeOption[] = [
  { value: "all", label: "All" },
  { value: "thisMonth", label: "This Month" },
  { value: "last1Month", label: "Last 1 month" },
  { value: "last2Months", label: "Last 2 months" },
  { value: "last3Months", label: "Last 3 months" },
  { value: "last6Months", label: "Last 6 months" },
  { value: "customDate", label: "Custom Date" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/** Display label for each filter type — for callers that need to show the
 *  current selection outside the panel (e.g. on its trigger button). */
export const BASE_FILTER_TYPE_LABELS: Record<BaseFilterType, string> = {
  all: "All",
  last7Days: "Last 7 days",
  last30Days: "Last 30 days",
  thisMonth: "This Month",
  last1Month: "Last 1 month",
  last2Months: "Last 2 months",
  last3Months: "Last 3 months",
  last6Months: "Last 6 months",
  customDate: "Custom Date",
};

/** Turns a `BaseFilterValue` into a concrete `[start, end]` range — for
 *  callers that need to translate the picked filter into request params
 *  (e.g. an API's startedDate/endedDate). "all" (the default, nothing picked
 *  yet) has no bounds, so it returns `null` — send no dates at all. */
export function resolveBaseFilterRange(
  value: BaseFilterValue
): { start: Dayjs; end: Dayjs } | null {
  const now = dayjs();

  switch (value.type) {
    // Rolling day windows, inclusive of today — "last 7 days" is today plus
    // the 6 before it, not the 7 days preceding today.
    case "last7Days":
      return {
        start: now.subtract(6, "day").startOf("day"),
        end: now.endOf("day"),
      };

    case "last30Days":
      return {
        start: now.subtract(29, "day").startOf("day"),
        end: now.endOf("day"),
      };

    case "thisMonth":
      return {
        start: now.startOf("month"),
        end: now.endOf("month"),
      };

    case "last1Month":
      return {
        start: now.subtract(1, "month").startOf("month"),
        end: now.subtract(1, "month").endOf("month"),
      };

    case "last2Months":
      return {
        start: now.subtract(2, "month").startOf("month"),
        end: now.subtract(2, "month").endOf("month"),
      };

    case "last3Months":
      return {
        start: now.subtract(3, "month").startOf("month"),
        end: now.subtract(3, "month").endOf("month"),
      };

    case "last6Months":
      return {
        start: now.subtract(6, "month").startOf("month"),
        end: now.subtract(6, "month").endOf("month"),
      };

    case "customDate":
      return {
        start: value.from ? dayjs(value.from) : now.subtract(90, "day"),
        end: value.to ? dayjs(value.to) : now.endOf("month"),
      };

    case "all":
    default:
      return null;
  }
}


type ActiveField = "from" | "to" | null;

function buildCalendarDays(month: Dayjs) {
  const startOfMonth = month.startOf("month");
  const gridStart = startOfMonth.subtract(startOfMonth.day(), "day");
  return Array.from({ length: 42 }, (_, i) => gridStart.add(i, "day"));
}

/**
 * "Filter" dropdown panel anchored to its trigger (not a centered modal).
 * Only the "Custom Date" type reveals the From/To range with an inline
 * calendar underneath — inline (not a nested popover) so it can't get
 * clamped/shifted by MUI when the panel sits low in a short viewport.
 * First calendar click sets From and keeps the calendar open on To; the
 * second click sets To and closes it.
 */
export default function BaseFilter({
  anchorEl,
  onClose,
  onApply,
  defaultValue,
  typeOptions = DEFAULT_TYPE_OPTIONS,
}: BaseFilterProps) {
  const [type, setType] = useState<BaseFilterType>(defaultValue?.type ?? "all");
  const [from, setFrom] = useState<Dayjs | null>(
    defaultValue?.from ? dayjs(defaultValue.from) : null,
  );
  const [to, setTo] = useState<Dayjs | null>(
    defaultValue?.to ? dayjs(defaultValue.to) : null,
  );
  const [viewMonth, setViewMonth] = useState<Dayjs>(() =>
    dayjs().startOf("month"),
  );
  const [activeField, setActiveField] = useState<ActiveField>(null);
  // The calendar is a popover anchored to the From/To row as a whole (not
  // pushed inline below it, and not pinned to a single field) — it floats
  // centered under both fields and follows whichever one is active via the
  // `activeField` border highlight, matching a floating range picker.
  const rangeRowRef = useRef<HTMLDivElement>(null);

  const calendarDays = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  const openCalendar = (field: Exclude<ActiveField, null>) => {
    setViewMonth((field === "from" ? from : to) ?? dayjs().startOf("month"));
    setActiveField(field);
  };

  const closeCalendar = () => setActiveField(null);

  const selectType = (value: BaseFilterType) => {
    setType(value);
    setFrom(null);
    setTo(null);
    closeCalendar();
  };

  // "Custom Date" is the only type with a range — jump straight into picking From.
  useEffect(() => {
    if (type === "customDate") {
      setViewMonth(dayjs().startOf("month"));
      setActiveField("from");
    }
  }, [type]);

  const pickDay = (day: Dayjs) => {
    if (activeField === "to" && from && day.isBefore(from, "day")) {
      setFrom(day);
      setTo(null);
      return;
    }
    if (!from || activeField === "from") {
      setFrom(day);
      setTo(null);
      setActiveField("to");
      return;
    }
    setTo(day);
    closeCalendar();
  };

  const handleApply = () => {
    onApply({
      type,
      from: from ? from.format("YYYY-MM-DD") : null,
      to: to ? to.format("YYYY-MM-DD") : null,
    });
  };

  const showRange = type === "customDate";

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            mt: 1,
            width: 420,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            borderRadius: `${radius.xl}px`,
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.16)",
          },
        },
      }}
    >
      <Box sx={{ p: 4 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: font.size.xl }}>
            Filter
          </Typography>
          <IconButton size="small" onClick={onClose} aria-label="Close filter">
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography
          variant="body2"
          sx={{ color: palette.slate[400], fontWeight: 600, mb: 2 }}
        >
          Select Type
        </Typography>

        <Stack
          direction="row"
          flexWrap="wrap"
          sx={{ gap: 3, mb: showRange ? 3 : 0 }}
        >
          {typeOptions.map((opt) => {
            const active = opt.value === type;
            return (
              <Box
                key={opt.value}
                component="button"
                type="button"
                onClick={() => selectType(opt.value)}
                sx={{
                  cursor: "pointer",
                  border: `1px solid ${active ? palette.navy[800] : palette.slate[200]}`,
                  borderRadius: "8px",
                  bgcolor: active ? palette.navy[800] : palette.white,
                  color: active ? palette.white : "text.primary",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: font.size.sm,
                  px: 2.5,
                  py: 1.25,
                  transition: "all 150ms ease",
                  "&:hover": { borderColor: palette.navy[800] },
                }}
              >
                {opt.label}
              </Box>
            );
          })}
        </Stack>

        {showRange && (
          <Stack ref={rangeRowRef} direction="row" spacing={2}>
            <Box sx={{ flex: 1 }} onClick={() => openCalendar("from")}>
              <BaseInput
                label="From"
                value={from ? from.format("DD MMM YYYY") : ""}
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
                          activeField === "from"
                            ? palette.info[400]
                            : palette.slate[200],
                      },
                    },
                  },
                }}
              />
            </Box>

            <Box sx={{ flex: 1 }} onClick={() => openCalendar("to")}>
              <BaseInput
                label="To"
                value={to ? to.format("DD MMM YYYY") : ""}
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
                          activeField === "to"
                            ? palette.info[400]
                            : palette.slate[200],
                      },
                    },
                  },
                }}
              />
            </Box>
          </Stack>
        )}

        {showRange && (
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
                  sx={{
                    textAlign: "center",
                    color: palette.slate[400],
                    fontWeight: 600,
                  }}
                >
                  {d}
                </Typography>
              ))}
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 0.5,
              }}
            >
              {calendarDays.map((day) => {
                const inMonth = day.isSame(viewMonth, "month");
                const isFrom = from && day.isSame(from, "day");
                const isTo = to && day.isSame(to, "day");
                const isToday = day.isSame(dayjs(), "day");
                const isFuture = day.isAfter(dayjs(), "day");
                const inRange =
                  from &&
                  to &&
                  day.isAfter(from, "day") &&
                  day.isBefore(to, "day");
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
        )}

        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: showRange ? 3 : 5 }}>
          <BaseButton
            title="Apply Now"
            onClick={handleApply}
            sx={{ borderRadius: `${radius.md}px` }}
          />
        </Box>
      </Box>
    </Popover>
  );
}
