"use client";

import Box, { type BoxProps } from "@mui/material/Box";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoneyReceiveCircleIcon,
  MoneySendCircleIcon,
} from "@hugeicons/core-free-icons";
import type { ComponentProps } from "react";

/** Money direction — `expense` is cash leaving, `income` is cash arriving. */
export type FlowDirection = "expense" | "income";

type HugeIcon = ComponentProps<typeof HugeiconsIcon>["icon"];

/**
 * Tone + default glyph per direction. The single place cash-flow red/green and
 * the arrow orientation are decided, so every Expense/Income badge matches.
 */
export const FLOW_TONE: Record<
  FlowDirection,
  { fg: string; bg: string; icon: HugeIcon }
> = {
  expense: { fg: "#E11D48", bg: "#FEE8E8", icon: MoneySendCircleIcon },
  income: { fg: "#10B981", bg: "#E6F4EA", icon: MoneyReceiveCircleIcon },
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
  /** Replace the default glyph (e.g. an `<img>` or another icon). */
  icon?: React.ReactNode;
};

export default function BaseFlowIcon({
  direction,
  size = 36,
  iconSize,
  strokeWidth = 1.5,
  color,
  bgColor,
  icon,
  sx,
  ...rest
}: BaseFlowIconProps) {
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
          color: color ?? tone.fg,
          flexShrink: 0,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {icon ?? (
        <HugeiconsIcon
          icon={tone.icon}
          size={iconSize ?? size / 2}
          strokeWidth={strokeWidth}
        />
      )}
    </Box>
  );
}