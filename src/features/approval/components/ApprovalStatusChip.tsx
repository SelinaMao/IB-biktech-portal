"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { approvalStatusMeta, type ApprovalStatus } from "../approval.types";
import { font, radius } from "@/theme/palette";

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  warning: { bg: "#F59E0B", text: "#FFFFFF" },
  success: { bg: "#16A34A", text: "#FFFFFF" },
  error: { bg: "#DC2626", text: "#FFFFFF" },
  info: { bg: "#2563EB", text: "#FFFFFF" },
  default: { bg: "#94A3B8", text: "#FFFFFF" },
};

export interface ApprovalStatusChipProps {
  status: ApprovalStatus;
  /** Custom border radius, e.g. "8px", "6px", `${radius.pill}px`, or 8 */
  borderRadius?: number | string;
  sx?: SxProps<Theme>;
}

/** Coloured status pill for an approval entry using approvalStatusMeta. */
export default function ApprovalStatusChip({
  status,
  borderRadius = "8px",
  sx,
}: ApprovalStatusChipProps) {
  const meta = approvalStatusMeta(status);
  const colorConfig = STATUS_COLOR_MAP[meta.color] ?? STATUS_COLOR_MAP.default;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 78,
        height: 32,
        borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius,
        bgcolor: colorConfig.bg,
        color: colorConfig.text,
        fontSize: "13px",
        fontWeight: font.weight.semibold ?? 600,
        lineHeight: 1,
        letterSpacing: "0.2px",
        boxSizing: "border-box",
        userSelect: "none",
        ...sx,
      }}
    >
      {meta.label}
    </Box>
  );
}
