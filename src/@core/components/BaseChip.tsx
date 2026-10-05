"use client";

import Link, { type LinkProps } from "@mui/material/Link";
import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/system";
import { font, padding, palette } from "@/theme/palette";
import { Chip, ChipProps, Stack, Typography } from "@mui/material";

export type BaseChipProps = Omit<ChipProps, "children" | "color"> & {
  children: ReactNode | null;
  color?: string;
  bgColor?: string;
  minWidth?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  border?: string;
};

const baseStyles: SxProps<Theme> = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  verticalAlign: "middle",
  whiteSpace: "nowrap",
  textAlign: "center",
  boxSizing: "border-box",
  fontSize: font.size.xs,
  padding: `${padding.xs}px`,
  "& .MuiChip-label": { padding: 0 },
};

export default function BaseChip({
  bgColor = palette.info[50],
  color,
  minWidth = 110,
  height = 34,
  borderRadius = 2,
  border,
  sx,
  style,
  children,
  ...rest
}: BaseChipProps) {
  const mergedSx: SxProps<Theme> = [
    baseStyles,
    { bgcolor: bgColor, color, borderRadius, border, "&:hover": { bgcolor: bgColor } },
    ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
  ];

  return (
    <Chip {...rest} sx={mergedSx} style={{ minWidth, height, ...style }} label={children} />
  );
}
