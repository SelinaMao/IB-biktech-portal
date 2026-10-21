"use client";

import React from "react";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import { ExternalLink, SquareArrowOutUpRight } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import { palette, radius, padding } from "@/theme/palette";
import BaseButton from "@/@core/components/BaseButton";

export interface ScheduleItem {
  id: string;
  day: string;
  month: string;
  title: string;
  status: string;
  statusTone: "danger" | "info" | "success";
  amount: string;
  href?: string;
}

export const defaultScheduleItems: ScheduleItem[] = [
  {
    id: "1",
    day: "25",
    month: "JUN",
    title: "Bakong Payment",
    status: "Over Due",
    statusTone: "danger",
    amount: "$25.00",
    href: "/transfer",
  },
  {
    id: "2",
    day: "25",
    month: "JUN",
    title: "NexPay Transfer",
    status: "Progress",
    statusTone: "info",
    amount: "$40.00",
    href: "/transfer",
  },
  {
    id: "3",
    day: "26",
    month: "JUN",
    title: "PayPal Refund",
    status: "Completed",
    statusTone: "success",
    amount: "$10.00",
    href: "/transfer",
  },
];

const toneStyleMap: Record<ScheduleItem["statusTone"], { bg: string; fg: string }> = {
  danger: { bg: "#FEE2E2", fg: "#EF4444" },
  info: { bg: "#DBEAFE", fg: "#2563EB" },
  success: { bg: "#DCFCE7", fg: "#16A34A" },
};

interface ScheduleCardProps {
  items?: ScheduleItem[];
  viewAllHref?: string;
}

export default function ScheduleCard({
  items = defaultScheduleItems,
  viewAllHref = "/transfer",
}: ScheduleCardProps) {
  return (
    <BaseCard
      sx={{
        p: `${padding.xxl}px`,
        borderRadius: `${radius.xl}px`,
        border: `1px solid ${palette.slate[200]}`,
        bgcolor: palette.white,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: { xs: 18, sm: 20 },
            fontWeight: 700,
            color: palette.slate[900],
            lineHeight: 1.2,
          }}
        >
          Schedule
        </Typography>

        {/* External Link Icon */}
        <Box
          component={Link}
          href={viewAllHref}
          aria-label="View all scheduled items"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            color: palette.slate[900],
            p: 1,
            backgroundColor:palette.slate[100],
            borderRadius: "50%",
            transition: "opacity 0.15s ease",
            "&:hover": {
              opacity: 0.7,
            },
          }}
        >
          <SquareArrowOutUpRight size={20} />
        </Box>
      </Box>

      {/* List Items */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const tone = toneStyleMap[item.statusTone] ?? toneStyleMap.info;

          return (
            <Box
              key={item.id}
              component={Link}
              href={item.href ?? viewAllHref}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1.75,
                borderBottom: isLast ? "none" : `1px solid ${palette.slate[100]}`,
                textDecoration: "none",
                color: "inherit",
                transition: "background-color 0.15s ease",
                px: 1,
                borderRadius: `${radius.lg}px`,
                "&:hover": {
                  bgcolor: palette.slate[50],
                },
              }}
            >
              {/* Left: Date Badge + Title/Status */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                {/* Date Container */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: `${radius.md}px`,
                    bgcolor: palette.slate[100],
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: palette.slate[900],
                      lineHeight: 1.1,
                    }}
                  >
                    {item.day}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: palette.slate[450],
                      lineHeight: 1.1,
                      mt: 0.25,
                    }}
                  >
                    {item.month}
                  </Typography>
                </Box>

                {/* Title and Status Chip */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: palette.slate[900],
                      lineHeight: 1.25,
                      padding:1
                    }}
                  >
                    {item.title}
                  </Typography>

                  <Box
                    component="span"
                    sx={{
                      display: "inline-block",
                      mt: 0.5,
                      px: 2.5,
                      py: 1,
                      borderRadius: `${radius.pill}px`,
                      bgcolor: tone.bg,
                      color: tone.fg,
                      fontSize: 12,
                      fontWeight: 500,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.status}
                  </Box>
                </Box>
              </Box>

              {/* Right: Amount */}
              <Typography
                component="div"
                sx={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: palette.slate[900],
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <BaseBlurText>{item.amount}</BaseBlurText>
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* Footer View All Button */}
<BaseButton
  component={Link}
  href={viewAllHref}
  title="View all"
  fullWidth
  sx={{
    py: 1.4,
    borderRadius: "9999px",
    bgcolor: palette.slate[100],
    color: palette.slate[900],
    fontSize: 15,
    fontWeight: 500,
    textDecoration: "none",
    mt: 0.5,
    "&:hover": {
      bgcolor: palette.slate[200],
    },
  }}
/>
    </BaseCard>
  );
}
