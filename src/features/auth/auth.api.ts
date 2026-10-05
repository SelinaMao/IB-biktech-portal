import { baseApi } from "@/store/baseApi";
import { adminApi } from "@/config/api.config";
import type { SessionUser } from "./auth.slice";
import type {
  LoginResult,
  SetPasswordResult,
  VerifyOtpRequest,
  VerifyOtpResult,
  ResendOtpRequest,
  ResendOtpResult,
  RequestSignupCodeRequest,
  RequestSignupCodeResult,
  ForgotPasswordRequest,
  ForgotPasswordResult,
  SessionInfo,
  RefreshSessionResult,
} from "@core/types/auth";

export type {
  LoginResult,
  SetPasswordResult,
  VerifyOtpType,
  VerifyOtpRequest,
  VerifyOtpSignupData,
  VerifyOtpResult,
  ResendOtpRequest,
  ResendOtpResult,
  RequestSignupCodeRequest,
  SignupRequestCodeData,
  RequestSignupCodeResult,
  ForgotPasswordRequest,
  ForgotPasswordResult,
  SessionInfo,
  RefreshSessionResult,
} from "@core/types/auth";

/**
 * Auth endpoints, injected into the single root `baseApi` (one cache, one
 * middleware — see src/store/baseApi.ts). Every feature follows this pattern:
 * src/features/<feature>/<feature>.api.ts + injectEndpoints.
 *
 * URLs are relative to the BFF (`/api`); the browser never talks to core
 * directly and never sends client credentials — the BFF adds those server-side.
 */
export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    me: build.query<SessionUser, void>({
      query: () => adminApi.AUTH.ME,
      providesTags: ["Session"],
    }),

    login: build.mutation<
      LoginResult,
      { usernameOrEmail: string; password: string }
    >({
      query: (body) => ({ url: adminApi.AUTH.LOGIN, method: "POST", body }),
      invalidatesTags: ["Session"],
    }),

    verifyOtp: build.mutation<VerifyOtpResult, VerifyOtpRequest>({
      query: (body) => ({ url: "/bank/otp/verify", method: "POST", body }),
    }),

    resendOtp: build.mutation<ResendOtpResult, ResendOtpRequest>({
      query: (body) => ({ url: "otp/resend", method: "POST", body }),
    }),

    setPassword: build.mutation<
      SetPasswordResult,
      | { token: string; newPassword: string }
      | { challengeToken: string; verificationToken: string; newPassword: string }
    >({
      // Shared by both the forgot-password flow ({token, newPassword}) and
      // the first-login flow ({challengeToken, verificationToken, newPassword}).
      // See useAuth's resetPassword / setPassword for the split client-side API.
      query: (body) => ({ url: adminApi.AUTH.FORCE_CHANGE_PASSWORD, method: "POST", body }),
      invalidatesTags: ["Session"],
    }),

    /** Token expiry + the bank's session policy; drives the session-timeout prompt. */
    sessionInfo: build.query<SessionInfo, void>({
      query: () => adminApi.AUTH.SESSION,
      keepUnusedDataFor: 0,
    }),

    refreshSession: build.mutation<RefreshSessionResult, void>({
      query: () => ({ url: adminApi.AUTH.REFRESH, method: "POST" }),
    }),

    // No invalidation: refetching /me after logout only earns a 401. The caller reloads to /login.
    logout: build.mutation<void, void>({
      query: () => ({ url: adminApi.AUTH.LOGOUT, method: "POST" }),
    }),

    requestSignupCode: build.mutation<RequestSignupCodeResult, RequestSignupCodeRequest>({
      query: (body) => ({ url: adminApi.AUTH.SIGNUP_REQUEST_CODE, method: "POST", body }),
    }),

    signUpVerifyOtp: build.mutation<VerifyOtpResult, VerifyOtpRequest>({
      query: (body) => ({ url: adminApi.AUTH.SIGNUP_VERIFY_OTP, method: "POST", body: { ...body, confirmationCode: body.confirmCode } }),
    }),

    forgotPassword: build.mutation<ForgotPasswordResult, ForgotPasswordRequest>({
      query: (body) => ({ url: adminApi.AUTH.FORGET_PASSWORD, method: "POST", body }),
    }),
  }),
});

export const {
  useMeQuery,
  useLoginMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useSetPasswordMutation,
  useLogoutMutation,
  useSessionInfoQuery,
  useRefreshSessionMutation,
  useRequestSignupCodeMutation,
  useSignUpVerifyOtpMutation,
  useForgotPasswordMutation,
} = authApi;
