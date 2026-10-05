"use client";

import React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import BaseDialog from "@core/components/BaseDialog";
import QrCodePlaceholder from "@core/components/QrCodePlaceholder";
import { font, palette } from "@/theme/palette";

const COUNTDOWN_SECONDS = 120;

export type QrConfirmationDialogProps = {
  open: boolean;
  /** Fired on dismiss (X icon/backdrop/esc) — treated as the mobile-app approval signal. */
  onApprove: () => void;
};

/**
 * Mocked mobile-approval step: a scannable-looking QR with a live countdown.
 * There's no pairing backend in this project, so approval is simulated —
 * dismissing the dialog is itself the "approved" signal.
 */
export default function QrConfirmationDialog({
  open,
  onApprove,
}: QrConfirmationDialogProps) {
  const [secondsLeft, setSecondsLeft] = React.useState(COUNTDOWN_SECONDS);
  const [qrSeed, setQrSeed] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setQrSeed(`${Date.now()}-${Math.random()}`);
    setSecondsLeft(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  return (
    <BaseDialog
      open={open}
      onClose={onApprove}
      title="Confirmation"
      maxWidth="xs"
      hideActions
      titleSx={{
        fontSize: "24px",
        fontWeight: font.weight.medium,
        textAlign: "center",
        py: 3,
        borderBottom: `1px solid ${palette.slate[200]}`,
      }}
    >
      <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center", py: 1 }}>
        <Typography variant="body2" sx={{ color: palette.slate[500], py: 5 }}>
          Scan this QR with{" "}
          <Typography component="span" sx={{ fontWeight: 700, color: "text.primary" }}>
            SME Bank Biz App
          </Typography>
        </Typography>

        <QrCodePlaceholder value={qrSeed} size={180} />

        <Typography variant="caption" sx={{ color: palette.slate[400], py: 5 }}>
          Expire in {secondsLeft}s
        </Typography>
      </Stack>
    </BaseDialog>
  );
}
