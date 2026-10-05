import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/**
 * Normalized auth failure, with the customer-facing support reference users can quote — it maps to
 * the server-side audit log.
 */
export class AuthError extends Error {
  readonly detail?: string;
  readonly referenceCode?: string;
  readonly status?: number | string;

  constructor(args: {
    message: string;
    detail?: string;
    referenceCode?: string;
    status?: number | string;
  }) {
    super(args.message);
    this.name = "AuthError";
    this.detail = args.detail;
    this.referenceCode = args.referenceCode;
    this.status = args.status;
  }
}

type ErrorEnvelope = {
  message?: string;
  detail?: string;
  referenceCode?: string;
};

/** Convert an RTK Query error into an AuthError with whatever detail exists. */
export function toAuthError(error: unknown): AuthError {
  const queryError = error as FetchBaseQueryError;

  if (queryError && typeof queryError === "object" && "status" in queryError) {
    const raw = queryError.data;
    const data = (raw !== null && typeof raw === "object" ? raw : {}) as ErrorEnvelope;
    return new AuthError({
      message: data.message ?? "Login Failed",
      detail: data.detail ?? "Unable to sign in right now. Please try again.",
      referenceCode: data.referenceCode,
      status: queryError.status,
    });
  }

  return new AuthError({
    message: "Login Failed",
    detail: "Unable to sign in right now. Please try again.",
  });
}

const EXPIRED_PATTERN = /expired/i;

/**
 * True when the backend rejected an OTP because the code/session had
 * already expired server-side — distinct from the client-side countdown,
 * which can still show time left if the user submits right at the edge
 * (network latency, clock drift) or if the dialog's countdown wasn't
 * configured at all.
 */
export function isOtpExpiredError(error: unknown): boolean {
  if (!(error instanceof AuthError)) return false;
  return (
    EXPIRED_PATTERN.test(error.message) ||
    EXPIRED_PATTERN.test(error.detail ?? "")
  );
}
