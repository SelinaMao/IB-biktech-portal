"use client";

import Box, { type BoxProps } from "@mui/material/Box";

/** Money direction — `expense` is cash leaving, `income` is cash arriving. */
export type FlowDirection = "expense" | "income";

/**
 * Background tone per direction. The single place cash-flow red/green
 * backgrounds are decided, so every Expense/Income badge matches — the glyph
 * itself comes from the caller, since different sections use different icons.
 */
export const FLOW_TONE: Record<FlowDirection, { bg: string }> = {
  expense: { bg: "#FEE8E8" },
  income: { bg: "#E6F4EA" },
};

export type BaseIconBadgeProps = Omit<BoxProps, "children" | "color"> & {
  direction: FlowDirection;
  /** Circle diameter in px. Defaults to 40. */
  size?: number;
  /** Glyph size in px. Defaults to 27. */
  iconSize?: number;
  /** Override the direction's glyph color. */
  color?: string;
  /** Override the direction's circle background. */
  bgColor?: string;
} & (
    | { iconSrc: string; icon?: never }
    | { iconSrc?: never; icon: React.ReactNode }
  );

export default function BaseIconBadge({
  direction,
  iconSrc,
  size = 40,
  iconSize = 25,
  color,
  bgColor,
  icon,
  sx,
  ...rest
}: BaseIconBadgeProps) {
  const tone = FLOW_TONE[direction];

  return (
    <Box
      aria-hidden={rest["aria-label"] ? undefined : true}
      sx={[
        {
          width: size,
          height: size,
          borderRadius: "50%",
          bgcolor: bgColor ?? tone.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {icon ?? (
        <Box
          component="img"
          src={iconSrc}
          alt=""
          sx={{ width: iconSize, height: iconSize }}
        />
      )}
    </Box>
  );
}
