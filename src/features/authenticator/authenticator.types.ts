/** An authenticator request an action waits for; web shows `qrPayload` as a QR. */
export interface AuthenticatorRequest {
  requestId: string;
  channel: string;
  qrPayload?: string | null;
  expiresAt: string;
}

/** auth-service `AuthenticatorStatus`; the phone authorizes it by scanning (web) or with the PIN (mobile). */
export type AuthenticatorState = "PENDING" | "AUTHORIZED" | "CONSUMED" | "CANCELLED" | "EXPIRED";

/** `GET auth/authenticator/{id}` response `data`. */
export interface AuthenticatorStatus {
  requestId: string;
  status: AuthenticatorState;
  expiresAt: string;
  authorizedAt?: string | null;
  consumedAt?: string | null;
}
export interface AuthenticatorResult {
  outcome: "SUCCEEDED" | "FAILED" | "UNKNOWN";
  /** The owning service's own status, e.g. a transfer's `COMPLETED` or `AWAITING_APPROVAL`. */
  status?: string | null;
  message?: string | null;
}

/** `GET auth/authenticator/{id}` response `data`; `result` stays null until the action was carried out. */
export interface AuthenticatorStatus {
  requestId: string;
  status: AuthenticatorState;
  expiresAt: string;
  /** Set once the phone scanned it and showed the summary; only the PIN is left. */
  scannedAt?: string | null;
  authorizedAt?: string | null;
  consumedAt?: string | null;
  result?: AuthenticatorResult | null;
}
