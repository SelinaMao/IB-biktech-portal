"use client";

import { useState } from "react";
import {
  Box,
  Checkbox,
  IconButton,
  InputAdornment,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import RadioButtonUncheckedRoundedIcon from "@mui/icons-material/RadioButtonUncheckedRounded";
import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";

const FOOTER_LINKS = [
  "FAQs",
  "User Guide",
  "Contact Us",
  "Security",
  "Privacy Policy",
];

const SPECIAL_CHAR_REGEX = /[^A-Za-z0-9\s'"<>&;`\\|]/;

export default function SetupPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(false);

  // UI Error states
  const [passwordError, setPasswordError] = useState<string>("");
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>("");
  const [termsError, setTermsError] = useState<string>("");
  const [touched, setTouched] = useState<{
    password?: boolean;
    confirmPassword?: boolean;
    terms?: boolean;
  }>({});

  const requirements = [
    {
      key: "minLength",
      label: "Minimum 8 characters",
      met: password.length >= 8,
    },
    {
      key: "specialChar",
      label: "At least 1 special character",
      met: SPECIAL_CHAR_REGEX.test(password),
    },
    {
      key: "number",
      label: "At least 1 number",
      met: /[0-9]/.test(password),
    },
    {
      key: "capitalLetter",
      label: "At least 1 capital letter",
      met: /[A-Z]/.test(password),
    },
    {
      key: "lowercaseLetter",
      label: "At least 1 lowercase letter",
      met: /[a-z]/.test(password),
    },
  ];

  const allRequirementsMet = requirements.every((r) => r.met);

  const validatePassword = (value: string): string => {
    if (!value.trim()) {
      return "Password is required";
    }
    const metAll = requirements.every((r) => {
      if (r.key === "minLength") return value.length >= 8;
      if (r.key === "specialChar") return SPECIAL_CHAR_REGEX.test(value);
      if (r.key === "number") return /[0-9]/.test(value);
      if (r.key === "capitalLetter") return /[A-Z]/.test(value);
      if (r.key === "lowercaseLetter") return /[a-z]/.test(value);
      return false;
    });
    if (!metAll) {
      return "Password does not meet all security requirements";
    }
    return "";
  };

  const validateConfirmPassword = (confirmVal: string, passVal: string): string => {
    if (!confirmVal.trim()) {
      return "Confirm Password is required";
    }
    if (confirmVal !== passVal) {
      return "Password does not match";
    }
    return "";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      setPasswordError(validatePassword(value));
    }
    if (touched.confirmPassword && confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(confirmPassword, value));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (touched.confirmPassword) {
      setConfirmPasswordError(validateConfirmPassword(value, password));
    }
  };

  const handleTermsChange = (checked: boolean) => {
    setAgreedTerms(checked);
    if (touched.terms) {
      setTermsError(checked ? "" : "Please agree to the Terms & Conditions");
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setTouched({ password: true, confirmPassword: true, terms: true });

    const pErr = validatePassword(password);
    const cpErr = validateConfirmPassword(confirmPassword, password);
    const tErr = agreedTerms ? "" : "Please agree to the Terms & Conditions";

    setPasswordError(pErr);
    setConfirmPasswordError(cpErr);
    setTermsError(tErr);

    if (!pErr && !cpErr && !tErr) {
      router.push("/success");
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        bgcolor: "#FFFFFF",
      }}
    >
      {/* 1. Top Header: Back Button & Language Switcher */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 3, sm: 6, md: 8 },
          py: 2.5,
          borderBottom: "1px solid #F1F5F9",
        }}
      >
        {/* Back Pill Button */}
        <Box
          component="button"
          type="button"
          onClick={() => router.back()}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            bgcolor: "#EDF0F4",
            color: "#1E293B",
            border: "none",
            borderRadius: "24px",
          px: 4,
            py: 2,
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              bgcolor: "#E2E8F0",
            },
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </Box>

        {/* Language Selector */}
        <SwitchLanguageMenu />
      </Box>

      {/* 2. Main Centered Content */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          px: 3,
          py: { xs: 4, sm: 6, md: 8 },
        }}
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            width: "100%",
            maxWidth: 420,
            display: "flex",
            flexDirection: "column",
            alignItems: "stretch",
          }}
        >
          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.4rem", sm: "1.65rem" },
              color: "#0F172A",
              mb: 1.5,
              letterSpacing: "-0.01em",
              textAlign: "left",
            }}
          >
            Setup Password
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              fontSize: "14px",
              color: "#64748B",
              mb: 3.5,
              textAlign: "left",
              lineHeight: 1.5,
            }}
          >
            Your password must comply with the security requirements below.
          </Typography>

          {/* New Password Field */}
          <Typography
            component="label"
            htmlFor="new-password"
            sx={{
              textAlign: "left",
              fontSize: "14px",
              fontWeight: 500,
              color: passwordError ? "#EF4444" : "#475569",
              mb: 1,
            }}
          >
            New Password
          </Typography>
          <TextField
            id="new-password"
            fullWidth
            type={showPassword ? "text" : "password"}
            placeholder="Enter Password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, password: true }));
              setPasswordError(validatePassword(password));
            }}
            error={Boolean(passwordError)}
            helperText={passwordError}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      sx={{ color: passwordError ? "#EF4444" : "#64748B" }}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                          <path d="m2 2 20 20" />
                        </svg>
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mb: passwordError ? 1.5 : 2.5,
              "& .MuiOutlinedInput-root": {
                height: 48,
                borderRadius: "10px",
                bgcolor: "#F8FAFC",
                color: "#1E293B",
                "& fieldset": {
                  borderColor: passwordError ? "#EF4444" : "#E2E8F0",
                },
                "&:hover fieldset": {
                  borderColor: passwordError ? "#DC2626" : "#CBD5E1",
                },
                "&.Mui-focused fieldset": {
                  borderColor: passwordError ? "#EF4444" : "#3B82F6",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "#EF4444",
                fontSize: "12px",
                mt: 0.5,
                mx: 0.5,
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

          {/* Confirm Password Field */}
          <Typography
            component="label"
            htmlFor="confirm-password"
            sx={{
              textAlign: "left",
              fontSize: "14px",
              fontWeight: 500,
              color: confirmPasswordError ? "#EF4444" : "#475569",
              mb: 1,
            }}
          >
            Confirm Password
          </Typography>
          <TextField
            id="confirm-password"
            fullWidth
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Enter Confirm Password"
            value={confirmPassword}
            onChange={(e) => handleConfirmPasswordChange(e.target.value)}
            onBlur={() => {
              setTouched((prev) => ({ ...prev, confirmPassword: true }));
              setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));
            }}
            error={Boolean(confirmPasswordError)}
            helperText={confirmPasswordError}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      edge="end"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      sx={{ color: confirmPasswordError ? "#EF4444" : "#64748B" }}
                    >
                      {showConfirmPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                          <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                          <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                          <path d="m2 2 20 20" />
                        </svg>
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              mb: confirmPasswordError ? 1.5 : 2.5,
              "& .MuiOutlinedInput-root": {
                height: 48,
                borderRadius: "10px",
                bgcolor: "#F8FAFC",
                color: "#1E293B",
                "& fieldset": {
                  borderColor: confirmPasswordError ? "#EF4444" : "#E2E8F0",
                },
                "&:hover fieldset": {
                  borderColor: confirmPasswordError ? "#DC2626" : "#CBD5E1",
                },
                "&.Mui-focused fieldset": {
                  borderColor: confirmPasswordError ? "#EF4444" : "#3B82F6",
                },
              },
              "& .MuiFormHelperText-root": {
                color: "#EF4444",
                fontSize: "12px",
                mt: 0.5,
                mx: 0.5,
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
                ...(!showConfirmPassword && {
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

          {/* Password Requirements Checklist */}
          <Stack spacing={1.25} sx={{ mt: 1, mb: 3 }}>
            {requirements.map((req) => (
              <Stack
                key={req.key}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center" }}
              >
                {req.met ? (
                  <CheckCircleRoundedIcon
                    sx={{ fontSize: 18, color: "#10B981" }}
                  />
                ) : (
                  <RadioButtonUncheckedRoundedIcon
                    sx={{
                      fontSize: 18,
                      color:
                        touched.password && !allRequirementsMet
                          ? "#CBD5E1"
                          : "#CBD5E1",
                    }}
                  />
                )}
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: req.met ? "#0F172A" : "#64748B",
                    fontWeight: req.met ? 500 : 400,
                  }}
                >
                  {req.label}
                </Typography>
              </Stack>
            ))}
          </Stack>

          {/* Terms & Conditions Checkbox */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                checked={agreedTerms}
                onChange={(e) => handleTermsChange(e.target.checked)}
                sx={{
                  color: termsError ? "#EF4444" : "#CBD5E1",
                  p: 0.5,
                  mr: 1,
                  "&.Mui-checked": {
                    color: "#0D9488",
                  },
                }}
              />
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
            </Box>
            {termsError && (
              <Typography
                sx={{
                  color: "#EF4444",
                  fontSize: "12px",
                  mt: 0.5,
                  ml: 4,
                  textAlign: "left",
                }}
              >
                {termsError}
              </Typography>
            )}
          </Box>

          {/* Verify / Submit Button */}
          <Box
            component="button"
            type="submit"
            sx={{
                marginTop:4,
              width: "100%",
              height: 48,
              borderRadius: "24px",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              bgcolor: "#2563EB",
              color: "#FFFFFF",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: "#1D4ED8",
              },
            }}
          >
            confirm
          </Box>
        </Box>
      </Box>

      {/* 3. Footer Links */}
      <Stack
        direction="row"
        spacing={{ xs: 2.5, sm: 3.5 }}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: 1.5,
          py: 3.5,
          px: 3,
        }}
      >
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link}
            href="#"
            underline="none"
            sx={{
              fontSize: "13px",
              color: "#64748B",
              "&:hover": {
                color: "#1E293B",
              },
            }}
          >
            {link}
          </Link>
        ))}
      </Stack>
    </Box>
  );
}