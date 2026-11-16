"use client";

import React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ChevronRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

const COUNTDOWN_SECONDS = 120;

export type QrConfirmationDialogProps = {
  open: boolean;
  /** Optional close handler to cancel or dismiss without approving. */
  onClose?: () => void;
  /** Fired on approve button click or simulated approval signal. */
  onApprove?: () => void;
  /** Optional dialog title override; defaults to "Secure Your Account" */
  title?: string;
  /** Optional instruction heading; defaults to "Scan QR Code" */
  instruction?: string;
  /** App name to display in the subtitle link; defaults to "Biktech Banking App" */
  appName?: string;
  /** App download/info link; defaults to "https://example.com" */
  appLink?: string;
  /** Optional dialog subtitle override */
  subtitle?: React.ReactNode;
  /** Optional QR payload or seed string */
  value?: string;
  /** Total countdown time in seconds; defaults to 120 */
  countdownSeconds?: number;
  /** Optional handler when clicking "Use SMS" */
  onUseSms?: () => void;
  /** Whether to show the "Use SMS" option; defaults to true */
  showSmsOption?: boolean;
};

/**
 * Mobile-approval QR confirmation modal:
 * Displays a scannable QR code and an optional SMS fallback action.
 */
export default function QrConfirmationDialog({
  open,
  onClose,
  onApprove,
  title = "Secure Your Account",
  instruction = "Scan QR Code",
  appName = "Biktech Banking App",
  appLink = "https://example.com",
  subtitle,
  value,
  onUseSms,
  showSmsOption = true,
}: QrConfirmationDialogProps) {
  const [qrSeed, setQrSeed] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setQrSeed(`${Date.now()}-${Math.random()}`);
  }, [open]);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onApprove) {
      onApprove();
    }
  };

  const handleUseSms = () => {
    if (onUseSms) {
      onUseSms();
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
          px: { xs: 3, sm: 4 },
          pt: { xs: 3.5, sm: 4 },
          pb: { xs: 3.5, sm: 4 },
          position: "relative",
          bgcolor: "#FFFFFF",
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.12)",
          maxWidth: 440,
          mx: 2,
        },
      }}
    >
      {/* Header: Title + Close Button */}
      <Stack
        direction="row"
        sx={{
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: "20px", sm: "22px" },
            color: "#0F172A",
            lineHeight: 1.25,
            letterSpacing: "-0.015em",
          }}
        >
          {title}
        </Typography>

        <IconButton
          onClick={handleClose}
          aria-label="Close"
          size="small"
          sx={{
            width: 32,
            height: 32,
            bgcolor: "#EDF0F4",
            color: "#1E293B",
            borderRadius: "50%",
            p: 0,
            transition: "all 0.15s ease-in-out",
            "&:hover": {
              bgcolor: "#E2E8F0",
            },
          }}
        >
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Stack>

      {/* Subheading & Subtitle */}
      <Box sx={{ mt: 3, textAlign: "left" }}>
        <Typography
          sx={{
            fontSize: "15px",
            fontWeight: 700,
            color: "#0F172A",
          }}
        >
          {instruction}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#475569",
            fontSize: "14px",
            fontWeight: 400,
            mt: 0.5,
            lineHeight: 1.5,
          }}
        >
          {subtitle ?? (
            <>
              Use{" "}
              <Link
                href={appLink}
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  color: "#0969DA",
                  textDecoration: "underline",
                  fontWeight: 500,
                  "&:hover": {
                    color: "#054DA7",
                  },
                }}
              >
                {appName}
              </Link>{" "}
              to scan the QR code
            </>
          )}
        </Typography>
      </Box>

      {/* QR Code Container */}
      <Box
        onClick={() => {
          if (onApprove) onApprove();
        }}
        sx={{
          width: "100%",
          bgcolor: "#F5F7FA",
          borderRadius: "16px",
          py: 3.5,
          px: 2,
          mt: 2.5,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          cursor: onApprove ? "pointer" : "default",
          transition: "transform 0.15s ease",
          "&:hover": onApprove ? { transform: "scale(1.01)" } : undefined,
        }}
        title={onApprove ? "Click to simulate mobile scan" : undefined}
      >
        <QRCodeSVG
          value={value || qrSeed || "bank-mobile-qr-confirmation"}
          size={180}
          level="M"
          marginSize={0}
        />
      </Box>

      {/* Use SMS Option */}
      {showSmsOption && (
        <ButtonBase
          onClick={handleUseSms}
          sx={{
            width: "100%",
            bgcolor: "#F5F7FA",
            borderRadius: "16px",
            p: 2,
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            textAlign: "left",
            transition: "background-color 0.15s ease",
            "&:hover": {
              bgcolor: "#EDF0F4",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#0F172A",
                flexShrink: 0,
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h3" />
                <path d="M14 2a2 2 0 0 1 2 2v7" />
                <circle cx="7" cy="18" r="0.75" fill="currentColor" />
                <circle cx="17.5" cy="14" r="2.5" />
                <path d="M13.5 22c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" />
              </svg>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#0F172A",
                  lineHeight: 1.3,
                }}
              >
                Use SMS
              </Typography>
              <Typography
                sx={{
                  fontSize: "13px",
                  fontWeight: 400,
                  color: "#64748B",
                  mt: 0.25,
                }}
              >
                Use SMS Code to Verify
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              bgcolor: "#EDF0F4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1E293B",
              flexShrink: 0,
            }}
          >
            <ChevronRight size={16} />
          </Box>
        </ButtonBase>
      )}
    </Dialog>
  );
}
