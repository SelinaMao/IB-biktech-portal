"use client";

import type { ReactNode } from "react";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";

export type BaseListSectionProps = {
  /** Typically a BaseActionBar followed by the list's table. */
  children: ReactNode;
  sx?: SxProps<Theme>;
};

const GAP = 6;

/**
 * Vertical gap between a list page's toolbar and its table — one place to
 * tune spacing so every list page (Users, Roles, …) stays in sync.
 */
export default function BaseListSection({ children, sx }: BaseListSectionProps) {
  return (
    <Stack gap={GAP} sx={sx}>
      {children}
    </Stack>
  );
}
