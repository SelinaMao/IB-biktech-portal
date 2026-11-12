"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import { palette } from "@/theme/palette";
import BaseBlurText from "@core/components/BaseBlurText";
import BaseCard from "@core/components/BaseCard";
import { formatDate } from "@/utils/date-time";
import type { ApprovalEntry, ApprovalSummary, ApprovalTypeBreakdown } from "../approval.types";
import ApprovalTypeBreakdownCard, {
  FIXED_APPROVAL_TYPE_BREAKDOWN,
} from "./ApprovalTypeBreakdownCard";

export const FIXED_APPROVAL_DATA = {
  pendingCount: 4,
  oldestDateText: "Oldest from 15 Oct 2026",
  pendingAmountUSD: "USD 27,200.00",
  pendingAmountSub: "KHR 1,680,000",
  typeBreakdown: FIXED_APPROVAL_TYPE_BREAKDOWN,
};

export interface ApprovalSummaryCardsProps {
  /** Total count of pending approvals. Falls back to default mock if undefined. */
  pendingCount?: number;
  /** Subtitle for the pending count, e.g. "Oldest from 15 Oct 2026". */
  oldestDateText?: string;
  /** Primary pending amount string, e.g. "USD 27,200.00". */
  pendingAmountUSD?: string;
  /** Secondary pending amount subtext, e.g. "KHR 1,680,000". */
  pendingAmountSub?: string;
  /** Breakdown by transaction type. Falls back to dynamic computation if undefined. */
  typeBreakdown?: ApprovalTypeBreakdown[];
  /** Optional summary object matching ApprovalSummary. */
  summary?: Partial<ApprovalSummary>;
  /** Dynamic pending entries list from API to automatically compute all missing metrics. */
  entries?: ApprovalEntry[];
  /** Optional title override for the breakdown card. */
  breakdownTitle?: string;
  /** Whether data is loading from the API */
  isLoading?: boolean;
  /** Click event when a breakdown row is clicked (e.g. to filter list by type) */
  onBreakdownItemClick?: (item: ApprovalTypeBreakdown) => void;
  /** Custom sx for the outer Grid container. */
  sx?: SxProps<Theme>;
}

export default function ApprovalSummaryCards({
  pendingCount,
  oldestDateText,
  pendingAmountUSD,
  pendingAmountSub,
  typeBreakdown,
  summary,
  entries,
  breakdownTitle,
  isLoading = false,
  onBreakdownItemClick,
  sx,
}: ApprovalSummaryCardsProps) {
  const resolvedPendingCount = useMemo(() => {
    if (pendingCount !== undefined) return pendingCount;
    if (summary?.pendingCount !== undefined) return summary.pendingCount;
    if (entries !== undefined) {
      const outgoing = entries.filter(
        (e) => !e.transactionType?.toLowerCase().includes("consumer bill")
      );
      return outgoing.length > 0 ? outgoing.length : entries.length;
    }
    return FIXED_APPROVAL_DATA.pendingCount;
  }, [pendingCount, summary?.pendingCount, entries]);

  const resolvedOldestText = useMemo(() => {
    if (oldestDateText) return oldestDateText;
    if (summary?.oldestDateText) return summary.oldestDateText;
    if (entries !== undefined) {
      if (entries.length === 0) return "No pending items";
      const sorted = [...entries]
        .filter((e) => Boolean(e.creationDate))
        .sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
      if (sorted[0]?.creationDate) {
        return `Oldest from ${formatDate(sorted[0].creationDate, "D MMM YYYY")}`;
      }
    }
    return FIXED_APPROVAL_DATA.oldestDateText;
  }, [oldestDateText, summary?.oldestDateText, entries]);

  const resolvedAmountUSD = useMemo(() => {
    if (pendingAmountUSD) return pendingAmountUSD;
    if (summary?.pendingAmountUSDLabel) return summary.pendingAmountUSDLabel;
    if (entries !== undefined) {
      const usdTotal = entries
        .filter(
          (e) =>
            (e.currency || "").toUpperCase() === "USD" &&
            !e.transactionType?.toLowerCase().includes("consumer bill")
        )
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      return `USD ${usdTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return FIXED_APPROVAL_DATA.pendingAmountUSD;
  }, [pendingAmountUSD, summary?.pendingAmountUSDLabel, entries]);

  const resolvedAmountSub = useMemo(() => {
    if (pendingAmountSub) return pendingAmountSub;
    if (summary?.pendingAmountKHRLabel) return summary.pendingAmountKHRLabel;
    if (entries !== undefined) {
      const khrTotal = entries
        .filter((e) => (e.currency || "").toUpperCase() === "KHR")
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      if (khrTotal > 0) {
        return `KHR ${khrTotal.toLocaleString("en-US")}`;
      }
    }
    if (summary?.pendingAmountSubLabel) return summary.pendingAmountSubLabel;
    return FIXED_APPROVAL_DATA.pendingAmountSub;
  }, [pendingAmountSub, summary?.pendingAmountKHRLabel, summary?.pendingAmountSubLabel, entries]);

  const resolvedBreakdown = useMemo(() => {
    if (typeBreakdown !== undefined) return typeBreakdown;
    if (summary?.typeBreakdown !== undefined) return summary.typeBreakdown;
    if (entries !== undefined) {
      if (entries.length === 0) return [];
      const countByType = new Map<string, number>();
      for (const e of entries) {
        if (e.transactionType?.toLowerCase().includes("consumer bill")) continue;
        let type = e.transactionType || "Other";
        const lower = type.toLowerCase();
        if (lower.includes("transfer") || lower.includes("bakong")) type = "Transfer";
        else if (lower.includes("bill payment")) type = "Bill payment";
        countByType.set(type, (countByType.get(type) || 0) + 1);
      }
      return Array.from(countByType.entries()).map(([label, count]) => ({ label, count }));
    }
    return FIXED_APPROVAL_DATA.typeBreakdown;
  }, [typeBreakdown, summary?.typeBreakdown, entries]);

  const cardStyle: SxProps<Theme> = {
    bgcolor: "#FFFFFF",
    borderRadius: "16px",
    border: `1px solid ${palette.slate[200]}`,
    p: { xs: 2.5, sm: "20px 24px" },
    height: "100%",
    minHeight: 124,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "none",
  };

  return (
    <Grid container spacing={2.5} sx={sx}>
      {/* Card 1: Pending count & oldest date */}
      <Grid size={{ xs: 12, md: 4 }}>
        <BaseCard sx={cardStyle}>
          <Typography
            sx={{
              fontSize: 14,
              color: palette.slate[500],
              fontWeight: 400,
              lineHeight: 1.2,
            }}
          >
            Pending
          </Typography>
          {isLoading ? (
            <Box sx={{ my: 1.5 }}>
              <Skeleton variant="text" width={80} height={40} />
              <Skeleton variant="text" width={140} height={20} />
            </Box>
          ) : (
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 28, sm: 32 },
                  fontWeight: 700,
                  color: "#0F172A",
                  my: 1.25,
                  lineHeight: 1.1,
                }}
              >
                {resolvedPendingCount}
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: palette.slate[500],
                  fontWeight: 400,
                  lineHeight: 1.2,
                }}
              >
                {resolvedOldestText}
              </Typography>
            </Box>
          )}
        </BaseCard>
      </Grid>

      {/* Card 2: Pending amount & currency breakdown */}
      <Grid size={{ xs: 12, md: 4 }}>
        <BaseCard sx={cardStyle}>
          <Typography
            sx={{
              fontSize: 14,
              color: palette.slate[500],
              fontWeight: 400,
              lineHeight: 1.2,
            }}
          >
            Pending amount
          </Typography>
          {isLoading ? (
            <Box sx={{ my: 1.5 }}>
              <Skeleton variant="text" width={160} height={36} />
              <Skeleton variant="text" width={220} height={20} />
            </Box>
          ) : (
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: 24, sm: 28 },
                  fontWeight: 700,
                  color: "#0F172A",
                  my: 1.25,
                  lineHeight: 1.1,
                }}
              >
                <BaseBlurText>{resolvedAmountUSD}</BaseBlurText>
              </Typography>
              <Typography
                sx={{
                  fontSize: 13,
                  color: palette.slate[500],
                  fontWeight: 400,
                  lineHeight: 1.2,
                }}
              >
                <BaseBlurText>{resolvedAmountSub}</BaseBlurText>
              </Typography>
            </Box>
          )}
        </BaseCard>
      </Grid>

      {/* Card 3: Pending by type with progress bars */}
      <Grid size={{ xs: 12, md: 4 }}>
        <ApprovalTypeBreakdownCard
          title={breakdownTitle ?? "Pending by type"}
          items={resolvedBreakdown}
          isLoading={isLoading}
          onItemClick={onBreakdownItemClick}
          sx={cardStyle}
        />
      </Grid>
    </Grid>
  );
}
