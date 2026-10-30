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
  { key: "inflow", color: "#10B981" },
  { key: "outflow", color: "#BE123C" },
] as const;

export const CASH_FLOW_PANEL_BG = palette.slate[50];
export const CASH_FLOW_PANEL_RADIUS = 14;

const formatCompactNumber = (v: number) => {
  if (v === 0) return "0K";
  return `${Math.round(v / 1000)}K`;
};

/** 5 evenly-spaced y-axis ticks (0, 1000, 2000, 3000, 4000) */
function getNiceAxisTicks(max: number) {
  if (max <= 0) return [0, 1000, 2000, 3000, 4000];
  const step = Math.ceil(max / 4000) * 1000;
  return [0, step, step * 2, step * 3, step * 4];
}

function CashFlowYAxisTick({ y, payload }: { y?: number; payload?: { value: number } }) {
  if (y == null || payload == null) return null;
  return (
    <text
      x={0}
      y={y}
      dy={4}
      textAnchor="start"
      fill={palette.slate[20]}
      fontSize={12}
      fontWeight={600}
    >
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
  hideAmount?: boolean;
  legendStartAdornment?: React.ReactNode;
  showLegend?: boolean;
};

export default function CashFlowChartPanel({
  data,
  currency,
  inflowLabel = "Income",
  outflowLabel = "Expense",
  height = 200,
  isLoading = false,
  hideAmount = false,
  legendStartAdornment,
  showLegend = false,
}: CashFlowChartPanelProps) {
  const labels = { inflow: inflowLabel, outflow: outflowLabel } as const;

  const yTicks = useMemo(() => {
    const max = Math.max(0, ...data.flatMap((d) => [d.inflow, d.outflow]));
    return getNiceAxisTicks(max || 3500);
  }, [data]);

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        bgcolor: "transparent",
        p: 0,
      }}
    >
      {isLoading ? (
        <Skeleton variant="rounded" height={height} />
      ) : (
        <>
          {/* Legend */}
          {(showLegend || legendStartAdornment) && (
            <Stack direction="row" sx={{ alignItems: "center", gap: 3, px: 0.5, mb: 2.5 }}>
              {legendStartAdornment}
              {CASH_FLOW_SERIES.map((s) => (
                <Stack key={s.key} direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      bgcolor: s.color,
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: palette.slate[900],
                    }}
                  >
                    {s.key === "inflow" ? "Income" : "Expense"}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}

          {/* Chart */}
          <AppRecharts sx={{ mx: 0, my: 0 }}>
            <ResponsiveContainer width="100%" height={height}>
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -10 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={palette.slate[200]} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={14}
                  tick={{ fill: palette.slate[20], fontSize: 12, fontWeight: 500 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={35}
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
                    type="natural"
                    dataKey={s.key}
                    stroke={s.color}
                    strokeWidth={2}
                    fill="none"
                    dot={false}
                    isAnimationActive={false}
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
