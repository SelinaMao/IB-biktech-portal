"use client";

import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { ChevronRight, RefreshCw } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import { useLazyAuthenticatorStatusQuery } from "@/features/authenticator/authenticator.api";
import type {
  AuthenticatorRequest,
  AuthenticatorResult,
} from "@/features/authenticator/authenticator.types";

const POLL_MS = 2_000;
const DEFAULT_COUNTDOWN_SECONDS = 120;

function secondsUntil(value?: string | null): number {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

type DialogView = "waiting" | "authorizing" | "expired" | "error";

export type QrConfirmationDialogProps = {
  open: boolean;
  /** Optional close handler to cancel or dismiss without approving. */
  onClose?: () => void;
  /** Fired once authorized by the backend or fallback signal. */
  onApprove?: () => void;
  /** Fired with authenticatorRequestId once mobile authorizes it on backend. */
  onAuthorized?: (requestId: string) => Promise<void> | void;
  /** Fired when the backend says the authorized action has already been carried out. */
  onConsumed?: (requestId: string, result?: AuthenticatorResult) => Promise<void> | void;
  /** Real backend authenticator challenge object */
  authenticator?: AuthenticatorRequest | null;
  /** Direct QR payload string from API */
  qrPayload?: string | null;
  /** Optional fallback / direct value string */
  value?: string;
  /** Direct request ID to poll from backend */
  requestId?: string;
  /** Renewal callback to obtain a new QR when expired */
  onRenew?: () => Promise<AuthenticatorRequest | void>;
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
  /** Total countdown time in seconds; defaults to 120 */
  countdownSeconds?: number;
  /** Optional handler when clicking "Use SMS" */
  onUseSms?: () => void;
  /** Whether to show the "Use SMS" option; defaults to true */
  showSmsOption?: boolean;
  /** Loading state while fetching qrPayload from API */
  isLoading?: boolean;
};

/**
 * Mobile-approval QR confirmation modal backed by the API (qrPayload):
 * Displays a scannable QR code fetched from the backend API and polls until authorized on mobile.
 */
export default function QrConfirmationDialog({
  open,
  onClose,
  onApprove,
  onAuthorized,
  onConsumed,
  authenticator: initialAuthenticator,
  qrPayload,
  value,
  requestId: directRequestId,
  onRenew,
  title = "Secure Your Account",
  instruction = "Scan QR Code",
  appName = "Biktech Banking App",
  appLink = "https://example.com",
  subtitle,
  countdownSeconds = DEFAULT_COUNTDOWN_SECONDS,
  onUseSms,
  showSmsOption = true,
  isLoading = false,
}: QrConfirmationDialogProps) {
  const [currentAuthenticator, setCurrentAuthenticator] = React.useState<AuthenticatorRequest | null>(
    initialAuthenticator ?? null
  );
  const [view, setView] = React.useState<DialogView>("waiting");
  const [renewing, setRenewing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    setCurrentAuthenticator(initialAuthenticator ?? null);
  }, [initialAuthenticator]);

  const effectiveRequestId = currentAuthenticator?.requestId || directRequestId;
  const effectivePayload = qrPayload || currentAuthenticator?.qrPayload || value;
  const initialExpirySeconds = currentAuthenticator?.expiresAt
    ? secondsUntil(currentAuthenticator.expiresAt)
    : countdownSeconds;

  const [secondsLeft, setSecondsLeft] = React.useState(initialExpirySeconds);
  const [loadStatus] = useLazyAuthenticatorStatusQuery();
  const spentFor = React.useRef<string | null>(null);

  // Reset state when opening or closing
  React.useEffect(() => {
    if (!open) {
      setView("waiting");
      setErrorMessage(null);
      spentFor.current = null;
      return;
    }
    const initialSec = currentAuthenticator?.expiresAt
      ? secondsUntil(currentAuthenticator.expiresAt)
      : countdownSeconds;
    setSecondsLeft(initialSec);
    setView("waiting");
    setErrorMessage(null);
  }, [open, currentAuthenticator?.expiresAt, countdownSeconds]);

  // Expiration countdown
  React.useEffect(() => {
    if (!open || view !== "waiting") return;
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setView("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [open, view]);

  const carryOut = React.useCallback(
    async (id: string, consumed: boolean, consumedResult?: AuthenticatorResult) => {
      if (spentFor.current === id) return;
      spentFor.current = id;
      setView("authorizing");
      try {
        if (consumed && onConsumed) {
          await onConsumed(id, consumedResult);
        } else if (onAuthorized) {
          await onAuthorized(id);
        } else if (onApprove) {
          onApprove();
        }
      } catch (error) {
        setView("error");
        setErrorMessage(error instanceof Error ? error.message : "The action could not be completed.");
      }
    },
    [onAuthorized, onApprove, onConsumed]
  );

  // Poll backend status until the mobile phone authorizes
  React.useEffect(() => {
    if (!open || !effectiveRequestId || view !== "waiting") return;
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const latest = await loadStatus(effectiveRequestId, false).unwrap();
        if (cancelled) return;
        if (latest.status === "AUTHORIZED") {
          void carryOut(effectiveRequestId, false);
          return;
        }
        if (latest.status === "CONSUMED") {
          void carryOut(effectiveRequestId, true, latest.result ?? undefined);
          return;
        }
        if (latest.status === "EXPIRED" || latest.status === "CANCELLED") {
          setView("expired");
          return;
        }
        timer = window.setTimeout(poll, POLL_MS);
      } catch {
        if (cancelled) return;
        // Keep retrying on transient network blip
        timer = window.setTimeout(poll, POLL_MS);
      }
    };

    timer = window.setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [open, effectiveRequestId, view, loadStatus, carryOut]);

  const handleRenew = async () => {
    if (!onRenew) {
      setSecondsLeft(countdownSeconds);
      spentFor.current = null;
      setView("waiting");
      setErrorMessage(null);
      return;
    }
    setRenewing(true);
    try {
      const renewed = await onRenew();
      if (renewed && typeof renewed === "object" && "requestId" in renewed) {
        setCurrentAuthenticator(renewed as AuthenticatorRequest);
        setSecondsLeft(secondsUntil(renewed.expiresAt));
      } else {
        setSecondsLeft(countdownSeconds);
      }
      spentFor.current = null;
      setView("waiting");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Could not renew the QR code. Please try again.");
    } finally {
      setRenewing(false);
    }
  };

  const handleClose = () => {
    if (view === "authorizing") return;
    onClose?.();
  };

  const handleUseSms = () => {
    onUseSms?.();
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
          disabled={view === "authorizing"}
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
        sx={{
          position: "relative",
          width: "100%",
          bgcolor: "#F5F7FA",
          borderRadius: "16px",
          py: 3.5,
          px: 2,
          mt: 2.5,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 220,
        }}
      >
        {isLoading || !effectivePayload ? (
          <CircularProgress size={36} sx={{ color: "#1B5299" }} />
        ) : (
          <Box
            onClick={() => {
              if (!effectiveRequestId && view === "waiting") {
                void carryOut("simulated-approval");
              }
            }}
            title={!effectiveRequestId ? "Click to simulate mobile app approval" : undefined}
            sx={{
              opacity: view !== "waiting" ? 0.1 : 1,
              transition: "opacity 0.2s ease",
              cursor: !effectiveRequestId && view === "waiting" ? "pointer" : "default",
            }}
          >
            <QRCodeSVG
              value={effectivePayload}
              size={180}
              level="M"
              marginSize={0}
            />
          </Box>
        )}

        {/* Overlay States: Authorizing */}
        {view === "authorizing" && (
          <Stack
            spacing={1.5}
            sx={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(245, 247, 250, 0.92)",
              borderRadius: "16px",
              p: 2,
            }}
          >
            <CircularProgress size={36} sx={{ color: "#16A34A" }} />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <CheckCircleRoundedIcon sx={{ fontSize: 18, color: "#16A34A" }} />
              <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
                Confirmed on your phone
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: "#64748B" }}>
              Completing action...
            </Typography>
          </Stack>
        )}

        {/* Overlay States: Expired */}
        {view === "expired" && (
          <Stack
            spacing={2}
            sx={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(245, 247, 250, 0.95)",
              borderRadius: "16px",
              p: 2,
            }}
          >
            <RefreshCw size={28} color="#64748B" />
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#0F172A" }}>
              QR Code Expired
            </Typography>
            <Button
              variant="contained"
              size="small"
              onClick={() => void handleRenew()}
              disabled={renewing}
              sx={{
                bgcolor: "#1B5299",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "13px",
                borderRadius: "8px",
                px: 2,
                "&:hover": { bgcolor: "#15427C" },
              }}
            >
              {renewing ? "Renewing..." : "Renew QR Code"}
            </Button>
          </Stack>
        )}

        {/* Overlay States: Error */}
        {view === "error" && (
          <Stack
            spacing={1.5}
            sx={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "rgba(245, 247, 250, 0.95)",
              borderRadius: "16px",
              p: 2,
              textAlign: "center",
            }}
          >
            <Typography sx={{ fontSize: "14px", fontWeight: 600, color: "#DC2626" }}>
              {errorMessage || "Verification Failed"}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={handleClose}
              sx={{
                textTransform: "none",
                fontSize: "13px",
                borderRadius: "8px",
                borderColor: "#CBD5E1",
                color: "#334155",
              }}
            >
              Dismiss
            </Button>
          </Stack>
        )}
      </Box>

      {/* Countdown timer */}
      {view === "waiting" && (
        <Stack spacing={0.75} sx={{ alignItems: "center", mt: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              textAlign: "center",
              color: secondsLeft <= 30 ? "#DC2626" : "#64748B",
              fontWeight: 600,
              fontSize: "13px",
            }}
          >
            Expires in {formatCountdown(secondsLeft)}
          </Typography>

          {!effectiveRequestId && (
            <Button
              size="small"
              variant="text"
              onClick={() => void carryOut("simulated-approval")}
              sx={{
                color: "#1B5299",
                fontSize: "12px",
                fontWeight: 500,
                textTransform: "none",
                p: 0.25,
                "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
              }}
            >
              Tap here to simulate mobile app approval
            </Button>
          )}
        </Stack>
      )}

      {/* Use SMS Option */}
      {showSmsOption && (
        <ButtonBase
          onClick={handleUseSms}
          disabled={view === "authorizing"}
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
