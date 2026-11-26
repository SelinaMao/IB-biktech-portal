"use client";

import React from "react";
import QrConfirmationDialog from "@core/components/QrConfirmationDialog";
import type { AuthenticatorRequest, AuthenticatorResult } from "../authenticator.types";

export type AuthenticatorDialogProps = {
  open: boolean;
  /** The QR to show; mount the dialog per action (a `key`) so a new action starts fresh. */
  authenticator: AuthenticatorRequest | null;
  /** What is being authorized, in the user's words: "transfer", "approval". */
  subject: string;
  /** Carries the action out once the phone has authorized it; a throw is shown in the dialog. */
  onAuthorized?: (requestId: string) => Promise<void>;
  /** Handles an action the backend reports as already carried out. */
  onConsumed?: (requestId: string, result?: AuthenticatorResult) => Promise<void> | void;
  /** Keep polling after phone authorization until the owning service records its result. */
  waitForConsumption?: boolean;
  /** Raises a new QR for the same action. */
  onRenew: () => Promise<AuthenticatorRequest>;
  /** Closed; `spent` once the authorization was used, so the action no longer waits for one. */
  onClose: (spent: boolean) => void;
};

/**
 * Shows an action's QR for Biktech Banking App and waits for the phone to scan it; the scan
 * authorizes the action, which is then carried out. Nothing happens until the phone scans.
 */
export default function AuthenticatorDialog({
  open,
  authenticator,
  subject,
  onAuthorized,
  onConsumed,
  waitForConsumption = false,
  onRenew,
  onClose,
}: AuthenticatorDialogProps) {
  const [spent, setSpent] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSpent(false);
    }
  }, [open]);

  const handleAuthorized = async (requestId: string) => {
    if (!onAuthorized) return;
    setSpent(true);
    await onAuthorized(requestId);
  };

  const handleConsumed = async (requestId: string, result?: AuthenticatorResult) => {
    setSpent(true);
    await onConsumed?.(requestId, result);
  };

  const handleClose = () => {
    onClose(spent);
  };

  return (
    <QrConfirmationDialog
      open={open}
      authenticator={authenticator}
      qrPayload={authenticator?.qrPayload}
      title="Secure Your Account"
      instruction="Scan QR Code"
      appName="Biktech Banking App"
      onClose={handleClose}
      onAuthorized={onAuthorized ? handleAuthorized : undefined}
      onConsumed={onConsumed ? handleConsumed : undefined}
      waitForConsumption={waitForConsumption}
      onRenew={onRenew}
    />
  );
}
