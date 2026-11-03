"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";

import { palette } from "@/theme/palette";
import { SectionCard } from "@/features/dashboard";
import type { ApprovalTypeBreakdown } from "../approval.types";

export const FIXED_APPROVAL_TYPE_BREAKDOWN: ApprovalTypeBreakdown[] = [
  { label: "Transfer", count: 3 },
  { label: "Bill payment", count: 1 },
  { label: "Consumer bill", count: 1 },
];

export interface ApprovalTypeBreakdownCardProps {
  items?: ApprovalTypeBreakdown[];
  /** Whether breakdown data is currently loading from API */
  isLoading?: boolean;
  /** Override for screens that break down something other than transactions. */
  title?: string;
  /** Optional top action badge/chip label from SectionCard (e.g. "View All") */
  action?: string;
  /** Event handler triggered when a breakdown row is clicked (e.g. to filter list in Approvals) */
  onItemClick?: (item: ApprovalTypeBreakdown) => void;
  headerSx?: object;
  titleSx?: object;
  sx?: SxProps<Theme>;
}

export default function ApprovalTypeBreakdownCard({
  items,
  isLoading = false,
  title = "Pending by type",
  action,
  onItemClick,
  headerSx,
  titleSx,
}: ApprovalTypeBreakdownCardProps) {
  // If items prop is provided (even if empty []), use it; otherwise fallback to default data
  const displayItems = items !== undefined ? items : FIXED_APPROVAL_TYPE_BREAKDOWN;

  const totalCount =
    displayItems.reduce((acc, curr) => acc + curr.count, 0) || 1;

  return (
    <SectionCard
      title={title}
      action={action}
      showBorder={false}
      headerSx={{ mb: 1.5, pb: 0, ...headerSx }}
      titleSx={{
        fontSize: 14,
        color: palette.slate[500],
        fontWeight: 400,
        lineHeight: 1.2,
        ...titleSx,
      }}
    >
      {isLoading ? (
        <Stack spacing={1.5} sx={{ py: 0.5 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton width="45%" height={20} />
            <Skeleton width="35%" height={16} />
          </Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton width="55%" height={20} />
            <Skeleton width="30%" height={16} />
          </Stack>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Skeleton width="40%" height={20} />
            <Skeleton width="25%" height={16} />
          </Stack>
        </Stack>
      ) : displayItems.length === 0 ? (
        <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
          Nothing pending right now.
        </Typography>
      ) : (
        <Stack spacing={1.25} sx={{ flex: 1, justifyContent: "center" }}>
          {displayItems.map((item) => {
            const percentage = (item.count / totalCount) * 100;
            return (
              <Stack
                key={item.label}
                direction="row"
                onClick={onItemClick ? () => onItemClick(item) : undefined}
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: onItemClick ? "pointer" : "default",
                  borderRadius: "6px",
                  py: 0.5,
                  px: onItemClick ? 0.75 : 0,
                  mx: onItemClick ? -0.75 : 0,
                  transition: "background-color 0.15s ease",
                  "&:hover": onItemClick
                    ? { bgcolor: palette.slate[100] }
                    : undefined,
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13.5,
                    color: palette.slate[900],
                    fontWeight: 400,
                  }}
                >
                  {item.label}
                </Typography>

                <Stack
                  direction="row"
                  spacing={1.25}
                  sx={{ alignItems: "center" }}
                >
                  <Typography
                    sx={{
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: "#0F172A",
                      minWidth: 12,
                      textAlign: "right",
                    }}
                  >
                    {item.count}
                  </Typography>
                  <Box
                    sx={{
                      width: 60,
                      height: 5,
                      borderRadius: "999px",
                      bgcolor: "#E7EEF5",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${Math.min(100, Math.max(0, percentage))}%`,
                        height: "100%",
                        bgcolor: "#2764A5",
                        borderRadius: "999px",
                      }}
                    />
                  </Box>
                </Stack>
              </Stack>
            );
          })}
        </Stack>
      )}
    </SectionCard>
  );
}
