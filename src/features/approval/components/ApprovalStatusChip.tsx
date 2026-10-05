"use client";

import Chip from "@mui/material/Chip";

import { approvalStatusMeta, type ApprovalStatus } from "../approval.types";

/** Coloured status pill for an approval entry. */
export default function ApprovalStatusChip({ status }: { status: ApprovalStatus }) {
  const meta = approvalStatusMeta(status);
  return (
    <Chip
      label={meta.label}
      size="small"
      color={meta.color === "default" ? "default" : meta.color}
      variant={meta.color === "default" ? "outlined" : "filled"}
      sx={{ fontWeight: 600 }}
    />
  );
}
