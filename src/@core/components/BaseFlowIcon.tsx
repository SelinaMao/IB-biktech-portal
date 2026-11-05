"use client";

import Box, { type BoxProps } from "@mui/material/Box";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";

/** Money direction — `expense` is cash leaving, `income` is cash arriving. */
export type FlowDirection = "expense" | "income";

/**
 * Tone + default glyph per direction. The single place cash-flow red/green and
 * the arrow orientation are decided, so every Expense/Income badge matches.
 */
export const FLOW_TONE: Record<
  FlowDirection,
  { fg: string; bg: string; Icon: LucideIcon }
> = {
  expense: { fg: "#E11D48", bg: "#FEE8E8", Icon: ArrowUpRight },
  income: { fg: "#10B981", bg: "#E6F4EA", Icon: ArrowDownRight },
};

export type BaseFlowIconProps = Omit<BoxProps, "children" | "color"> & {
  direction: FlowDirection;
  /** Circle diameter in px. */
  size?: number;
  /** Glyph size in px. Defaults to half the diameter. */
  iconSize?: number;
  strokeWidth?: number;
  /** Override the direction's glyph color. */
  color?: string;
  /** Override the direction's circle background. */
  bgColor?: string;
  /** Replace the default arrow (e.g. an `<img>` or another lucide icon). */
  icon?: React.ReactNode;
};

/**
 * Circular tinted badge holding a cash-flow arrow — the base every
 * Expense/Income (debit/credit) indicator uses instead of re-declaring the
 * circle, the tint and the arrow at each call site.
 */
export default function BaseFlowIcon({
  direction,
  size = 36,
  iconSize,
  strokeWidth = 2,
  color,
  bgColor,
  icon,
  sx,
  ...rest
}: BaseFlowIconProps) {
  const tone = FLOW_TONE[direction];
  const Icon = tone.Icon;

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
          color: color ?? tone.fg,
          flexShrink: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {icon ?? <Icon size={iconSize ?? size / 2} strokeWidth={strokeWidth} />}
    </Box>
  );
}
