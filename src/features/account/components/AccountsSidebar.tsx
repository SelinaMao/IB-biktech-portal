"use client";

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";

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

const getAccountIndicatorColor = (
  account: CoreAccountEntry,
  index: number,
  isDeposit: boolean,
): string => {
  if (account.color) return account.color;

  const type = (account.accountType || account.type || "").toUpperCase();
  const name = (account.accountName || "").toLowerCase();

  if (isDeposit || type === "TD" || type === "FD" || name.includes("fixed") || name.includes("deposit")) {
    return "#20A678"; // Green for Deposit / TD
  }

  if (type === "CA" || name.includes("shiiping") || name.includes("shipping") || index === 0) {
    return "#1C64B4"; // Blue for Current / Shiiping
  }

  if (type === "SA" || name.includes("current") || name.includes("saving") || index === 1) {
    return "#E88000"; // Orange
  }

  const fallbackColors = ["#1C64B4", "#E88000", "#20A678", "#8B5CF6"];
  return fallbackColors[index % fallbackColors.length];
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

const isDepositAccount = (account: CoreAccountEntry) => {
  const type = (account.accountType || account.type || "").toUpperCase();
  const cls = (account.accountClass || "").toUpperCase();
  const desc = (account.accountClassDescription || "").toLowerCase();
  const name = (account.accountName || "").toLowerCase();
  return (
    type === "TD" ||
    type === "FD" ||
    cls === "TD" ||
    cls === "FD" ||
    desc.includes("fixed") ||
    desc.includes("deposit") ||
    desc.includes("term") ||
    name.includes("fixed") ||
    name.includes("deposit")
  );
};

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

    return {
      totalBalanceKHR: khr,
      totalBalanceUSD: usd,
    };
  }, [summary, accounts]);

  const savingsAccounts = useMemo(
    () => accounts.filter((a) => !isDepositAccount(a)),
    [accounts],
  );

  const depositAccounts = useMemo(
    () => accounts.filter((a) => isDepositAccount(a)),
    [accounts],
  );

  const renderAccountCard = (
    account: CoreAccountEntry,
    index: number,
    isDeposit: boolean,
  ) => {
    const key = account.id || `${account.accountNumber}-${account.accountType}`;
    const active = Boolean(
      selectedId &&
        (account.id === selectedId ||
          account.accountNumber === selectedId ||
          `${account.accountNumber}-${account.accountType}` === selectedId),
    );

    const barColor = getAccountIndicatorColor(account, index, isDeposit);

    return (
      <Box
        key={key}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={() => onSelect?.(key)}
        onKeyDown={(e) => {
          if (!onSelect) return;
          if (e.key === "Enter" || e.key === " ") onSelect(key);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          width: "100%",
          height: 72,
          minWidth: 0,
          overflow: "hidden",
          p: "0 10px",
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
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
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
            maxWidth: "55%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            pl: 1,
          }}
        >
          <BaseBlurText>
            {formatCCY(account.availableBalance, account.ccy)}
          </BaseBlurText>
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "24px",
        p: { xs: 2.5, sm: "20px 15px" },
        boxShadow: "0px 1px 3px rgba(15, 23, 42, 0.04)",
        border: "1px solid #EDF2F7",
      }}
    >
      {/* ───────── Top: Summary Box ───────── */}
      <Box
        sx={{
          bgcolor: "#F4F7FB",
          borderRadius: "12px",
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

      {/* ───────── Savings Section ───────── */}
      {savingsAccounts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#5A6B82",
              lineHeight: 1.2,
              mb: 1.5,
              px: 0.5,
            }}
          >
            Savings
          </Typography>
          <Stack spacing={1.5}>
            {savingsAccounts.map((account, index) => renderAccountCard(account, index, false))}
          </Stack>
        </Box>
      )}

      {/* ───────── Deposit Section ───────── */}
      {depositAccounts.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#5A6B82",
              lineHeight: 1.2,
              mb: 1.5,
              px: 0.5,
            }}
          >
            Deposit
          </Typography>
          <Stack spacing={1.5}>
            {depositAccounts.map((account, index) => renderAccountCard(account, index, true))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
