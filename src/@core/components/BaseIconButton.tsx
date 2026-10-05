"use client";

import { palette, radius } from "@/theme/palette";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton, { type IconButtonProps } from "@mui/material/IconButton";
import Tooltip, { type TooltipProps } from "@mui/material/Tooltip";

export type BaseIconButtonProps = Omit<IconButtonProps, "children"> & {
  /** The icon element to render (already sized, e.g. `<EditIcon fontSize="small" />`). */
  icon: React.ReactNode;
  /** Tooltip text. Also used as the default `aria-label`. */
  tooltip?: string;
  tooltipPlacement?: TooltipProps["placement"];
  /** Shows a spinner and disables the button. */
  isLoading?: boolean;
  isBorder?: boolean;
};

/** Spinner size by IconButton size (matches the icon's optical size). */
const SPINNER_SIZE = { small: 16, medium: 20, large: 24 } as const;

/**
 * Icon-only button with a built-in tooltip and loading state — the base every
 * row/action icon uses instead of hand-wiring Tooltip + span + IconButton.
 */
export default function BaseIconButton({
  icon,
  tooltip,
  tooltipPlacement,
  isLoading = false,
  disabled,
  size = "small",
  "aria-label": ariaLabel,
  isBorder = false,
  ...rest
}: BaseIconButtonProps) {
  const button = (
    <IconButton
      size={size}
      disabled={disabled || isLoading}
      aria-label={ariaLabel ?? tooltip}
      sx={{
        borderRadius: "12px",
        border: `1px solid ${palette.slate[200]}`,
        padding: "8px",
        "&:hover": { backgroundColor: palette.primary[100] },
      }}
      {...rest}
    >
      {isLoading ? (
        <CircularProgress size={SPINNER_SIZE[size]} color="inherit" />
      ) : (
        icon
      )}
    </IconButton>
  );

  if (!tooltip) return button;

  return (
    <Tooltip title={tooltip} placement={tooltipPlacement}>
      {/* span keeps the tooltip working when the button is disabled */}
      <span>{button}</span>
    </Tooltip>
  );
}
