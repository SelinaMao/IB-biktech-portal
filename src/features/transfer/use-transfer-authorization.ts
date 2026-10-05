"use client";

import React from "react";

import { showToast } from "@core/components/AppToast";
import type { AuthenticatorRequest } from "@/features/authenticator";
import { toToastError } from "@/utils/api-error";
import { useAuthorizeTransferMutation, useRequestTransferAuthenticatorMutation } from "./transfer.api";
import type { TransferResult } from "./transfer.types";

/**
 * Submit -> scan the QR on the linked phone -> carry out. A submitted transfer waits in `pending`
 * until the phone authorizes it; reopening the QR reuses it, and `discard` (going back to edit
 * the form) drops it so the next submit saves a fresh one.
 */
export function useTransferAuthorization({
  submit,
  onCompleted,
}: {
  submit?: () => Promise<TransferResult>;
  /** The phone authorized it and the transfer went through to this. */
  onCompleted: (result: TransferResult) => void;
}) {
  const [pending, setPending] = React.useState<TransferResult | null>(null);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [authorizeTransfer] = useAuthorizeTransferMutation();
  const [requestNewAuthenticator] = useRequestTransferAuthenticatorMutation();

  const start = async () => {
    if (!submit) return;
    if (pending) {
      setQrOpen(true);
      return;
    }
    setSubmitting(true);
    try {
      setPending(await submit());
      setQrOpen(true);
    } catch (error) {
      showToast("error", toToastError(error, "Transfer not submitted"));
    } finally {
      setSubmitting(false);
    }
  };

  // A refusal throws, and the QR dialog shows it
  const authorize = async (authenticatorRequestId: string) => {
    if (!pending) return;
    const result = await authorizeTransfer({ referenceId: pending.referenceId, authenticatorRequestId }).unwrap();
    setQrOpen(false);
    setPending(null);
    onCompleted(result);
  };

  const renew = async (): Promise<AuthenticatorRequest> => {
    if (!pending) throw new Error("No transfer is waiting for authorization");
    const renewed = await requestNewAuthenticator(pending.referenceId).unwrap();
    if (!renewed.authenticator) throw new Error("No authenticator request was returned");
    return renewed.authenticator;
  };

  const closeQr = (spent: boolean) => {
    setQrOpen(false);
    if (spent) setPending(null);
  };

  const discard = () => {
    setPending(null);
    setQrOpen(false);
  };

  return { pending, qrOpen, submitting, start, authorize, renew, closeQr, discard };
}
