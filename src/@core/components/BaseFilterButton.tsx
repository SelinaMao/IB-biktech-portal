"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import Button, { type ButtonProps } from "@mui/material/Button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { palette } from "@/theme/palette";

export interface BaseFilterButtonProps
  extends Omit<ButtonProps, "onClick" | "children" | "startIcon" | "endIcon"> {
  /** Highlights the button (blue border/background/text) when a filter is applied. */
  active?: boolean;
  /** Whether the filter dropdown/dialog is open. Toggles chevron up vs down. */
  open?: boolean;
  label?: string;
  /** Optional start icon. Defaults to undefined (no leading icon). */
  icon?: ReactNode;
  /** Optional start icon alias for MUI compatibility. */
  startIcon?: ReactNode;
  /** Optional custom end icon override. Defaults to ChevronUp when open else ChevronDown. */
  endIcon?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Text color while inactive — screens have used both slate[900] and slate[700]. */
  inactiveTextColor?: string;
}

/**
 * Filter trigger button matching portal UI design:
 * Clean rounded border, label (default: "Last 7 days"), and a trailing Chevron
 * that toggles between ChevronDown (closed) and ChevronUp (open/clicked).
 */
export default function BaseFilterButton({
  active = false,
  open: externalOpen,
  label = "Last 7 days",
  icon,
  startIcon: customStartIcon,
  endIcon: customEndIcon,
  onClick,
  inactiveTextColor = palette.slate[700],
  sx,
  ...rest
}: BaseFilterButtonProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (externalOpen === undefined) {
      setInternalOpen((prev) => !prev);
    }
    onClick?.(event);
  };

  const resolvedStartIcon = customStartIcon ?? icon;

  const resolvedEndIcon =
    customEndIcon !== undefined ? (
      customEndIcon
    ) : isOpen ? (
      <ChevronUp size={16} strokeWidth={2} />
    ) : (
      <ChevronDown size={16} strokeWidth={2} />
    );

  return (
    <Button
      variant="outlined"
      onClick={handleClick}
      startIcon={resolvedStartIcon}
      endIcon={resolvedEndIcon}
      sx={{
        height: 38,
        px: 2.5,
        borderRadius: "8px",
        borderColor: active ? "#1C64B4" : palette.slate[200],
        bgcolor: active ? "#F0F7FF" : "#FFFFFF",
        color: active ? "#1C64B4" : inactiveTextColor,
        textTransform: "none",
        fontSize: 13.5,
        fontWeight: 500,
        boxShadow: "none",
        "& .MuiButton-endIcon": {
          ml: 1,
          mr: 0,
          color: active ? "#1C64B4" : inactiveTextColor,
        },
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
