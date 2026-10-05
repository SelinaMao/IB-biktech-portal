"use client";

import { useState } from "react";
import { Avatar, Box, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import { Download } from "lucide-react";

import { font, palette, radius } from "@/theme/palette";
import { formatAccountNumber } from "@/utils/format-account-number";
import BaseChip from "@core/components/BaseChip";
import BaseSideDialog from "@core/components/BaseSideDialog";
import type { IAccountDetailResponses } from "../account.types";

export interface AccountDetailsProps {
  open: boolean;
  onClose: () => void;
  info: IAccountDetailResponses;
  fixedDeposit?: IAccountDetailResponses;
  onDownloadCertificate?: () => void | Promise<void>;
}

function StatusBadge({ value }: { value: string }) {
  return (
    <BaseChip bgColor={palette.success.main} minWidth={60} height={22} color={palette.white}>
      {value}
    </BaseChip>
  );
}

const BOLD_ROW_KEYS = [
  "ACCOUNT_CURRENT_BALANCE",
  "ACCOUNT_AVAILABLE_BALANCE",
  "ACCOUNT_LEDGER_BALANCE",
  "ACCOUNT_FLOATING_BALANCE",
];

function Row({ label, value, rowKey }: { label: string; value: React.ReactNode; rowKey: string }) {
  const isBold = BOLD_ROW_KEYS.includes(rowKey);
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 2 }}>
      <Typography sx={{ fontSize: font.size.sm, color: "text.secondary" }}>{label}</Typography>
      <Typography
        component="div"
        sx={{
          fontSize: font.size.sm,
          fontWeight: isBold ? font.weight.semibold : font.weight.regular,
          color: "text.primary",
          textAlign: "right",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

/** Slide-over triggered by "View Details" on an account overview card —
 *  the account's full profile as a plain label/value list. */
export default function AccountDetails({
  open,
  onClose,
  info,
  fixedDeposit,
  onDownloadCertificate,
}: AccountDetailsProps) {
  const nameParts = (info.accountName || "?").trim().split(/\s+/).filter(Boolean);
  const initials = (
    nameParts.length > 1 ? nameParts.slice(0, 2).map((part) => part[0]).join("") : nameParts[0]?.slice(0, 2) ?? "?"
  ).toUpperCase();

  const rows = (info.fields ?? []).filter((field) => field.value);

  const [isDownloading, setIsDownloading] = useState(false);
  const handleDownloadClick = async () => {
    if (!onDownloadCertificate || isDownloading) return;
    setIsDownloading(true);
    try {
      await onDownloadCertificate();
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <BaseSideDialog
      open={open}
      onClose={onClose}
      title="Account Details"
      icon={<AccountBalanceRoundedIcon fontSize="small" />}
      width={420}
    >
      <Stack spacing={4} py={4}>
        <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 50,
              height: 50,
              borderRadius: "12px",
              fontSize: font.size.xl,
              fontWeight: font.weight.medium,
              color: palette.white,
              bgcolor: palette.navy[800],
            }}
          >
            {initials}
          </Avatar>
          <Typography sx={{ fontSize: font.size.lg, fontWeight: font.weight.medium }}>
            {info.accountName}
          </Typography>
        </Stack>

        <Stack spacing={4} py={4}>
          {rows.map((row) => (
            <Row
              key={row.key}
              rowKey={row.key}
              label={row.label}
              value={
                row.key === "ACCOUNT_STATUS" ? (
                  <StatusBadge value={row.value} />
                ) : row.key === "ACCOUNT_NUMBER" ? (
                  formatAccountNumber(row.value)
                ) : (
                  row.value
                )
              }
            />
          ))}
        </Stack>

        {info.joinHolderDto && info.joinHolderDto.length > 0 && (
          <Box>
            <Typography sx={{ fontSize: font.size.xs, color: "text.secondary", mb: 0.5 }}>Joint Holders</Typography>
            <Stack spacing={0.25}>
              {info.joinHolderDto.map((holder) => (
                <Typography key={holder.accountNumber} sx={{ fontSize: font.size.sm, fontWeight: font.weight.semibold }}>
                  {holder.accountName}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {fixedDeposit && (
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Box
              component="button"
              type="button"
              onClick={handleDownloadClick}
              disabled={isDownloading}
              sx={{
                cursor: isDownloading ? "default" : "pointer",
                border: "none",
                bgcolor: "transparent",
                p: 0,
                fontFamily: "inherit",
                fontSize: font.size.base,
                opacity: isDownloading ? 0.6 : 1,

                textAlign: "left",
              }}
            >
              Download Certificate
            </Box>
            <IconButton
              onClick={handleDownloadClick}
              disabled={isDownloading}
              aria-label="Download certificate"
              sx={{
                bgcolor: palette.info.bg,
                color: palette.info[600],
                borderRadius: `${radius.md}px`,
                "&:hover": { bgcolor: palette.info[200] },
              }}
            >
              {isDownloading ? <CircularProgress size={18} color="inherit" /> : <Download size={18} />}
            </IconButton>
          </Stack>
        )}
      </Stack>
    </BaseSideDialog>
  );
}
