"use client";

import type { ReactNode } from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import Image from "next/image";

import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";

const FOOTER_LINKS = [
  "FAQs",
  "User Guide",
  "Contact Us",
  "Security",
  "Privacy Policy",
];

export type BaseAuthLayoutProps = {
  /** Rendered above the form. */
  title: ReactNode;
  /** Form content, rendered below the title. */
  children: ReactNode;
  /** Content for the grey strip at the bottom of the card. */
  belowForm?: ReactNode;
  /** Dialogs / overlays (OTP, password setup, etc.) rendered outside the card. */
  overlays?: ReactNode;
  signUp?: boolean;
  symmetricSpacing?: boolean;
};

export default function BaseAuthLayout({
  title,
  children,
  belowForm,
  overlays,
}: BaseAuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundImage: "url(/assets/images/Background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
        px: { xs: 2, sm: 3, md: 4 },
        py: { xs: 2, sm: 3 },
      }}
    >
      {/* Top Header: Language Switcher */}
      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexShrink: 0,
          "& .MuiStack-root": {
            bgcolor: "#FFFFFF",
            borderRadius: "999px",
            height: 38,
            px: 2,
            boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <SwitchLanguageMenu />
      </Box>

      {/* OUTER CARD: no padding here */}
      <Box
        sx={{
          width: "100%",
          maxWidth: 440,
          mx: "auto",
          my: 3,
          p: 0,
          bgcolor: "#FFFFFF",
          borderRadius: "15px",
          boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
        }}
      >
        {/* CARD BODY: all padding goes here */}
        <Box
          sx={{
            width: "100%",
            px: { xs: 4, sm: 10 },   // 32px mobile, 80px desktop
            pt: { xs: 6, sm: 9 },    // 48px mobile, 72px desktop
            pb: { xs: 7, sm: 10 },   // 56px mobile, 80px desktop
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Brand Logo */}
          <Box sx={{ mb: 3, display: "flex", justifyContent: "flex-start" }}>
            <Image
              src="/branding/BiKTECH.png"
              alt="BiKTECH Solution"
              width={160}
              height={45}
              style={{
                width: "auto",
                maxWidth: "200px",
                height: "auto",
                objectFit: "contain",
              }}
              priority
            />
          </Box>

          {/* Title */}
          {typeof title === "string" ? (
            <Typography
              variant="h5"
              component="h1"
              sx={{
                fontWeight: 700,
                fontSize: { xs: "20px", sm: "22px" },
                color: "#0F172A",
                mb: 3.5,
                textAlign: "left",
                lineHeight: 1.3,
              }}
            >
              {title}
            </Typography>
          ) : (
            <Box sx={{ mb: 3.5 }}>{title}</Box>
          )}

          {/* Form Content */}
          {children}
        </Box>

        {/* CARD FOOTER: fixed height, independent of body padding */}
        {belowForm && (
          <Box
            sx={{
              width: "100%",
              height: 51,
              flexShrink: 0,
              bgcolor: "#EDF0F4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              "& .MuiTypography-root": {
                fontSize: "14px",
                color: "#2764A5",
              },
              "& a": {
                fontWeight: 700,
                color: "#1D6FD8",
                textDecoration: "none",
              },
            }}
          >
            {belowForm}
          </Box>
        )}
      </Box>

      {/* Page Footer Links */}
      <Stack
        direction="row"
        spacing={{ xs: 1.5, sm: 3 }}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: 1,
          pt: 3,
          pb: 1,
          flexShrink: 0,
        }}
      >
        {FOOTER_LINKS.map((link) => (
          <Link
            key={link}
            href="#"
            underline="none"
            sx={{
              fontSize: "12px",
              color: "rgba(255, 255, 255, 0.45)",
              transition: "color 0.15s ease",
              "&:hover": { color: "#FFFFFF" },
            }}
          >
            {link}
          </Link>
        ))}
      </Stack>

      {/* Dialogs / Overlays */}
      {overlays}
    </Box>
  );
}