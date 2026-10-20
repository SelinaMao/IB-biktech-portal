"use client";

import React from "react";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

export type ApproveTransferProps = {
  open: boolean;
  /** Close or dismiss the dialog without approving. */
  onClose?: () => void;
  /** Fired when the "I haven't received an approval request" link is clicked. */
  onNotReceived?: () => void;
  /** Fired when the transfer is approved. */
  onApprove?: () => void;
  /** Optional title override. */
  title?: string;
  /** Optional message override. */
  message?: string;
  /** Optional link text override. */
  linkText?: string;
  /** Image path from the public folder. */
  imageSrc?: string;
};

/**
 * Push-notification approval modal:
 * Tells the user to approve the transfer from their mobile app.
 */
export default function ApproveTransfer({
  open,
  onClose,
  onNotReceived,
  onApprove,
  title = "Approve transfer using the mobile app",
  message = "We’ve sent a notification to your phone. Tap on it to approve this transfer.",
  linkText = "I haven’t received an approval request",
  imageSrc = "/assets/images/iconApprove.png",
}: ApproveTransferProps) {
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose?.();
      }}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: "28px",
          px: { xs: 3, sm: 6 },
          pt: { xs: 5, sm: 6 },
          pb: { xs: 4, sm: 5 },
          position: "relative",
          bgcolor: "#FFFFFF",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.12)",
          maxWidth: 460,
          mx: 2,
        },
      }}
    >
      <IconButton
        onClick={onClose}
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
          "&:hover": { bgcolor: "#E4E7EC" },
        }}
      >
        <CloseRoundedIcon sx={{ fontSize: 19 }} />
      </IconButton>

      <Box
        sx={{
          mt: "25px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box
          component="img"
          src={imageSrc}
          alt=""
          onClick={onApprove}
          sx={{
            width: 140,
            height: 140,
            objectFit: "contain",
            cursor: onApprove ? "pointer" : "default",
          }}
        />

        <Typography
          variant="h5"
          component="h2"
          sx={{
            mt: 4,
            maxWidth: 300,
            fontWeight: 700,
            fontSize: { xs: "22px", sm: "24px" },
            color: "#0F172A",
            lineHeight: 1.3,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mt: 3,
            px: 1,
            color: "#475569",
            fontSize: { xs: "15px", sm: "16px" },
            fontWeight: 400,
            lineHeight: 1.6,
          }}
        >
          {message}
        </Typography>

        <Link
          component="button"
          type="button"
          underline="always"
          onClick={onNotReceived}
          sx={{
            mt: 4,
            color: "#94A3B8",
            fontSize: "14px",
            fontWeight: 400,
            "&:hover": { color: "#64748B" },
          }}
        >
          {linkText}
        </Link>
      </Box>
    </Dialog>
  );
}