"use client";

import { useMemo } from "react";
import { Box, Stack, Typography } from "@mui/material";

import BaseBlurText from "@core/components/BaseBlurText";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import LoanSummary from "./LoanSummary";

export interface LoanEntry {
  id: string;
  name: string;
  number: string;
  type?: string;
  balance: number;
  currency: string; // "USD" | "KHR"
  color?: string;
}

export interface LoansSidebarProps {
  outstandingKhr?: number;
  outstandingUsd?: number;
  loans: LoanEntry[];
  hideSummary?: boolean;
  selectedId?: string;
  onSelect?: (id: string) => void;
}

/** Converts any hex or rgb color to rgba with custom alpha for soft gradients */
export function colorWithAlpha(color: string, alpha: number): string {
  if (!color) return `rgba(92, 175, 228, ${alpha})`;
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

export const getLoanIndicatorColor = (
  loan?: LoanEntry | null,
  index: number = 0,
): string => {
  if (loan?.color) return loan.color;
  const name = (loan?.name || "").toLowerCase();
  const type = (loan?.type || "").toLowerCase();
  if (name.includes("housing") || name.includes("home") || type.includes("housing")) {
    return "#74C0A8"; // Sage Green
  }
  if (name.includes("car") || name.includes("auto") || type.includes("car")) {
    return "#5CAFE4"; // Sky Blue
  }
  if (name.includes("sme") || name.includes("business") || type.includes("sme")) {
    return "#F1B96E"; // Warm Orange
  }
  if (name.includes("overdraft") || type.includes("overdraft")) {
    return "#A78BFA"; // Purple
  }

  const palette = [
    "#5CAFE4", // Sky Blue
    "#F1B96E", // Warm Orange
    "#74C0A8", // Sage Green
    "#8DD4BE", // Mint Teal
    "#A78BFA", // Purple
    "#F472B6", // Pink
    "#38BDF8", // Cyan
  ];

  return palette[index % palette.length];
};

export function getLoanTypeName(loan: LoanEntry): string {
  const type = (loan.type || "").trim();
  const name = (loan.name || "").toLowerCase();

  if (type) {
    if (type.toLowerCase().includes("loan") || type.toLowerCase().includes("facility")) {
      return type;
    }
    return `${type} Loan`;
  }

  if (name.includes("car") || name.includes("auto")) return "Car Loan";
  if (name.includes("housing") || name.includes("home")) return "Housing Loan";
  if (name.includes("sme") || name.includes("business")) return "SME Loan";
  if (name.includes("overdraft")) return "Overdraft Facility";

  return "Loan Account";
}

export default function LoansSidebar({
  outstandingKhr,
  outstandingUsd,
  loans,
  hideSummary = false,
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

  const renderLoanCard = (loan: LoanEntry, index: number) => {
    const key = `${loan.id}-${loan.currency}`;
    const active = Boolean(
      selectedId && (loan.id === selectedId || loan.number === selectedId),
    );

    const barColor = getLoanIndicatorColor(loan, index);
    const loanTypeName = getLoanTypeName(loan);

    return (
      <Box
        key={key}
        role={onSelect ? "button" : undefined}
        tabIndex={onSelect ? 0 : undefined}
        onClick={() => onSelect?.(loan.id)}
        onKeyDown={(e) => {
          if (!onSelect) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(loan.id);
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
        {/* Unselected: Left Vertical Curved Tapered Indicator (hides smoothly when active) */}
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

        {/* Loan Card Box */}
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
          {/* Line 1: Loan Name */}
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
            {loan.name}
          </Typography>

          {/* Line 2: Loan Number | Loan Type */}
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
            {formatAccountNumber(loan.number)}
            {" | "}
            {loanTypeName}
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
              {formatCCY(loan.balance, loan.currency)}
            </BaseBlurText>
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      {!hideSummary && (
        <LoanSummary
          totalKHR={totalKHR}
          totalUSD={totalUSD}
          loans={loans}
        />
      )}

      {/* ───────── Loan Accounts List Section ───────── */}
      {loans.length > 0 && (
        <Box sx={{ mt: 3 }}>
          {/* <Typography
            sx={{
              fontSize: 15,
              fontWeight: 700,
              color: "#5A6B82",
              lineHeight: 1.2,
              mb: 1.5,
              px: 0.5,
            }}
          >
            Loan Accounts
          </Typography> */}
          <Stack spacing={1.5}>
            {loans.map((loan, index) => renderLoanCard(loan, index))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
