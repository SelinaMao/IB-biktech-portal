"use client";

import React from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { QRCodeSVG } from "qrcode.react";

const COUNTDOWN_SECONDS = 120;

export type QrConfirmationDialogProps = {
  open: boolean;
  /** Optional close handler to cancel or dismiss without approving. */
  onClose?: () => void;
  /** Fired on approve button click or simulated approval signal. */
  onApprove?: () => void;
  /** Optional dialog title override; defaults to "Confirmations" */
  title?: string;
  /** Optional dialog subtitle override; defaults to "Scan this QR with Bank Mobile App" */
  subtitle?: string;
  /** Optional QR payload or seed string */
  value?: string;
  /** Total countdown time in seconds; defaults to 120 */
  countdownSeconds?: number;
};

/**
 * Mobile-approval QR confirmation modal:
 * Displays a scannable QR code with a live countdown and dismiss button.
 */
export default function QrConfirmationDialog({
  open,
  onClose,
  onApprove,
  title = "Confirmations",
  subtitle = "Scan this QR with Bank Mobile App",
  value,
  countdownSeconds = COUNTDOWN_SECONDS,
}: QrConfirmationDialogProps) {
  const [secondsLeft, setSecondsLeft] = React.useState(countdownSeconds);
  const [qrSeed, setQrSeed] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setQrSeed(`${Date.now()}-${Math.random()}`);
    setSecondsLeft(countdownSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open, countdownSeconds]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onApprove) {
      onApprove();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        handleClose();
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
       
          borderRadius: "28px",
          px: { xs: 3, sm: 6 },
          pt: { xs: 5, sm: 6.5 },
          pb: { xs: 4, sm: 5.5 },
          position: "relative",
          bgcolor: "#FFFFFF",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.12)",
          maxWidth: 460,
          mx: 2,
        },
      }}
    >
      <IconButton
        onClick={handleClose}
        aria-label="Close"
        sx={{
          position: "absolute",
          top: 24,
          right: 24,
          width: 36,
          height: 36,
          bgcolor: "#F2F4F7",
          color: "#1D2939",
          borderRadius: "50%",
          p: 0,
          transition: "all 0.15s ease-in-out",
          "&:hover": {
            bgcolor: "#E4E7EC",
          },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: 19 }} />
      </IconButton>

      <Box
        sx={{
          marginTop:"25px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "24px", sm: "28px" },
            color: "#0F172A",
            lineHeight: 1.25,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: "#475569",
            fontSize: { xs: "15px", sm: "16px" },
            fontWeight: 400,
            mt: 2,
            px: 1,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </Typography>

        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            my: { xs: 4, sm: 5 },
          }}
        >
          <QRCodeSVG
            value={value || qrSeed || "bank-mobile-qr-confirmation"}
            size={200}
            level="M"
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: "#64748B",
            fontSize: "14px",
            fontWeight: 400,
          }}
        >
          Expire in {secondsLeft}s
        </Typography>
      </Box>
    </Dialog>
  );
}
