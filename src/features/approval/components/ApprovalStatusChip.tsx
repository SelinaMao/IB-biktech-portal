"use client";

import Box from "@mui/material/Box";
import { approvalStatusMeta, type ApprovalStatus } from "../approval.types";
import { font } from "@/theme/palette";

const STATUS_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  warning: { bg: "#F59E0B", text: "#000000" },
  success: { bg: "#16A34A", text: "#000000" },
  error: { bg: "#DC2626", text: "#000000" },
  info: { bg: "#2563EB", text: "#000000" },
  default: { bg: "#94A3B8", text: "#000000" },
};

/** Coloured status pill for an approval entry using approvalStatusMeta. */
export default function ApprovalStatusChip({ status }: { status: ApprovalStatus }) {
  const meta = approvalStatusMeta(status);
  const colorConfig = STATUS_COLOR_MAP[meta.color] ?? STATUS_COLOR_MAP.default;

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        px:2,
        py: 1,
        borderRadius: "6px",
        bgcolor: colorConfig.bg,
        color: colorConfig.text,
        fontSize: "12px",
        fontWeight: font.weight.medium,
        lineHeight: 1.4,
        letterSpacing: "0.2px",
      }}
    >
      {meta.label}
    </Box>
  );
}
