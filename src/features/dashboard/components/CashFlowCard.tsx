"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Stack,
} from "@mui/material";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import BaseCard from "@core/components/BaseCard";

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

/** Build a smooth cubic bezier path from a numeric series scaled to the viewBox. */
function toSmoothPath(series: number[], max: number) {
  const stepX = (W - PAD * 2) / (series.length - 1);
  const pts = series.map((v, i) => {
    const x = PAD + i * stepX;
    const y = H - PAD - (v / max) * (H - PAD * 2);
    return [x, y] as const;
  });

  if (pts.length === 0) return { line: "", area: "" };
  let line = `M ${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;

  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i === 0 ? i : i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2 < pts.length ? i + 2 : i + 1];

    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    line += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }

  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - PAD} L${pts[0][0].toFixed(1)},${H - PAD} Z`;
  return { line, area };
}

/** Build a linear polyline path from a numeric series scaled to the viewBox. */
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

function renderAmount(val: string, color: string) {
  const dotIndex = val.lastIndexOf(".");
  if (dotIndex !== -1) {
    const main = val.slice(0, dotIndex);
    const decimals = val.slice(dotIndex);
    return (
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "flex-start", color }}
      >
        <Typography
          component="span"
          sx={{ fontSize: 20, fontWeight: 600, color: "inherit", lineHeight: 1 }}
        >
          {main}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontSize: 12,
            fontWeight: 600,
            color: "inherit",
            lineHeight: 1,
            ml: 0.2,
            mt: "-2px",
          }}
        >
          {decimals}
        </Typography>
      </Box>
    );
  }
  return (
    <Typography component="span" sx={{ fontSize: 20, fontWeight: 600, color, lineHeight: 1 }}>
      {val}
    </Typography>
  );
}

export default function CashFlowCard() {
  const [ccy, setCcy] = useState<"USD" | "KHR">("USD");
  const max = Math.max(...cashFlow.cashIn, ...cashFlow.cashOut) * 1.1;
  const inPath = toSmoothPath(cashFlow.cashIn, max);
  const outPath = toSmoothPath(cashFlow.cashOut, max);
  const gridYs = [0, 0.25, 0.5, 0.75, 1];
  const currencies: ("USD" | "KHR")[] = ["USD", "KHR"];

  const displayExpense =
    ccy === "USD" ? "-$23,000.90" : "-93,000,000.00 KHR";
  const displayIncome =
    ccy === "USD" ? "$3,000.90" : "12,293,000.00 KHR";

  return (
    <BaseCard
      sx={{
        p: { xs: 2.5, sm: "20px 24px" },
        borderRadius: "20px",
        border: `1px solid ${palette.slate[200]}`,
        bgcolor: "#FFFFFF",
        width: "100%",
      }}
    >
      {/* Header: Title on left, Segmented Currency Pill on right */}
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2.5,
        }}
      >
        <Typography
          sx={{
            color: palette.slate[900],
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Cash Flow
        </Typography>

        {/* Currency Pill Toggle: triggers setCcy */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            bgcolor: "#EDF0F4",
            borderRadius: "999px",
            p: "3px",
          }}
        >
          {currencies.map((item) => {
            const isActive = ccy === item;
            return (
              <Box
                key={item}
                component="button"
                type="button"
                onClick={() => setCcy(item)}
                sx={{
                  px: 1.75,
                  py: 0.5,
                  borderRadius: "999px",
                  border: "none",
                  bgcolor: isActive ? "#1E659E" : "transparent",
                  color: isActive ? "#FFFFFF" : "#64748B",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {item}
              </Box>
            );
          })}
        </Box>
      </Stack>

      {/* Top Summary Stats (Expense & Income) */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: { xs: 4, sm: 8 },
          mb: 3,
        }}
      >
        {/* Expense Stat */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "#FEE8E8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#E11D48",
              flexShrink: 0,
            }}
          >
            <ArrowUpRight size={18} strokeWidth={2} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 13,
                color: palette.slate[700],
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Expense
            </Typography>
            <Box sx={{ mt: 0.75 }}>
              {renderAmount(displayExpense, "#E11D48")}
            </Box>
          </Box>
        </Box>

        {/* Income Stat */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              bgcolor: "#E6F4EA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10B981",
              flexShrink: 0,
            }}
          >
            <ArrowDownRight size={18} strokeWidth={2} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: 13,
                color: palette.slate[700],
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              Income
            </Typography>
            <Box sx={{ mt: 0.75 }}>
              {renderAmount(displayIncome, "#10B981")}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Chart: Scaled SVG with dashed grids and smooth curves */}
      <Stack direction="row" sx={{ alignItems: "stretch" }}>
        <Stack
          sx={{
            justifyContent: "space-between",
            alignItems: "flex-end",
            pr: 1.5,
            height: H,
          }}
        >
          {[...gridYs].reverse().map((g) => (
            <Typography
              key={g}
              variant="caption"
              sx={{ color: palette.slate[400], fontSize: 11, fontWeight: 500, lineHeight: 1 }}
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
                  stopColor="#10B981"
                  stopOpacity="0.12"
                />
                <stop
                  offset="100%"
                  stopColor="#10B981"
                  stopOpacity="0"
                />
              </linearGradient>
              <linearGradient id="cfOut" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="#E11D48"
                  stopOpacity="0.10"
                />
                <stop
                  offset="100%"
                  stopColor="#E11D48"
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
              stroke="#E11D48"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <path
              d={inPath.line}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
          <Stack
            direction="row"
            sx={{ justifyContent: "space-between", mt: 1 }}
          >
            {cashFlow.labels.map((l, i) => (
              <Typography key={i} variant="caption" sx={{ color: palette.slate[500], fontSize: 11, fontWeight: 500 }}>
                {l}
              </Typography>
            ))}
          </Stack>
        </Box>
      </Stack>
    </BaseCard>
  );
}
