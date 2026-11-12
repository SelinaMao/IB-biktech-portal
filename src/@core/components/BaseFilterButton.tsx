"use client";

import type { MouseEvent, ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import { SlidersHorizontal } from "lucide-react";
import { palette } from "@/theme/palette";

export interface BaseFilterButtonProps
  extends Omit<ButtonProps, "onClick" | "children" | "startIcon"> {
  /** Highlights the button (blue border/background/text) when a filter is applied. */
  active?: boolean;
  label?: string;
  icon?: ReactNode;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Text color while inactive — screens have used both slate[900] and slate[700]. */
  inactiveTextColor?: string;
}

/**
 * "Filters" trigger button — opens whatever filter UI the parent wires up
 * (a `BaseFilter` popover, a `BaseFilterDialog` modal, etc). Carries only the
 * active/inactive styling; the parent owns what "active" means and what
 * clicking it opens.
 */
export default function BaseFilterButton({
  active = false,
  label = "Filters",
  icon = <SlidersHorizontal size={15} />,
  onClick,
  inactiveTextColor = palette.slate[900],
  sx,
  ...rest
}: BaseFilterButtonProps) {
  return (
    <Button
      variant="outlined"
      onClick={onClick}
      startIcon={icon}
      sx={{
        height: 38,
        px: 4,
        borderRadius: "8px",
        borderColor: active ? "#1C64B4" : palette.slate[200],
        bgcolor: active ? "#F0F7FF" : "#FFFFFF",
        color: active ? "#1C64B4" : inactiveTextColor,
        textTransform: "none",
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "none",
        "&:hover": {
          borderColor: active ? "#1C64B4" : palette.slate[300],
          bgcolor: active ? "#E5F0FD" : palette.slate[50],
        },
        ...sx,
      }}
      {...rest}
    >
      {label}
    </Button>
  );
}
