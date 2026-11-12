"use client";

import { Box, Divider, Stack, Typography } from "@mui/material";
import { DollarSign } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseIconBadge from "@core/components/BaseIconBadge";
import BasePieChart, { DEFAULT_PIE_COLORS, type PieDatum } from "@core/components/PieChart";
import { font, palette, radius } from "@/theme/palette";

export interface LoanSummaryProps {
  totalKHR: number;
  totalUSD: number;
  loans: Array<{ id: string; name: string; color?: string }>;
  chartData?: PieDatum[];
  expenseAmount?: number;
  incomeAmount?: number;
  currency?: string;
}

function formatCurrency(amount: number, currency: "KHR" | "USD"): string {
  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

function formatCashFlow(amount: number, currency: string, expense: boolean): string {
  const symbol = currency.toUpperCase() === "KHR" ? "៛" : "$";
  const formatted = Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${expense ? "-" : ""}${symbol}${formatted}`;
}

function CashFlowAmount({ value, color }: { value: string; color: string }) {
  const decimalIndex = value.lastIndexOf(".");
  if (decimalIndex < 0) {
    return (
      <Typography
        component="span"
        sx={{
          fontSize: { xs: 15, sm: 16 },
          fontWeight: 700,
          color,
          lineHeight: 1.25,
        }}
      >
        {value}
      </Typography>
    );
  }

  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "flex-start", color }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: { xs: 15, sm: 20 },
          fontWeight: 700,
          color: "inherit",
          lineHeight: 1.25,
        }}
      >
        {value.slice(0, decimalIndex)}
      </Typography>
      <Typography
        component="span"
        sx={{
          fontSize: 11,
          fontWeight: 700,
          color: "inherit",
          lineHeight: 1.25,
          ml: 0.1,
          mt: "1px",
        }}
      >
        {value.slice(decimalIndex)}
      </Typography>
    </Box>
  );
}

export default function LoanSummary({
  totalKHR,
  totalUSD,
  loans,
  chartData,
  expenseAmount,
  incomeAmount,
  currency = "USD",
}: LoanSummaryProps) {
  const pieData: PieDatum[] =
    chartData && chartData.length > 0
      ? chartData
      : loans.length > 0
        ? loans.map((loan, index) => ({
            name: loan.name || `Loan ${index + 1}`,
            value: 1,
            color: loan.color ?? DEFAULT_PIE_COLORS[index % DEFAULT_PIE_COLORS.length],
          }))
        : [{ name: "No loans", value: 1, color: palette.slate[200] }];

  const hasCashFlow = expenseAmount !== undefined && incomeAmount !== undefined;

  return (
    <BaseCard
      sx={{
        width: "100%",
        borderRadius: `${radius.xl}px`,
        p: { xs: 2.5, sm: "20px 24px" },
        bgcolor: "#FFFFFF",
        mb: { xs: 2.5, sm: 3.5 },
        border: `1px solid ${palette.slate[200]}`,
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
      }}
    >
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "flex-start", lg: "center" }}
        justifyContent="space-between"
        spacing={{ xs: 2, lg: 3 }}
      >
        {/* Left Section: Donut Chart + Outstanding Loan Balance (KHR & USD) */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{ flexWrap: { xs: "wrap", sm: "nowrap" } }}
        >
          <BasePieChart
            data={pieData}
            size={120}
            thickness={18}
            startAngle={-45}
            centerValue={loans.length}
            centerLabel={loans.length === 1 ? "loan" : "loans"}
            centerColor={palette.slate[900]}
          />

          <Stack spacing={2.75} sx={{ pl: { xs: 0, sm: 5 }, mb: { xs: 0, sm: 2 } }}>
            <Typography
              sx={{
                fontSize: 12,
                color: palette.slate[500],
                fontWeight: 400,
                lineHeight: "16px",
              }}
            >
              Outstanding Loan Balance
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems={{ xs: "flex-start", sm: "center" }}
              spacing={{ xs: 1.5, sm: 6, md: 10, lg: 12, xl: 36 }}
            >
              {/* KHR Item */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <BaseIconBadge
                  direction="income"
                  bgColor="#FFF4E8"
                  icon={
                    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
                      <text
                        x="50%"
                        y="50%"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="24"
                        fontWeight={font.weight.medium}
                        fill={palette.orange}
                      >
                        ៛
                      </text>
                    </svg>
                  }
                />
                <Box>
                  <Typography sx={{ fontSize: 15, color: "#64748B", fontWeight: 300, lineHeight: 1.2 }}>
                    KHR
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 18, sm: 20, md: 22 },
                      fontWeight: 600,
                      color: "#0F172A",
                      mt: 0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    <BaseBlurText>{formatCurrency(totalKHR, "KHR")}</BaseBlurText>
                  </Typography>
                </Box>
              </Stack>

              {/* USD Item */}
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <BaseIconBadge
                  direction="income"
                  bgColor="#EAF6EE"
                  icon={<DollarSign color="#16A34A" size={20} />}
                />
                <Box>
                  <Typography sx={{ fontSize: 15, color: "#64748B", fontWeight: 300, lineHeight: 1.2 }}>
                    USD
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: 18, sm: 20, md: 22 },
                      fontWeight: 600,
                      color: "#0F172A",
                      mt: 0.5,
                      lineHeight: 1.2,
                    }}
                  >
                    <BaseBlurText>{formatCurrency(totalUSD, "USD")}</BaseBlurText>
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        {/* Right Section: Divider + Cash Flow (Expense & Income) */}
        {hasCashFlow && (
          <Stack
            direction="row"
            alignItems="center"
            spacing={{ xs: 2.5, sm: 6, xl: 8 }}
            sx={{
              alignSelf: { xs: "stretch", lg: "center" },
              justifyContent: { xs: "space-between", lg: "flex-end" },
              pt: { xs: 1, lg: 6 },
              borderTop: { xs: `1px solid ${palette.slate[100]}`, lg: "none" },
            }}
          >
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                borderColor: palette.slate[200],
                height: 70,
                alignSelf: "center",
                display: { xs: "none", lg: "block" },
                mr: { lg: 2, xl: 3 },
              }}
            />

            <Stack direction="row" alignItems="center" spacing={2.5}>
              <BaseIconBadge
                direction="expense"
                iconSrc="/assets/icons/expense-icon.svg"
                size={36}
                iconSize={18}
              />
              <Box>
                <Typography sx={{ fontSize: 15, color: palette.slate[500], fontWeight: 300, lineHeight: 1.2 }}>
                  Expense
                </Typography>
                <Box sx={{ mt: 0.25 }}>
                  <BaseBlurText>
                    <CashFlowAmount
                      value={formatCashFlow(expenseAmount, currency, true)}
                      color="#DC2626"
                    />
                  </BaseBlurText>
                </Box>
              </Box>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2.5}>
              <BaseIconBadge
                direction="income"
                iconSrc="/assets/icons/income-icon.svg"
                size={36}
                iconSize={18}
              />
              <Box>
                <Typography sx={{ fontSize: 15, color: palette.slate[500], fontWeight: 300, lineHeight: 1.2 }}>
                  Income
                </Typography>
                <Box sx={{ mt: 0.25 }}>
                  <BaseBlurText>
                    <CashFlowAmount
                      value={formatCashFlow(incomeAmount, currency, false)}
                      color="#16A34A"
                    />
                  </BaseBlurText>
                </Box>
              </Box>
            </Stack>
          </Stack>
        )}
      </Stack>
    </BaseCard>
  );
}
