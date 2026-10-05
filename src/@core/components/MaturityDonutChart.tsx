"use client";

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import AppRecharts from "@/styles/AppRecharts";
import { palette } from "@/theme/palette";

export type MaturityDonutChartProps = {
  /** Days elapsed since the effective/placement date. */
  totalMaturityDays: number;
  /** Total tenor in days — the ring's 100%. */
  totalDays: number;
  /** Caption under the "elapsed/total" figure. */
  caption?: string;
  /** Square size (px) of the chart. */
  size?: number;
  /** Ring thickness (px). */
  thickness?: number;
  progressColor?: string;
  trackColor?: string;
};

/**
 * Circular "N/Total days" progress ring used to visualize tenor progress
 * (e.g. Fixed Deposit days-to-maturity, Loan repayment tenor). Generic on
 * purpose so any feature with an elapsed/total-days tenor can reuse it.
 */
export default function MaturityDonutChart({
  totalMaturityDays,
  totalDays,
  caption = "Days to\nmaturity",
  size = 150,
  thickness = 25,
  progressColor = palette.primary.main,
  trackColor = palette.slate[200],
}: MaturityDonutChartProps) {

  const data = [
    { name: "elapsed", value: totalMaturityDays },
    { name: "remaining", value: totalDays },
  ];
  const trackData = [{ name: "track", value: 1 }];
  const outerRadius = size / 2;
  const innerRadius = outerRadius - thickness;

  const [showLabel, setShowLabel] = useState(false);

  useEffect(() => {
    setShowLabel(false);
  }, [totalMaturityDays, totalDays]);

  return (
    <Box sx={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <AppRecharts>
        <ResponsiveContainer width="100%" height={size}>
          <PieChart>
            {/* Static full ring shown immediately, before the real data animates in. */}
            <Pie
              data={trackData}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              stroke="none"
              isAnimationActive={false}
            >
              <Cell fill={trackColor} />
            </Pie>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              stroke="none"
              isAnimationActive
              animationDuration={600}
              animationEasing="ease-out"
              onAnimationEnd={() => setShowLabel(true)}
            >
              <Cell fill={progressColor} />
              <Cell fill="transparent" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </AppRecharts>

      {showLabel && (
        <Stack
          sx={{
            position: "absolute",
            inset: 0,
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            px: 1.5,
            animation: "maturityDonutLabelFadeIn 300ms ease-out",
            "@keyframes maturityDonutLabelFadeIn": {
              from: { opacity: 0 },
              to: { opacity: 1 },
            },
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 600, color: palette.primary.main, lineHeight: 1.2 }}>
            {totalMaturityDays}
            /
            <Typography component="span" sx={{ fontSize: 16, fontWeight: 600, color: palette.danger[400] }}>
              {totalDays}
            </Typography>
          </Typography>
          <Typography sx={{ fontSize: 12, color: "text.secondary", mt: 0.25, lineHeight: 1.3, whiteSpace: "pre-line" }}>
            {caption}
          </Typography>
        </Stack>
      )}
    </Box>
  );
}
