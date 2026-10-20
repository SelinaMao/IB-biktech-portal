"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
} from "@mui/material";
import BaseCard from "@core/components/BaseCard";
import BaseSwitch from "@core/form/BaseSwitch";

import { cashFlow } from "../dashboard.data";
import { palette } from "@/theme/palette";

const W = 560;
const H = 200;
const PAD = 8;

const formatAmount = (amount: number, ccy: string) => {
  const sign = amount >= 0 ? "+" : "-";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted} ${ccy}`;
};

const formatCompactNumber = (v: number) =>
  v === 0
    ? "0K"
    : Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);

/** Build a smooth-ish polyline path from a numeric series scaled to the viewBox. */
function toPath(series: number[], max: number) {
  const stepX = (W - PAD * 2) / (series.length - 1);
  const pts = series.map((v, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - (v / max) * (H - PAD * 2);
    return [x, y] as const;
  });
  const line = pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${pts[0][0].toFixed(1)},${H - PAD} Z`;
  return { line, area };
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
      <Box
        sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: color }}
      />
      <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{label}</Typography>
    </Stack>
  );
}

export default function CashFlowCard() {
  const [ccy, setCcy] = useState<"USD" | "KHR">("USD");
  const max = Math.max(...cashFlow.cashIn, ...cashFlow.cashOut) * 1.1;
  const inPath = toPath(cashFlow.cashIn, max);
  const outPath = toPath(cashFlow.cashOut, max);
  const gridYs = [0, 0.25, 0.5, 0.75, 1];
  const currencies = ["USD", "KHR"];
  return (
    <BaseCard sx={{ p: 3, height: "100%" }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "flex-start",
          justifyContent: "space-between",
          mb: 0.5,
        }}
      >
        <Box>
          <Typography variant="h4">Cash Flow</Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            Last 30 days · Jun 2026
          </Typography>
        </Box>
        <BaseSwitch
          value={ccy}
          onChange={(v) => setCcy(v)}
         options={currencies.map((ccy) => ({ value: ccy, label: ccy }))}
        />
      </Stack>

      <Stack direction="row" spacing={2.5} sx={{ mt: 2, mb: 1 }}>
        <Legend color={palette.primary[600]} label="Cash-In" />
        <Legend color={palette.danger.main} label="Cash-Out" />
      </Stack>

      {/* Chart */}
      <Stack direction="row" sx={{ alignItems: "stretch" }}>
        <Stack
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-end",
            pr: 1,
            height: H,
          }}
        >
          {[...gridYs].reverse().map((g) => (
            <Typography
              key={g}
              variant="caption"
              sx={{ color: palette.slate[400], lineHeight: 1 }}
            >
              {formatCompactNumber(g * max)}
            </Typography>
          ))}
        </Stack>

        <Box sx={{ position: "relative", width: "100%" }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            width="100%"
            height={H}
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="cfIn" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={palette.primary[600]}
                  stopOpacity="0.18"
                />
                <stop
                  offset="100%"
                  stopColor={palette.primary[600]}
                  stopOpacity="0"
                />
              </linearGradient>
              <linearGradient id="cfOut" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={palette.danger.main}
                  stopOpacity="0.14"
                />
                <stop
                  offset="100%"
                  stopColor={palette.danger.main}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>
            {gridYs.map((g) => (
              <line
                key={g}
                x1={PAD}
                x2={W - PAD}
                y1={H - PAD - g * (H - PAD * 2)}
                y2={H - PAD - g * (H - PAD * 2)}
                stroke={palette.slate[200]}
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}
            <path d={inPath.area} fill="url(#cfIn)" />
            <path d={outPath.area} fill="url(#cfOut)" />
            <path
              d={outPath.line}
              fill="none"
              stroke={palette.danger.main}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={inPath.line}
              fill="none"
              stroke={palette.primary[600]}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", mt: 0.5 }}
          >
            {cashFlow.labels
              .filter((l) => l)
              .map((l) => (
                <Typography key={l} variant="caption">
                  {l}
                </Typography>
              ))}
          </Stack>
        </Box>
      </Stack>

      {/* Averages */}
      <Stack
        direction="row"
        sx={{ mt: 2, borderTop: `1px solid ${palette.slate[100]}`, pt: 2 }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2">Average income</Typography>
          <Typography variant="h4" sx={{ color: "text.primary" }}>
            {cashFlow.avgIncome ?? " "}{" "}
            <Typography component="span" variant="body2">
              {ccy === "KHR" ? "៛" : ccy}
            </Typography>
          </Typography>
        </Box>
        <Box
          sx={{ flex: 1, borderLeft: `1px solid ${palette.slate[100]}`, pl: 2 }}
        >
          <Typography variant="body2">Average spending</Typography>
          <Typography variant="h4" sx={{ color: palette.danger.main }}>
            {cashFlow.avgSpending}{" "}
            <Typography
              component="span"
              variant="body2"
              sx={{ color: palette.danger.main }}
            >
              {ccy === "KHR" ? "៛" : ccy}
            </Typography>
          </Typography>
        </Box>
      </Stack>
    </BaseCard>
  );
}
