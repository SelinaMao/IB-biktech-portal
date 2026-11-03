"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { palette } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import type { ScheduledTransaction } from "../schedule.types";

export interface ScheduleDetailDialogProps {
  open: boolean;
  schedule: ScheduledTransaction | null;
  onClose: () => void;
  onEdit?: (schedule: ScheduledTransaction) => void;
}

export default function ScheduleDetailDialog({
  open,
  schedule,
  onClose,
  onEdit,
}: ScheduleDetailDialogProps) {
  if (!schedule) return null;

  const rows = [
    { label: "Reference Number", value: schedule.refNo },
    { label: "Transaction Type", value: schedule.transactionType },
    { label: "Pay To", value: schedule.payToName },
    { label: "Account / Identifier", value: schedule.payToAccount },
    {
      label: "Amount",
      value:
        schedule.currency === "KHR"
          ? `KHR ${schedule.amount.toLocaleString("en-US")}`
          : `USD ${schedule.amount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
    },
    { label: "Status", value: schedule.status },
    { label: "Frequency", value: schedule.frequency ?? "Monthly" },
    { label: "Date & Time", value: `${schedule.date} at ${schedule.time}` },
    { label: "Remarks", value: schedule.remarks || "—" },
  ];

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Schedule details"
      subtitle="Complete information for this scheduled transaction."
      confirmTitle="Edit schedule"
      onConfirm={() => {
        onClose();
        if (onEdit) onEdit(schedule);
      }}
      cancelTitle="Close"
      maxWidth="sm"
    >
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {rows.map((row, index) => (
          <Box key={row.label}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ py: 1 }}
            >
              <Typography sx={{ fontSize: 13, color: palette.slate[500], fontWeight: 500 }}>
                {row.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: row.label === "Amount" ? 700 : 500,
                  color: "#0F172A",
                  textAlign: "right",
                }}
              >
                {row.value}
              </Typography>
            </Stack>
            {index < rows.length - 1 && (
              <Divider sx={{ borderColor: palette.slate[100] }} />
            )}
          </Box>
        ))}
      </Stack>
    </BaseDialog>
  );
}
