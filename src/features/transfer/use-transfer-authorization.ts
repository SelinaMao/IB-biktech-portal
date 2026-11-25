"use client";

import React from "react";

import { showToast } from "@core/components/AppToast";

import type { AuthenticatorRequest, AuthenticatorResult } from "@/features/authenticator";
import { toToastError } from "@/utils/api-error";
import { useRequestTransferAuthenticatorMutation } from "./transfer.api";
import type { TransferResult, TransferStatus } from "./transfer.types";
import { useIdempotencyKey } from "./use-idempotency-key";
import { AnalyticsEvent, trackEvent, trackFailure } from "../analytics";

/** What analytics may know about a transfer: its kind, never its parties, amount or reference. */
function transferAnalytics(transfer: TransferResult) {
  return {
    transfer_type: transfer.transferType,
    method: transfer.method,
    currency: transfer.currency,
    scheduled: Boolean(transfer.schedule),
    frequency: transfer.schedule?.frequency,
  };
}

/**
 * Submit -> the linked phone scans the QR, shows the transfer and its PIN authorizes it -> the
 * server carries it out. A submitted transfer waits in `pending` until then; reopening the QR
 * reuses it, and `discard` (going back to edit the form) drops it so the next submit saves a fresh one.
 *
 * ADR-004 Idempotency-Key: we mint one UUID per submit *intent* (the first click
 * of "Confirm" on this open form). If `submit()` throws on the network, the next
 * click reuses it so the server can replay or recognise the duplicate. Once the
 * transfer reaches a terminal state (server accepted it, or the user went Back
 * to edit, or the dialog closed), the key is cleared. The renew-authenticator
 * POST hits the same guarded path family and gets its own fresh key per click.
 */
export function useTransferAuthorization({
  submit,
  renewAuthenticator,
  onCompleted,
}: {
  submit?: (idempotencyKey: string) => Promise<TransferResult>;
  renewAuthenticator?: (referenceId: string, idempotencyKey: string) => Promise<AuthenticatorRequest>;
  /** The phone authorized it and the transfer went through to this. */
  onCompleted: (result: TransferResult) => void;
}) {
  const [pending, setPending] = React.useState<TransferResult | null>(null);
  const [qrOpen, setQrOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [requestNewAuthenticator] = useRequestTransferAuthenticatorMutation();
  const idem = useIdempotencyKey();

  const start = async (): Promise<boolean> => {
    if (!submit) return false;
    if (pending) {
      setQrOpen(true);
      return true;
    }
    setSubmitting(true);
    const key = idem.ensure();
    try {
      const submitted = await submit(key);
      trackEvent(AnalyticsEvent.TRANSFER_SUBMITTED, transferAnalytics(submitted));
      if (submitted.authenticator) {
        setPending(submitted);
        setQrOpen(true);
      } else {
        if (submitted.status === "AWAITING_AUTHORIZATION") {
          throw new Error("The transfer is waiting for phone authorization, but no QR request was returned.");
        }
        if (["REFUSED", "INDETERMINATE", "CANCELLED"].includes(submitted.status)) {
          throw new Error(submitted.failureReason || `The transfer was not completed (${submitted.status}).`);
        }
        // The service returned a status directly, so no phone challenge is outstanding.
        onCompleted(submitted);
        idem.reset();
      }
      return true;
    } catch (error) {
      // Keep the key: the user may click Confirm again (retry) and the server
      // must recognise the same submission. On non-retryable failures the form
      // reset / Back button clears pending state (and the key with it via `discard`).
      trackFailure(AnalyticsEvent.TRANSFER_SUBMITTED, error);
      showToast("error", toToastError(error, "Transfer not submitted"));
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  // The auth service records the owning payment service's result after it performs the transfer.
  const done = (result?: AuthenticatorResult) => {
    if (!pending) return;
    if (result?.outcome !== "SUCCEEDED" || !result.status || result.status === "AWAITING_AUTHORIZATION") {
      throw new Error(result?.message || "The payment service has not confirmed this transfer.");
    }
    setQrOpen(false);
    setPending(null);
    const completed = { ...pending, status: result.status as TransferStatus };
    trackEvent(AnalyticsEvent.TRANSFER_COMPLETED, { ...transferAnalytics(completed), status: completed.status });
    onCompleted(completed);
    idem.reset();
  };
  const renew = async (): Promise<AuthenticatorRequest> => {
    if (!pending) throw new Error("No transfer is waiting for authorization");
    // Each renew is its own money-movement POST per ADR-004 path pattern; mint a dedicated key.
    if (renewAuthenticator) return renewAuthenticator(pending.referenceId, crypto.randomUUID());
    const renewed = await requestNewAuthenticator({
      body: pending.referenceId,
      idempotencyKey: crypto.randomUUID(),
    }).unwrap();
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
    idem.reset();
  };

  return { pending, qrOpen, submitting, start, done, renew, closeQr, discard };
}
