"use client";

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { WalletCards } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import { loanAccounts } from "../loan.data";

export interface LoanEntry {
  id: string;
  name: string;
  number: string;
  type?: string;
  balance: number;
  currency: string; // "USD" | "KHR"
}

export interface LoansSidebarProps {
  outstandingKhr?: number;
  outstandingUsd?: number;
  loans: LoanEntry[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}

const getLoanIndicatorColor = (loan: LoanEntry, index: number = 0): string => {
  const name = (loan.name || "").toLowerCase();
  const type = (loan.type || "").toLowerCase();
  if (name.includes("housing") || name.includes("home") || type.includes("housing")) {
    return "#20A678"; // Green
  }
  if (name.includes("car") || name.includes("auto") || type.includes("car")) {
    return "#1C64B4"; // Blue
  }
  if (name.includes("sme") || name.includes("business") || type.includes("sme")) {
    return "#E88000"; // Orange
  }
  if (name.includes("overdraft") || type.includes("overdraft")) {
    return "#8B5CF6"; // Purple
  }

  const fallbackColors = ["#20A678", "#1C64B4", "#E88000", "#8B5CF6", "#0EA5E9"];
  return fallbackColors[index % fallbackColors.length];
};

/** Formats amount as "KHR 120,293,000.00" or "USD 293,000.00" */
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

export default function LoansSidebar({
  outstandingKhr,
  outstandingUsd,
  loans,
  selectedId,
  onSelect,
}: LoansSidebarProps) {
  // Prefer totals from props, fallback to summing the loans list
  const { totalKHR, totalUSD } = useMemo(() => {
    const khr =
      outstandingKhr !== undefined
        ? outstandingKhr
        : loans
          .filter((l) => l.currency === "KHR")
          .reduce((sum, l) => sum + (Number(l.balance) || 0), 0);

    const usd =
      outstandingUsd !== undefined
        ? outstandingUsd
        : loans
          .filter((l) => l.currency === "USD" || !l.currency)
          .reduce((sum, l) => sum + (Number(l.balance) || 0), 0);

    return { totalKHR: khr, totalUSD: usd };
  }, [outstandingKhr, outstandingUsd, loans]);

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
          Summary Loan
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
            <BaseBlurText>{formatSummaryCurrency(totalKHR, "KHR")}</BaseBlurText>
          </Typography>

          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.35,
            }}
          >
            <BaseBlurText>{formatSummaryCurrency(totalUSD, "USD")}</BaseBlurText>
          </Typography>
        </Stack>
      </Box>

      {/* ───────── Middle: Loans List Header ───────── */}
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
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 700,
            color: "#5A6B82",
            lineHeight: 1.2,
          }}
        >
          Loan Accounts
        </Typography>
      </Stack>

      {/* ───────── Bottom: Loan Cards List ───────── */}
      <Stack spacing={1.5}>
        {loans.map((loan, index) => {
          const active = Boolean(
            selectedId && (loan.id === selectedId || loan.number === selectedId),
          );

          return (
            <Box
              key={`${loan.id}-${loan.currency}`}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
              onClick={() => onSelect?.(loan.id)}
              onKeyDown={(e) => {
                if (!onSelect) return;
                if (e.key === "Enter" || e.key === " ") onSelect(loan.id);
              }}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                boxSizing: "border-box",
                width: "100%",
                height: 72,            // fixed height
                minWidth: 0,
                overflow: "hidden",    // nothing can push the card bigger
                p: "0 10px",           // vertical centering is handled by alignItems
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
              {/* Left: Indicator Bar + Loan Name & Number */}
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
                    bgcolor: getLoanIndicatorColor(loan, index),
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
                    {loan.name}
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
                    {formatAccountNumber(loan.number)}
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
                  flexShrink: 0,       // balance never gets squeezed
                  maxWidth: "55%",     // but can't take over the whole card
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  pl: 1,
                }}
              >
                <BaseBlurText>
                  {formatCCY(loan.balance, loan.currency)}
                </BaseBlurText>
              </Typography>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}