"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Divider, InputAdornment, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { glassCheckboxHelperSx, glassCheckboxSx, glassInputSx } from "@/theme/glass";
import { controlBTNHeight, font, palette } from "@/theme/palette";
import { formatLocalPhoneDisplay, stripSpaces, toIntlPhone } from "@/utils";
import { AuthError, toAuthError, useAuth, useOtpDialog, type VerifyOtpRequest } from "@/features/auth";
import { getSignUpSchema, signUpDefaultValues } from "@/features/auth/schema/auth.schema";
import type { TSignUpForm } from "@core/types/auth";
import BaseAuthLayout from "@core/components/BaseAuthLayout";
import { showToast } from "@core/components/AppToast";
import BaseButton from "@core/components/BaseButton";
import BaseOTP from "@core/components/BaseOTP";
import BaseSuccessSMS from "@core/components/BaseSuccessSMS";
import BaseTermsLabel from "@core/components/BaseTermsLabel";
import { ControlledBaseCheckbox, ControlledBaseInput } from "@core/form";
import { useTranslations } from "next-intl";
import { useSignUpVerifyOtpMutation } from "@/features/auth/auth.api";

export default function ClientSignUpPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const { signUp, verifyOtp, resendOtp } = useAuth();
  const [signUpVerifyOtp] = useSignUpVerifyOtpMutation();
  const [pendingValues, setPendingValues] = useState<TSignUpForm | null>(null);
  const [signupUserId, setSignupUserId] = useState<string | undefined>();
  const [OtpId, setOtpId] = useState<string | undefined>();
  const [successOpen, setSuccessOpen] = useState(false);
  const [_getphone, setGetPhone] = useState<string | undefined>();
  const otpDialog = useOtpDialog({
    invalidCodeMessage: t("otp.invalidCode"),
    resendFailedMessage: t("otp.resendFailed"),
    resentMessage: t("otp.resent"),
  });


  const schema = useMemo(() => getSignUpSchema(t), [t]);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<TSignUpForm>({
    resolver: yupResolver(schema),
    mode: "onSubmit",
    defaultValues: signUpDefaultValues,
  });

  const [accountNumber, nId, phone, agreedTerms] = watch([
    "accountNumber",
    "nId",
    "phone",
    "agreedTerms",
  ]);
  const canSubmit =
    Boolean(accountNumber?.trim()) &&
    Boolean(nId?.trim()) &&
    Boolean(phone?.trim()) &&
    agreedTerms;

  const onSubmit = async (formData: TSignUpForm) => {
    try {
      const normalizedValues = {
        ...formData,
        phone: toIntlPhone(formData.phone),
        accountNumber: stripSpaces(formData.accountNumber),
        nId: stripSpaces(formData.nId),
      };

      const result = await signUp({ body: normalizedValues });
      setPendingValues(normalizedValues);
      setSignupUserId(result.data?.userId);
      setOtpId(result.data?.otpId);
      otpDialog.openOtp(result.data?.resendSecondCount);
      setGetPhone(result.data?.phoneNumber);
      console.log("Sign up successful:", result);
    } catch (error) {
      if (error instanceof AuthError) {
        showToast("error", {
          title: error.message,
          message: error.detail,
          referenceCode: error.referenceCode,
        });
      } else {
        showToast("error", {
          title: t("signUpFlow.submitError"),
        });
      }
    }
  };


  const handleVerifyOtp = (code: string) => {

    if (!OtpId) return;
    return otpDialog.runVerify(async () => {
      const payload: VerifyOtpRequest = {
        confirmCode: code,
        otpId: OtpId,
      };

      try {
        await signUpVerifyOtp(payload).unwrap();
      } catch (error) {
        throw toAuthError(error);
      }
      otpDialog.setOtpSuccess(t("otp.success"));
      setTimeout(() => {
        otpDialog.closeOtp();
        setSuccessOpen(true);
      }, 900);
    });
  };

  const handleResendOtp = () => {

    if (!OtpId || !signupUserId) return;
    return otpDialog.runResend(async () => {
      const result = await resendOtp({
        otpId: OtpId,
      });
      // Resend rotates both userId and otpId — verifying with the old pair fails.
      if (result.data?.user?.id) setSignupUserId(result.data.user.id);
      setOtpId(result.data?.otpId);
    });
  };

  const handleCloseOtp = () => {
    otpDialog.closeOtp();
  };

  const handleDoneSignUp = () => {
    setSuccessOpen(false);
    setPendingValues(null);
    setSignupUserId(undefined);
    setOtpId(undefined);
    router.push("/login");
  };

  return (
    <BaseAuthLayout
      title={
        <Box component="span" sx={{ fontWeight: font.weight.semibold, fontSize: font.size.xxl, color: palette.white }}>
          {t("signUpFlow.title")}
        </Box>
      }
      symmetricSpacing
      belowForm={
        <Link
          component={NextLink}
          href="/login"
          underline="hover"
          sx={{
            color: "#fff",
            fontWeight: font.weight.regular,
            fontSize: "16px",
          }}
        >
          {t("signUpFlow.signIn")}
        </Link>
      }
      overlays={
        <>
          <BaseOTP
            open={otpDialog.otpOpen}
            onClose={handleCloseOtp}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            isVerifying={otpDialog.isVerifyingOtp}
            errorText={otpDialog.otpError}
            successText={otpDialog.otpSuccess}
            expiredSessionToken={otpDialog.otpExpiredToken}
            sessionExpiredText={otpDialog.otpSessionExpiredText ?? t("otp.sessionExpired")}
            title={t("otp.title")}
            phone={_getphone}
            description={t("otp.description", {
              phone: _getphone ?? ""
            })}
            {...(otpDialog.otpExpirySeconds != null ? { expirySeconds: otpDialog.otpExpirySeconds } : {})}
            expiresInLabel={(seconds) => t("otp.expiresIn", { seconds })}
            resendPromptText={t("otp.resendPrompt")}
            resendLabel={t("otp.resend")}
            verifyLabel={t("otp.verify")}
            verifyingLabel={t("otp.verifying")}
          />

          <BaseSuccessSMS
            open={successOpen}
            onDone={handleDoneSignUp}
            title={t("signUpFlow.success.title")}
            description={t("signUpFlow.success.description")}
            subtitle={t("signUpFlow.success.subtitle")}
            doneLabel={t("signUpFlow.success.done")}
          />
        </>
      }
      signUp={false}
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Typography sx={{ color: palette.white, fontSize: font.size.md, mb: { xs: 0, sm: 0, md: 2 } }} >
          {t("signUpFlow.accountNumber")}
        </Typography>
        <ControlledBaseInput
          name="accountNumber"
          control={control}
          placeholder={t("signUpFlow.accountNumberPlaceholder")}
          disabled={isSubmitting}
          sx={{
            mb: { xs: 2, sm: 3, md: 6 },
            ...glassInputSx,
            "& .MuiOutlinedInput-root": {
              ...glassInputSx["& .MuiOutlinedInput-root"],
              bgcolor: "#FFFFFF",
              color: palette.text.primary,
            },
            "& .MuiInputBase-input::placeholder": {
              color: palette.text.primary,
              opacity: 0.45,
            },
            "& .MuiInputBase-root": { height: controlBTNHeight },
          }}
        />


        <Typography sx={{ color: palette.white, fontSize: font.size.md, mb: { xs: 0, sm: 0, md: 2 } }}>
          {t("signUpFlow.idNumber")}
        </Typography>
        <ControlledBaseInput
          name="nId"
          control={control}
          placeholder={t("signUpFlow.idNumberPlaceholder")}
          disabled={isSubmitting}
          sx={{
            mb: { xs: 2, sm: 3, md: 6 },
            ...glassInputSx,
            "& .MuiOutlinedInput-root": {
              ...glassInputSx["& .MuiOutlinedInput-root"],
              bgcolor: "#FFFFFF",
              color: palette.text.primary,
            },
            "& .MuiInputBase-input::placeholder": {
              color: palette.text.primary,
              opacity: 0.45,
            },
            "& .MuiInputBase-root": { height: controlBTNHeight },
          }}
        />


        <Typography sx={{ color: palette.white, fontSize: font.size.md, mb: { xs: 0, sm: 0, md: 2 } }}>
          {t("signUpFlow.mobile")}
        </Typography>
        <ControlledBaseInput
          name="phone"
          control={control}
          format={formatLocalPhoneDisplay}
          placeholder={t("signUpFlow.phonePlaceholder")}
          disabled={isSubmitting}
          slotProps={{
            htmlInput: { inputMode: "numeric" },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Typography
                    sx={{
                      color: palette.text.primary,
                      fontSize: font.size.md,
                      fontWeight: font.weight.medium,
                    }}
                  >
                    +855
                  </Typography>
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{ mx: 1, my: 0.5, borderColor: palette.text.primary, opacity: 0.25 }}
                  />
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: { xs: 2, sm: 3, md: 6 },
            ...glassInputSx,
            "& .MuiOutlinedInput-root": {
              ...glassInputSx["& .MuiOutlinedInput-root"],
              bgcolor: "#FFFFFF",
              color: palette.text.primary,
            },
            "& .MuiInputBase-input::placeholder": {
              color: palette.text.primary,
              opacity: 0.45,
            },
            "& .MuiInputBase-root": { height: controlBTNHeight },
          }}
        />

        <ControlledBaseCheckbox
          name="agreedTerms"
          control={control}
          disabled={isSubmitting}
          sx={{ ...glassCheckboxSx }}
          helperSx={glassCheckboxHelperSx}
          label={
            <BaseTermsLabel
              text={t("agreeTerms")}
              sx={{ color: "#F7F7F7", fontSize: font.size.base, fontWeight: font.weight.regular }}
              linkSx={{ color: "#F7F7F7", fontWeight: font.weight.bold, fontSize: font.size.base }}
            />
          }
          labelSx={{ mb: { xs: 3, sm: 3 }, alignItems: "center" }}
        />

        <BaseButton
          fullWidth
          type="submit"
          size="medium"
          variant="contained"
          color="secondary"
          disabled={!canSubmit}
          isLoading={isSubmitting}
          title={isSubmitting ? t("signUpFlow.signingUp") : t("signUpFlow.signUp")}
          sx={{
            height: controlBTNHeight,
            "&.Mui-disabled": {
              backgroundColor: "#D1D1D6",
              color: "#3C3C4399",
              mt: { xs: 3, sm: 3 }
            },
          }}
        />
      </Box>
    </BaseAuthLayout>
  );
}
