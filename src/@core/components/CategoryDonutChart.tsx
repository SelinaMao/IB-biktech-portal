"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import AppRecharts from "@/styles/AppRecharts";
import { palette } from "@/theme/palette";

export type CategoryDonutDatum = {
  name: string;
  value: number;
  color: string;
};

export type CategoryDonutChartProps = {
  data: CategoryDonutDatum[];
  /** Square size (px) of the chart. */
  size?: number;
  /** Ring thickness (px). */
  thickness?: number;
  /** Degrees; 90 starts the first slice at 12 o'clock, sweeping clockwise. */
  startAngle?: number;
  /** Gap between slices, in degrees — recharts handles the geometry, so this stays
   *  consistent regardless of segment size (unlike a pixel-based stroke-dash gap). */
  paddingAngle?: number;
  /** Rounds each slice's cut edges; 0 (flat-cut, the default) is the conventional
   *  look for a multi-category donut — a non-zero value quickly reads as separate
   *  pill shapes rather than one ring once there are only a few slices. */
  cornerRadius?: number;
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  centerColor?: string;
};

/**
 * Multi-category donut — one colored, flat-cut slice per `data` entry, with a
 * centered value/label. Same recharts + AppRecharts setup as MaturityDonutChart,
 * but for N arbitrary categories (e.g. one slice per account) instead of a single
 * elapsed/total progress ring.
 */
export default function CategoryDonutChart({
  data,
  size = 90,
  thickness = 14,
  startAngle = 90,
  paddingAngle = 4,
  cornerRadius,
  centerValue,
  centerLabel,
  centerColor = palette.slate[900],
}: CategoryDonutChartProps) {
  const outerRadius = size / 2;
  const innerRadius = outerRadius - thickness;
  const endAngle = startAngle - 360;

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <AppRecharts>
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              startAngle={startAngle}
              endAngle={endAngle}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={paddingAngle}
              cornerRadius={cornerRadius ?? 0}
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((d, index) => (
                <Cell key={`${d.name}-${index}`} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </AppRecharts>

      {(centerValue !== undefined || centerLabel !== undefined) && (
        <Stack
          sx={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: `${Math.round(thickness * 0.5)}px`,
            pointerEvents: "none",
          }}
        >
          {centerValue !== undefined && (
            <Typography
              component="span"
              sx={{ fontSize: Math.round(size * 0.22), fontWeight: 600, lineHeight: 1.1, color: centerColor }}
            >
              {centerValue}
            </Typography>
          )}
          {centerLabel !== undefined && (
            <Typography
              component="span"
              sx={{ fontSize: Math.round(size * 0.12), color: palette.slate[500], lineHeight: 1.2 }}
            >
              {centerLabel}
            </Typography>
          )}
        </Stack>
      )}
    </Box>
  );
}
