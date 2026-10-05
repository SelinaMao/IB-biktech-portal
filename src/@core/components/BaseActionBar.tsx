"use client";

import { Children, type ReactNode } from "react";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";

export type BaseActionBarProps = {
  /**
   * Search input + filter controls (e.g. BaseInput, BaseSelect), followed by
   * the primary action (e.g. a BaseButton) as the last child — it's split out
   * and pinned to the trailing edge automatically.
   */
  children: ReactNode;
  sx?: SxProps<Theme>;
};

const FILTERS_MAX_WIDTH = 640;

/**
 * Search + filters + primary action row shared by list pages (Users, Roles, …)
 * so spacing/sizing stays identical everywhere it's used.
 */
export default function BaseActionBar({ children, sx }: BaseActionBarProps) {
  const items = Children.toArray(children);
  const action = items.length > 1 ? items[items.length - 1] : null;
  const filters = action ? items.slice(0, -1) : items;

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={2}
      sx={{
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        mb: 3,
        ...sx,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ flex: 1, width: "100%", maxWidth: FILTERS_MAX_WIDTH }}
      >
        {filters}
      </Stack>
      {action}
    </Stack>
  );
}
