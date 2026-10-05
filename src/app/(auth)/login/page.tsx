"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch, type Control } from "react-hook-form";
import * as yup from "yup";

import { AuthError, useAuth, useOtpDialog, type SessionUser } from "@/features/auth";
import { glassCheckboxHelperSx, glassCheckboxSx, glassInputSx, glassText } from "@/theme/glass";
import { controlBTNHeight, font, palette } from "@/theme/palette";
import BaseAuthLayout from "@core/components/BaseAuthLayout";
import { showToast } from "@core/components/AppToast";
import BaseButton from "@core/components/BaseButton";
import BaseOTP from "@core/components/BaseOTP";
import SetupPassword, { type SetupPasswordFormValues } from "../setupPassword";
import ForgotPassword, { type ForgotPasswordSuccess } from "../forgotPassword";
import BaseSuccessSMS from "@core/components/BaseSuccessSMS";
import BaseTermsLabel, { TermsLinkText } from "@core/components/BaseTermsLabel";
import { BaseSelect, ControlledBaseCheckbox, ControlledBaseInput } from "@core/form";
import { useTranslations } from "next-intl";
import router from "next/router";

// Rejects strings that are empty or whitespace-only once required() has
// already let an empty string through (e.g. before .trim() normalizes it).
const spaceRegex = /\S/;

export type LoginFormFields = {
  username: string;
  password: string;
  agreedTerms: boolean;
};

// Subscribes to just the fields it needs via `control`, so typing in the
// inputs re-renders this button instead of the whole login page.
function LoginSubmitButton({ control, isSubmitting, signInLabel, signingInLabel }: { control: Control<LoginFormFields>; isSubmitting: boolean; signInLabel: string; signingInLabel: string }) {
  const [username, password, agreedTerms] = useWatch({
    control,
    name: ["username", "password", "agreedTerms"],
  });
  const canSubmit = Boolean(username?.trim()) && Boolean(password) && agreedTerms;

  return (
    <BaseButton
      fullWidth
      type="submit"
      size="medium"
      variant="contained"
      color="secondary"
      disabled={!canSubmit}
      isLoading={isSubmitting}
      title={isSubmitting ? signingInLabel : signInLabel}
      sx={{
        height: controlBTNHeight,
        "&.Mui-disabled": {
          backgroundColor: "#D1D1D6",
          color: "#3C3C4399",
        },
      }}
    />
  );
}

const PRESET_ACCOUNTS = [

  {
    label: "selina.001",
    role: "Corporate",
    username: "selina.001",
    password: "@STRONGPASSWORD",
  },
  {
    label: "wesley.001",
    role: "Corporate",
    username: "wesley.001",
    password: "@STRONGPASSWORD",
  },

];

export default function ClientLoginPage() {
  const { beginSession, login, verifyOtp, resendOtp, setPassword, resetPassword } = useAuth();
  const t = useTranslations("login");
  const tSession = useTranslations("session");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<LoginFormFields | null>(null);
  const [otpUserId, setOtpUserId] = useState("");
  const [otpId, setOtpId] = useState<string | undefined>();
  const [resetToken, setResetToken] = useState("");
  const [fpUsernameOrEmail, setFpUsernameOrEmail] = useState("");
  const [verificationToken, setverificationToken] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const otpDialog = useOtpDialog({
    invalidCodeMessage: t("otp.invalidCode"),
    resendFailedMessage: t("otp.resendFailed"),
    resentMessage: t("otp.resent"),
  });

  const [passwordFlow, setPasswordFlow] = useState<"login" | "forgotPassword">("login");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [successOpen, setSuccessOpen] = useState(false);
  const [pendingLoginPassword, setPendingLoginPassword] = useState("");
  // First login ends signed in: the session set-password opened, started when the user leaves the
  // success dialog. Null if no session came back — they then sign in with the new password.
  const [activatedUser, setActivatedUser] = useState<SessionUser | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  // The portal sends a session that ended by itself here with `?reason=` — say why, once.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason !== "idle" && reason !== "expired") return;
    showToast("info", {
      title: tSession(`ended.${reason}.title`),
      message: tSession(`ended.${reason}.message`),
    });
    params.delete("reason");
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, [tSession]);

  const accountOptions: any[] = useMemo(
    () =>
      PRESET_ACCOUNTS.map((acc) => ({
        value: acc.username,
        label: (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              gap: 1.5,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: font.weight.semibold }}>
              {acc.label}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {acc.username}
            </Typography>
          </Box>
        ),
      })),
    [],
  );

  // ---- Forgot password flow: ForgotPassword owns form -> OTP itself; this
  // page only reacts once a reset token is ready for the password step.
  const [fpOpen, setFpOpen] = useState(false);

  const loginSchema = useMemo(
    () =>
      yup.object({
        username: yup
          .string()
          .required(t("error.userIdRequired"))
          .matches(spaceRegex, t("error.userIdRequired"))
          .trim()
          .min(6, t("error.userIdMin"))
          .matches(/^[A-Za-z0-9._]+$/, t("error.userIdInvalid")),
        password: yup.string().required(t("error.passwordRequired")).trim(),
        agreedTerms: yup.boolean().oneOf([true], t("error.termsRequired")).required(),
      }),
    [t],
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { isSubmitting },
  } = useForm<LoginFormFields>({
    resolver: yupResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: { username: "", password: "", agreedTerms: false },
  });

  const [phone, setPhone] = useState("");
  const maskPhone = (value?: string) => {
    const digits = value ? value.replace(/\D/g, "") : "";
    return digits ? `${"•".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}` : "";
  };
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onSubmit = async (formData: LoginFormFields) => {

    if (submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await login({ body: formData });
      if (result.data?.actionStatus === "FIRST_LOGIN") {
        setPendingCredentials(formData);
        setOtpUserId(result.data.user.id);
        setOtpId(result.data.otpId);
        setChallengeToken(result.data.challengeToken ?? "");
        setPhone(result.data.user.phone ?? "");
        setSubmitting(false);
        otpDialog.openOtp(result.data?.resendSecondCount);

      } else if (result.status === "success") {
        showToast("success", {
          title: t("loginSuccessTitle"),
          message: t("loginSuccessMessage"),
        });
      }
    } catch (error) {
      if (error instanceof AuthError) {
        setErrorMessage(error.detail ?? error.message);
        showToast("error", {
          title: error.message,
          message: error.detail,
          referenceCode: error.referenceCode,
        });
      } else {
        const message = "Unable to sign in right now. Please try again.";
        setErrorMessage(message);
        showToast("error", {
          title: "Login Failed",
          message,
        });
      }
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = (code: string) => {
    if (!pendingCredentials) return;

    return otpDialog.runVerify(async () => {
      const result = await verifyOtp({
        confirmCode: code,
        otpId,
      });
      setResetToken(result.resetToken ?? "");
      setverificationToken(result.verificationToken ?? "");
      otpDialog.setOtpSuccess(t("otp.success"));
      setTimeout(() => {
        otpDialog.closeOtp();
        setPasswordError(undefined);
        setPasswordFlow("login");
        setPasswordOpen(true);
      }, 900);
    });
  };

  const handleResendOtp = () => {
    if (!otpUserId) return;

    return otpDialog.runResend(async () => {
      const result = await resendOtp({
        otpId,
      });
      // Resend rotates both userId and otpId — verifying with the old pair fails.
      if (result.data?.user?.id) setOtpUserId(result.data.user.id);
      setOtpId(result.data?.otpId);
    });
  };

  const handleCloseOtp = () => {
    otpDialog.closeOtp();
  };

  const handleConfirmPassword = async (formData: SetupPasswordFormValues) => {

    const newPassword = formData.password;
    const isForgotPasswordFlow = passwordFlow === "forgotPassword";
    // forgot-password needs the resetToken from otp/verify; first-login needs
    // both challengeToken (from login) and verificationToken (from otp/verify).
    const missingToken = isForgotPasswordFlow ? !resetToken : !challengeToken || !verificationToken;
    if (missingToken) {
      setPasswordError(isForgotPasswordFlow ? t("forgotPasswordFlow.resetPassword.error") : t("setupPassword.error"));
      return;
    }
    setIsSettingPassword(true);
    setPasswordError(undefined);
    try {
      if (isForgotPasswordFlow) {
        await resetPassword({ resetToken, newPassword, autoLogin: false });
      } else {
        const result = await setPassword({ challengeToken, verificationToken, newPassword, autoLogin: false });
        console.log("setPassword result:", result);
        setActivatedUser(result.data?.user ?? null);
      }

      setPendingLoginPassword(newPassword);
      setPasswordOpen(false);
      setSuccessOpen(true);
    } catch (error) {
      if (error instanceof AuthError) {
        setPasswordError(error.detail ?? error.message);
        showToast("error", {
          title: error.message,
          message: error.detail,
          referenceCode: error.referenceCode,
        });
      } else {
        setPasswordError(isForgotPasswordFlow ? t("forgotPasswordFlow.resetPassword.error") : t("setupPassword.error"));
        showToast("error", {
          title: "Login Failed",
          message: "Unable to sign in right now. Please try again.",
        });
      }
    } finally {
      setIsSettingPassword(false);
    }
  };

  const handleClosePassword = () => {
    setPasswordOpen(false);
    setPasswordError(undefined);
  };
  const handleDoneSuccess = async () => {
    setSuccessOpen(false);
    if (passwordFlow === "forgotPassword") {
      return;
    }

    const username = pendingCredentials?.username;
    const newPassword = pendingLoginPassword;

    setPendingCredentials(null);
    setResetToken("");
    setverificationToken("");
    setChallengeToken("");
    setPendingLoginPassword("");

    if (!username || !newPassword) {
      router.push("/login");
      return;
    }

    try {
      await login({ body: { username, password: newPassword } });
    } catch {
      showToast("error", {
        title: "Login Failed",
        message: "Password was updated but automatic sign-in failed. Please sign in manually.",
      });
      router.push("/login");
    }
    setActivatedUser(null);
    if (activatedUser) beginSession(activatedUser);
  };

  const handleOpenForgotPassword = () => {
    setFpOpen(true);
  };

  const handleCloseForgotPassword = () => {
    setFpOpen(false);
  };

  const handleForgotPasswordVerified = ({ resetToken: fpResetToken, usernameOrEmail: fpUsernameOrEmailValue }: ForgotPasswordSuccess) => {
    setFpOpen(false);
    setResetToken(fpResetToken);
    setFpUsernameOrEmail(fpUsernameOrEmailValue);
    setPasswordError(undefined);
    setPasswordFlow("forgotPassword");
    setPasswordOpen(true);
  };

  const termsLabel = (
    <TermsLinkText
      text={t("agreeTerms")}
      linkSx={{ color: palette.navy[800], fontWeight: font.weight.regular, textDecoration: "underline" }}
    />
  );
  const sharedSetupPasswordProps = {
    newPasswordLabel: t("setupPassword.newPassword"),
    newPasswordPlaceholder: t("setupPassword.newPasswordPlaceholder"),
    confirmPasswordLabel: t("setupPassword.confirmPassword"),
    confirmPasswordPlaceholder: t("setupPassword.confirmPasswordPlaceholder"),
    mismatchText: t("setupPassword.mismatch"),
    termsLabel,
  };

  const loginTitle = (() => {
    const welcomeText = t("welcome");
    const brandIndex = welcomeText.toLowerCase().indexOf("sme");
    const splitIndex = brandIndex > 0 ? brandIndex : welcomeText.indexOf(" ") + 1;
    if (splitIndex <= 0) {
      return (
        <Box component="span" sx={{ fontWeight: font.weight.bold }}>
          {welcomeText}
        </Box>
      );
    }

    const lead = welcomeText.slice(0, splitIndex).trimEnd();
    const brand = welcomeText.slice(splitIndex).trimStart();
    const bizIndex = brand.toLowerCase().lastIndexOf("biz");
    const brandLead = bizIndex > 0 ? brand.slice(0, bizIndex).trimEnd() : brand;
    const bizWord = bizIndex > 0 ? brand.slice(bizIndex) : "";

    return (
      <>
        {lead}{" "}
        <Box component="span" sx={{ fontWeight: font.weight.bold }}>
          {brandLead}
          {bizWord && (
            <>
              {" "}
              <Box component="span" sx={{ color: "#D7A777" }}>
                {bizWord}
              </Box>
            </>
          )}
        </Box>
      </>
    );
  })();

  return (
    <BaseAuthLayout
      title={loginTitle}
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
            phone={phone}
            description={t("otp.description", { phone: maskPhone(phone) })}
            {...(otpDialog.otpExpirySeconds != null ? { expirySeconds: otpDialog.otpExpirySeconds } : {})}
            expiresInLabel={(seconds) => t("otp.expiresIn", { seconds })}
            resendPromptText={t("otp.resendPrompt")}
            resendLabel={t("otp.resend")}
            verifyLabel={t("otp.verify")}
            verifyingLabel={t("otp.verifying")}
          />

          <SetupPassword
            {...sharedSetupPasswordProps}
            open={passwordOpen}
            onClose={handleClosePassword}
            onConfirm={handleConfirmPassword}
            isSubmitting={isSettingPassword}
            errorText={passwordError}
            title={passwordFlow === "forgotPassword" ? t("forgotPasswordFlow.resetPassword.title") : t("setupPassword.title")}
            description={passwordFlow === "forgotPassword" ? t("forgotPasswordFlow.resetPassword.description") : t("setupPassword.description")}
            confirmLabel={passwordFlow === "forgotPassword" ? t("forgotPasswordFlow.resetPassword.confirm") : t("setupPassword.confirm")}
            submittingLabel={passwordFlow === "forgotPassword" ? t("forgotPasswordFlow.resetPassword.confirming") : t("setupPassword.confirming")}
            excludedValues={passwordFlow === "forgotPassword" ? [fpUsernameOrEmail] : [pendingCredentials?.username]}
          />

          {/* Shared success dialog for the same two flows as SetupPassword above. */}
          <BaseSuccessSMS
            open={successOpen}
            onDone={handleDoneSuccess}
            title={passwordFlow === "forgotPassword" ? t("forgotPasswordFlow.success.title") : t("setupPassword.success.title")}
            description={passwordFlow === "forgotPassword" ? t("forgotPasswordFlow.success.description") : t("setupPassword.success.description")}
            subtitle={
              passwordFlow === "forgotPassword"
                ? t("forgotPasswordFlow.success.subtitle")
                : activatedUser
                  ? t("setupPassword.success.subtitle")
                  : t("setupPassword.success.signInSubtitle")
            }
            doneLabel={passwordFlow === "forgotPassword" ? t("forgotPasswordFlow.success.done") : t("setupPassword.success.done")}
          />

          <ForgotPassword open={fpOpen} onClose={handleCloseForgotPassword} onSuccess={handleForgotPasswordVerified} />
        </>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <BaseSelect
          value={selectedAccount}
          placeholder="Select Account (Quick Login)"
          options={accountOptions}
          disabled={isSubmitting}
          onChange={(e) => {
            const val = e.target.value as string;
            setSelectedAccount(val);
            const acc = PRESET_ACCOUNTS.find((a) => a.username === val);
            if (acc) {
              setValue("username", acc.username, { shouldValidate: true });
              setValue("password", acc.password, {
                shouldValidate: true,
              });
              setValue("agreedTerms", true, { shouldValidate: true });
            }
          }}
          sx={{
            mb: 2,
            ...glassInputSx,
            "& .MuiSvgIcon-root": { color: glassText.icon },
          }}
        />

        <Typography sx={{ color: palette.white, fontSize: font.size.sm, mb: { xs: 0, sm: 0, md: 2 } }}>{t("userId")}</Typography>
        <ControlledBaseInput
          name="username"
          control={control}
          placeholder={t("userIdPlaceholder")}
          disabled={isSubmitting}
          sx={{
            mb: { xs: 3, sm: 6 },
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

        <Typography sx={{ color: palette.white, fontSize: font.size.sm, mb: { xs: 0, sm: 0, md: 2 } }}>{t("password")}</Typography>
        <ControlledBaseInput
          name="password"
          control={control}
          type={showPassword ? "text" : "password"}
          placeholder={t("passwordPlaceholder")}
          disabled={isSubmitting}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((s) => !s)} edge="end" aria-label={showPassword ? "Hide password" : "Show password"} sx={{ color: palette.text.primary }} disabled={isSubmitting}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: { xs: 3, sm: 6 },
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
          sx={glassCheckboxSx}
          helperSx={glassCheckboxHelperSx}
          label={
            <BaseTermsLabel
              text={t("agreeTerms")}
              underline="always"
              sx={{ color: "#F7F7F7", fontSize: font.size.base, fontWeight: font.weight.regular }}
              linkSx={{ color: "#F7F7F7", fontWeight: font.weight.bold, fontSize: font.size.base, textDecoration: "underline" }}
            />
          }
          labelSx={{ mb: { xs: 2, sm: 3 }, alignItems: "center" }}
        />
        <Box sx={{ mt: { xs: 0, sm: 0, md: 5, lg: 5 } }}></Box>
        <LoginSubmitButton control={control} isSubmitting={isSubmitting} signInLabel={t("signIn")} signingInLabel={t("signingIn")} />
        <Box sx={{ mt: { xs: 0, sm: 0, md: 5, lg: 5 } }}></Box>
        <Stack
          direction="row"
          sx={{
            // my: {
            //   xs: 2,
            // },
            mb: { xs: 0, sm: 0 },
            alignItems: "center",
            justifyContent: "center",

          }}
        >
          <Link
            component="button"
            type="button"
            onClick={handleOpenForgotPassword}
            underline="hover"
            sx={{
              color: "#fff",
              fontWeight: font.weight.regular,
              fontSize: "16px",
            }}
          >
            {t("forgotPassword")}
          </Link>
        </Stack>
        <Stack sx={{ mt: 0.75, alignItems: "center", py: { md: 5 }, gap: { md: 6 } }}>
          <Typography sx={{ color: glassText.muted, fontSize: font.size.sm }}>{t("signUpPrompt")}</Typography>
          <Link
            component={NextLink}
            href="/signup"
            underline="hover"
            sx={{
              color: "#fff",
              fontWeight: font.weight.regular,
              fontSize: "16px",
            }}
          >
            {t("signUp")}
          </Link>
        </Stack>
      </Box>
    </BaseAuthLayout >
  );
}
