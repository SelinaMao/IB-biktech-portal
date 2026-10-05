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
