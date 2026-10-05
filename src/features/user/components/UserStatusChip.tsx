"use client";

import Chip from "@mui/material/Chip";

import { userStatusMeta, type UserStatus } from "../user.types";

/** Coloured status pill for a backoffice user. */
export default function UserStatusChip({ status }: { status: UserStatus }) {
  const meta = userStatusMeta(status);
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
