"use client";

import Chip from "@mui/material/Chip";

import type { InstanceStatus } from "../workflow.types";

const LOOK: Record<
  InstanceStatus,
  { label: string; color: "default" | "primary" | "success" | "error" | "warning" }
> = {
  PENDING: { label: "Pending", color: "primary" },
  IN_PROGRESS: { label: "In progress", color: "primary" },
  APPROVED: { label: "Approved", color: "success" },
  REJECTED: { label: "Rejected", color: "error" },
  ESCALATED: { label: "Escalated", color: "warning" },
  CANCELLED: { label: "Cancelled", color: "default" },
};

export default function InstanceStatusChip({ status }: { status: InstanceStatus }) {
  const look = LOOK[status] ?? { label: status, color: "default" as const };
  return <Chip size="small" variant="outlined" color={look.color} label={look.label} />;
}
