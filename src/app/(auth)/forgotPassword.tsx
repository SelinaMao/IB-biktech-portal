"use client";

import { useMemo, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";

import { font, palette } from "@/theme/palette";
import { PHONE_DIAL_CODE, toIntlPhone } from "@/utils";
import { AuthError, useAuth, useOtpDialog, VERIFY_TYPE } from "@/features/auth";
import { ControlledBaseInput } from "@core/form";
import BaseDialog from "@/@core/components/BaseDialog";
import BaseOTP from "@core/components/BaseOTP";
import { showToast } from "@core/components/AppToast";
import type { VerifyOtpRequest } from "@core/types/auth";

export type ForgotPasswordValues = {
  usernameOrEmail: string;
  phone: string;
};

export type ForgotPasswordSuccess = {
  resetToken: string;
  usernameOrEmail: string;
};

type OtpSession = {
  userId: string;
  otpId?: string;
  phone: string;
};

const EMPTY_OTP_SESSION: OtpSession = { userId: "", otpId: undefined, phone: "" };

function buildForgotPasswordPayload(data: ForgotPasswordValues) {
  return {
    usernameOrEmail: data.usernameOrEmail,
    phone: `+${toIntlPhone(data.phone)}`,
    type: VERIFY_TYPE.FORGET_PASSWORD_EMAIL,
  };
}

const maskPhone = (value?: string) => {
  const digits = value ? value.replace(/\D/g, "") : "";
  return digits ? `${"•".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}` : "";
};

export type ForgotPasswordProps = {
  open: boolean;
  onClose: () => void;
  /** Called once the OTP is verified, with the reset token for the password step. */
  onSuccess: (result: ForgotPasswordSuccess) => void;
};

/**
 * Full "Forgot Password" flow: collect User ID + mobile, request the OTP,
 * then verify it — owns its own OTP step (verify/resend/close) the same way
 * signup/page.tsx owns its OTP step, so the caller only reacts to the final
 * `onSuccess` once a reset token is available.
 */
export default function ForgotPassword({ open, onClose, onSuccess }: ForgotPasswordProps) {
  const { forgotPassword, verifyOtp, resendOtp } = useAuth();
  const t = useTranslations("login");

  const schema = useMemo(
    () =>
      yup.object({
        usernameOrEmail: yup.string().required("User ID is required").trim(),
        phone: yup
          .string()
          .required("Mobile No. is required")
          .matches(/^\d+$/, "Digits only")
          .trim(),
      }),
    [],
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting: isFormSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: { usernameOrEmail: "", phone: "" },
  });

  const [isRequesting, setIsRequesting] = useState(false);
  const [errorText, setErrorText] = useState<string | undefined>();

  // ---- OTP step, owned here instead of by the caller ----
  const [otpSession, setOtpSession] = useState<OtpSession>(EMPTY_OTP_SESSION);
  const otpDialog = useOtpDialog({
    invalidCodeMessage: t("otp.invalidCode"),
    resendFailedMessage: t("otp.resendFailed"),
    resentMessage: t("otp.resent"),
  });

  // Reset back to the form step whenever the dialog transitions to open — a
  // render-phase update rather than an effect (see BaseOTP / SetupPassword
  // for the same pattern).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      reset({ usernameOrEmail: "", phone: "" });
      setErrorText(undefined);
      otpDialog.closeOtp();
    }
  }

  const submitting = isRequesting || isFormSubmitting;

  const [usernameOrEmail, phone] = watch(["usernameOrEmail", "phone"]);
  const canSubmit = Boolean(usernameOrEmail.trim()) && Boolean(phone.trim()) && !submitting;

  const onSubmit = async (data: ForgotPasswordValues) => {
    const payload = buildForgotPasswordPayload(data);
    console.log("ForgotPassword.onSubmit", payload);
    setErrorText(undefined);
    setIsRequesting(true);
    try {
      const result = await forgotPassword(payload);
      setOtpSession({
        userId: result.data?.userId ?? "",
        otpId: result.data?.otpId,
        phone: payload.phone,
      });
      otpDialog.openOtp(result.data?.resendSecondCount);
    } catch (error) {
      if (error instanceof AuthError) {
        setErrorText(error.detail ?? error.message);
        showToast("error", {
          title: error.message,
          message: error.detail,
          referenceCode: error.referenceCode,
        });
      } else {
        setErrorText(t("forgotPasswordFlow.error"));
        showToast("error", { title: "Request Failed", message: t("forgotPasswordFlow.error") });
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleVerifyOtp = (code: string) => {
    if (!otpSession.userId) return;

    return otpDialog.runVerify(async () => {
      const payload: VerifyOtpRequest = {
        type: VERIFY_TYPE.FORGET_PASSWORD_EMAIL,
        userId: otpSession.userId,
        phone: otpSession.phone,
        confirmCode: code,
        otpId: otpSession.otpId,
      };

      const result = await verifyOtp(payload);
      otpDialog.setOtpSuccess(t("otp.success"));
      setTimeout(() => {
        onSuccess({ resetToken: result.resetToken ?? "", usernameOrEmail });
      }, 900);
    });
  };

  const handleResendOtp = () => {
    if (!otpSession.userId) return;

    return otpDialog.runResend(async () => {
      const result = await resendOtp({
        otpId: otpSession.otpId,
      });
      // Resend rotates both userId and otpId — verifying with the old pair fails.
      setOtpSession((prev) => ({
        ...prev,
        userId: result.data?.user?.id ?? prev.userId,
        otpId: result.data?.otpId,
      }));
    });
  };

  const handleCloseOtp = () => {
    otpDialog.closeOtp();
    onClose();
  };

  return (
    <>
      <BaseDialog
        open={open && !otpDialog.otpOpen}
        onClose={onClose}
        title={t("forgotPassword")}
        maxWidth="xs"
        variant="action"
        isLoading={submitting}
        confirmTitle={submitting ? t("forgotPasswordFlow.submitting") : t("forgotPasswordFlow.next")}
        confirmDisabled={!canSubmit}
        onConfirm={handleSubmit(onSubmit)}
      >
        <Typography
          variant="body2"
          sx={{ color: palette.slate[950], mb: 6, lineHeight: 1.5, fontSize: font.size.base, fontWeight: font.weight.regular }}
        >
          {t("forgotPasswordFlow.description")}
        </Typography>

        <Typography sx={{ color: palette.slate[950], fontSize: font.size.md, mb: 0.75, fontWeight: font.weight.regular }}>
          {t("userId")}
        </Typography>
        <ControlledBaseInput
          name="usernameOrEmail"
          control={control}
          placeholder={t("forgotPasswordFlow.userIdPlaceholder")}
          disabled={submitting}
          fullWidth
          sx={{ mb: 6 }}
        />

        <Typography sx={{ color: palette.slate[950], fontSize: font.size.md, mb: 0.75, fontWeight: font.weight.regular }}>
          {t("forgotPasswordFlow.mobile")}
        </Typography>
        <ControlledBaseInput
          name="phone"
          control={control}
          prefix={PHONE_DIAL_CODE}
          placeholder={t("forgotPasswordFlow.mobilePlaceholder")}
          disabled={submitting}
          fullWidth
          inputProps={{ inputMode: "numeric" }}
        />

        {errorText && (
          <Typography variant="body2" sx={{ color: palette.danger.main, mt: 2 }}>
            {errorText}
          </Typography>
        )}
      </BaseDialog>

      <BaseOTP
        open={open && otpDialog.otpOpen}
        onClose={handleCloseOtp}
        onVerify={handleVerifyOtp}
        onResend={handleResendOtp}
        isVerifying={otpDialog.isVerifyingOtp}
        errorText={otpDialog.otpError}
        successText={otpDialog.otpSuccess}
        expiredSessionToken={otpDialog.otpExpiredToken}
        sessionExpiredText={otpDialog.otpSessionExpiredText ?? t("otp.sessionExpired")}
        title={t("otp.title")}
        phone={otpSession.phone}
        description={t("otp.description", { phone: maskPhone(otpSession.phone) })}
        {...(otpDialog.otpExpirySeconds != null ? { expirySeconds: otpDialog.otpExpirySeconds } : {})}
        expiresInLabel={(seconds) => t("otp.expiresIn", { seconds })}
        resendPromptText={t("otp.resendPrompt")}
        resendLabel={t("otp.resend")}
        verifyLabel={t("otp.verify")}
        verifyingLabel={t("otp.verifying")}
      />
    </>
  );
}
