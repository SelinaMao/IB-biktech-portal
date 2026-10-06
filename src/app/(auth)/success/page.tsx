"use client";

import { Box, Link, Stack, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";

const FOOTER_LINKS = [
  "FAQs",
  "User Guide",
  "Contact Us",
  "Security",
  "Privacy Policy",
];

export default function SuccessPage() {
  const router = useRouter();

  const handleDone = () => {
    router.push("/login");
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

        {/* Language Dropdown */}
        <SwitchLanguageMenu />
      </Box>

      {/* 2. Main Centered Review Success Content */}
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
            maxWidth: 440,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          {/* Success Graphic from /branding/otp.png */}
          <Box
            sx={{
              width: { xs: 130, sm: 160 },
              height: { xs: 120, sm: 140 },
              mb: 3.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src="/branding/otp.png"
              alt="Application Under Review"
              width={160}
              height={140}
              style={{
                width: "auto",
                maxWidth: "100%",
                height: "auto",
                maxHeight: "100%",
                objectFit: "contain",
              }}
              priority
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.45rem", sm: "1.7rem" },
              color: "#0F172A",
              mb: 1.5,
              letterSpacing: "-0.01em",
            }}
          >
            Application Under Review
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              fontSize: "14.5px",
              color: "#64748B",
              lineHeight: 1.55,
              maxWidth: 420,
              mb: 4.5,
            }}
          >
            Thank you for signing up! Our team is currently reviewing your
            application to ensure your account security.
          </Typography>

          {/* Done Button */}
          <Box
            component="button"
            type="button"
            onClick={handleDone}
            sx={{
              width: "100%",
              maxWidth: 320,
              height: 48,
              borderRadius: "24px",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
              bgcolor: "#2060A0",
              color: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(32, 96, 160, 0.28)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: "#1A4F85",
              },
            }}
          >
            Done
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
