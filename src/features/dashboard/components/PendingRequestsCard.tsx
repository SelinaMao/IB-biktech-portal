"use client";

import React from "react";
import Link from "next/link";
import { Box, Typography } from "@mui/material";
import BaseButton from "@core/components/BaseButton";
import {
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  HandCoins,
  ScrollText,
  Settings,
  SquareArrowOutUpRight,
} from "lucide-react";

import BaseCard from "@core/components/BaseCard";
import { font, palette, radius, padding } from "@/theme/palette";

export interface PendingRequestItem {
  id: string;
  title: string;
  count: number;
  icon: React.ReactNode;
  href: string;
}

export const defaultPendingRequests: PendingRequestItem[] = [
  {
    id: "transfer",
    title: "Transfer",
    count: 3,
    icon: <ArrowUpRight size={20} color={palette.slate[900]} />,
    href: "/approval",
  },
  {
    id: "bill-payment",
    title: "Bill Payment",
    count: 2,
    icon: <HandCoins size={20} color={palette.slate[900]} />,
    href: "/approval",
  },
  {
    id: "payroll",
    title: "Payroll",
    count: 4,
    icon: <ScrollText size={20} color={palette.slate[900]} />,
    href: "/approval",
  },
  {
    id: "admin-setup",
    title: "Admin Setup",
    count: 1,
    icon: <Settings size={20} color={palette.slate[900]} />,
    href: "/approval",
  },
];

interface PendingRequestsCardProps {
  items?: PendingRequestItem[];
  totalBadge?: number;
  viewAllHref?: string;
}

export default function PendingRequestsCard({
  items = defaultPendingRequests,
  totalBadge,
  viewAllHref = "/approval",
}: PendingRequestsCardProps) {
  const totalCount =
    totalBadge ?? items.reduce((sum, item) => sum + item.count, 0);

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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: 18, sm: 20 },
              fontWeight: 700,
              color: palette.slate[900],
              lineHeight: 1.2,
            }}
          >
            Pending Request
          </Typography>

          {/* Badge */}
          <Box
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: palette.orange,
              color: palette.white,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {totalCount}
          </Box>
        </Box>

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

      {/* Request Items List */}
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <Box
              key={item.id}
              component={Link}
              href={item.href}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1.75,
                borderBottom: isLast ? "none" : `1px solid ${palette.slate[100]}`,
                textDecoration: "none",
                color: "inherit",
                transition: "background-color 0.15s ease",
                px: 0.5,
                borderRadius: 1.5,
                "&:hover": {
                  bgcolor: palette.slate[50],
                },
              }}
            >
              {/* Left: Icon + Labels */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    bgcolor: palette.slate[100],
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: 15,
                      fontWeight: 500,
                      color: palette.slate[900],
                      lineHeight: 1.25,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: palette.slate[450],
                      lineHeight: 1.25,
                      mt: 0.5,
                    }}
                  >
                    {item.count} {item.count === 1 ? "request" : "requests"}
                  </Typography>
                </Box>
              </Box>

              {/* Right: Chevron Circle Button */}
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: palette.slate[100],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: palette.slate[700],
                  flexShrink: 0,
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: palette.slate[200],
                  },
                }}
              >
                <ChevronRight size={18} />
              </Box>
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
