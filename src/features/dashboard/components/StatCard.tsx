"use client";

import { Box, Typography } from "@mui/material";
import { ClipboardClock, HandCoins, Wallet } from "lucide-react";

import { font, palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseChip from "@core/components/BaseChip";
import type { StatCardProps, StatTone } from "../dashboard.types";
import { Pallet } from "@mui/icons-material";

export const toneMap: Record<StatTone, { fg: string; bg: string }> = {
  success: { fg: palette.success.main, bg: palette.success.bg },
  warning: { fg: palette.warning.main, bg: palette.warning.bg },
  info: { fg: palette.info.main, bg: palette.info.bg },
  // 'purple' kept as the accent tone key; now a warm Twine tan (on-brand).
  purple: { fg: palette.primary[700], bg: palette.primary[100] },
};

export default function StatCard({
  label,
  value,
  sub,
  action,
  icon,
  tone,
}: StatCardProps) {
  const c = toneMap[tone];
  return (
    <BaseCard sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1 }}>
        {/* two-column grid: fixed icon column + content column so label/sub/value align */}
        <Box sx={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 5, alignItems: "start", mb: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1,
              bgcolor: c.bg,
              color: c.fg,
              display: "grid",
              placeItems: "center",
            }}
          >
            {icon}
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ color: "text.primary", fontSize: 16 }}>
              {label}
            </Typography>

            {sub && (
              <Typography variant="body2" sx={{ mt: 1, fontSize: 18, fontWeight: 700, }}>
                <BaseBlurText>{sub}</BaseBlurText>
              </Typography>
            )}
            <Typography
              variant="body2"
              sx={{
                color: "text.primary",
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 2,
                mt: 2,
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              <BaseBlurText>{value}</BaseBlurText>
            </Typography>
          </Box>
        </Box>
      </Box>

      {action && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <BaseChip minWidth={80} height={33} sx={{ background: palette.info[50], color: palette.info[700], fontSize: font.size.xs }}>{action}</BaseChip>
        </Box>
      )}
    </BaseCard>
  );
}

export const statCards: StatCardProps[] = [
  {
    label: "Available Balance",
    value: "$1,221.57",
    sub: "៛ 4,886,2800",
    icon: <Wallet color="#16A34A" />,
    tone: "success",
    action: "View All",
  },
  {
    label: "Loan Outstanding",
    value: "$1,221.57",
    sub: "៛ 4,886,280",
    icon: <HandCoins color="#2F2B7A" />,
    tone: "info",
    action: "View All",
  },
  {
    label: "Pending Approval",
    value: "3",
    icon: <ClipboardClock />,
    tone: "warning",
    action: "View All",
  },
];
