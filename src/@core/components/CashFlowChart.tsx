"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { formatCCY } from "@/utils/format-ccy";
import { font, palette } from "@/theme/palette";
import BaseSwitch from "../form/BaseSwitch";
import BaseBlurText from "./BaseBlurText";
import BaseCard from "./BaseCard";
import CashFlowChartPanel, {
  CASH_FLOW_PANEL_BG as PANEL_BG,
  CASH_FLOW_PANEL_RADIUS as PANEL_RADIUS,
  CASH_FLOW_SERIES as SERIES,
  type CashFlowPoint,
} from "./CashFlowChartPanel";

export type { CashFlowPoint };

export type CashFlowChartProps = {
  data: CashFlowPoint[];
  title?: string;
  dateRange?: string;
  accountNumber?: string;
  inflowLabel?: string;
  outflowLabel?: string;
  /** Currency segmented switch (top-right). */
  currencies?: string[];
  activeCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
  height?: number;
  isLoading?: boolean;
  /** Hide or mask amounts */
  hideAmount?: boolean;
  showStats?: boolean;
  showHeader?: boolean;
  legendStartAdornment?: React.ReactNode;

  showCard?: boolean;
};


export default function CashFlowChart({
  data,
  title = "Cash Flow",
  dateRange = "Last 30 days · Jun 2026",
  accountNumber = "000 000 168",
  inflowLabel = "Average Income",
  outflowLabel = "Average Spending",
  currencies = ["USD", "KHR"],
  activeCurrency,
  onCurrencyChange,
  height = 250,
  isLoading = false,
  hideAmount = false,
  showStats = true,
  showHeader = true,
  legendStartAdornment,
  showCard = true,
}: CashFlowChartProps) {
  const [internalCcy, setInternalCcy] = useState(currencies[0]);
  const currency = activeCurrency ?? internalCcy;
  const labels = { inflow: inflowLabel, outflow: outflowLabel } as const;

  const totals = useMemo(
    () => ({
      inflow: data.reduce((sum, d) => sum + d.inflow, 0),
      outflow: data.reduce((sum, d) => sum + d.outflow, 0),
    }),
    [data],
  );

  const content = (
    <>
      {/* ---------- Header: title left · currency switch right ---------- */}
      {showHeader && (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
            pb: 2,
            borderBottom: `1px solid ${palette.slate[200]}`,
          }}
        >
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <Typography variant="h6" sx={{ color: palette.primary[1000], fontSize: font.size.lg, pl: 4, }}>{title}</Typography>
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              | {dateRange}
            </Typography>
          </Stack>

          <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
            {/* <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
              {accountNumber}
            </Typography> */}

            <BaseSwitch
              value={currency}
              onChange={(ccy) => {
                setInternalCcy(ccy);
                onCurrencyChange?.(ccy);
              }}
              options={currencies.map((ccy) => ({ value: ccy, label: ccy === "KHR" ? "KHR" : ccy }))}
            />
          </Stack>
        </Stack>
      )}

      {/* ---------- Body: stat cards left · chart panel right ---------- */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ gap: 2, alignItems: "stretch" }}
      >
        {/* Stat cards */}
        {showStats && (
          <Stack
            direction={{ xs: "row", md: "column" }}
            sx={{ gap: 2, width: { xs: "100%", md: 225 }, flexShrink: 0 }}
          >
            {SERIES.map((s) => (
              <Box
                key={s.key}
                sx={{
                  flex: 1,
                  bgcolor: PANEL_BG,
                  borderRadius: `${PANEL_RADIUS}px`,
                  p: 4,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="body2" sx={{ fontSize: font.size.base, color: palette.primary[1000] }}>
                  {labels[s.key]}
                </Typography>
                {isLoading ? (
                  <Skeleton width="80%" height={32} />
                ) : (
                  <Typography
                    variant="h5"
                    sx={{ color: s.color, fontWeight: font.weight.bold, mt: 0.5, fontSize: font.size.lg }}
                  >
                    <BaseBlurText>{formatCCY(totals[s.key], currency)}</BaseBlurText>
                  </Typography>
                )}
              </Box>
            ))}
          </Stack>
        )}

        {/* Chart panel */}
        <CashFlowChartPanel
          data={data}
          currency={currency}
          inflowLabel={inflowLabel}
          outflowLabel={outflowLabel}
          height={height}
          isLoading={isLoading}
          hideAmount={hideAmount}
          legendStartAdornment={legendStartAdornment}
        />
      </Stack>
    </>
  );

  if (!showCard) return content;

  return <BaseCard sx={{ height: "100%" }}>{content}</BaseCard>;
}
