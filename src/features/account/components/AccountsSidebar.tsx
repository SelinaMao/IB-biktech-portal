"use client";

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { WalletCards } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import type { CoreAccountEntry, CoreAccountsResponse } from "../account.types";

export interface AccountsSidebarProps {
  summary: CoreAccountsResponse["summary"] | null;
  accounts: CoreAccountEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const DEFAULT_TYPE_COLORS: Record<string, string> = {
  CA: "#1C64B4", // Blue
  TD: "#20A678", // Green
  SA: "#E88000", // Orange
  CL: "#8B5CF6", // Purple
};

/** Formats dynamic amount as "KHR 120,293,000.00" or "USD 293,000.00" */
function formatSummaryCurrency(
  amount: number | string | undefined | null,
  ccy: string,
): string {
  const num = Number(amount ?? 0);
  const formatted = (isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${ccy} ${formatted}`;
}

export default function AccountsSidebar({
  summary,
  accounts,
  selectedId,
  onSelect,
}: AccountsSidebarProps) {
  // Dynamic balances: prefer core summary totals, fallback to summing accounts list dynamically
  const { totalBalanceKHR, totalBalanceUSD } = useMemo(() => {
    const khr =
      summary?.totalBalanceKHR !== undefined
        ? summary.totalBalanceKHR
        : accounts
            .filter((a) => a.ccy === "KHR")
            .reduce((sum, a) => sum + (Number(a.availableBalance) || 0), 0);

    const usd =
      summary?.totalBalanceUSD !== undefined
        ? summary.totalBalanceUSD
        : accounts
            .filter((a) => a.ccy === "USD" || !a.ccy)
            .reduce((sum, a) => sum + (Number(a.availableBalance) || 0), 0);

    return { totalBalanceKHR: khr, totalBalanceUSD: usd };
  }, [summary, accounts]);

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "16px",
        p: { xs: 2, sm: 2.5 },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: "1px solid #EDF2F7",
      }}
    >
      {/* ───────── Top: Summary Box ───────── */}
      <Box
        sx={{
          bgcolor: "#F4F7FB",
          borderRadius: "18px",
          p: "18px 20px",
        }}
      >
        <Typography
          sx={{
            fontSize: 14,
            fontWeight: 500,
            color: "#718096",
            mb: 1.25,
            lineHeight: 1.2,
          }}
        >
          Summary
        </Typography>

        <Stack spacing={0.75}>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.35,
            }}
          >
            <BaseBlurText>
              {formatSummaryCurrency(totalBalanceKHR, "KHR")}
            </BaseBlurText>
          </Typography>

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.35,
            }}
          >
            <BaseBlurText>
              {formatSummaryCurrency(totalBalanceUSD, "USD")}
            </BaseBlurText>
          </Typography>
        </Stack>
      </Box>

      {/* ───────── Middle: Accounts List Header ───────── */}
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          alignItems: "center",
          mt: 3,
          mb: 2,
          px: 0.5,
        }}
      >
        <WalletCards size={20} color="#5A6B82" strokeWidth={2} />
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: "#5A6B82",
            lineHeight: 1.2,
          }}
        >
          Accounts List
        </Typography>
      </Stack>

      {/* ───────── Bottom: Account Cards List ───────── */}
      <Stack spacing={1.5}>
        {accounts.map((account, index) => {
          const active = account.accountNumber === selectedId;
          const barColor =
            account.color ||
            DEFAULT_TYPE_COLORS[account.accountType] ||
            (index === 0 ? "#1C64B4" : index === 1 ? "#20A678" : "#E88000");

          return (
            <Box
              key={`${account.accountNumber}-${account.ccy}`}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={() => onSelect?.(account.accountNumber)}
              onKeyDown={(e) => {
                if (!onSelect) return;
                if (e.key === "Enter" || e.key === " ") onSelect(account.accountNumber);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: "16px 18px",
                borderRadius: "16px",
                cursor: onSelect ? "pointer" : "default",
                bgcolor: active ? "#EDF4FC" : "#FFFFFF",
                border: active ? "1.5px solid #85B7E8" : "1.5px solid #EDF2F7",
                transition: "all 0.15s ease-in-out",
                "&:hover": {
                  bgcolor: active ? "#EDF4FC" : "#F8FAFC",
                  borderColor: active ? "#73A8DC" : "#CBD5E1",
                },
              }}
            >
              {/* Left: Indicator Bar + Account Name & Number */}
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center", minWidth: 0, pr: 1 }}
              >
                <Box
                  sx={{
                    width: "4px",
                    height: "32px",
                    borderRadius: "4px",
                    bgcolor: barColor,
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#0F172A",
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {account.accountName}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: 400,
                      color: "#64748B",
                      mt: "4px",
                      lineHeight: 1.2,
                    }}
                  >
                    {formatAccountNumber(account.accountNumber)}
                  </Typography>
                </Box>
              </Stack>

              {/* Right: Balance */}
              <Typography
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#0F172A",
                  textAlign: "right",
                  flexShrink: 0,
                  pl: 1,
                }}
              >
                <BaseBlurText>
                  {formatCCY(account.availableBalance, account.ccy)}
                </BaseBlurText>
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
