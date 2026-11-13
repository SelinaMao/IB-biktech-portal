"use client";

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { DollarSign } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseIconBadge from "@core/components/BaseIconBadge";
import BasePieChart, { DEFAULT_PIE_COLORS, type PieDatum } from "@core/components/PieChart";
import { font, palette, radius } from "@/theme/palette";
import type { CoreAccountEntry, CoreAccountsResponse } from "../account.types";
import { getAccountIndicatorColor } from "./AccountsSidebar";

// Matches the Summary box's accent — both represent the aggregate, not one account.
const SUMMARY_ACCENT_COLOR = "#8DD4BE";

export type AccountSummaryPanelProps = {
  accounts: CoreAccountEntry[];
  summary: CoreAccountsResponse["summary"] | null;
};

/** Formats dynamic amount as "293,000.00 USD" or "120,293,000.00 KHR" */
function formatCurrencySuffix(amount: number, ccy: "USD" | "KHR"): string {
  const formatted = amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${formatted} ${ccy}`;
}

/**
 * Default right-column view before an account is picked: "N accounts" donut
 * plus the KHR/USD totals — the compact counterpart to AccountDetailCard's
 * selected-account header.
 */
export default function AccountSummaryPanel({ accounts, summary }: AccountSummaryPanelProps) {
  const pieData = useMemo<PieDatum[]>(() => {
    if (!accounts || accounts.length === 0) {
      return [{ name: "Savings", value: 1, color: DEFAULT_PIE_COLORS[0] }];
    }
    // Same resolver as AccountsSidebar's cards and the selected-account accent,
    // so a given account is always the same color everywhere on the page.
    return accounts.map((acc, index) => ({
      name: acc.accountName || `Account ${index + 1}`,
      value: 1,
      color: getAccountIndicatorColor(acc, index),
    }));
  }, [accounts]);

  const totalKhr = useMemo(() => {
    if (summary?.totalBalanceKHR !== undefined) return summary.totalBalanceKHR;
    return accounts
      .filter((a) => a.ccy === "KHR")
      .reduce((sum, a) => sum + (Number(a.availableBalance) || 0), 0);
  }, [summary, accounts]);

  const totalUsd = useMemo(() => {
    if (summary?.totalBalanceUSD !== undefined) return summary.totalBalanceUSD;
    return accounts
      .filter((a) => a.ccy === "USD" || !a.ccy)
      .reduce((sum, a) => sum + (Number(a.availableBalance) || 0), 0);
  }, [summary, accounts]);

  return (
    <Box>
      <Typography
        sx={{
          fontSize: 18,
          fontWeight: 700,
          color: "#0F172A",
          lineHeight: 1.2,
          mb: 1.5,
          px: 0.5,
        }}
      >
        Account Summary
      </Typography>

      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: `${radius.xl}px`,
          border: `1px solid ${palette.slate[200]}`,
          borderLeft: `4px solid ${SUMMARY_ACCENT_COLOR}`,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          p: { xs: 2.5, sm: "20px 24px" },
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={{ xs: 2.5, sm: 4 }}
          sx={{ flexWrap: "wrap" }}
        >
          <BasePieChart
            data={pieData}
            size={90}
            thickness={14}
            gap={6}
            startAngle={-45}
            centerValue={accounts.length}
            centerLabel={accounts.length === 1 ? "account" : "accounts"}
            centerColor={palette.slate[900]}
          />

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <BaseIconBadge
              direction="income"
              bgColor="#FFF4E8"
              icon={
                <svg width="22" height="22" viewBox="0 0 28 28" aria-hidden="true">
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="20"
                    fontWeight={font.weight.medium}
                    fill={palette.orange}
                  >
                    ៛
                  </text>
                </svg>
              }
            />
            <Box>
              <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 400, lineHeight: 1.2 }}>
                KHR
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#0F172A", mt: 0.25, lineHeight: 1.2 }}>
                <BaseBlurText>{formatCurrencySuffix(totalKhr, "KHR")}</BaseBlurText>
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <BaseIconBadge direction="income" bgColor="#EAF6EE" icon={<DollarSign color="#16A34A" size={18} />} />
            <Box>
              <Typography sx={{ fontSize: 13, color: "#64748B", fontWeight: 400, lineHeight: 1.2 }}>
                USD
              </Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#0F172A", mt: 0.25, lineHeight: 1.2 }}>
                <BaseBlurText>{formatCurrencySuffix(totalUsd, "USD")}</BaseBlurText>
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
}
