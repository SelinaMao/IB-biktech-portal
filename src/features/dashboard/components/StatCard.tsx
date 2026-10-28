"use client";

import Image from "next/image";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { ArrowUpRight, DollarSign, Eye, EyeOff, HandCoins, ListCollapse, Wallet } from "lucide-react";
import { HandCoinsIcon } from "lucide-react";
import { font, palette, radius, padding } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseChip from "@core/components/BaseChip";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleHideAmount } from "@/store/global/global.slice";
import type { StatCardProps, StatTone } from "../dashboard.types";
import BaseButton from "@/@core/components/BaseButton";
import { SmartButton } from "@mui/icons-material";

export const toneMap: Record<StatTone, { fg: string; bg: string }> = {
  success: { fg: palette.success.main, bg: palette.success.bg },
  warning: { fg: palette.warning.main, bg: palette.warning.bg },
  info: { fg: palette.info.main, bg: palette.info.bg },
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
  const dispatch = useAppDispatch();
  const hideAmount = useAppSelector((state) => state.global.hideAmount);

  if (label === "Available Balance") {
    const khrAmount = sub?.includes("KHR")
      ? sub
      : value?.includes("KHR")
      ? value
      : "120,293,000.00 KHR";

    const usdAmount = value?.includes("USD")
      ? value
      : sub?.includes("USD")
      ? sub
      : "293,000.00 USD";

    return (
      <BaseCard
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "20px",
          p: { xs: 2.5, sm: "20px 24px" },
          border: `1px solid ${palette.slate[200]}`,
          boxShadow: "none",
          width: "100%",
        }}
      >
        {/* Top Header Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 2.5,
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 16, sm: 18 },
              fontWeight: font.weight.regular,
              color: "#0F172A",
            }}
          >
            {label}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            {/* Hide / Show Toggle Pill */}
            <Box
              component="button"
              type="button"
              onClick={() => dispatch(toggleHideAmount())}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 2,
                py: 1.5,
                borderRadius: "9999px",
                bgcolor: "#EDF0F4",
                border: "none",
                cursor: "pointer",
                color: "#0F172A",
                fontSize: 13,
                fontWeight: 500,
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: "#E2E8F0",
                },
                marginRight:"8px"
              }}
            >
              {hideAmount ? <Eye size={15} /> : <EyeOff size={15} />}
              <span>{hideAmount ? "Show" : "Hide"}</span>
            </Box>

            {/* KHQR Icon Button */}
            <Box
              component="button"
              type="button"
              aria-label="KHQR"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "50%",
                width: "34px",
                height: "34px",
                bgcolor: "#EDF0F4",
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: "#E2E8F0",
                },
              }}
            >
              <Image
                src="/branding/khqr-small.png"
                alt="KHQR"
                width={20}
                height={20}
                style={{ objectFit: "contain" }}
              />
            </Box>
          </Box>
        </Box>

        {/* Currency Balances Row (KHR and USD side by side) */}
        <Box
          sx={{
            
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: { xs: 15, sm: 20, md: 40 },
            mt: 6,
          }}
        >
          {/* KHR Item */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                bgcolor: "#FFF4E8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Image
                src="/assets/images/riel.png"
                alt="KHR"
                width={5}
                height={14}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 15, color: "#64748B", fontWeight: 300, lineHeight: 1.2 }}>
                KHR
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 18, sm: 20, md: 22 },
                  fontWeight: 700,
                  color: "#0F172A",
                  mt: 0.5,
                  lineHeight: 1.2,
                }}
              >
                <BaseBlurText>{khrAmount}</BaseBlurText>
              </Typography>
            </Box>
          </Box>

          {/* USD Item */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                bgcolor: "#EAF6EE",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
               <Image
                src="/assets/images/dollar.png"
                alt="USD"
                width={10}
                height={13}
                style={{ objectFit: "contain" }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 15, color: "#64748B", fontWeight: 300, lineHeight: 1.2 }}>
                USD
              </Typography>
              <Typography
                sx={{
                  fontSize: { xs: 18, sm: 20, md: 22 },
                  fontWeight: 700,
                  color: "#0F172A",
                  mt: 0.5,
                  lineHeight: 1.2,
                }}
              >
                <BaseBlurText>{usdAmount}</BaseBlurText>
              </Typography>
            </Box>
          </Box>
        </Box>
      </BaseCard>
    );
  }

  // Fallback for other stat cards
  return (
    <BaseCard sx={{ height: "100%", display: "flex", flexDirection: "column", }}>
      <Box sx={{ flex: 1 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ color: "text.primary", fontSize: 16 }}>
            {label}
          </Typography>

          {sub && (
            <Typography variant="body2" sx={{ mt: 1, fontSize: 20, fontWeight: 700 }}>
              <BaseBlurText>{sub}</BaseBlurText>
            </Typography>
          )}
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              display: "inline-flex",
              alignItems: "center",
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

      {action && (
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-start", mt: 1.5 }}>
          <BaseChip minWidth={80} height={33} sx={{ background: palette.info[50], color: palette.info[700], fontSize: font.size.xs }}>
            {action}
          </BaseChip>
        </Box>
      )}
    </BaseCard>
  );
}

export const statCards: StatCardProps[] = [
  {
    label: "Available Balance",
    value: "293,000.00 USD",
    sub: "120,293,000.00 KHR",
    icon: <Wallet color="#16A34A" />,
    tone: "success",
    action: "View All",
  },
];
