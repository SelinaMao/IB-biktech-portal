"use client";

import React from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import { RefreshCw, Smartphone } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import { font, palette, radius } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";
import { useLazyAuthenticatorStatusQuery } from "../authenticator.api";
import type { AuthenticatorRequest, AuthenticatorState } from "../authenticator.types";

const POLL_MS = 2_000;
const QR_SIZE = 200;
// The countdown turns red once the QR is about to run out
const LOW_SECONDS = 30;

// The portal's secondary button, as on the transfer dialog's Back
const SECONDARY_SX = {
  backgroundColor: "#DFDFDE",
  borderColor: "#DFDFDE",
  color: palette.text.primary,
  "&:hover": { backgroundColor: "#DFDFDE", borderColor: "#DFDFDE" },
};

type View =
  | { kind: "waiting" }
  | { kind: "authorizing" }
  | { kind: "expired" }
  | { kind: "error"; title: string; message: string };

export type AuthenticatorDialogProps = {
  open: boolean;
  /** The QR to show; mount the dialog per action (a `key`) so a new action starts fresh. */
  authenticator: AuthenticatorRequest | null;
  /** What is being authorized, in the user's words: "transfer", "approval". */
  subject: string;
  /** Carries the action out once the phone has authorized it; a throw is shown in the dialog. */
  onAuthorized: (requestId: string) => Promise<void>;
  /** Raises a new QR for the same action. */
  onRenew: () => Promise<AuthenticatorRequest>;
  /** Closed; `spent` once the authorization was used, so the action no longer waits for one. */
  onClose: (spent: boolean) => void;
};

function secondsUntil(value?: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function errorView(error: unknown, fallbackTitle: string): View {
  const toast = toToastError(error, fallbackTitle);
  return { kind: "error", title: toast.title, message: toast.message ?? "Something went wrong. Please try again." };
}

/**
 * Shows an action's QR for SME Bank Biz App and waits for the phone to scan it; the scan
 * authorizes the action, which is then carried out. Nothing happens until the phone scans.
 */
export default function AuthenticatorDialog({
  open,
  authenticator: initial,
  subject,
  onAuthorized,
  onRenew,
  onClose,
}: AuthenticatorDialogProps) {
  const [authenticator, setAuthenticator] = React.useState<AuthenticatorRequest | null>(initial);
  const [view, setView] = React.useState<View>({ kind: "waiting" });
  const [secondsLeft, setSecondsLeft] = React.useState(() => secondsUntil(initial?.expiresAt));
  // How long this QR lived when it was shown, for the time-left bar
  const [lifetime, setLifetime] = React.useState(() => secondsUntil(initial?.expiresAt));
  const [renewing, setRenewing] = React.useState(false);
  const spentFor = React.useRef<string | null>(null);

  const [loadStatus] = useLazyAuthenticatorStatusQuery();

  const requestId = authenticator?.requestId;
  const watching = open && Boolean(requestId) && view.kind === "waiting";

  // Countdown to the QR's expiry
  React.useEffect(() => {
    if (!watching) return;
    const update = () => {
      const left = secondsUntil(authenticator?.expiresAt);
      setSecondsLeft(left);
      if (left === 0) setView({ kind: "expired" });
    };
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [watching, authenticator?.expiresAt]);

  const carryOut = React.useCallback(
    async (id: string) => {
      if (spentFor.current === id) return;
      spentFor.current = id;
      setView({ kind: "authorizing" });
      try {
        await onAuthorized(id);
      } catch (error) {
        setView(errorView(error, `The ${subject} was not completed`));
      }
    },
    [onAuthorized, subject],
  );

  // Poll the request until the phone authorizes it or it runs out
  React.useEffect(() => {
    if (!watching || !requestId) return;
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const latest = await loadStatus(requestId, false).unwrap();
        if (cancelled) return;
        if (latest.status === "AUTHORIZED") {
          void carryOut(requestId);
          return;
        }
        const next = nextView(latest.status);
        if (next) {
          setView(next);
          return;
        }
        timer = window.setTimeout(poll, POLL_MS);
      } catch (error) {
        if (cancelled) return;
        setView(errorView(error, "Could not check the authorization"));
      }
    };

    timer = window.setTimeout(poll, POLL_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [watching, requestId, loadStatus, carryOut]);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      const renewed = await onRenew();
      setAuthenticator(renewed);
      setLifetime(secondsUntil(renewed.expiresAt));
      setSecondsLeft(secondsUntil(renewed.expiresAt));
      spentFor.current = null;
      setView({ kind: "waiting" });
    } catch (error) {
      setView(errorView(error, "Could not create a new QR"));
    } finally {
      setRenewing(false);
    }
  };

  const busy = view.kind === "authorizing";
  const close = () => onClose(spentFor.current !== null);

  return (
    <BaseDialog
      open={open}
      onClose={busy ? () => undefined : close}
      title="Confirmation"
      maxWidth="xs"
      hideActions
      disableBackdropClick
      hideCloseButton={busy}
      titleSx={{
        fontSize: font.size.xxl,
        fontWeight: font.weight.medium,
        py: 3,
        borderBottom: `1px solid ${palette.slate[200]}`,
      }}
    >
      {view.kind === "error" ? (
        <Outcome title={view.title} message={view.message}>
          <BaseButton title="Close" variant="outlined" fullWidth onClick={close} sx={SECONDARY_SX} />
        </Outcome>
      ) : (
        <Stack spacing={4} sx={{ alignItems: "center", textAlign: "center", pt: 6, pb: 4 }}>
          <Heading view={view.kind} subject={subject} />

          <QrFrame
            payload={authenticator?.qrPayload}
            subject={subject}
            faded={view.kind !== "waiting"}
            overlay={
              view.kind === "authorizing" || renewing ? (
                <Spinner />
              ) : view.kind === "expired" ? (
                <Stack spacing={2} sx={{ alignItems: "center", color: palette.slate[500] }}>
                  <RefreshCw size={28} aria-hidden />
                  <Typography sx={{ fontSize: font.size.md, fontWeight: font.weight.semibold }}>
                    QR expired
                  </Typography>
                </Stack>
              ) : null
            }
          />

          {view.kind === "waiting" && <WaitingStatus secondsLeft={secondsLeft} lifetime={lifetime} />}

          {view.kind === "authorizing" && (
            <StatusPill>
              <CheckCircleRoundedIcon sx={{ fontSize: 18, color: palette.success[600] }} />
              <span>Confirmed on your phone</span>
            </StatusPill>
          )}

          {view.kind === "expired" && (
            <Stack spacing={3} sx={{ width: "100%", pt: 2 }}>
              <BaseButton
                title="Show new QR"
                variant="contained"
                fullWidth
                isLoading={renewing}
                onClick={() => void handleRenew()}
              />
              <BaseButton
                title="Close"
                variant="outlined"
                fullWidth
                disabled={renewing}
                onClick={close}
                sx={SECONDARY_SX}
              />
            </Stack>
          )}
        </Stack>
      )}
    </BaseDialog>
  );
}

// PENDING keeps waiting; the rest stop the poll
function nextView(status: AuthenticatorState): View | null {
  switch (status) {
    case "EXPIRED":
    case "CANCELLED":
      return { kind: "expired" };
    case "CONSUMED":
      return {
        kind: "error",
        title: "Already used",
        message: "This authorization was already used. Check the status before trying again.",
      };
    default:
      return null;
  }
}

function Heading({ view, subject }: { view: "waiting" | "authorizing" | "expired"; subject: string }) {
  const [title, detail] =
    view === "authorizing"
      ? [`Submitting the ${subject}…`, "Please keep this window open until it finishes."]
      : view === "expired"
        ? ["QR code expired", `The ${subject} was not submitted. Show a new QR and scan it before it runs out.`]
        : [null, `Then check the details and confirm the ${subject} with your PIN.`];

  return (
    <Stack spacing={1.5} sx={{ alignItems: "center", maxWidth: 320 }} aria-live="polite">
      <Typography sx={{ fontSize: font.size.base, color: palette.slate[950] }}>
        {title ?? (
          <>
            Scan this QR with{" "}
            <Box component="span" sx={{ fontWeight: font.weight.bold }}>
              SME Bank Biz App
            </Box>
          </>
        )}
      </Typography>
      <Typography sx={{ fontSize: font.size.md, color: palette.slate[500] }}>{detail}</Typography>
    </Stack>
  );
}

/** The QR on a card; `overlay` veils it while the phone's answer is being used or once it ran out. */
function QrFrame({
  payload,
  subject,
  faded,
  overlay,
}: {
  payload?: string | null;
  subject: string;
  faded: boolean;
  overlay: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        position: "relative",
        p: 4,
        bgcolor: palette.white,
        border: `1px solid ${palette.slate[200]}`,
        borderRadius: `${radius.xl}px`,
        boxShadow: "0 12px 32px rgba(31, 27, 75, 0.08)",
        lineHeight: 0,
      }}
    >
      <Box sx={{ opacity: faded ? 0.08 : 1, transition: "opacity 200ms ease" }}>
        {payload ? (
          <QRCodeSVG
            value={payload}
            size={QR_SIZE}
            level="Q"
            marginSize={0}
            title={`${subject} authorization QR code`}
          />
        ) : (
          // No QR for this channel: the phone was asked directly
          <Stack
            spacing={3}
            sx={{
              width: QR_SIZE,
              height: QR_SIZE,
              alignItems: "center",
              justifyContent: "center",
              color: palette.slate[400],
              lineHeight: 1.5,
            }}
          >
            <Smartphone size={40} aria-hidden />
            <Typography sx={{ fontSize: font.size.md, color: palette.slate[500], px: 4 }}>
              Confirm the {subject} on your phone.
            </Typography>
          </Stack>
        )}
      </Box>
      {overlay && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            lineHeight: 1.5,
          }}
        >
          {overlay}
        </Box>
      )}
    </Box>
  );
}

/** Tells the user the page is listening for the phone, and how long the QR has left. */
function WaitingStatus({ secondsLeft, lifetime }: { secondsLeft: number; lifetime: number }) {
  const low = secondsLeft <= LOW_SECONDS;
  const shownFor = QR_SIZE + 34; // the QR card's width

  return (
    <Stack spacing={2.5} sx={{ alignItems: "center", width: shownFor }}>
      <LinearProgress
        variant="determinate"
        value={lifetime > 0 ? (secondsLeft / lifetime) * 100 : 0}
        aria-label="Time left to scan"
        sx={{
          width: "100%",
          height: 4,
          borderRadius: radius.pill,
          bgcolor: palette.slate[100],
          "& .MuiLinearProgress-bar": {
            borderRadius: radius.pill,
            bgcolor: low ? palette.danger[500] : palette.primary.main,
            transition: "transform 1s linear",
          },
        }}
      />
      <Typography
        sx={{
          fontSize: font.size.sm,
          color: low ? palette.danger[500] : palette.slate[400],
          fontVariantNumeric: "tabular-nums",
        }}
      >
        Expires in {formatCountdown(secondsLeft)}
      </Typography>
      <StatusPill>
        <CircularProgress size={14} thickness={5} sx={{ color: palette.navy[800] }} />
        <span>Waiting for your phone…</span>
      </StatusPill>
    </Stack>
  );
}

/** A spinner on a full ring, so it reads as working even when its arc is short. */
function Spinner() {
  const size = 56;
  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <CircularProgress
        variant="determinate"
        value={100}
        size={size}
        thickness={4}
        aria-hidden
        sx={{ position: "absolute", inset: 0, color: palette.slate[200] }}
      />
      <CircularProgress
        size={size}
        thickness={4}
        disableShrink
        aria-label="Working"
        sx={{ position: "absolute", inset: 0, color: palette.navy[800] }}
      />
    </Box>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      role="status"
      sx={{
        alignItems: "center",
        px: 3.5,
        py: 1.5,
        borderRadius: `${radius.pill}px`,
        bgcolor: palette.slate[50],
        border: `1px solid ${palette.slate[200]}`,
        fontSize: font.size.md,
        color: palette.slate[700],
      }}
    >
      {children}
    </Stack>
  );
}

function Outcome({ title, message, children }: { title: string; message: string; children: React.ReactNode }) {
  return (
    <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center", width: "100%", py: 6 }}>
      <ErrorOutlineRoundedIcon sx={{ fontSize: 48, color: palette.danger.main }} />
      <Typography variant="h6">{title}</Typography>
      <Typography variant="body2" sx={{ color: palette.slate[500] }}>
        {message}
      </Typography>
      <Stack spacing={3} sx={{ width: "100%", pt: 4 }}>
        {children}
      </Stack>
    </Stack>
  );
}
