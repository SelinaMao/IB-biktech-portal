"use client";

import React from "react";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import BaseSearchButton from "./BaseSearchButton";
import BaseFilterByDay, { type BaseFilterByDayValue } from "./BaseFilterByDay";

export type { BaseFilterByDayValue };

export interface BaseSearchByDayProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchWidth?: number | string;
  focusBorderColor?: string;
  dateFilter?: BaseFilterByDayValue | null;
  onDateFilterChange?: (filter: BaseFilterByDayValue | null) => void;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
}

/**
 * Composite search and date filter toolbar.
 * Pairs BaseSearchButton (left) with BaseFilterByDay (right) across tables and portals.
 */
export default function BaseSearchByDay({
  search = "",
  onSearchChange,
  searchPlaceholder = "Search",
  searchWidth = 240,
  focusBorderColor,
  dateFilter,
  onDateFilterChange,
  children,
  sx,
}: BaseSearchByDayProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        width: "100%",
        ...sx,
      }}
    >
      <BaseSearchButton
        value={search}
        onChange={onSearchChange ?? (() => {})}
        placeholder={searchPlaceholder}
        width={searchWidth}
        focusBorderColor={focusBorderColor}
      />

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: "center",
          alignSelf: { xs: "flex-end", sm: "center" },
        }}
      >
        <BaseFilterByDay
          value={dateFilter}
          onChange={onDateFilterChange}
          activeVariant="subtle"
          sx={{
            "& button": {
              height: 40,
              py: 0,
              px: 2,
              borderRadius: "10px",
              fontFamily: "inherit",
              fontSize: 13,
              fontWeight: 500,
            },
          }}
        />
        {children}
      </Stack>
    </Stack>
  );
}
