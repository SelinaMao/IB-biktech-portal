"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Wallet } from "lucide-react";

import { font, palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import SummaryCard from "@/features/account/components/SummaryCard";
import type { SummaryCardProps } from "@/features/account/account.types";
// Adjust to match your real loan type
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

export default function LoansSidebar({
  outstandingKhr,
  outstandingUsd,
  loans,
  selectedId,
  onSelect,
}: LoansSidebarProps) {
  // Total outstanding per currency, summed from the list or passed from props
  const totalUSD =
    outstandingUsd !== undefined
      ? outstandingUsd
      : loans
          .filter((l) => l.currency === "USD")
          .reduce((sum, l) => sum + l.balance, 0);
  const totalKHR =
    outstandingKhr !== undefined
      ? outstandingKhr
      : loans
          .filter((l) => l.currency === "KHR")
          .reduce((sum, l) => sum + l.balance, 0);

  const summaryCard: SummaryCardProps = {
    label: "Summary",
    value: formatCCY(totalUSD, "USD"),
    sub: formatCCY(totalKHR, "KHR"),
    icon: <Wallet color={palette.success.main} size={20} />,
    tone: "success",
  };

  return (
    <Stack spacing={2.5}>
      {/* <Box>
        <SummaryCard {...summaryCard} />
      </Box> */}

      <Box
        sx={{
          border: "0px solid",
          bgcolor: "white",
          borderRadius: "20px",
          padding: 3,
        }}
      >
        <Typography
          sx={{ fontSize: 18, fontWeight: 600, color: "text.primary", mb: 1.5 }}
        >
         Loan Accounts
        </Typography>

        <Stack spacing={2}>
          {loans.map((loan) => {
            const active = loan.id === selectedId || loan.number === selectedId;
            return (
              <BaseCard
                key={`${loan.id}-${loan.currency}`}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onClick={() => onSelect?.(loan.id)}
                onKeyDown={(e) => {
                  if (!onSelect) return;
                  if (e.key === "Enter" || e.key === " ") onSelect(loan.id);
                }}
                sx={{
                  padding: "5px",
                  cursor: onSelect ? "pointer" : "default",
                  backgroundColor: active ? "#2764A514" : "white",
                  border: "none",
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    position: "relative",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 2,
                    paddingLeft: "10px",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontWeight: font.weight.regular,
                        fontSize: font.size.base,
                        color: palette.primary[1000],
                      }}
                    >
                      {loan.name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: font.size.xs,
                        color: palette.text.secondary,
                        mt: 0.25,
                      }}
                    >
                      {formatAccountNumber(loan.number)}
                      {/* {loan.type ? ` | ${loan.type}` : ""} */}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontWeight: font.weight.bold,
                      fontSize: font.size.sm,
                      color: palette.text.primary,
                      paddingLeft: "10px",
                      margin: "5px",
                    }}
                  >
                    <BaseBlurText>
                      {formatCCY(loan.balance, loan.currency)}
                    </BaseBlurText>
                  </Typography>
                </Stack>
              </BaseCard>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}