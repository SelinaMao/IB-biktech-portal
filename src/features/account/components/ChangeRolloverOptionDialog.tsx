"use client";

import React from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { font, palette } from "@/theme/palette";
import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseSideDialog from "@core/components/BaseSideDialog";
import BaseInput from "@core/form/BaseInput";
import { formatAccountNumber } from "@/utils/format-account-number";
import type { RolloverOption } from "../account.types";

export interface ChangeRolloverOptionDialogProps {
  open: boolean;
  onClose: () => void;
  companyName?: string;
  accountNumber?: string;
  /** Display label for the term deposit's current rollover setting. */
  currentOptionLabel: string;
  maturityDate: string;
  /** The option the user tapped on the Rollover Options panel — preselects the picker. */
  initialOption: RolloverOption;
  onSave: (option: RolloverOption) => void;
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", py: 0.75, gap: 2 }}>
      <Typography sx={{ fontSize: font.size.sm, color: "text.secondary" }}>{label}</Typography>
      <Typography sx={{ fontSize: font.size.sm, fontWeight: font.weight.semibold, color: "text.primary", textAlign: "right" }}>
        {value}
      </Typography>
    </Stack>
  );
}

/** Second step of the "Change Rollover Option" flow — confirms which new
 *  option to apply, then hands off to Save (the caller opens the QR
 *  confirmation dialog once this fires `onSave`). */
export default function ChangeRolloverOptionDialog({
  open,
  onClose,
  companyName,
  accountNumber,
  currentOptionLabel,
  maturityDate,
  initialOption,
  onSave,
}: ChangeRolloverOptionDialogProps) {
  return (
    <BaseSideDialog
      open={open}
      onClose={onClose}
      title="Change Rollover Option"
      subtitle="Manage how your maturity balance is handled"
      width={500}
      confirmClose
      confirmCloseTitle="Discard rollover change?"
      confirmCloseMessage="You have an unsaved rollover option change. Are you sure you want to close? Your selection will be lost."
      footer={
        <Stack direction="row" spacing={1.5}>
          <BaseButton
            title="Cancel"
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
              backgroundColor: "#FFFFFF",
              color: palette.text.primary,
              borderColor: palette.slate[300],
              fontWeight: font.weight.regular,
              "&:hover": { backgroundColor: "#FFFFFF" },
            }}
          />
          <BaseButton fullWidth title="Save" onClick={() => onSave(initialOption)} />
        </Stack>
      }
    >
      <Stack spacing={6}>
        <BaseInput
          label={<Typography sx={{ fontSize: font.size.md, color: "text.secondary" }}>Current Option</Typography>}
          value={currentOptionLabel}
          disabled
        />

        <Box>
          <Typography sx={{ fontSize: font.size.md, color: "text.secondary", mb: 3 }}>
            Select New Rollover Option
          </Typography>
          <BaseCard
            sx={{
              // p: 2.5,
              // borderRadius: 2,
              border: `1px solid ${palette.navy[800]}`,
              bgcolor: palette.info[50],
              boxShadow: "none",
            }}
          >
            <Typography sx={{ fontSize: font.size.base }}>
              {initialOption.label}
            </Typography>
            <Typography sx={{ fontSize: font.size.xs, color: "text.secondary", mt: 0.25 }}>
              {initialOption.description}
            </Typography>
          </BaseCard>
        </Box>

        <Alert severity="warning" variant="outlined">
          This change takes effect at the next maturity date and cannot be undone once approved.
        </Alert>

        <Box>
          <Typography sx={{ fontSize: font.size.md, mb: 3, color: "text.secondary", }}>
            Confirmation Summary
          </Typography>
          <BaseCard
            sx={{
              bgcolor: palette.slate[50],
              boxShadow: "none",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <SummaryRow label="Account Name" value={companyName ?? "-"} />
            <SummaryRow label="Account Number" value={accountNumber ? formatAccountNumber(accountNumber) : "-"} />
            <SummaryRow label="Current Option" value={currentOptionLabel} />
            <SummaryRow label="New Option" value={initialOption.label} />
            <SummaryRow label="Maturity Date" value={maturityDate} />
          </BaseCard>
        </Box>
      </Stack>
    </BaseSideDialog>
  );
}
