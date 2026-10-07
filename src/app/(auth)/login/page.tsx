"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Box, IconButton, InputAdornment, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as yup from "yup";

import { AuthError, useAuth, useOtpDialog } from "@/features/auth";
import { font } from "@/theme/palette";
import BaseAuthLayout from "@core/components/BaseAuthLayout";
import { showToast } from "@core/components/AppToast";
import BaseOTP from "@core/components/BaseOTP";
import { BaseSelect, ControlledBaseCheckbox, ControlledBaseInput } from "@core/form";
import { useTranslations } from "next-intl";

// Rejects strings that are empty or whitespace-only once required() has
// already let an empty string through (e.g. before .trim() normalizes it).
const spaceRegex = /\S/;

export type LoginFormFields = {
  username: string;
  password: string;
  agreedTerms: boolean;
};

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
  const router = useRouter();
  const { login, verifyOtp, resendOtp } = useAuth();
  const t = useTranslations("login");
  const tSession = useTranslations("session");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<LoginFormFields | null>(null);
  const [otpUserId, setOtpUserId] = useState("");
  const [otpId, setOtpId] = useState<string | undefined>();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const otpDialog = useOtpDialog({
    invalidCodeMessage: t("otp.invalidCode"),
    resendFailedMessage: t("otp.resendFailed"),
    resentMessage: t("otp.resent"),
  });

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

  const accountOptions = useMemo(
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
    watch,
    formState: { isSubmitting },
  } = useForm<LoginFormFields>({
    resolver: yupResolver(loginSchema),
    mode: "onSubmit",
    defaultValues: { username: "", password: "", agreedTerms: false },
  });

  const [username, password, agreedTerms] = watch([
    "username",
    "password",
    "agreedTerms",
  ]);

  const canSubmit = Boolean(username?.trim()) && Boolean(password) && Boolean(agreedTerms);

  const maskPhone = (value?: string) => {
    const digits = value ? value.replace(/\D/g, "") : "";
    return digits ? `${"•".repeat(Math.max(digits.length - 4, 0))}${digits.slice(-4)}` : "";
  };

  const onSubmit = async (formData: LoginFormFields) => {
    if (submitting) return;

    setSubmitting(true);

    try {
      const result = await login({ body: formData });
      if (result.status === "first_login") {
        setPendingCredentials(formData);
        setOtpUserId(result.data.user.id);
        setOtpId(result.data.otpId);
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
        showToast("error", {
          title: error.message,
          message: error.detail,
          referenceCode: error.referenceCode,
        });
      } else {
        const message = "Unable to sign in right now. Please try again.";
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
      await verifyOtp({
        confirmCode: code,
        otpId,
      });
      otpDialog.setOtpSuccess(t("otp.success"));
      setTimeout(() => {
        otpDialog.closeOtp();
        router.push("/setupPassword");
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

  return (
    <BaseAuthLayout
      title="Login"
      overlays={
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
      }
      belowForm={
        <Box sx={{ mt: { xs: 2.5, sm: 3.5 }, textAlign: "center" }}>
          <Typography
            component="span"
            sx={{
              fontSize: "14px",
              color: "#64748B",
            }}
          >
            No account yet?{" "}
          </Typography>
          <Link
            component={NextLink}
            href="/signup"
            underline="none"
            sx={{
              color: "#2563EB",
              fontWeight: 600,
              fontSize: "14px",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Sign Up
          </Link>
        </Box>
      }
    >
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ width: "100%" }}>
        {/* Quick select account for testing */}
        <BaseSelect
          value={selectedAccount}
          placeholder="Select Account (Quick Login)"
          options={accountOptions}
          disabled={isSubmitting || submitting}
          onChange={(e) => {
            const val = e.target.value as string;
            setSelectedAccount(val);
            const acc = PRESET_ACCOUNTS.find((a) => a.username === val);
            if (acc) {
              setValue("username", acc.username, { shouldValidate: true });
              setValue("password", acc.password, { shouldValidate: true });
              setValue("agreedTerms", true, { shouldValidate: true });
            }
          }}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              height: 44,
              borderRadius: "10px",
              bgcolor: "#F8FAFC",
              color: "#1E293B",
              "& fieldset": {
                borderColor: "#E2E8F0",
              },
              "&:hover fieldset": {
                borderColor: "#CBD5E1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3B82F6",
              },
            },
          }}
        />

        {/* User ID Field */}
        <Typography
          component="label"
          htmlFor="userId"
          sx={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#475569",
            mb: 1,
            mt: 2,
          }}
        >
          User ID
        </Typography>
        <ControlledBaseInput
          id="userId"
          name="username"
          control={control}
          placeholder="Enter User ID"
          disabled={isSubmitting || submitting}
          sx={{
            mb: 2.5,
            "& .MuiOutlinedInput-root": {
              height: 48,
              borderRadius: "10px",
              bgcolor: "#F8FAFC",
              color: "#1E293B",
              "& fieldset": {
                borderColor: "#E2E8F0",
              },
              "&:hover fieldset": {
                borderColor: "#CBD5E1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3B82F6",
              },
              "&.Mui-error fieldset": {
                borderColor: "#EF4444",
              },
            },
            "& input:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #F8FAFC inset !important",
              boxShadow: "0 0 0 1000px #F8FAFC inset !important",
              WebkitTextFillColor: "#1E293B !important",
              caretColor: "#1E293B !important",
            },
            "& .MuiInputBase-input::placeholder": {
              color: "#94A3B8",
              opacity: 1,
              fontSize: "14px",
            },
          }}
        />

        {/* Password Field */}
        <Typography
          component="label"
          htmlFor="password"
          sx={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#475569",
            mb: 1,
            mt: 2,
          }}
        >
          Password
        </Typography>
        <ControlledBaseInput
          id="password"
          name="password"
          control={control}
          type={showPassword ? "text" : "password"}
          placeholder="Enter Password"
          disabled={isSubmitting || submitting}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    sx={{ color: "#64748B" }}
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: 20 }} />
                    ) : (
                      <Visibility sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          sx={{
            mb: 2.5,
            "& .MuiOutlinedInput-root": {
              height: 48,
              borderRadius: "10px",
              bgcolor: "#F8FAFC",
              color: "#1E293B",
              "& fieldset": {
                borderColor: "#E2E8F0",
              },
              "&:hover fieldset": {
                borderColor: "#CBD5E1",
              },
              "&.Mui-focused fieldset": {
                borderColor: "#3B82F6",
              },
              "&.Mui-error fieldset": {
                borderColor: "#EF4444",
              },
            },
            "& input:-webkit-autofill": {
              WebkitBoxShadow: "0 0 0 1000px #F8FAFC inset !important",
              boxShadow: "0 0 0 1000px #F8FAFC inset !important",
              WebkitTextFillColor: "#1E293B !important",
              caretColor: "#1E293B !important",
            },
            "& .MuiInputBase-input::-ms-reveal, & .MuiInputBase-input::-ms-clear": {
              display: "none",
            },
            "& .MuiInputBase-input": {
              ...(!showPassword && {
                WebkitTextSecurity: "asterisk",
                letterSpacing: "2px",
              }),
            },
            "& .MuiInputBase-input::placeholder": {
              color: "#94A3B8",
              opacity: 1,
              fontSize: "14px",
              letterSpacing: "normal",
              WebkitTextSecurity: "none",
            },
          }}
        />

        {/* Terms & Conditions Checkbox */}
        <ControlledBaseCheckbox
          name="agreedTerms"
          control={control}
          disabled={isSubmitting || submitting}
          sx={{
            color: "#CBD5E1",
            p: 0.5,
            mr: 1,
            "&.Mui-checked": {
              color: "#0D9488",
            },
          }}
          label={
            <Typography sx={{ fontSize: "14px", color: "#475569" }}>
              I have read and agreed to the{" "}
              <Link
                href="#"
                underline="always"
                sx={{
                  color: "#2563EB",
                  fontWeight: 500,
                }}
              >
                Term & Conditions
              </Link>
            </Typography>
          }
          labelSx={{ mb: 3, alignItems: "center", mx: 0, mt: 2 }}
        />

        {/* Login Submit Button */}
        <Box
          component="button"
          type="submit"
          disabled={!canSubmit || isSubmitting || submitting}
          sx={{
            marginTop: 2,
            width: "100%",
            height: 46,
            borderRadius: "24px",
            border: "none",
            fontSize: "15px",
            fontWeight: 600,
            cursor: canSubmit && !isSubmitting && !submitting ? "pointer" : "not-allowed",
            bgcolor: canSubmit && !isSubmitting && !submitting ? "#2563EB" : "#DDE4EE",
            color: canSubmit && !isSubmitting && !submitting ? "#FFFFFF" : "#94A3B8",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: canSubmit && !isSubmitting && !submitting ? "#1D4ED8" : "#DDE4EE",
            },
          }}
        >
          {isSubmitting || submitting ? t("signingIn") : t("signIn")}
        </Box>

        {/* Forgot Password Link */}
        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Link
            component={NextLink}
            href="/forgotPassword"
            underline="none"
            sx={{
              color: "#2563EB",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Forgot Password?
          </Link>
        </Box>
      </Box>
    </BaseAuthLayout>
  );
}
