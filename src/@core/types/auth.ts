import type { SessionUser } from "@/features/auth/auth.slice";

/**
 * Raw core user snapshot as returned on first login — `roles`/`permissions`
 * are null until the account is fully activated. Mirrors CoreUserDto
 * (verified live 2026-08-20).
 */
export interface FirstLoginUser {
    id: string;
    username: string;
    email: string;
    userType: string | null;
    phone?: string;
    roles?: string[] | null;
    permissions?: string[] | null;
}

/**
 * `data` on a "first_login" LoginResult — core's envelope data, untouched.
 * Re-verified live (2026-08-20): adds `resendSecondCount` and `actionStatus`
 * (currently only "FIRST_LOGIN") alongside the OTP-challenge fields.
 */
export interface LoginChallengeData {
    expiresIn?: number;
    challenge?: string;
    challengeToken?: string;
    otpId?: string;
    resendSecondCount?: number;
    message?: string;
    actionStatus?: string;
    user: FirstLoginUser;
}

/**
 * Result of POST auth/login. A normal login authenticates immediately
 * ("success" — cookies are already set server-side). A user's first login
 * instead returns "first_login": core sent an OTP to `phone` and no session
 * exists yet — the caller must run the OTP + setup-password flow. `status`
 * is the BFF's own discriminant; `success`/`message`/`data`/`timestamp`
 * mirror core's envelope verbatim (verified live 2026-08-20).
 */
export type LoginResult =
    | { status: "success"; user: SessionUser; data?: undefined }
    | {
        status: "first_login";
        success?: boolean;
        message?: string;
        timestamp?: string;
        data: LoginChallengeData;
    };

/**
 * Result of POST auth/login/set-password. Core may complete the login right
 * away (`data.user` present — cookies set server-side) or only set the
 * password (`data` null) — the caller then runs a normal login with the new
 * password.
 */
export interface SetPasswordResult {
    success: boolean;
    message?: string;
    data: { user: SessionUser } | null;
    error?: string;
    timestamp?: string;
}

/** Which OTP-confirmation flow a POST otp/verify call is for. */
export type VerifyOtpType =
    | "LOGIN"
    | "SIGNUP"
    | "FORGOT_PASSWORD"
    | "CORPORATE_SIGNUP"
    | "MERCHANT_SIGNUP"
    | "USER_SIGNUP"
    | "CONFIRMATION_CODE"
    | "FIRST_LOGIN_PHONE"
    | "FIRST_LOGIN_EMAIL"
    | "CHANGE_PASSWORD"
    | "FORGET_PASSWORD_PHONE"
    | "FORGET_PASSWORD_EMAIL";

/**
 * Request body for POST otp/verify — the single endpoint shared by
 * every flow that confirms an OTP. `type` selects the flow and determines
 * which of the flow-specific fields are required.
 */
export type VerifyOtpRequest =
    | { confirmCode: string; otpId?: string }
    | { type: "FIRST_LOGIN_EMAIL"; userId: string; phone: string; confirmCode: string; otpId?: string }
    | { type: "FORGET_PASSWORD_EMAIL"; userId: string; phone: string; confirmCode: string; otpId?: string }
    | {
        type: "SIGNUP";
        userId: string;
        confirmCode: string;
        accountNumber: string;
        nId: string;
        phone: string;
        cif?: string;
        companyName?: string;
        orgType?: string;
        registrationNumber?: string;
        adminFullName?: string;
        adminEmail?: string;
        customerCategory?: string;
        natureOfBusiness?: string;
        otpId?: string;
    }
    | { type: "CORPORATE_SIGNUP"; userId: string; phone: string; confirmCode: string; otpId?: string };

/** Completed corporate signup record — populated only when `typ: "SIGNUP"`. */
export interface VerifyOtpSignupData {
    userId: string;
    accountNumber: string;
    nId: string;
    phone: string;
    cif: string;
    companyName: string;
    orgType: string;
    registrationNumber: string;
    adminFullName: string;
    adminEmail: string;
    adminPhone: string;
    customerCategory: string;
    natureOfBusiness: string;
}

/**
 * Result of POST otp/verify. `resetToken` is populated for LOGIN /
 * FORGOT_PASSWORD; `data` is populated for SIGNUP.
 */
export interface VerifyOtpResult {
    success?: boolean;
    message?: string;
    resetToken?: string;
    verificationToken?: string;
    data?: VerifyOtpSignupData;
    error?: string;
    timestamp?: string;
    type?: VerifyOtpType;
    phone?: string;
}

/**
 * Request body for POST otp/resend. `type` selects which flow's code
 * gets resent — `userId` alone identifies the pending request, so unlike
 * verify-otp no `phone` is needed. Verified against a live response
 * (2026-08-18).
 */
export interface ResendOtpRequest {

    otpId?: string;
}

/**
 * Result of POST otp/resend. `data.otpId` and `data.user` are a *new*
 * pending request — core rotates both on every resend (verified live
 * 2026-08-20) — so callers must replace their stored userId/otpId with
 * these before the next verify/resend call.
 */
export interface ResendOtpResult {
    success?: boolean;
    message?: string;
    data?: { message?: string; expiresIn?: number; otpId?: string; user?: FirstLoginUser };
    timestamp?: string;
}

/** Request body for POST auth/signup/request-code. */
export interface RequestSignupCodeRequest {
    accountNumber: string;
    nId: string;
    phone: string;
}

/** Signup form field values, as collected by the signup page before OTP verification. */
export type TSignUpForm = {
    accountNumber: string;
    nId: string;
    phone: string;
    agreedTerms: boolean;
    phoneNumber?: string;
};

/**
 * Prospective company/admin record core matches ahead of OTP verification.
 * `expiresIn` is not present on the live response (2026-08-18) — the caller
 * must fall back to a client-side default OTP expiry.
 */
export interface SignupRequestCodeData {
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
    resendSecondCount?: number; // not observed live — kept optional in case core adds it
    otpId?: string;
    phoneNumber?: string;
}

/** Result of POST auth/signup/request-code. */
export interface RequestSignupCodeResult {
    success?: boolean;
    message?: string;
    data?: SignupRequestCodeData;
    timestamp?: string;
}

/** Request body for POST auth/forgot-password/cooperate. */
export interface ForgotPasswordRequest {
    usernameOrEmail: string;
    phone: string;
    type?: VerifyOtpType;
    phoneNumber?: string;
}

export type RequestOTP = {
    userId: string;
    phone: string;
    phoneNumber?: string;
    confirmCode: string;
    type?: VerifyOtpType;
    otpId?: string;
};
/** Result of POST auth/forgot-password/cooperate. */
export interface ForgotPasswordResult {
    success?: boolean;
    message?: string;
    data?: { userId: string; message?: string; expiresIn?: number; resendSecondCount?: number; otpId?: string };
    timestamp?: string;
}

/**
 * GET /api/auth/session — what the browser needs to time the session, without ever seeing a
 * token. All times are epoch ms. See api/auth/session/route.ts.
 */
export interface SessionInfo {
    /** When the access token stops working. */
    expiresAt: number;
    /** When no refresh can extend the session any further; null when the sign-in time is unknown. */
    endsAt: number | null;
    /** The bank's front-client session policy (Security parameters in the back office). */
    policy: {
        idleTimeoutMinutes: number;
        warningMinutes: number;
        absoluteTimeoutHours: number;
    };
}

/** POST /api/auth/refresh — the rotated access token's expiry (epoch ms). */
export interface RefreshSessionResult {
    expiresAt: number;
}
