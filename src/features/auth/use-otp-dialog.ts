"use client";

import { useCallback, useRef, useState } from "react";

import { showToast } from "@core/components/AppToast";
import { AuthError, isOtpExpiredError } from "./auth.error";

export type UseOtpDialogOptions = {
  invalidCodeMessage: string;
  resendFailedMessage: string;
  resentMessage: string;
};

/**
 * Owns the BaseOTP dialog's UI state (open/loading/error/success/expiry) and
 * the verify/resend error handling shared by every OTP-gated flow (signup,
 * login, forgot-password): expired-code errors go to the auto-resend banner,
 * everything else becomes a generic error message. Callers only supply the
 * actual API call and their own success behavior (navigation, next dialog, …).
 */
export function useOtpDialog({ invalidCodeMessage, resendFailedMessage, resentMessage }: UseOtpDialogOptions) {
  const [otpOpen, setOtpOpen] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | undefined>();
  const [otpSuccess, setOtpSuccess] = useState<string | undefined>();
  const [otpExpiredToken, setOtpExpiredToken] = useState(0);
  const [otpSessionExpiredText, setOtpSessionExpiredText] = useState<string | undefined>();
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number | undefined>();

  // Bumped whenever the pending code is invalidated from under an in-flight
  // verify (dialog reopened/closed, or resent) so a late verify rejection
  // can't clobber the fresh state with a stale "Invalid OTP" error.
  const generationRef = useRef(0);

  const openOtp = useCallback((expirySeconds?: number) => {
    generationRef.current += 1;
    setOtpExpirySeconds(expirySeconds);
    setOtpError(undefined);
    setOtpSuccess(undefined);
    setOtpSessionExpiredText(undefined);
    setOtpOpen(true);
  }, []);

  const closeOtp = useCallback(() => {
    generationRef.current += 1;
    setOtpOpen(false);
    setOtpError(undefined);
    setOtpSuccess(undefined);
    setOtpSessionExpiredText(undefined);
  }, []);

  /** Runs `verify` (the API call + success behavior); the guard for "is there a pending session" stays with the caller. */
  const runVerify = useCallback(
    async (verify: () => Promise<void>) => {
      const generation = generationRef.current;
      setIsVerifyingOtp(true);
      setOtpError(undefined);
      try {
        await verify();
      } catch (error) {
        if (generationRef.current !== generation) return;
        if (error instanceof AuthError && isOtpExpiredError(error)) {
          setOtpSessionExpiredText(error.message);
          setOtpExpiredToken((n) => n + 1);
        } else {
          setOtpError(error instanceof AuthError ? error.message : invalidCodeMessage);
        }
      } finally {
        if (generationRef.current === generation) setIsVerifyingOtp(false);
      }
    },
    [invalidCodeMessage],
  );

  /** Runs `resend` (just the API call); the guard for "is there a pending session" stays with the caller. */
  const runResend = useCallback(
    async (resend: () => Promise<void>) => {
      generationRef.current += 1;
      setOtpError(undefined);
      setOtpSuccess(undefined);
      try {
        await resend();
        showToast("success", { title: resentMessage });
      } catch (error) {
        const message = error instanceof AuthError ? error.message : resendFailedMessage;
        setOtpError(message);
        showToast("error", { title: message });
      }
    },
    [resendFailedMessage, resentMessage],
  );

  return {
    otpOpen,
    isVerifyingOtp,
    otpError,
    otpSuccess,
    otpExpiredToken,
    otpSessionExpiredText,
    otpExpirySeconds,
    setOtpSuccess,
    openOtp,
    closeOtp,
    runVerify,
    runResend,
  };
}
