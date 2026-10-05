"use client";

import { Box, Stack, Typography } from "@mui/material";
import { Wallet } from "lucide-react";

import { palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import { formatCCY } from "@/utils/format-ccy";

export interface AvailableBalanceCardProps {
  balanceKhr: number;
  balanceUsd: number;
}

/** Available Balance summary card — shared by the Account sidebar and transfer dialogs. */
export default function AvailableBalanceCard({ balanceKhr, balanceUsd }: AvailableBalanceCardProps) {
  return (
    <BaseCard sx={{ p: 2.5 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            bgcolor: palette.success.bg,
            color: palette.success.main,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Wallet size={20} />
        </Box>
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: "text.primary" }}>
          Available Balance
        </Typography>
      </Stack>
      <Typography sx={{ fontSize: 22, fontWeight: 700, color: "text.primary" }}>
        <BaseBlurText>{formatCCY(balanceKhr, "KHR")}</BaseBlurText>
      </Typography>
      <Typography sx={{ fontSize: 15, color: "text.secondary", mt: 0.5 }}>
        <BaseBlurText>{formatCCY(balanceUsd, "USD")}</BaseBlurText>
      </Typography>
    </BaseCard>
  );
}
