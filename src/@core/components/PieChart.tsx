"use client";

import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";

export type PieDatum = {
  name: string;
  value: number;
  color: string;
};

export const DEFAULT_PIE_COLORS = [
  "#5AC0A0", // Mint Green (top)
  "#F9A825", // Warm Orange (right)
  "#6C4BA0", // Purple (bottom)
  "#3391D0", // Sky Blue (left)
];

type BasePieChartProps = {
  data: PieDatum[];
  size?: number;
  thickness?: number;
  /**
   * Controls spacing between round caps.
   * Defaults to `-thickness` so adjacent round caps share the exact same center point
   * (producing the smooth overlapping pill effect from the reference image).
   */
  gap?: number;
  /** Degrees, 0 = 12 o'clock, clockwise. Default -45 centers the first segment at 12 o'clock. */
  startAngle?: number;
  centerValue?: ReactNode;
  centerLabel?: string;
  centerColor?: string;
};

export default function BasePieChart({
  data,
  size = 78,
  thickness = 11,
  gap,
  startAngle = -45,
  centerValue,
  centerLabel,
  centerColor = "#0F172A",
}: BasePieChartProps) {
  const effectiveGap = gap ?? -thickness;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const activeData = data.filter((d) => d.value > 0);
  const total = activeData.reduce((sum, d) => sum + d.value, 0) || 1;

  const arcs: Array<PieDatum & { dash: number; strokeOffset: number }> = [];
  let currentOffset = 0;
  for (let i = 0; i < activeData.length; i++) {
    const d = activeData[i];
    const portion = (d.value / total) * c;
    const dash = Math.max(portion - thickness - effectiveGap, 0.01);
    arcs.push({
      ...d,
      dash,
      strokeOffset: -(currentOffset + (thickness + effectiveGap) / 2),
    });
    currentOffset += portion;
  }

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        display: "inline-flex",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: `rotate(${startAngle - 90}deg)` }}
      >
        {arcs.map((a, index) => (
          <circle
            key={`${a.name}-${index}`}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`${a.dash} ${c}`}
            strokeDashoffset={a.strokeOffset}
          />
        ))}

        {/* Tucks the first segment's start under the last segment while keeping its clockwise end cap on top */}
        {arcs.length > 1 && effectiveGap < 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={arcs[0].color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={`0.01 ${c}`}
            strokeDashoffset={arcs[0].strokeOffset - arcs[0].dash}
          />
        )}
      </svg>

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          pointerEvents: "none",
          px: `${Math.round(thickness * 0.5)}px`,
        }}
      >
        {centerValue !== undefined && (
          <Typography
            component="span"
            sx={{
              fontSize: Math.round(size * 0.22),
              fontWeight: 600,
              lineHeight: 1.1,
              color: centerColor,
            }}
          >
            {centerValue}
          </Typography>
        )}
        {centerLabel && (
          <Typography
            component="span"
            sx={{
              fontSize: Math.round(size * 0.13),
              fontWeight: 400,
              lineHeight: 1.1,
              color: centerColor,
              mt: "1px",
            }}
          >
            {centerLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
