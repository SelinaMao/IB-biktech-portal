"use client";

import { useState } from "react";
import {
  Box,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";
import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";

const FOOTER_LINKS = [
  "FAQs",
  "User Guide",
  "Contact Us",
  "Security",
  "Privacy Policy",
];

export default function ForgotPassword() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [phone, setPhone] = useState("");

  const canSubmit = Boolean(userId.trim()) && Boolean(phone.trim());

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;
    router.push("/otp");
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
            Forgot Password
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
            Enter your information to verify.
          </Typography>

          {/* User ID Field */}
          <Typography
            component="label"
            htmlFor="user-id"
            sx={{
              textAlign: "left",
              fontSize: "14px",
              fontWeight: 500,
              color: "#475569",
              mb: 1,
            }}
          >
            User ID
          </Typography>
          <TextField
            id="user-id"
            fullWidth
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
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

          {/* Mobile Number Field */}
          <Typography
            component="label"
            htmlFor="mobile-number"
            sx={{
              textAlign: "left",
              fontSize: "14px",
              fontWeight: 500,
              color: "#475569",
              mb: 1,
            }}
          >
            Mobile Number
          </Typography>
          <TextField
            id="mobile-number"
            fullWidth
            placeholder="eg: 012934975"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

          {/* Next Button */}
          <Box
            component="button"
            type="submit"
            disabled={!canSubmit}
            sx={{
              marginTop: 4,
              width: "100%",
              height: 48,
              borderRadius: "24px",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              cursor: canSubmit ? "pointer" : "not-allowed",
              bgcolor: canSubmit ? "#2563EB" : "#DDE4EE",
              color: canSubmit ? "#FFFFFF" : "#94A3B8",
              boxShadow: canSubmit ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: canSubmit ? "#1D4ED8" : "#DDE4EE",
              },
            }}
          >
            Next
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