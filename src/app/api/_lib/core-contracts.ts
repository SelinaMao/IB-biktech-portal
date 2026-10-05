import "server-only";

/**
 * Core-banking API contract (DTOs) — the single place upstream response
 * shapes are declared. Route handlers import these; nothing outside the BFF
 * sees them. If core changes its contract, this file is the only place to
 * update.
 *
 * Verified against the real auth-service response (2026-07-18).
 */

/** Every core response is wrapped in this envelope. */
export type CoreEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  error?: string;
  timestamp: string;
};

/**
 * Error body — the one envelope core, the gateway and the BFF (error-response.ts)
 * all send. Surfaced to the client via auth.error.ts / utils/api-error.ts.
 */
export type CoreErrorBody = {
  success?: boolean;
  message?: string;
  detail?: string;
  errorCode?: string;
  referenceCode?: string;
  correlationId?: string;
};

/**
 * A role as embedded on `CoreUserDto.roles`.
 *
 * `code` is the identifier — the value the JWT carries and the one to gate on. `name` is a label
 * the bank can rename, so it is for display only.
 */
export type CoreUserRoleDto = {
  id: string;
  code?: string;
  name: string;
  description?: string;
  isSystem?: boolean;
};

/** auth-service user representation. */
export type CoreUserDto = {
  id: string;
  username: string;
  email: string;
  userType: string | null; // null on first login — not yet assigned
  phone?: string;
  // The two endpoints differ: /me returns role OBJECTS, while login returns bare role CODES.
  // toSessionUser() reduces either to the code.
  roles?: (CoreUserRoleDto | string)[] | null; // null on first login — not yet assigned
  permissions?: string[] | null; // null on first login — not yet assigned
};

/**
 * POST v1/auth/login → data. On a normal login, core issues tokens
 * straight away. On a user's *first* login it withholds tokens and instead
 * returns a `challenge` (currently only "OTP_REQUIRED") with a short-lived
 * `challengeToken` scoping the OTP it sent — `accessToken` is absent and
 * `message` explains why (e.g. "OTP sent — verify to continue activation").
 * Re-verified against a live response (2026-08-20). See route.ts for the
 * branch.
 */
export type LoginDataDto = {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string; // "Bearer"
  expiresIn: number; // seconds
  message?: string;
  user: CoreUserDto;
  /** Identifies the OTP dispatched on first login; passed to verify-otp/resend-otp alongside userId. */
  otpId?: string;
  /** Currently only "OTP_REQUIRED" — present whenever core withholds tokens. */
  challenge?: string;
  /** Short-lived JWT scoping the pending OTP challenge (purpose: "otp_challenge"). */
  challengeToken?: string;
  /** Seconds until the OTP resend button re-enables. */
  resendSecondCount?: number;
  /** Currently only "FIRST_LOGIN" — present whenever core withholds tokens. */
  actionStatus?: string;
};

/** Distinguishes which flow POST v1/auth/verify-otp is confirming a code for. */
export type VerifyOtpType = "LOGIN" | "CORPORATE_SIGNUP" | "FORGOT_PASSWORD";

/**
 * POST v1/auth/verify-otp → data. Single endpoint for every flow that
 * confirms an OTP — `type` in the request selects the flow (request body:
 * {type, userId, confirmCode, ...type-specific fields} — not yet verified
 * against a live response for CORPORATE_SIGNUP), core validates the rest of
 * the body accordingly:
 *  - LOGIN / FORGOT_PASSWORD: confirms the OTP sent during a first-login
 *    attempt or a forgot-password request; does not issue tokens. Returns a
 *    short-lived `resetToken` that authorizes the follow-up set-password /
 *    reset-password call (see SetPasswordDataDto below).
 *  - CORPORATE_SIGNUP: confirms the OTP sent during corporate signup and
 *    returns the completed corporate signup record.
 * The response shape is a superset of all three — fields outside a given
 * `type` are simply absent.
 */
export type VerifyOtpDataDto = {
  resetToken?: string;
  verificationToken?: string;
  message?: string;
  userId?: string;
  accountNumber?: string;
  nId?: string;
  phone?: string;
  cif?: string;
  companyName?: string;
  orgType?: string;
  registrationNumber?: string;
  adminFullName?: string;
  adminEmail?: string;
  adminPhone?: string;
  customerCategory?: string;
  natureOfBusiness?: string;
};

/**
 * POST v1/auth/login/set-password → data. Consumes the `token` field
 * (populated with the `resetToken` returned by verify-otp) to set the
 * account's password. Mirrors LoginDataDto: core may complete the login
 * right away (tokens present) or require a fresh login afterward (tokens
 * absent) — see set-password/route.ts for the branch.
 */
export type SetPasswordDataDto = {
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string; // "Bearer"
  expiresIn?: number; // seconds
  message?: string;
  user?: CoreUserDto;
};

/**
 * POST v1/auth/signup/request-code → data. Sends an OTP to `phone` after
 * validating `accountNumber` + `nId` for self-service signup. `userId`
 * identifies the pending signup and must be passed to
 * v1/auth/verify-otp (type: "CORPORATE_SIGNUP") alongside the OTP the user enters. Core also
 * returns the prospective company/admin record it matched, ahead of
 * verification.
 * Re-verified against a live response (2026-08-18): `expiresIn` is NOT
 * present on this endpoint (unlike resend-otp) — the envelope only carries
 * a top-level `timestamp`. Caller must fall back to a client-side default
 * OTP expiry.
 */
export type SignupRequestCodeDataDto = {
  userId: string;
  adminEmail: string;
  adminFullName: string;
  adminPhone: string;
  cif: string;
  companyName: string;
  customerCategory: string;
  natureOfBusiness: string;
  orgType: string;
  organizationId: string;
  referenceNo: string;
  registrationNumber: string;
  expiresIn?: number; // not observed live — kept optional in case core adds it
  /** Identifies the OTP dispatched for signup; passed to verify-otp/resend-otp alongside userId. */
  otpId?: string;
};

/**
 * POST v1/auth/forgot-password/cooperate → data. Sends an OTP to `phone`
 * after validating `usernameOrEmail` for the forgot-password flow. `userId`
 * identifies the pending request and must be passed to
 * v1/auth/verify-otp (type: "FORGOT_PASSWORD") alongside the OTP the user enters.
 */
export type ForgotPasswordDataDto = {
  userId: string;
  message?: string;
  expiresIn?: number; // OTP validity, in seconds
  resendSecondCount?: number; // not observed live — kept optional in case core adds it
  /** Identifies the OTP dispatched for this request; passed to verify-otp/resend-otp alongside userId. */
  otpId?: string;
};

/**
 * POST v1/auth/resend-otp → data. Resends the code for whichever flow `type`
 * names in the request (LOGIN / FORGET_PASSWORD_EMAIL / CORPORATE_SIGNUP,
 * etc. — see VerifyOtpType). Request body is `{userId, type}` — `userId`
 * alone identifies the pending request, no `phone` needed. Re-verified
 * against a live response (2026-08-20): core rotates both `otpId` and the
 * pending `user` record on every resend — callers must overwrite their
 * stored userId/otpId with these before the next verify/resend call, or
 * verification will fail against the stale, no-longer-valid OTP.
 */
export type ResendOtpDataDto = {
  message?: string;
  expiresIn?: number; // OTP validity, in seconds
  otpId?: string;
  user?: CoreUserDto;
};

/**
 * GET v1/users/me → data. Not yet verified against a live response — core
 * may return the user directly or nested under `user`; normalized here.
 * TODO(core): pin once observed, then simplify.
 */
export type MeDataDto = CoreUserDto | { user: CoreUserDto };

export function normalizeMeData(data: MeDataDto): CoreUserDto {
  return "user" in data ? data.user : data;
}
