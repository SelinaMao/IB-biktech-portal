"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SessionEndReason } from "@/config/session.config";
import { baseApi } from "@/store/baseApi";
import { useAppDispatch } from "@/store/hooks";
import { resetStore } from "@/store/root-reducer";
import {
  useLoginMutation,
  useLogoutMutation,
  useResendOtpMutation,
  useSetPasswordMutation,
  useRequestSignupCodeMutation,
  useForgotPasswordMutation,
  type LoginResult,
  type SetPasswordResult,
  type RequestSignupCodeResult,
  type ForgotPasswordRequest,
  type ForgotPasswordResult,
  type VerifyOtpRequest,
  type VerifyOtpResult,
  type ResendOtpRequest,
  type ResendOtpResult,
} from "./auth.api";
import { clearSession, setSession, type SessionUser } from "./auth.slice";
import { toAuthError } from "./auth.error";
import { leaveToLogin, postSessionMessage } from "./session-sync";
import { TSignUpForm } from "@/@core/types/auth";
import { useVerifyOtpMutation } from "../otp/otp.api";

export function useAuth() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [loginMutation] = useLoginMutation();
  const [verifyOtpMutation] = useVerifyOtpMutation();
  const [resendOtpMutation] = useResendOtpMutation();
  const [setPasswordMutation] = useSetPasswordMutation();
  const [logoutMutation] = useLogoutMutation();
  const [requestSignupCodeMutation] = useRequestSignupCodeMutation();
  const [forgotPasswordMutation] = useForgotPasswordMutation();

  /**
   * Every sign-in starts from an empty store. Whatever this browser cached for the previous user —
   * their device binding, accounts, permissions — must never be shown to the next one.
   */
  const beginSession = useCallback(
    (user: SessionUser) => {
      dispatch(baseApi.util.resetApiState());
      dispatch(resetStore());
      dispatch(setSession(user));
      postSessionMessage({ type: "signedIn", userId: user.id });
      router.push("/dashboard");
    },
    [dispatch, router],
  );

  const login = useCallback(
    async ({ body }: { body: { username: string; password: string } }): Promise<LoginResult> => {
      try {
        const result = await loginMutation({
          usernameOrEmail: body.username,
          password: body.password,
        }).unwrap();

        console.log("login result-> ", result);

        if (result.status === "success") beginSession(result.user);

        return result;
      } catch (error) {
        throw toAuthError(error);
      }
    },
    [beginSession, loginMutation],
  );

  const verifyOtp = useCallback(
    async (request: VerifyOtpRequest): Promise<VerifyOtpResult> => {
      try {
        return await verifyOtpMutation(request).unwrap();
      } catch (error) {
        throw toAuthError(error);
      }
    },
    [verifyOtpMutation],
  );

  const resendOtp = useCallback(
    async (request: ResendOtpRequest): Promise<ResendOtpResult> => {
      try {
        return await resendOtpMutation(request).unwrap();
      } catch (error) {
        throw toAuthError(error);
      }
    },
    [resendOtpMutation],
  );

  /**
   * First-login flow: challengeToken from login + verificationToken from otp/verify. Core opens the
   * session along with the new password (the BFF has already stored its tokens), so `data.user` is
   * the signed-in user — no second login.
   */
  const setPassword = useCallback(
    async (args: { challengeToken: string; verificationToken: string; newPassword: string; autoLogin?: boolean }): Promise<SetPasswordResult> => {
      const { challengeToken, verificationToken, newPassword, autoLogin = true } = args;
      try {
        const result = await setPasswordMutation({ challengeToken, verificationToken, newPassword }).unwrap();
        if (autoLogin && result.data?.user) beginSession(result.data.user);
        return result;
      } catch (error) {
        throw toAuthError(error);
      }
    },
    [beginSession, setPasswordMutation],
  );

  /** Forgot-password flow: the resetToken returned by otp/verify. */
  const resetPassword = useCallback(
    async (args: { resetToken: string; newPassword: string; autoLogin?: boolean }): Promise<SetPasswordResult> => {
      const { resetToken, newPassword, autoLogin = true } = args;
      try {
        const result = await setPasswordMutation({ token: resetToken, newPassword }).unwrap();
        if (autoLogin && result.data?.user) beginSession(result.data.user);
        return result;
      } catch (error) {
        throw toAuthError(error);
      }
    },
    [beginSession, setPasswordMutation],
  );

  const signUp = useCallback(
    async ({ body }: { body: TSignUpForm }): Promise<RequestSignupCodeResult> => {
      try {
        return await requestSignupCodeMutation({
          ...body,
        }).unwrap();
      } catch (error) {
        throw toAuthError(error);
      }
    },
    [requestSignupCodeMutation],
  );

  const forgotPassword = useCallback(
    async (body: ForgotPasswordRequest): Promise<ForgotPasswordResult> => {
      try {
        return await forgotPasswordMutation(body).unwrap();
      } catch (error) {
        throw toAuthError(error);
      }
    },
    [forgotPasswordMutation],
  );

  /**
   * Ends the session in this tab and every other one. `reason` is set when the session ended on its
   * own (idle, expiry) rather than by the user, so the login page can say why.
   */
  const logout = useCallback(
    async (reason?: SessionEndReason) => {
      try {
        await logoutMutation().unwrap();
      } finally {
        // Even if the BFF call fails, drop the client mirror and go to login. clearSession first so
        // the portal is unmounted — no screen of this user's data — while the page reloads.
        dispatch(clearSession());
        postSessionMessage({ type: "ended", reason });
        leaveToLogin(reason);
      }
    },
    [dispatch, logoutMutation],
  );

  return {
    beginSession,
    login,
    verifyOtp,
    resendOtp,
    setPassword,
    resetPassword,
    logout,
    signUp,
    forgotPassword,
  };
}
