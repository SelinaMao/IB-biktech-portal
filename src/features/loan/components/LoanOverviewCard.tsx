"use client";

import React from "react";
import { Box, Grid, Stack, Typography } from "@mui/material";

import { font, palette } from "@/theme/palette";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseChip from "@core/components/BaseChip";
import BaseTitle from "@core/components/BaseTitle";
import MaturityDonutChart from "@core/components/MaturityDonutChart";
import type { BorrowerProfile, LoanScheduleDetails, LoanStatus } from "../loan.types";

const STATUS_STYLES: Record<LoanStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: palette.success.main, bg: palette.success.bg },
  overdue: { label: "Overdue", color: palette.danger.main, bg: palette.danger.bg },
  closed: { label: "Closed", color: palette.status.dormantFrozen, bg: palette.warning.bg },
};

export interface LoanOverviewCardProps {
  borrower: BorrowerProfile;
  schedule: LoanScheduleDetails;
  onViewDetails?: () => void;
  chipColor?: string;
  chipBgColor?: string;
}

function Field({
  label,
  value,
  valueSx,
}: {
  label: string;
  value: React.ReactNode;
  valueSx?: object;
}) {
  return (
    <Box>
      <Typography sx={{ fontSize: font.size.sm, color: "text.secondary", fontWeight: font.weight.medium }}>{label}</Typography>
      <Box
        sx={{ fontSize: font.size.lg, fontWeight: font.weight.bold, color: "text.primary", mt: 0.25, ...valueSx }}
      >
        {value}
      </Box>
    </Box>
  );
}

export default function LoanOverviewCard({
  borrower,
  schedule: sch,
  onViewDetails,
  chipColor = palette.slate[950],
  chipBgColor = "transparent",
}: LoanOverviewCardProps) {
  const ccy = sch.currency ?? "USD";

  const fields: Array<{ label: string; value: React.ReactNode; valueSx?: object } | null> = [
    {
      label: "Current Outstanding",
      value: <BaseBlurText>{formatCCY(sch.outstandingPrincipal, ccy)}</BaseBlurText>,
    },
    {
      label: "Approved Limit",
      value: <BaseBlurText>{formatCCY(sch.approvedLimit, ccy)}</BaseBlurText>,
    },
    { label: "Interest", value: `${sch.interestRatePct.toFixed(2)}%` },
    { label: "Disbursement Date", value: sch.disbursementDate },
    { label: "Maturity Date", value: sch.maturityDate },
    { label: "Repayment Frequency", value: sch.repaymentMethod },
    {
      label: "Next Payment Amount",
      value: <BaseBlurText>{formatCCY(sch.nextInstallmentAmount, ccy)}</BaseBlurText>,
    },
    { label: "Next Payment Date", value: sch.nextInstallmentDate },
    {
      label: "No. of Overdue",
      value: sch.overdueCount,
      valueSx: { color: palette.danger.main },
    },
  ];

  return (
    <BaseCard>
      <Stack spacing={1.5} sx={{ pb: 5, mb: 5 }}>
        <Stack
          direction="row"
          sx={{ justifyContent: "space-between", alignItems: "center", gap: 1.5 }}
        >
          <BaseTitle>{borrower.name}</BaseTitle>

          <BaseChip

            onClick={(e) => {
              e.preventDefault();
              onViewDetails?.();
            }}
            color={chipColor}
            bgColor={chipBgColor}

            borderRadius={1}
            border="1px solid #E8ECF4"
            sx={{ fontSize: 14, fontweight: 400 }}
          >
            {" "}
            View Details
          </BaseChip>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            {formatAccountNumber(borrower.accountNumber)}
          </Typography>
          <Typography sx={{ fontSize: 13, color: palette.slate[300] }}>|</Typography>
          <Typography
            sx={{ fontSize: font.size.md, fontWeight: font.weight.regular, color: STATUS_STYLES[borrower.status].color }}
          >
            {STATUS_STYLES[borrower.status].label}
          </Typography>
          {borrower.creditRemark && (
            <>
              <Typography sx={{ fontSize: 13, color: palette.slate[300] }}>|</Typography>
              <Typography sx={{ fontSize: font.size.md, fontWeight: font.weight.regular, color: palette.status.dormantFrozen }}>
                {borrower.creditRemark}
              </Typography>
            </>
          )}
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        sx={{ alignItems: "center" }}
      >
        <MaturityDonutChart
          totalMaturityDays={sch.remainingInstallments}
          totalDays={sch.totalInstallments}
          caption={"Remaining\nInstallments"}
        />

        <Grid container spacing={3} sx={{ flex: 1 }}>
          {fields.map((field, index) => (
            <Grid key={index} size={{ xs: 6, sm: 4 }}>
              {field && <Field label={field.label} value={field.value} valueSx={field.valueSx} />}
            </Grid>
          ))}
        </Grid>
      </Stack>
    </BaseCard>
  );
}
