"use client";

import Image from "next/image";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { ArrowUpRight, Eye, EyeOff, HandCoins, ListCollapse, Wallet } from "lucide-react";
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

export default function StatCardRenew({
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
    return (
      <BaseCard
        sx={{
          background: 'linear-gradient(to right, #2764A5, #21558C, #1B4674, #143457, #0F263F)',
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          p: `${padding.xxl}px`,
          borderRadius: `${radius.xl}px`,
          color:"white",
          border: `1px solid ${palette.slate[200]}`,
          bgcolor: palette.white,
        }}
      >
        {/* Top Header Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 500,
              color: palette.white,
            }}
          >
            {label}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Hide / Show Toggle Pill */}
            <Box
              component="button"
              type="button"
              onClick={() => dispatch(toggleHideAmount())}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                px: 2.5,
                py: 1.55,
                borderRadius: "9999px",
                bgcolor: palette.slate[100],
                border: "none",
                cursor: "pointer",
                color: palette.slate[900],
                fontSize: 13,
                fontWeight: 500,
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: palette.slate[200],
                },
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
                padding:"none",
                marginLeft:"10px",
                borderRadius: "50%",
                width:"34px",
                height:"34px",
                bgcolor: palette.slate[100],
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: palette.slate[200],
                },
              }}
            >
              <Image
                src="/branding/khqr-small.png"
                alt="KHQR"
                width={24}
                height={24}
                style={{ objectFit: "contain" ,}}
              />
            </Box>
          </Box>
        </Box>

        {/* Balance Values */}
        <Box sx={{ my: 0.5 }}>
          {sub && (
            <Typography
              component="div"
              sx={{
                fontSize: { xs: 22, sm: 26 },
                fontWeight: 700,
                color: palette.white,
                letterSpacing: "-0.02em",
                lineHeight: 1.25,
              }}
            >
              <BaseBlurText>{sub}</BaseBlurText>
            </Typography>
          )}

          <Typography
            component="div"
            sx={{
              fontSize: { xs: 16, sm: 19 },
              fontWeight: 700,
              color: palette.white ,
              lineHeight: 1.25,
              mt: 2.75,
            }}
          >
            <BaseBlurText>{value}</BaseBlurText>
          </Typography>
        </Box>

        {/* Action Buttons Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 4,
            mt: 2.5,
          }}
        >
          {/* Send money */}
          <BaseButton
            startIcon={<ArrowUpRight size={15}/>}
            title="Send money"
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: "999px",
              textTransform: "none",
              fontSize: 15,
              fontWeight: 400,
              color: "#FFFFFF",
              border: "0px",
              backgroundImage: "linear-gradient(180deg, #3584C0 0%, #1F5E94 100%)",
              boxShadow: "none",
              "&:hover": {
                backgroundImage: "linear-gradient(180deg, #2D76AF 0%, #194F80 100%)",
                boxShadow: "none",
              },
            }}
          />
          <BaseButton
            startIcon={<HandCoinsIcon size={15}/>}
            title="Pay Bill"
            sx={{
              fontSize: 15,
              fontWeight: 400,
               px: 4,
              py: 1.5,
              bgcolor: "#EDF0F4",
              border: "0px",
              color: "#000000",
              "&:hover": {
                backgroundColor: "#d4d4d4",
              },
            }}
          />


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
