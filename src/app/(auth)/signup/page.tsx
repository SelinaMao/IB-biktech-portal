"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { Box, Link, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

import BaseAuthLayout from "@core/components/BaseAuthLayout";
import { showToast } from "@core/components/AppToast";
import BaseOTP from "@core/components/BaseOTP";
import BaseSuccessSMS from "@core/components/BaseSuccessSMS";
import { ControlledBaseCheckbox, ControlledBaseInput } from "@core/form";
import {
  AuthError,
  toAuthError,
  useAuth,
  useOtpDialog,
  type VerifyOtpRequest,
} from "@/features/auth";
import {
  getSignUpSchema,
  signUpDefaultValues,
} from "@/features/auth/schema/auth.schema";
import { useSignUpVerifyOtpMutation } from "@/features/auth/auth.api";
import type { TSignUpForm } from "@core/types/auth";
import { formatLocalPhoneDisplay, stripSpaces, toIntlPhone } from "@/utils";

export default function ClientSignUpPage() {
  const router = useRouter();
  const t = useTranslations("login");
  const [, setPendingValues] = useState<TSignUpForm | null>(null);
  const [signupUserId, setSignupUserId] = useState<string | undefined>();
  const [successOpen, setSuccessOpen] = useState(false);
  const [_getphone, setGetPhone] = useState<string | undefined>();

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
    Boolean(agreedTerms);

  const handleDoneSignUp = () => {
    router.push("/otp");
  };

  return (
    <BaseAuthLayout
      title="Signup"
      belowForm={
        <Box sx={{ mt: { xs: 2.5, sm: 3.5 }, textAlign: "center" }}>
          <Typography
            component="span"
            sx={{
              fontSize: "14px",
              color: "#64748B",
            }}
          >
            Already have account?{" "}
          </Typography>
          <Link
            component={NextLink}
            href="/login"
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
            Login
          </Link>
        </Box>
      }
     
    >
      <Box component="form" onSubmit={handleSubmit(handleDoneSignUp)} noValidate>
        {/* 1. Account Number Field */}
        <Typography
          component="label"
          htmlFor="accountNumber"
          sx={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#475569",
            mb: 1,
          }}
        >
          Account Number
        </Typography>
        <ControlledBaseInput
          name="accountNumber"
          control={control}
          placeholder="Enter account number"
          disabled={isSubmitting}
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
            "& .MuiInputBase-input::placeholder": {
              color: "#94A3B8",
              opacity: 1,
              fontSize: "14px",
            },
          }}
        />

        {/* 2. NID/Passport ID Field */}
        <Typography
          component="label"
          htmlFor="nId"
          sx={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#475569",
            mb: 1,
          }}
        >
          NID/Passport ID
        </Typography>
        <ControlledBaseInput
          name="nId"
          control={control}
          placeholder="NID/ Password ID"
          disabled={isSubmitting}
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
            "& .MuiInputBase-input::placeholder": {
              color: "#94A3B8",
              opacity: 1,
              fontSize: "14px",
            },
          }}
        />

        {/* 3. Mobile Number Field */}
        <Typography
          component="label"
          htmlFor="phone"
          sx={{
            display: "block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#475569",
            mb: 1,
          }}
        >
          Mobile Number
        </Typography>
        <ControlledBaseInput
          name="phone"
          control={control}
          format={formatLocalPhoneDisplay}
          placeholder="eg: 012934975"
          disabled={isSubmitting}
          slotProps={{
            htmlInput: { inputMode: "numeric" },
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
            "& .MuiInputBase-input::placeholder": {
              color: "#94A3B8",
              opacity: 1,
              fontSize: "14px",
            },
          }}
        />

        {/* 4. Terms and Conditions Checkbox */}
        <ControlledBaseCheckbox
          name="agreedTerms"
          control={control}
          disabled={isSubmitting}
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
          labelSx={{ mb: { xs: 2.5, sm: 3 }, alignItems: "center", mx: 0 }}
        />

        {/* 5. Sign up Submit Button */}
        <Box
          component="button"
          type="button"
          onClick={() => router.push("/otp")}
          sx={{
            width: "100%",
            height: 46,
            borderRadius: "24px",
            border: "none",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            bgcolor: "#2563EB",
            color: "#FFFFFF",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: "#1D4ED8",
            },
          }}
        >
          Sign up
        </Box>
      </Box>
    </BaseAuthLayout>
  );
}
