"use client";

import type React from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";

import { palette } from "@/theme/palette";

export type BaseButtonProps = Omit<ButtonProps, "children"> & {
  /** Button label. Kept as a prop (old-project convention) for uniform usage. */
  title: string;
  /** Shows a spinner and disables the button. */
  isLoading?: boolean;
  /** Allows rendering as an anchor (e.g. component="a" href="..."). */
  component?: React.ElementType;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
};

export default function BaseButton({
  title,
  isLoading = false,
  disabled,
  startIcon,
  sx,
  ...rest
}: BaseButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Button
      {...rest}
      disabled={isDisabled}
      startIcon={
        isLoading ? (
          <CircularProgress size={18} color="inherit" />
        ) : (
          startIcon
        )
      }
      sx={{
        padding: "12px 16px 12px 16px",
        backgroundColor: isDisabled ? "#EDEDEC" : "#CC9966",
        color: isDisabled ? "#94A3B8" : "#FFFFFF",
        "&:hover": {
          backgroundColor: isDisabled ? "#EDEDEC" : "#CC9966",
        },
        "&.Mui-disabled": {
          backgroundColor: "#EDEDEC",
          color: "#94A3B8",
        },
        ...sx,
      }}
    >
      {title}
    </Button>
  );
}
