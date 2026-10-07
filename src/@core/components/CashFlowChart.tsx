"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowDownLeft, ArrowUpRight, CirclePlus, MoreVertical } from "lucide-react";

import { formatCCY } from "@/utils/format-ccy";
import { font, palette, radius, padding } from "@/theme/palette";
import BaseBlurText from "./BaseBlurText";
import BaseCard from "./BaseCard";
import CashFlowChartPanel, {
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
  expenseAmount?: string;
  incomeAmount?: string;
};

function renderAmount(val: string, color: string) {
  const dotIndex = val.lastIndexOf(".");
  if (dotIndex !== -1) {
    const main = val.slice(0, dotIndex);
    const decimals = val.slice(dotIndex);
    return (
      <Box component="span" sx={{ display: "inline-flex", alignItems: "baseline", color }}>
        <Typography component="span" sx={{ fontSize: 22, fontWeight: 700, color: "inherit", lineHeight: 1 }}>
          {main}
        </Typography>
        <Typography component="span" sx={{ fontSize: 13, fontWeight: 600, color: "inherit", lineHeight: 1, ml: 0.2 }}>
          {decimals}
        </Typography>
      </Box>
    );
  }
  return (
    <Typography component="span" sx={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>
      {val}
    </Typography>
  );
}

export default function CashFlowChart({
  data,
  title = "Cash Flow",
  dateRange = "Last 30 days · Jun 2026",
  accountNumber = "000 000 168",
  inflowLabel = "Income",
  outflowLabel = "Expense",
  currencies = ["USD", "KHR"],
  activeCurrency,
  onCurrencyChange,
  height = 200,
  isLoading = false,
  hideAmount = false,
  showStats = true,
  showHeader = true,
  legendStartAdornment,
  showCard = true,
  expenseAmount,
  incomeAmount,
}: CashFlowChartProps) {
  const [internalCcy, setInternalCcy] = useState(currencies[0]);
  const currency = activeCurrency ?? internalCcy;

  const totals = useMemo(
    () => ({
      inflow: data.reduce((sum, d) => sum + d.inflow, 0),
      outflow: data.reduce((sum, d) => sum + d.outflow, 0),
    }),
    [data],
  );

  const displayExpense = expenseAmount ?? (totals.outflow > 0 ? `-${formatCCY(totals.outflow, currency)}` : "-$23,000.90");
  const displayIncome = incomeAmount ?? (totals.inflow > 0 ? formatCCY(totals.inflow, currency) : "$3,000.90");

  const content = (
    <Box sx={{ width: "100%" }}>
      {/* ---------- Header: title left · controls right ---------- */}
      {showHeader && (
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2,
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
            {title}
          </Typography>

          <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
            {/* Currency Pill Toggle */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                bgcolor: palette.slate[100],
                borderRadius: "999px",
                p: "3px",
              }}
            >
              {currencies.map((ccy) => {
                const isActive = currency === ccy;
                return (
                  <Box
                    key={ccy}
                    onClick={() => {
                      setInternalCcy(ccy);
                      onCurrencyChange?.(ccy);
                    }}
                    sx={{
                      px: 1.75,
                      py: 0.4,
                      borderRadius: "999px",
                      bgcolor: isActive ? "#1E659E" : "transparent",
                      color: isActive ? "#FFFFFF" : palette.slate[500],
                      fontSize: "12px",
                      fontWeight: isActive ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {ccy}
                  </Box>
                );
              })}
            </Box>

            {/* Plus in circle icon */}
            <IconButton
              size="small"
              sx={{
                p: 0.5,
                color: palette.slate[900],
                "&:hover": { bgcolor: palette.slate[100] },
              }}
            >
              <CirclePlus size={20} />
            </IconButton>

            {/* More options 3 dots icon */}
            <IconButton
              size="small"
              sx={{
                p: 0.5,
                color: palette.slate[900],
                "&:hover": { bgcolor: palette.slate[100] },
              }}
            >
              <MoreVertical size={20} />
            </IconButton>
          </Stack>
        </Stack>
      )}

      {/* ---------- Full-width Chart Panel ---------- */}
      <Box sx={{ width: "100%" }}>
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
      </Box>

      {/* ---------- Bottom Summary Stats ---------- */}
      {showStats && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
            gap: 3,
            mt: 6,
            pb: 0.5,
          }}
        >
          {/* Expense Stat */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "#FEE8E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#E11D48",
                flexShrink: 0,
              }}
            >
              <ArrowUpRight size={18} strokeWidth={1.8} />
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
              <Box sx={{ mt: 1 }}>
                <BaseBlurText>
                  {hideAmount ? "••••••" : renderAmount(displayExpense, "#E11D48")}
                </BaseBlurText>
              </Box>
            </Box>
          </Box>

          {/* Income Stat */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "#E6F4EA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16A34A",
                flexShrink: 0,
              }}
            >
              <ArrowDownLeft size={18} strokeWidth={1.8} />
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
              <Box sx={{ mt: 1 }}>
                <BaseBlurText>
                  {hideAmount ? "••••••" : renderAmount(displayIncome, "#2A7BE4")}
                </BaseBlurText>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );

  if (!showCard) return content;

  return (
    <BaseCard
      sx={{
        p: `${padding.xxl}px`,
        borderRadius: `${radius.xl}px`,
        border: `1px solid ${palette.slate[200]}`,
        bgcolor: "#FFFFFF",
      }}
    >
      {content}
    </BaseCard>
  );
}
