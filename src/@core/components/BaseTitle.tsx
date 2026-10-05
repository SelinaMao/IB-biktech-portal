"use client";

import Typography, { type TypographyProps } from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/system";

export type BaseTitleProps = TypographyProps & {
  fontSize?: number | string;
  fontWeight?: number | string;
  color?: string;
};

const baseStyles: SxProps<Theme> = {
  fontSize: 24,
  fontWeight: 600,
  color: "text.primary",
};

export default function BaseTitle({
  fontSize,
  fontWeight,
  color,
  sx,
  children,
  ...rest
}: BaseTitleProps) {
  const mergedSx: SxProps<Theme> = [
    baseStyles,
    { ...(fontSize !== undefined && { fontSize }), ...(fontWeight !== undefined && { fontWeight }), ...(color !== undefined && { color }) },
    ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
  ];

  return (
    <Typography {...rest} sx={mergedSx}>
      {children}
    </Typography>
  );
}
