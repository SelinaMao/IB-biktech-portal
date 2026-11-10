"use client";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import type { SxProps, Theme } from "@mui/material/styles";
import { palette } from "@/theme/palette";

export type BaseToggleSwitchProps = {
  checked: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  /** Tooltip text shown on hover/focus. */
  tooltip?: React.ReactNode;
  "aria-label"?: string;
  activeColor?: string;
  inactiveColor?: string;
  sx?: SxProps<Theme>;
};

/** Compact pill switch with a sliding knob — the base every status toggle uses. */
export default function BaseToggleSwitch({
  checked,
  onClick,
  disabled = false,
  tooltip,
  "aria-label": ariaLabel,
  activeColor,
  inactiveColor,
  sx,
}: BaseToggleSwitchProps) {
  const switchEl = (
    <Box
      component="button"
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={checked}
      sx={[
        {
          width: 40,
          height: 22,
          borderRadius: "999px",
          border: 0,
          p: "3px",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.6 : 1,
          bgcolor: checked ? (activeColor ?? palette.navy[800]) : (inactiveColor ?? palette.slate[300]),
          display: "flex",
          justifyContent: checked ? "flex-end" : "flex-start",
          transition: "background-color 150ms ease",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Box sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: palette.white }} />
    </Box>
  );

  if (!tooltip) return switchEl;

  return (
    <Tooltip title={tooltip}>
      {/* span keeps the tooltip working when the switch is disabled */}
      <span>{switchEl}</span>
    </Tooltip>
  );
}
