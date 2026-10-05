import type { VerifyOtpType } from "@core/types/auth";

/**
 * Runtime values for `VerifyOtpType` — use these instead of hardcoding the
 * flow strings at call sites. `satisfies Record<VerifyOtpType, VerifyOtpType>`
 * keeps this in lockstep with the union in @core/types/auth: adding, removing,
 * or renaming a flow there breaks this object until it's updated to match.
 */
export const VERIFY_TYPE = {
    LOGIN: "LOGIN",
    SIGNUP: "SIGNUP",
    FORGOT_PASSWORD: "FORGOT_PASSWORD",
    CORPORATE_SIGNUP: "CORPORATE_SIGNUP",
    MERCHANT_SIGNUP: "MERCHANT_SIGNUP",
    USER_SIGNUP: "USER_SIGNUP",
    CONFIRMATION_CODE: "CONFIRMATION_CODE",
    FIRST_LOGIN_PHONE: "FIRST_LOGIN_PHONE",
    FIRST_LOGIN_EMAIL: "FIRST_LOGIN_EMAIL",
    CHANGE_PASSWORD: "CHANGE_PASSWORD",
    FORGET_PASSWORD_PHONE: "FORGET_PASSWORD_PHONE",
    FORGET_PASSWORD_EMAIL: "FORGET_PASSWORD_EMAIL",
} as const satisfies Record<VerifyOtpType, VerifyOtpType>;
