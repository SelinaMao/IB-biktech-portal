"use client";

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";

import BaseBlurText from "@core/components/BaseBlurText";
import { DEFAULT_PIE_COLORS } from "@core/components/PieChart";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import type { CoreAccountEntry, CoreAccountsResponse } from "../account.types";

export interface AccountsSidebarProps {
  summary: CoreAccountsResponse["summary"] | null;
  accounts: CoreAccountEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Makes the Summary box clickable to return to the aggregate view (clears the account selection). */
  onSelectSummary?: () => void;
  hideSummary?: boolean;
}
// First colors match the donut chart, extras prevent repeats when there are more accounts
const ACCOUNT_COLORS: string[] = [
  ...DEFAULT_PIE_COLORS,
  "#36A17E", // Pink
  "#FACC15", // Yellow
  "#14B8A6", // Teal
  "#F87171", // Red
  "#A3E635", // Lime
  "#818CF8", // Indigo
];




/** Converts any hex or rgb color to rgba with custom alpha for soft gradients */
export function colorWithAlpha(color: string, alpha: number): string {
  if (!color) return `rgba(141, 212, 190, ${alpha})`;
  const trimmed = color.trim();
  if (trimmed.startsWith("#")) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((c) => c + c).join("");
    }
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  }
  if (trimmed.startsWith("rgb")) {
    const parts = trimmed.match(/\d+(\.\d+)?/g);
    if (parts && parts.length >= 3) {
      return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${alpha})`;
    }
  }
  return trimmed;
}

/** Formats account type name (e.g. "Current Account", "Savings Account", "Term Deposit") */
export function getAccountTypeName(account: CoreAccountEntry): string {
  const rawType = (account.accountType || account.type || "").toUpperCase();
  const desc = (account.accountClassDescription || "").trim();
  const name = (account.accountName || "").toLowerCase();

  if (desc) {
    if (desc === desc.toUpperCase() && desc.length > 2) {
      return desc
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
    }
    return desc;
  }

  if (
    rawType === "TD" ||
    rawType === "FD" ||
    name.includes("fixed") ||
    name.includes("deposit") ||
    name.includes("term")
  ) {
    return "Term Deposit";
  }

  if (
    rawType === "CA" ||
    name.includes("current") ||
    name.includes("shipping") ||
    name.includes("shiiping")
  ) {
    return "Current Account";
  }

  if (rawType === "SA" || name.includes("saving")) {
    return "Savings Account";
  }

  if (rawType === "CL" || name.includes("loan")) {
    return "Loan Account";
  }

  return rawType || "Current Account";
}



/**
 * Returns the indicator / theme color for each account: 1 account = 1 color, by
 * position in the list. Always index-based — the API's `account.color` isn't used
 * here, since it isn't guaranteed distinct per account and would collapse the
 * sidebar/donut/selected-highlight back to a single repeated color.
 */
export const getAccountIndicatorColor = (
  account?: CoreAccountEntry | null,
  index: number = 0,
): string => {
  return ACCOUNT_COLORS[index % ACCOUNT_COLORS.length];
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
  onSelectSummary,
  hideSummary = false,
}: AccountsSidebarProps) {
  // The aggregate Summary view is "active" whenever no specific account is picked.
  const summaryActive = !selectedId || selectedId === "summary";
  // Matches DEFAULT_PIE_COLORS[0] — the donut's own mint-green for the first slot.
  const summaryAccentColor = "#5AC0A0";
  // Dynamic balances: prefer core summary totals, fallback to summing accounts list
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

  const renderAccountCard = (account: CoreAccountEntry, index: number) => {
    const key = account.id || `${account.accountNumber}-${account.accountType}`;
    const active = Boolean(
      selectedId &&
      selectedId !== "summary" &&
      (account.id === selectedId ||
        account.accountNumber === selectedId ||
        `${account.accountNumber}-${account.accountType}` === selectedId),
    );

    const barColor = getAccountIndicatorColor(account, index);
    const accountTypeName = getAccountTypeName(account);

    return (
      <Box
        key={key}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={() => onSelect?.(key)}
        onKeyDown={(e) => {
          if (!onSelect) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(key);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "stretch",
          width: "100%",
          cursor: onSelect ? "pointer" : "default",
          outline: "none",
          userSelect: "none",
        }}
      >
        {/* Left vertical tapered indicator (hides when active) */}
        <Box
          sx={{
            width: active ? 0 : "6px",
            opacity: active ? 0 : 1,
            mr: active ? 0 : "4px",
            flexShrink: 0,
            display: "flex",
            alignItems: "stretch",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            overflow: "hidden",
          }}
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 10 100"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ overflow: "visible", display: "block" }}
          >
            <path
              d="M 9.2 0.5 C 9.0 2.5, 8.2 4.5, 7.0 6.5 L 7.0 93.5 C 8.2 95.5, 9.0 97.5, 9.2 99.5 C 7.0 99.0, 2.5 97.5, 0.5 93.5 L 0.5 6.5 C 2.5 2.5, 7.0 1.0, 9.2 0.5 Z"
              fill={barColor}
            />
          </svg>
        </Box>

        {/* Account Card Box */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            boxSizing: "border-box",
            borderRadius: "16px",
            bgcolor: "#FFFFFF",
            border: `1px solid ${active ? barColor : "#EDF2F7"}`,
            borderLeft: active ? `4px solid ${barColor}` : "1px solid #EDF2F7",
            backgroundImage: active
              ? `linear-gradient(90deg, ${colorWithAlpha(barColor, 0.35)} 0%, ${colorWithAlpha(barColor, 0.12)} 22%, ${colorWithAlpha(barColor, 0.04)} 38%, rgba(255, 255, 255, 0) 50%, #FFFFFF 100%)`
              : "none",
            boxShadow: active
              ? `0px 2px 8px ${colorWithAlpha(barColor, 0.14)}`
              : "0px 1px 3px rgba(15, 23, 42, 0.03)",
            p: "10px 14px",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": {
              ...(active
                ? {}
                : {
                  bgcolor: "#F8FAFC",
                  borderColor: "#CBD5E1",
                }),
            },
            "&:focus-visible": {
              outline: "2px solid #3B82F6",
              outlineOffset: 2,
            },
          }}
        >
          {/* Line 1: Account Name */}
          <Typography
            sx={{
              fontSize: 14,
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

          {/* Line 2: Account Number | Account Type */}
          <Typography
            sx={{
              fontSize: 11.5,
              fontWeight: 400,
              color: "#64748B",
              mt: "3px",
              lineHeight: 1.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {formatAccountNumber(account.accountNumber)}
            {" | "}
            {accountTypeName}
          </Typography>

          {/* Line 3: Balance */}
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0F172A",
              mt: "8px",
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <BaseBlurText>
              {formatCCY(account.availableBalance, account.ccy)}
            </BaseBlurText>
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Summary box — also selectable: clicking it returns to the aggregate view */}
      {!hideSummary && (
        <Box
          role={onSelectSummary ? "button" : undefined}
          tabIndex={onSelectSummary ? 0 : undefined}
          onClick={onSelectSummary}
          onKeyDown={(e) => {
            if (!onSelectSummary) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectSummary();
            }
          }}
          sx={{
            borderRadius: "16px",
            p: "18px 20px",
            bgcolor: "#FFFFFF",
            border: `1px solid ${summaryActive ? summaryAccentColor : "#EDF2F7"}`,
            borderLeft: summaryActive ? `4px solid ${summaryAccentColor}` : "1px solid #EDF2F7",
            backgroundImage: summaryActive
              ? `linear-gradient(90deg, ${colorWithAlpha(summaryAccentColor, 0.35)} 0%, ${colorWithAlpha(summaryAccentColor, 0.12)} 22%, ${colorWithAlpha(summaryAccentColor, 0.04)} 38%, rgba(255, 255, 255, 0) 50%, #FFFFFF 100%)`
              : "none",
            boxShadow: summaryActive
              ? `0px 2px 8px ${colorWithAlpha(summaryAccentColor, 0.14)}`
              : "0px 1px 3px rgba(15, 23, 42, 0.03)",
            cursor: onSelectSummary ? "pointer" : "default",
            outline: "none",
            userSelect: "none",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:hover": onSelectSummary && !summaryActive ? { borderColor: "#CBD5E1" } : undefined,
            "&:focus-visible": { outline: "2px solid #3B82F6", outlineOffset: 2 },
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
              sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", lineHeight: 1.35 }}
            >
              <BaseBlurText>
                {formatSummaryCurrency(totalBalanceKHR, "KHR")}
              </BaseBlurText>
            </Typography>

            <Typography
              sx={{ fontSize: 16, fontWeight: 700, color: "#0F172A", lineHeight: 1.35 }}
            >
              <BaseBlurText>
                {formatSummaryCurrency(totalBalanceUSD, "USD")}
              </BaseBlurText>
            </Typography>
          </Stack>
        </Box>
      )}

      {/* Account list */}
      {accounts.length > 0 && (
        <Box sx={{ mt: hideSummary ? 0 : 3 }}>
          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 700,
              color: "#5A6B82",
              lineHeight: 1.2,
              mb: 1.5,
              px: 0.5,
            }}
          >
            Account List
          </Typography>
          <Stack spacing={1.5}>
            {accounts.map((account, index) => renderAccountCard(account, index))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}