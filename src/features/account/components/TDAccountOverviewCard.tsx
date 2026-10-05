"use client";

import React, { useState } from "react";
import { Box, Grid, Menu, MenuItem, Stack, Typography } from "@mui/material";
import dayjs from "dayjs";
import { Settings2 } from "lucide-react";

import { font, palette } from "@/theme/palette";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseChip from "@core/components/BaseChip";
import BaseTitle from "@core/components/BaseTitle";
import MaturityDonutChart from "@core/components/MaturityDonutChart";
import { ROLLOVER_OPTIONS } from "../account.data";
import type {
  CompanyProfile,
  CompanyStatus,
  IAccountDetailResponses,
  RolloverOption,
  RolloverOptionCode,
} from "../account.types";

const STATUS_STYLES: Record<CompanyStatus, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: palette.success.main, bg: palette.success.bg },
  dormant: { label: "Dormant", color: palette.status.dormantFrozen, bg: palette.warning.bg },
  frozen: { label: "Frozen", color: palette.status.dormantFrozen, bg: palette.warning.bg },
};

export interface TDAccountOverviewCardProps {
  fixedDeposit: IAccountDetailResponses;
  /** Company/status summary shown above the donut+terms grid — mirrors
   *  AccountOverviewCard's header-then-content layout. */
  company?: CompanyProfile;
  onViewDetails?: () => void;
  chipColor?: string;
  chipBgColor?: string;
  /** Code of the term deposit's current rollover option, if known — highlighted
   *  in the "Change Rollover Option" submenu. */
  currentRolloverCode?: RolloverOptionCode;
  /** Fired with the picked option when a rollover option is chosen from the
   *  "Change Rollover Option" submenu. */
  onChangeRollover?: (option: RolloverOption) => void;
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
      <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{label}</Typography>
      <Box
        sx={{ fontSize: 15, fontWeight: 600, color: "text.primary", mt: 0.25, ...valueSx }}
      >
        {value}
      </Box>
    </Box>
  );
}

export default function TDAccountOverviewCard({
  fixedDeposit: fd,
  company,
  onViewDetails,
  chipColor = palette.slate[950],
  chipBgColor = "transparent",
  currentRolloverCode,
  onChangeRollover,
}: TDAccountOverviewCardProps) {
  const [optionsAnchor, setOptionsAnchor] = useState<null | HTMLElement>(null);
  const ccy = fd.ccy ?? fd.currencyCode ?? "USD";

  const bigValueSx = { fontSize: font.size.lg, fontWeight: 700 };
  const NorValueSx = { fontSize: font.size.base, fontWeight: 700 };

  const fields: Array<{ label: string; value: React.ReactNode; valueSx?: object } | null> = [
    {
      label: "Principal Amount",
      value: <BaseBlurText>{formatCCY(fd.placementAmt ?? 0, ccy)}</BaseBlurText>,
      valueSx: bigValueSx,
    },
    {
      label: "Amount at Maturity",
      value: <BaseBlurText>{formatCCY(fd.totalAmountToReceive ?? 0, ccy)}</BaseBlurText>,
      valueSx: bigValueSx,
    },
    null,
    {
      label: "Interest",
      value: (
        <>
          {(fd.interestRate ?? 0).toFixed(2)}% | <BaseBlurText>{formatCCY(fd.interestAmount ?? 0, ccy)}</BaseBlurText>
        </>
      ),
      valueSx: NorValueSx,
    },
    {
      label: "Withholding Tax",
      valueSx: NorValueSx,
      value: (
        <>
          {(fd.taxRate ?? 0).toFixed(2)}% |{" "}
          <BaseBlurText>{formatCCY(fd.taxAmount ?? 0, ccy)}</BaseBlurText>
        </>
      ),
    },
    { label: "Rollover", value: fd.renewalOption, valueSx: NorValueSx },
    {
      label: "Effective Date",
      value: fd.openedDate ? dayjs(fd.openedDate).format("DD MMM YYYY") : "",
      valueSx: NorValueSx,
    },
    {
      label: "Maturity Date",
      value: fd.maturityDate ? dayjs(fd.maturityDate).format("DD MMM YYYY") : "",
      valueSx: NorValueSx,
    },
    { label: "Tenor", value: fd.tenorMonths ? `${fd.tenorMonths} months` : "", valueSx: NorValueSx },
  ];

  const companyHeader = company && (
    <Stack spacing={1.5} sx={{ pb: 5, mb: 5 }}>
      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "center", gap: 1.5 }}
      >
        <BaseTitle>{company.name}</BaseTitle>

        <BaseChip
          onClick={(e) => {
            e.preventDefault();
            onViewDetails?.();
          }}
          bgColor={chipBgColor}
          borderRadius={1}
          border="1px solid #E8ECF4"
          sx={{ fontSize: 14, fontweight: 400 }}
        >
          {" "}
          View Details
        </BaseChip>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" } }}
        py={4}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            {formatAccountNumber(company.accountNumber)}
          </Typography>
          {company.status && (
            <Box
              sx={{
                px: 1.5,
                py: 0.25,
                borderRadius: "999px",
                bgcolor: STATUS_STYLES[company.status].bg,
                color: STATUS_STYLES[company.status].color,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {STATUS_STYLES[company.status].label}
            </Box>
          )}
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <BaseChip

            onClick={(e) => {
              e.preventDefault();
              setOptionsAnchor(e.currentTarget);
            }}

            bgColor="transparent"
            minWidth="auto"
            height={32}
            borderRadius={1}
            border={`1px solid ${optionsAnchor ? palette.navy[800] : palette.slate[200]}`}
            sx={{
              fontSize: 14,
              fontWeight: 400,
              flexShrink: 0,
              px: 2,
              "&:hover": { borderColor: palette.navy[800] },
            }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", whiteSpace: "nowrap" }}>
              <span>Change Rollover Options</span>
              <Settings2 size={16} />
            </Stack>
          </BaseChip>
          <Menu
            anchorEl={optionsAnchor}
            open={Boolean(optionsAnchor)}
            onClose={() => setOptionsAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <Typography sx={{ px: 2, py: 1, fontSize: 12.5, color: "text.secondary" }}>
              Options
            </Typography>

            {ROLLOVER_OPTIONS.map((option) => (
              <MenuItem
                key={option.code}
                selected={option.code === currentRolloverCode}
                onClick={() => {
                  setOptionsAnchor(null);
                  onChangeRollover?.(option);
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Stack>
    </Stack>
  );

  return (
    <BaseCard>
      {companyHeader}

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={{ xs: 3, md: 4 }}
        sx={{ alignItems: "center" }}
      >
        <MaturityDonutChart totalMaturityDays={fd.onGoingMaturityDays ?? 0} totalDays={fd.totalMaturityDays ?? 0} />

        <Grid container spacing={2.5} sx={{ flex: 1 }}>
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
