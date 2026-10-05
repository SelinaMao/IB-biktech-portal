"use client";

import { Box, Stack, Typography } from "@mui/material";
import { ChevronRight, HandCoins } from "lucide-react";

import { font, palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import { formatCCY } from "@/utils/format-ccy";
import StatCard from "@/features/dashboard/components/StatCard";
import type { StatCardProps } from "@/features/dashboard/dashboard.types";
import type { LoanAccountListItem } from "../loan.types";

export interface LoansSidebarProps {
  outstandingKhr: number;
  outstandingUsd: number;
  loans: LoanAccountListItem[];
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
  const outstandingBalanceCard: StatCardProps = {
    label: "Outstanding Balance",
    value: formatCCY(outstandingUsd, "USD"),
    sub: formatCCY(outstandingKhr, "KHR"),
    icon: <HandCoins color={palette.info.main} size={20} />,
    tone: "info",
  };

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography sx={{ fontSize: 24, fontWeight: 400, color: "text.primary", mb: 1.5 }}>
          Summary
        </Typography>
        <StatCard {...outstandingBalanceCard} />
      </Box>

      <Box>
        <Typography sx={{ fontSize: 24, fontWeight: 400, color: "text.primary", mb: 1.5 }}>
          Loans
        </Typography>
        <Stack spacing={2}>
          {loans.map((loan) => {
            const active = loan.id === selectedId;
            return (
              <BaseCard
                key={loan.id}
                role={onSelect ? "button" : undefined}
                tabIndex={onSelect ? 0 : undefined}
                onClick={() => onSelect?.(loan.id)}
                onKeyDown={(e) => {
                  if (!onSelect) return;
                  if (e.key === "Enter" || e.key === " ") onSelect(loan.id);
                }}
                sx={{
                  cursor: onSelect ? "pointer" : "default",
                  border: `1.5px solid ${active ? palette.navy[800] : "#EDEDEC"}`,
                  outline: "none",
                  ...(active && { backgroundColor: "transparent" }),
                }}
              >
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: font.weight.regular, fontSize: font.size.base, color: palette.primary[1000] }}>
                      {loan.name}
                    </Typography>
                    <Typography sx={{ fontSize: font.size.xs, color: palette.text.secondary, mt: 0.25 }}>
                      {loan.number} | {loan.type}
                    </Typography>
                  </Box>
                  <ChevronRight
                    size={18}
                    color={active ? palette.navy[800] : palette.slate[400]}
                  />
                </Stack>
                <Typography sx={{ fontWeight: font.weight.bold, fontSize: font.size.lg, color: palette.text.primary }}>
                  <BaseBlurText>{formatCCY(loan.balance, loan.currency)}</BaseBlurText>
                </Typography>
              </BaseCard>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
