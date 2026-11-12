"use client";

import type { ReactNode } from "react";
import Popover from "@mui/material/Popover";
import dayjs, { type Dayjs } from "dayjs";

import { radius } from "@/theme/palette";

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

export interface BaseFilterProps {
  /** Element the panel is anchored to. Panel is closed when null. */
  anchorEl: HTMLElement | null;
  onClose: () => void;
  /** Popover paper width. */
  width?: number;
  /** The filter UI itself — fully owned by the caller (e.g.
   *  `BaseFilterTypeContent`, or a screen-specific period list), so each
   *  screen can show whatever filter options it needs without this shell
   *  knowing about them. */
  children: ReactNode;
}

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

/**
 * Popup shell — anchors a Popover to `anchorEl` and renders whatever content
 * the caller passes in as `children`. Carries no filter logic of its own;
 * pair it with a content component (e.g. `BaseFilterTypeContent`) that owns
 * the actual options, selection state, and apply/close behavior.
 */
export default function BaseFilter({
  anchorEl,
  onClose,
  width = 420,
  children,
}: BaseFilterProps) {
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
            width,
            maxHeight: "calc(100vh - 32px)",
            overflowY: "auto",
            borderRadius: `${radius.xl}px`,
            boxShadow: "0 12px 32px rgba(15, 23, 42, 0.16)",
          },
        },
      }}
    >
      {children}
    </Popover>
  );
}
