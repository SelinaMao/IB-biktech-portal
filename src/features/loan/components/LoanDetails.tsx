"use client";

import { Avatar, Box, IconButton, Stack, Typography } from "@mui/material";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import { Download } from "lucide-react";

import { font, palette, radius } from "@/theme/palette";
import BaseSideDialog from "@core/components/BaseSideDialog";
import { formatAccountNumber } from "@/utils/format-account-number";
import type { BorrowerProfile, LoanScheduleDetails, LoanStatus } from "../loan.types";

const STATUS_STYLES: Record<LoanStatus, { label: string; color: string }> = {
  active: { label: "Active", color: palette.success.main },
  overdue: { label: "Overdue", color: palette.danger.main },
  closed: { label: "Closed", color: palette.status.dormantFrozen },
};

export interface LoanDetailsPanelProps {
  open: boolean;
  onClose: () => void;
  borrower: BorrowerProfile;
  schedule: LoanScheduleDetails;
  onDownloadSchedule?: () => void;
  onDownloadRemainingInstallments?: () => void;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
      <Typography sx={{ fontSize: font.size.sm, color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: "text.primary", textAlign: "right" }}>
        {value}
      </Typography>
    </Stack>
  );
}

function DownloadRow({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
      <Box
        component="button"
        type="button"
        onClick={onClick}
        sx={{
          cursor: "pointer",
          border: "none",
          bgcolor: "transparent",
          p: 0,
          fontSize: font.size.base,
          fontWeight: font.weight.semibold,
          textAlign: "left",
        }}
      >
        {label}
      </Box>
      <IconButton
        onClick={onClick}
        aria-label={`Download ${label}`}
        sx={{
          bgcolor: palette.info.bg,
          color: palette.navy[800],
          borderRadius: `${radius.md}px`,
          "&:hover": { bgcolor: palette.info[200] },
        }}
      >
        <Download size={18} />
      </IconButton>
    </Stack>
  );
}

/** Slide-over triggered by "View Details" on the Loan overview card —
 *  the loan account's full profile as a plain label/value list. */
export default function LoanDetailsPanel({
  open,
  onClose,
  borrower,
  schedule,
  onDownloadSchedule,
  onDownloadRemainingInstallments,
}: LoanDetailsPanelProps) {
  const initials = (borrower.name || "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const rows: Array<{ label: string; value: React.ReactNode } | null> = [
    { label: "Account Number", value: formatAccountNumber(borrower.accountNumber) },
    schedule.accountType ? { label: "Account Type", value: schedule.accountType } : null,
    {
      label: "Account Status",
      value: (
        <Box component="span" sx={{ color: STATUS_STYLES[borrower.status].color }}>
          {STATUS_STYLES[borrower.status].label}
        </Box>
      ),
    },
    { label: "Disbursement Date", value: schedule.disbursementDate },
    { label: "Maturity Date", value: schedule.maturityDate },
    schedule.tenorLabel ? { label: "Tenor", value: schedule.tenorLabel } : null,
    schedule.settlementAccountName || schedule.settlementAccountNumber
      ? {
        label: "Settlement Account",
        value: (
          <>
            {schedule.settlementAccountName && (
              <Typography component="span" sx={{ display: "block", fontSize: font.size.sm, fontWeight: font.weight.semibold }}>
                {schedule.settlementAccountName}
              </Typography>
            )}
            {schedule.settlementAccountNumber && (
              <Typography component="span" sx={{ display: "block", fontSize: font.size.sm, color: "text.secondary" }}>
                {formatAccountNumber(schedule.settlementAccountNumber)}
              </Typography>
            )}
          </>
        ),
      }
      : null,
  ];

  return (
    <BaseSideDialog
      open={open}
      onClose={onClose}
      title="Account Details"
      icon={<AccountBalanceRoundedIcon fontSize="small" />}
      width={420}
    >
      <Stack spacing={4}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              fontSize: font.size.sm,
              fontWeight: font.weight.semibold,
              color: palette.navy[300],
              bgcolor: palette.navy[800],
            }}
          >
            {initials}
          </Avatar>
          <Typography sx={{ fontSize: font.size.lg, fontWeight: font.weight.medium }}>
            {borrower.name}
          </Typography>
        </Stack>

        <Stack spacing={6}>
          {rows
            .filter((row): row is { label: string; value: React.ReactNode } => Boolean(row))
            .map((row) => (
              <Row key={row.label} label={row.label} value={row.value} />
            ))}
        </Stack>

        <Stack spacing={4}>
          <DownloadRow label="Loan Schedule" onClick={onDownloadSchedule} />
          <DownloadRow label="Remaining Installments" onClick={onDownloadRemainingInstallments} />
        </Stack>
      </Stack>
    </BaseSideDialog>
  );
}
