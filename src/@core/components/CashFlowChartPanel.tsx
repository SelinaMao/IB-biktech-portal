"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AppRecharts from "@/styles/AppRecharts";
import { formatCCY } from "@/utils/format-ccy";
import { font, palette, radius } from "@/theme/palette";

/** One point on the cash-flow timeline. */
export type CashFlowPoint = {
  /** Label on the X axis, e.g. "Jul 12" or "2026-07". */
  date: string;
  inflow: number;
  outflow: number;
};

/**
 * Series styling per the approved design (Group 37571): navy for inflow
 * (design #2A367E = palette.navy[800]), red for outflow (#DC2626 ≈
 * palette.danger[600]). Gradient fades 25% → 0.
 */
export const CASH_FLOW_SERIES = [
  { key: "inflow", color: palette.navy[800] },
  { key: "outflow", color: palette.danger[600] },
] as const;

/** Light panel background from the design (#F8FAFF ≈ slate.50). */
export const CASH_FLOW_PANEL_BG = palette.slate[50];
export const CASH_FLOW_PANEL_RADIUS = 14;

const formatCompactNumber = (v: number) =>
  v === 0
    ? "0K"
    : Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

/** 5 evenly-spaced "nice" y-axis ticks (0, step, 2*step, 3*step, 4*step) sized to the data. */
function getNiceAxisTicks(max: number) {
  if (max <= 0) return [0, 1, 2, 3, 4];
  const rawStep = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const residual = rawStep / magnitude;
  const niceResidual = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  const step = niceResidual * magnitude;
  return [0, step, step * 2, step * 3, step * 4];
}

/**
 * Left-aligns Y-axis tick labels to x=0 so they sit flush with the legend's
 * left edge instead of recharts' default right-anchored position against
 * the axis line.
 */
function CashFlowYAxisTick({ y, payload }: { y?: number; payload?: { value: number } }) {
  if (y == null || payload == null) return null;
  return (
    <text x={0} y={y} dy={4} textAnchor="start" className="recharts-text">
      {formatCompactNumber(payload.value)}
    </text>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
  labels,
  hideAmount = false,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number }>;
  label?: string;
  currency: string;
  labels: Record<"inflow" | "outflow", string>;
  hideAmount?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: `1px solid ${palette.slate[200]}`,
        borderRadius: `${radius.md}px`,
        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.08)",
        px: 1.5,
        py: 1,
      }}
    >
      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      {payload.map((entry) => {
        const series = CASH_FLOW_SERIES.find((s) => s.key === entry.dataKey);
        return (
          <Stack
            key={entry.dataKey}
            direction="row"
            sx={{ alignItems: "center", gap: 0.75, mt: 0.25 }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: series?.color,
              }}
            />
            <Typography variant="body2">
              {labels[entry.dataKey as "inflow" | "outflow"]}:{" "}
              {hideAmount ? "***" : formatCCY(entry.value, currency)}
            </Typography>
          </Stack>
        );
      })}
    </Box>
  );
}

export type CashFlowChartPanelProps = {
  data: CashFlowPoint[];
  currency: string;
  inflowLabel?: string;
  outflowLabel?: string;
  height?: number;
  isLoading?: boolean;
  /** Hide or mask amounts in the tooltip */
  hideAmount?: boolean;
  /** Optional content shown on the same line as the Cash-In / Cash-Out legend, before it. */
  legendStartAdornment?: React.ReactNode;
};

/**
 * Standalone gradient area chart panel (legend + chart, in its own light
 * card background). Extracted from CashFlowChart so it can be dropped into
 * any page/layout on its own, e.g. where the Average Income / Average
 * Spending stat cards shouldn't be shown.
 */
export default function CashFlowChartPanel({
  data,
  currency,
  inflowLabel = "Average Income",
  outflowLabel = "Average Spending",
  height = 250,
  isLoading = false,
  hideAmount = false,
  legendStartAdornment,
}: CashFlowChartPanelProps) {
  const labels = { inflow: inflowLabel, outflow: outflowLabel } as const;

  const yTicks = useMemo(() => {
    const max = Math.max(0, ...data.flatMap((d) => [d.inflow, d.outflow]));
    return getNiceAxisTicks(max);
  }, [data]);

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        bgcolor: CASH_FLOW_PANEL_BG,
        borderRadius: `${CASH_FLOW_PANEL_RADIUS}px`,
        p: 0
      }}
    >
      {isLoading ? (
        <Skeleton variant="rounded" height={height} />
      ) : (
        <>
          {/* Legend */}
          <Stack direction="row" sx={{ alignItems: "center", gap: 5, p: 4 }}>
            {legendStartAdornment}
            {CASH_FLOW_SERIES.map((s) => (
              <Stack key={s.key} direction="row" sx={{ alignItems: "center", gap: 1 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: s.color,
                  }}
                />
                <Typography variant="body2" sx={{ fontSize: font.size.base, color: "text.primary" }}>
                  {s.key === "inflow" ? "Cash-In" : "Cash-Out"}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* Chart */}
          <AppRecharts sx={{ mx: 4, my: 2 }}>
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  {CASH_FLOW_SERIES.map((s) => (
                    <linearGradient key={s.key} id={`cashflow-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>

                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke={palette.slate[300]} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={50}
                  domain={[0, yTicks[yTicks.length - 1]]}
                  ticks={yTicks}
                  interval={0}
                  tick={<CashFlowYAxisTick />}
                />
                <Tooltip
                  content={<ChartTooltip currency={currency} labels={labels} hideAmount={hideAmount} />}
                  cursor={{ stroke: palette.slate[300] }}
                />
                {CASH_FLOW_SERIES.map((s) => (
                  <Area
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    fill={`url(#cashflow-${s.key})`}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </AppRecharts>
        </>
      )}
    </Box>
  );
}
