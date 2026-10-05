"use client";

import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import OutlinedInput from "@mui/material/OutlinedInput";
import Link from "@mui/material/Link";
import CircularProgress from "@mui/material/CircularProgress";

import { font, palette } from "@/theme/palette";
import BaseDialog from "./BaseDialog";

export type BaseOTPProps = {
  open: boolean;
  onClose: () => void;
  /** Called with the joined code as soon as all boxes are filled — verification is automatic, no button press needed. */
  onVerify: (code: string) => void | Promise<void>;
  onResend?: () => void | Promise<void>;
  title?: string;
  phone?: string;
  description?: string;
  length?: number;
  expirySeconds?: number;
  isVerifying?: boolean;
  errorText?: string;
  successText?: string;
  verifyLabel?: string;
  verifyingLabel?: string;
  resendPromptText?: string;
  resendLabel?: string;
  expiresInLabel?: (secondsLeft: number) => string;
  expiredText?: string;
  /**
   * Bump this (e.g. a counter) whenever the caller's onVerify rejected the
   * code because it had already expired server-side. BaseOTP reacts by
   * clearing the boxes, restarting the countdown, and firing onResend —
   * the user never has to notice and tap Resend themselves.
   */
  expiredSessionToken?: number;
  /** Shown briefly after an expiredSessionToken-triggered auto-resend. */
  sessionExpiredText?: string;
};

const DEFAULT_LENGTH = 6;
const DEFAULT_EXPIRY = 0;

/**
 * Second-factor OTP dialog. Six single-digit boxes with auto-advance,
 * backspace-to-previous, and paste-the-whole-code support, plus a resend
 * countdown. Stateless about *how* the code is delivered/verified — the
 * caller owns that via onVerify/onResend.
 */
export default function BaseOTP({
  open,
  onClose,
  onVerify,
  onResend,
  title = "Security Verification",
  phone,
  description,
  length = DEFAULT_LENGTH,
  expirySeconds = DEFAULT_EXPIRY,
  isVerifying = false,
  errorText,
  successText,
  verifyingLabel = "Verifying...",
  resendPromptText = "Didn't get the code?",
  resendLabel = "Resend",
  expiresInLabel = (s) => `Expires in: ${s}s`,
  expiredText = "Session expired. Resend a new one.",
  sessionExpiredText = "This 6-digits has expired. Input a recently one.",
  expiredSessionToken = 0,
}: BaseOTPProps) {
  const [digits, setDigits] = useState<string[]>(() => Array(length).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(expirySeconds);
  const [autoResendNotice, setAutoResendNotice] = useState<string | undefined>();
  // Resending means a new code is on its way, so the old error is stale —
  // hide it the instant Resend is clicked instead of waiting on the caller's
  // async state update to flow back down through errorText.
  const [errorSuppressed, setErrorSuppressed] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const lastSubmittedRef = useRef<string>("");

  const maskedPhone = phone ? `${phone.replace(/\D/g, "").slice(-4)}` : undefined;
  const resolvedDescription =
    description ??
    (maskedPhone
      ? `We've sent a One-Time Password (OTP) to your registered mobile number ending in ${maskedPhone}.`
      : "We've sent a One-Time Password (OTP) to your registered mobile number.");
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDigits(Array(length).fill(""));
      setSecondsLeft(expirySeconds);
      lastSubmittedRef.current = "";
      setAutoResendNotice(undefined);
      setErrorSuppressed(false);
    }
  }

  // onResend is a real side effect (network call), so — unlike the wasOpen
  // reset above, which only touches internal state — this reacts via an
  // effect rather than adjusting state during render.
  const prevExpiredTokenRef = useRef(expiredSessionToken);
  useEffect(() => {
    if (expiredSessionToken === prevExpiredTokenRef.current) return;
    prevExpiredTokenRef.current = expiredSessionToken;
    if (!open) return;
    setDigits(Array(length).fill(""));
    setSecondsLeft(expirySeconds);
    lastSubmittedRef.current = "";
    setAutoResendNotice(sessionExpiredText);
    setErrorSuppressed(true);
    onResend?.();
  }, [expiredSessionToken, open, length, expirySeconds, sessionExpiredText, onResend]);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => inputRefs.current[0]?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [open]);

  const setDigitAt = (index: number, value: string) => {
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleChange = (index: number, rawValue: string) => {
    const value = rawValue.replace(/\D/g, "").slice(-1);
    setDigitAt(index, value);
    if (autoResendNotice) setAutoResendNotice(undefined);
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setDigitAt(index - 1, "");
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLDivElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    setDigits((prev) => {
      const next = [...prev];
      for (let i = 0; i < pasted.length && index + i < length; i += 1) {
        next[index + i] = pasted[i];
      }
      return next;
    });
    const lastFilled = Math.min(index + pasted.length, length) - 1;
    inputRefs.current[Math.max(lastFilled, 0)]?.focus();
  };

  const code = digits.join("");
  const isComplete = code.length === length;
  const isExpired = secondsLeft <= 0 && !successText;
  const canResend = secondsLeft <= 0 && !successText;
  const displayErrorText = !successText && !errorSuppressed && (errorText);
  const statusText = successText ?? displayErrorText ?? autoResendNotice;
  const statusColor = successText
    ? palette.success.main
    : displayErrorText
      ? palette.danger.main
      : palette.warning.main;

  useEffect(() => {
    if (!isComplete || isVerifying || successText) return;
    if (code === lastSubmittedRef.current) return;
    lastSubmittedRef.current = code;
    setErrorSuppressed(false);
    onVerify(code);
  }, [code, isComplete, isVerifying, successText, onVerify]);

  const handleResend = () => {
    if (!canResend) return;
    setDigits(Array(length).fill(""));
    setSecondsLeft(expirySeconds);
    lastSubmittedRef.current = "";
    setAutoResendNotice(undefined);
    setErrorSuppressed(true);
    inputRefs.current[0]?.focus();
    onResend?.();
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="xs"
      variant="action"
      isLoading={isVerifying}
      hideActions
    >
      <Typography
        variant="body2"
        sx={{ color: palette.slate[950], mb: 3, lineHeight: 1.5, fontSize: font.size.md, fontWeight: font.weight.regular }}
      >
        {resolvedDescription}
      </Typography>

      <Typography
        variant="body2"
        sx={{ color: palette.slate[950], mb: "32px", lineHeight: 1.5, fontSize: font.size.md, fontWeight: font.weight.regular }}
      >
        Please enter the 6-digits OTP below:
      </Typography>

      <Box sx={{ width: "fit-content", mx: "auto", mb: 4 }} >
        <Stack direction="row" spacing={{ xs: 1, sm: 1.25 }}>
          {digits.map((digit, index) => (
            <OutlinedInput
              key={index}
              inputRef={(el: HTMLInputElement | null) => {
                inputRefs.current[index] = el;
              }}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={(e) => handlePaste(index, e)}
              error={Boolean(displayErrorText)}
              disabled={isVerifying || Boolean(successText)}
              inputProps={{
                inputMode: "numeric",
                pattern: "[0-9]*",
                maxLength: 1,
                "aria-label": `Digit ${index + 1}`,
                style: {
                  textAlign: "center",
                  padding: 0,
                  fontSize: font.size.xl,
                  fontWeight: font.weight.semibold,
                },
              }}
              sx={{
                width: { xs: 44, sm: 50 },
                height: { xs: 44, sm: 50 },
                ...(successText && {
                  "& .MuiOutlinedInput-notchedOutline": { borderColor: palette.success.main },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: palette.success.main },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: palette.success.main },
                  "&.Mui-disabled .MuiOutlinedInput-notchedOutline": { borderColor: palette.success.main },
                }),
              }}
            />
          ))}
        </Stack>
        {isVerifying ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.5 }}>
            <CircularProgress size={16} sx={{ color: palette.navy[800] }} />
            <Typography variant="body2" sx={{ color: palette.slate[950] }}>
              {verifyingLabel}
            </Typography>
          </Stack>
        ) : (
          statusText && (
            <Typography
              variant="body2"
              sx={{ color: statusColor, textAlign: "left", mt: 1.5 }}
            >
              {statusText}
            </Typography>
          )
        )}
      </Box>

      <Stack sx={{ alignItems: "center", gap: 2 }}>
        <Typography variant="body2" sx={{ color: palette.slate[950] }}>
          {(() => {
            const label = expiresInLabel(secondsLeft);
            const numStr = String(secondsLeft);
            const idx = label.indexOf(numStr);
            if (idx === -1) return label;
            return (
              <>
                {label.slice(0, idx)}
                <Typography component="span" variant="body2" sx={{ fontWeight: font.weight.bold }}>
                  {label.slice(idx)}
                </Typography>
              </>
            );
          })()}
        </Typography>
        <Typography variant="body2" sx={{ color: palette.slate[950] }}>
          {resendPromptText}{" "}
          <Link
            component="button"
            type="button"
            onClick={handleResend}
            sx={{
              fontWeight: font.weight.semibold,
              color: canResend ? palette.navy[800] : palette.slate[400],
              cursor: canResend ? "pointer" : "default",
              pointerEvents: canResend ? "auto" : "none",
            }}
          >
            {resendLabel}
          </Link>
        </Typography>
      </Stack>
    </BaseDialog>
  );
}
