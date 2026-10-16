"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import {
  Box,
  Link,
  OutlinedInput,
  Stack,
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

export default function OtpPage() {
  const router = useRouter();
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const isComplete = digits.every((d) => d.trim().length > 0);

  const handleChange = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = char;
    setDigits(updated);

    // Auto-advance to the next input box
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    router.push("/success");
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
            px: 2.25,
            py: 0.85,
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

      {/* 2. Main Centered OTP Content */}
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
          sx={{
            width: "100%",
            maxWidth: 380,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
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
            }}
          >
            6 Digit code
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              fontSize: "14px",
              color: "#64748B",
              mb: 4,
              lineHeight: 1.5,
            }}
          >
            Enter the code sent to 0*****975
          </Typography>

          {/* 6 Digit Input Boxes: [ ] [ ] [ ] - [ ] [ ] [ ] */}
          <Stack
            direction="row"
            spacing={{ xs: 0.85, sm: 1.25 }}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              mb: 3.5,
            }}
          >
            {/* First Group of 3 */}
            {[0, 1, 2].map((index) => {
              const isFilled = Boolean(digits[index]);
              return (
                <OutlinedInput
                  key={index}
                  inputRef={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                  }}
                  value={digits[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(index, e)
                  }
                  inputProps={{
                    inputMode: "numeric",
                    maxLength: 1,
                    style: {
                      textAlign: "center",
                      padding: 0,
                      fontSize: "19px",
                      fontWeight: 600,
                      color: "#1E293B",
                    },
                  }}
                  sx={{
                    width: { xs: 42, sm: 48 },
                    height: { xs: 48, sm: 54 },
                    borderRadius: "12px",
                    bgcolor: isFilled ? "#EBF4FF" : "#DDE4EE",
                    transition: "all 0.15s ease-in-out",
                    "& fieldset": {
                      borderColor: isFilled ? "#2563EB" : "transparent",
                      borderWidth: isFilled ? "1.5px" : 0,
                    },
                    "&:hover fieldset": {
                      borderColor: isFilled ? "#1D4ED8" : "transparent",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2563EB",
                      borderWidth: "1.5px",
                    },
                  }}
                />
              );
            })}

            {/* Separator Hyphen */}
            <Typography
              sx={{
                color: "#64748B",
                fontSize: "20px",
                fontWeight: 600,
                px: { xs: 0.25, sm: 0.75 },
                userSelect: "none",
              }}
            >
              -
            </Typography>

            {/* Second Group of 3 */}
            {[3, 4, 5].map((index) => {
              const isFilled = Boolean(digits[index]);
              return (
                <OutlinedInput
                  key={index}
                  inputRef={(el: HTMLInputElement | null) => {
                    inputRefs.current[index] = el;
                  }}
                  value={digits[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) =>
                    handleKeyDown(index, e)
                  }
                  inputProps={{
                    inputMode: "numeric",
                    maxLength: 1,
                    style: {
                      textAlign: "center",
                      padding: 0,
                      fontSize: "19px",
                      fontWeight: 600,
                      color: "#1E293B",
                    },
                  }}
                  sx={{
                    width: { xs: 42, sm: 48 },
                    height: { xs: 48, sm: 54 },
                    borderRadius: "12px",
                    bgcolor: isFilled ? "#EBF4FF" : "#DDE4EE",
                    transition: "all 0.15s ease-in-out",
                    "& fieldset": {
                      borderColor: isFilled ? "#2563EB" : "transparent",
                      borderWidth: isFilled ? "1.5px" : 0,
                    },
                    "&:hover fieldset": {
                      borderColor: isFilled ? "#1D4ED8" : "transparent",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2563EB",
                      borderWidth: "1.5px",
                    },
                  }}
                />
              );
            })}
          </Stack>

          {/* Countdown timer */}
          <Typography
            sx={{
              fontSize: "14px",
              color: "#475569",
              fontWeight: 500,
              mb: 2.5,
            }}
          >
            Expired In 00:15
          </Typography>

          {/* Resend prompt */}
          <Typography
            sx={{
              fontSize: "14px",
              color: "#64748B",
              mb: 4.5,
            }}
          >
            Don&apos;t see a code?{" "}
            <Link
              href="#"
              underline="none"
              sx={{
                color: "#2563EB",
                fontWeight: 600,
                "&:hover": {
                  textDecoration: "underline",
                },
              }}
            >
              Resend
            </Link>
          </Typography>

          {/* Verify Button (Active when all 6 digits are filled) */}
          <Box
            component="button"
            type="button"
            disabled={!isComplete}
            onClick={handleVerify}
            sx={{
              width: "100%",
              maxWidth: 340,
              height: 48,
              borderRadius: "24px",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              cursor: isComplete ? "pointer" : "not-allowed",
              bgcolor: isComplete ? "#2563EB" : "#DDE4EE",
              color: isComplete ? "#FFFFFF" : "#94A3B8",
              boxShadow: isComplete ? "0 4px 12px rgba(37, 99, 235, 0.25)" : "none",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: isComplete ? "#1D4ED8" : "#DDE4EE",
              },
            }}
          >
            Verify
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