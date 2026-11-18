"use client";

import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ShieldAlert } from "lucide-react";

import { palette } from "@/theme/palette";
import { formatCCY } from "@/utils/format-ccy";
import { formatDate } from "@/utils/date-time";
import BaseDialog from "@core/components/BaseDialog";
import { useGetScheduleDetailQuery } from "../schedule.api";
import {
  mapBackendFrequencyToUi,
  type ScheduledTransaction,
} from "../schedule.types";

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
  const router = useRouter();
  const { data: detailData, isLoading } = useGetScheduleDetailQuery(
    schedule?.refNo ?? "",
    {
      skip: !open || !schedule?.refNo,
      refetchOnMountOrArgChange: true,
    },
  );

  if (!schedule) return null;

  const isAwaitingApproval = schedule.status === "Awaiting Approval";

  const backendSchedule = detailData?.schedule ?? schedule.raw;

  const fromAccount = backendSchedule?.fromAccountName
    ? `${backendSchedule.fromAccountName} (${backendSchedule.fromAccountNumber || ""})`
    : backendSchedule?.fromAccountNumber || schedule.fromAccountNumber || "—";

  const displayFrequency =
    schedule.frequency ??
    (backendSchedule?.frequency
      ? mapBackendFrequencyToUi(backendSchedule.frequency)
      : "Monthly");

  const displayNextRun =
    schedule.date && schedule.time && schedule.date !== "-"
      ? `${schedule.date} at ${schedule.time}`
      : backendSchedule?.nextRunAt
        ? `${formatDate(backendSchedule.nextRunAt, "DD MMM YYYY")} at ${formatDate(backendSchedule.nextRunAt, "hh:mm A")}`
        : "—";

  const displayStartDate = schedule.startDate
    ? formatDate(schedule.startDate, "DD MMM YYYY")
    : backendSchedule?.startDate
      ? formatDate(backendSchedule.startDate, "DD MMM YYYY")
      : schedule.date && schedule.date !== "-"
        ? schedule.date
        : "—";

  const displayEndDate = schedule.endDate
    ? formatDate(schedule.endDate, "DD MMM YYYY")
    : backendSchedule?.endDate
      ? formatDate(backendSchedule.endDate, "DD MMM YYYY")
      : "Ongoing";

  const displayRemarks = schedule.remarks || backendSchedule?.remark || "—";

  const rows = [
    { label: "Reference Number", value: schedule.refNo },
    { label: "Transaction Type", value: schedule.transactionType },
    { label: "From Account", value: fromAccount },
    { label: "Pay To", value: schedule.payToName },
    {
      label: "Account / Identifier",
      value: schedule.payToAccount,
    },
    {
      label: "Amount",
      value: formatCCY(schedule.amount, schedule.currency),
    },
    { label: "Status", value: schedule.status },
    { label: "Frequency", value: displayFrequency },
    {
      label: "Next Run",
      value: displayNextRun,
    },
    ...(detailData?.pendingCount !== undefined
      ? [{ label: "Pending Runs", value: `${detailData.pendingCount} remaining` }]
      : []),
    ...(detailData?.historyCount !== undefined
      ? [{ label: "Executed Runs", value: `${detailData.historyCount} executed` }]
      : []),
    {
      label: "Start Date",
      value: displayStartDate,
    },
    {
      label: "End Date",
      value: displayEndDate,
    },
    {
      label: "Remarks",
      value: displayRemarks,
    },
  ];

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Schedule details"
      subtitle="Complete information for this scheduled transfer."
      confirmTitle={isAwaitingApproval ? "Go to Approvals" : "Edit schedule"}
      onConfirm={() => {
        onClose();
        if (isAwaitingApproval) {
          router.push("/approval");
        } else if (onEdit) {
          onEdit(schedule);
        }
      }}
      cancelTitle="Close"
      maxWidth="sm"
    >
      <Stack spacing={1.5} sx={{ mt: 1 }}>
        {isAwaitingApproval && (
          <Box
            sx={{
              p: 2,
              borderRadius: "10px",
              bgcolor: "#EFF6FF",
              border: "1px solid #BFDBFE",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              mb: 0.5,
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <ShieldAlert size={20} color="#2563EB" />
              <Typography sx={{ fontSize: 13, color: "#1E40AF", fontWeight: 500 }}>
                This schedule is awaiting checker approval. It will execute once approved.
              </Typography>
            </Stack>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                onClose();
                router.push("/approval");
              }}
              sx={{
                bgcolor: "#2563EB",
                color: "#FFFFFF",
                fontSize: 12,
                textTransform: "none",
                fontWeight: 600,
                whiteSpace: "nowrap",
                px: 2,
                boxShadow: "none",
                "&:hover": { bgcolor: "#1D4ED8", boxShadow: "none" },
              }}
            >
              Approve
            </Button>
          </Box>
        )}

        {isLoading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <CircularProgress size={20} sx={{ color: palette.slate[400] }} />
          </Box>
        )}
        {rows.map((row, index) => (
          <Box key={row.label}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ py: 1 }}
            >
              <Typography
                sx={{ fontSize: 13, color: palette.slate[500], fontWeight: 500 }}
              >
                {row.label}
              </Typography>
              <Typography
                sx={{
                  fontSize: 14,
                  fontWeight: row.label === "Amount" ? 700 : 500,
                  color: "#0F172A",
                  textAlign: "right",
                  maxWidth: "60%",
                  wordBreak: "break-word",
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
