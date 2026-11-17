"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import { Box, Skeleton, Typography } from "@mui/material";
import { Calendar } from "lucide-react";

import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import BaseIconBadge from "@core/components/BaseIconBadge";
import BaseButton from "@/@core/components/BaseButton";
import { palette, radius, padding } from "@/theme/palette";
import {
  useListSchedulesQuery,
  mapBackendStatusToUi,
  type ScheduleResponse,
} from "@/features/schedule";
import { formatCCY } from "@/utils/format-ccy";

export interface ScheduleItem {
  id: string;
  day: string;
  month: string;
  title: string;
  status: string;
  statusTone: "danger" | "info" | "success" | "warning";
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
    href: "/schedule",
  },
  {
    id: "2",
    day: "25",
    month: "JUN",
    title: "NexPay Transfer",
    status: "Progress",
    statusTone: "info",
    amount: "$40.00",
    href: "/schedule",
  },
  {
    id: "3",
    day: "26",
    month: "JUN",
    title: "PayPal Refund",
    status: "Completed",
    statusTone: "success",
    amount: "$10.00",
    href: "/schedule",
  },
];

const toneStyleMap: Record<ScheduleItem["statusTone"], { bg: string; fg: string }> = {
  danger: { bg: "#FEE2E2", fg: "#EF4444" },
  info: { bg: "#DBEAFE", fg: "#2563EB" },
  success: { bg: "#DCFCE7", fg: "#16A34A" },
  warning: { bg: "#FEF3C7", fg: "#D97706" },
};

export interface ScheduleCardProps {
  items?: ScheduleItem[];
  viewAllHref?: string;
  isLoading?: boolean;
}

export default function ScheduleCard({
  items: propItems,
  viewAllHref = "/schedule",
  isLoading: propIsLoading,
}: ScheduleCardProps) {
  const hasPropItems = propItems !== undefined;

  const {
    data: backendSchedules,
    isLoading: isBackendLoading,
  } = useListSchedulesQuery(undefined, {
    refetchOnMountOrArgChange: true,
    skip: hasPropItems,
  });

  const isLoading =
    propIsLoading ??
    (!hasPropItems && isBackendLoading && !backendSchedules);

  const items = useMemo<ScheduleItem[]>(() => {
    if (hasPropItems && propItems) {
      return propItems;
    }

    if (!backendSchedules || !Array.isArray(backendSchedules) || backendSchedules.length === 0) {
      return [];
    }

    return backendSchedules.slice(0, 3).map((item: ScheduleResponse) => {
      const dateStr = item.nextRunAt || item.startDate || item.createdAt;
      const dateObj = dateStr ? dayjs(dateStr) : null;
      const day = dateObj && dateObj.isValid() ? dateObj.format("DD") : "--";
      const month = dateObj && dateObj.isValid() ? dateObj.format("MMM").toUpperCase() : "--";

      const statusUpper = (item.status || "").toUpperCase();
      let statusTone: ScheduleItem["statusTone"] = "info";
      if (statusUpper === "ACTIVE" || statusUpper === "COMPLETED") {
        statusTone = "success";
      } else if (statusUpper === "FAILED" || statusUpper === "CANCELLED") {
        statusTone = "danger";
      } else if (statusUpper === "PAUSED") {
        statusTone = "warning";
      } else {
        statusTone = "info";
      }

      const formattedAmount = formatCCY(item.amount ?? 0, item.currency || "USD");

      const title =
        item.name ||
        item.transferTypeLabel ||
        (item.toAccountName
          ? item.toBankName
            ? `${item.toAccountName} · ${item.toBankName}`
            : item.toAccountName
          : null) ||
        "Scheduled Transfer";

      return {
        id: item.referenceId,
        day,
        month,
        title,
        status: mapBackendStatusToUi(item.status),
        statusTone,
        amount: formattedAmount,
        href: viewAllHref,
      };
    });
  }, [hasPropItems, propItems, backendSchedules, viewAllHref]);

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
      </Box>

      {/* Content */}
      {isLoading ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
          {[1, 2, 3].map((key) => (
            <Box
              key={key}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                py: 1.5,
                px: 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: "50%" }} />
                <Box>
                  <Skeleton variant="text" width={110} height={20} />
                  <Skeleton variant="rounded" width={60} height={18} sx={{ borderRadius: "9999px", mt: 0.5 }} />
                </Box>
              </Box>
              <Skeleton variant="text" width={65} height={24} />
            </Box>
          ))}
        </Box>
      ) : items.length === 0 ? (
        /* Empty / Default card state matching design */
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            py: 4.5,
            px: 3,
            borderRadius: "16px",
            border: `1px dashed ${palette.slate[200]}`,
            bgcolor: "#FBFCFD",
            textAlign: "center",
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              bgcolor: palette.slate[100],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1.5,
            }}
          >
            <Calendar size={20} color={palette.slate[400]} strokeWidth={1.8} />
          </Box>

          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 600,
              color: palette.slate[900],
              lineHeight: 1.3,
            }}
          >
            No schedules set
          </Typography>

          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 400,
              color: palette.slate[400],
              lineHeight: 1.4,
              mt: 0.5,
            }}
          >
            Automatic payments will appear here.
          </Typography>
        </Box>
      ) : (
        /* List Items */
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
                  <BaseIconBadge
                    direction="income"
                    size={44}
                    bgColor={palette.slate[100]}
                    icon={
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                    }
                  />

                  {/* Title and Status Chip */}
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

                    <Box
                      component="span"
                      sx={{
                        display: "inline-block",
                        mt: 0.5,
                        px: 2.5,
                        py: 0.75,
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
      )}

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
