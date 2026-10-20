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

/* ---- UI spacing controls (MUI units: 1 = 8px) ---- */
const LABEL_GAP = 1.25; // label -> input (10px)
const FIELD_GAP = 3.5; // input -> next label (28px)
const CHECKBOX_GAP = 4; // checkbox -> button (32px)
const CHECKBOX_TOP = 0.5; // extra space above checkbox

const labelSx = {
  display: "block",
  fontSize: "14px",
  fontWeight: 500,
  color: "#475569",
  mb: LABEL_GAP,
} as const;

const inputSx = {
  mb: FIELD_GAP,
  "& .MuiOutlinedInput-root": {
    height: 52,
    borderRadius: "12px",
    bgcolor: "#F8FAFC",
    color: "#1E293B",
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#CBD5E1" },
    "&.Mui-focused fieldset": { borderColor: "#3B82F6" },
    "&.Mui-error fieldset": { borderColor: "#EF4444" },
  },
  "& .MuiInputBase-input": { px: 2 },
  "& .MuiInputBase-input::placeholder": {
    color: "#94A3B8",
    opacity: 1,
    fontSize: "14px",
  },
} as const;

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
        <Typography
          sx={{
            fontSize: "14px",
            color: "#475569",
          }}
        >
          Already have account?{" "}
          <Link
            component={NextLink}
            href="/login"
            underline="none"
            sx={{
              color: "#0969DA",
              fontWeight: 700,
              fontSize: "14px",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Login
          </Link>
        </Typography>
      }
    >
      <Box component="form" onSubmit={handleSubmit(handleDoneSignUp)} noValidate>
        {/* 1. Account Number Field */}
        <Typography component="label" htmlFor="accountNumber" sx={labelSx}>
          Account Number
        </Typography>
        <ControlledBaseInput
          name="accountNumber"
          control={control}
          placeholder="123 123 123"
          disabled={isSubmitting}
          sx={inputSx}
        />

        {/* 2. NID/Passport ID Field */}
        <Typography component="label" htmlFor="nId" sx={labelSx}>
          NID/Passport ID
        </Typography>
        <ControlledBaseInput
          name="nId"
          control={control}
          placeholder="002338699"
          disabled={isSubmitting}
          sx={inputSx}
        />

        {/* 3. Mobile Number Field */}
        <Typography component="label" htmlFor="phone" sx={labelSx}>
          Mobile Number
        </Typography>
        <ControlledBaseInput
          name="phone"
          control={control}
          format={formatLocalPhoneDisplay}
          placeholder="012934975"
          disabled={isSubmitting}
          slotProps={{
            htmlInput: { inputMode: "numeric" },
          }}
          sx={inputSx}
        />

        {/* 4. Terms and Conditions Checkbox */}
        <ControlledBaseCheckbox
          name="agreedTerms"
          control={control}
          disabled={isSubmitting}
          sx={{
            color: "#CBD5E1",
            p: 0.5,
            mr: 1.5,
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
                  color: "#2764A5",
                  fontWeight: 500,
                }}
              >
                Term & Conditions
              </Link>
            </Typography>
          }
          labelSx={{
            mt: CHECKBOX_TOP,
            mb: CHECKBOX_GAP,
            alignItems: "center",
            mx: 0,
          }}
        />

        {/* 5. Sign up Submit Button */}
        <Box
          component="button"
          type="button"
          onClick={() => router.push("/otp")}
          sx={{
            display: "block",
            width: "100%",
            height: 50,
            borderRadius: "999px",
            border: "none",
            fontSize: "15px",
            fontWeight: 600,
            cursor: "pointer",
            bgcolor: "#2764A5",
            color: "#FFFFFF",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: "#1E5289",
            },
          }}
        >
          Sign up
        </Box>
      </Box>
    </BaseAuthLayout>
  );
}