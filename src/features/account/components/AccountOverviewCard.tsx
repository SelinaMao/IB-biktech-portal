"use client";

import React from "react";
import { Box, CardContent, Stack, Typography } from "@mui/material";

import { palette } from "@/theme/palette";
import { formatCCY } from "@/utils/format-ccy";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import CashFlowChart, { type CashFlowPoint } from "@core/components/CashFlowChart";
import type { CompanyProfile, CompanyStatus, IAccountDetailResponses } from "../account.types";
import BaseChip from "@/@core/components/BaseChip";
import BaseTitle from "@/@core/components/BaseTitle";

const STATUS_STYLES: Record<CompanyStatus, { label: string; color: string }> = {
  active: { label: "Active", color: palette.success.main },
  dormant: { label: "Dormant", color: palette.status.dormantFrozen },
  frozen: { label: "Frozen", color: palette.status.dormantFrozen },
};

/** Which `IAccountDetailResponses` fields the stat tiles show, and in what order. */
const STAT_FIELDS: Array<{ key: keyof IAccountDetailResponses; label: string }> = [
  { key: "ledgerBalance", label: "Ledger Balance" },
  { key: "overdraftLimit", label: "OD Limit" },
  { key: "blockedBalance", label: "Blocked Balance" },
  { key: "availableBalance", label: "Available Balance" },
];

export interface AccountOverviewCardProps {
  company: CompanyProfile;
  /** No live cash-flow API yet — chart is hidden entirely when omitted. */
  data?: CashFlowPoint[];
  stats: IAccountDetailResponses;
  onViewDetails?: () => void;
  chipColor?: string;
  chipBgColor?: string;
}

export default function AccountOverviewCard({
  company,
  data,
  stats,
  onViewDetails,
  chipColor = palette.slate[950],
  chipBgColor = "transparent",
}: AccountOverviewCardProps) {
  const currency = stats.ccy ?? stats.currencyCode ?? "";
  return (
    <BaseCard sx={{ p: 0 }}>
      <CardContent sx={{ p: 6 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
            mb: 1,
          }}
        >
          <BaseTitle fontSize={18} fontWeight={700} color={palette.text.primary}>
            {company.name}
          </BaseTitle>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
            <BaseChip

              onClick={(e) => {
                e.preventDefault();
                onViewDetails?.();
              }}
              color={chipColor}
              bgColor={chipBgColor}
              borderRadius={1}
              border="1px solid #E8ECF4"
              sx={{ fontSize: 14, fontweight: 400, px: 1.5, py: 0 }}
            >
              {" "}
              View Details
            </BaseChip>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2.5, flexWrap: "wrap" }}>
          <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
            {formatAccountNumber(company.accountNumber)}
          </Typography>
          {company.status &&
            (Object.keys(STATUS_STYLES) as CompanyStatus[]).map((key) => (
              <React.Fragment key={key}>
                <Typography sx={{ fontSize: 13, color: palette.slate[300] }}>|</Typography>
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: company.status === key ? 700 : 500,
                    color: STATUS_STYLES[key].color,
                  }}
                >
                  {STATUS_STYLES[key].label}
                </Typography>
              </React.Fragment>
            ))}
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
          {data && (
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <CashFlowChart
                data={data}
                activeCurrency="USD"
                showCard={false}
                showHeader={false}
                showStats={false}
                legendStartAdornment={
                  <Typography sx={{ fontSize: 18, color: palette.text.primary, fontWeight: 500 }}>
                    Latest Transactions
                  </Typography>
                }
              />
            </Box>
          )}

          <Stack
            spacing={2.5}
            px={{ xs: 0, md: 3 }}
            sx={{ width: { xs: "100%", md: 210 }, flexShrink: 0, }}
          >
            {STAT_FIELDS.filter(({ key }) => stats[key] !== undefined).map(({ key, label }) => (
              <Box key={key}>
                <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{label}</Typography>
                <Typography sx={{ fontSize: 17, fontWeight: 700, color: "text.primary", mt: 0.25 }}>
                  <BaseBlurText>{formatCCY(stats[key] as number, currency)}</BaseBlurText>
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </BaseCard>
  );
}
