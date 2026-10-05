"use client";

import type { ReactNode } from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import Image from "next/image";

import { glassPanelSx, glassText } from "@/theme/glass";
import { font, palette } from "@/theme/palette";
import { SwitchLanguageMenu } from "@core/components/SwitchLanguageMenu";

const FOOTER_LINKS = ["FAQ", "User Guide", "Contact Us", "Security", "Privacy"];

export type BaseAuthLayoutProps = {
  /** Rendered inside the shared title Typography, above the form. */
  title: ReactNode;
  /** Form content, rendered below the title. */
  children: ReactNode;
  /** Optional content (e.g. a "Login" link) centered in the gap between the form and the footer links. */
  belowForm?: ReactNode;
  /** Dialogs / overlays (OTP, password setup, etc.) rendered outside the glass panel. */
  overlays?: ReactNode;
  signUp?: boolean;
  /**
   * When true, the top spacer keeps the same minHeight floor as the bottom
   * spacer so the gap above the header and the gap below the footer stay
   * equal even when the form (e.g. sign up's validation errors) eats into
   * the leftover space. Defaults to false to keep login's current spacing.
   */
  symmetricSpacing?: boolean;
};

/**
 * Shared shell for the login / sign up screens: background image, glass
 * panel, header, logo and footer links. Pages only supply the title and the
 * form body — everything else stays visually identical between screens.
 */
export default function BaseAuthLayout({ title, children, belowForm, overlays, symmetricSpacing = false, signUp = true }: BaseAuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: { xs: "center", md: "flex-end" },
        alignItems: "stretch",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ---------- Background Image ---------- */}
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url("/branding/screen.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* ---------- Form panel overlaid on right side ---------- */}
      <Box
        sx={{
          width: { xs: "100%", sm: "100%", md: 520, lg: 610 },
          height: "100vh",
          maxHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          zIndex: 1,
          px: { xs: 3, sm: 6, lg: 8 },
          py: { xs: 2, md: 5, lg: 5 },
          overflowX: "hidden",
          overflowY: { xs: "auto", md: "hidden" },
          ...glassPanelSx,
          opacity: 0.8,
        }}
      >
        {/* Uncapped spacer: on tall viewports, absorbs half of the leftover
            height (mirrored by the matching spacer after the footer) so
            extra space splits evenly above/below instead of piling up on
            one side. Weighted lowest so the header/footer gaps get first
            claim on any scarce leftover space. */}
        <Box
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: 0,
            // minHeight: symmetricSpacing ? { xs: 5, sm: 5 } : 0,
          }}
        />

        {/* 1. Header (Fixed Height) */}
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <Box sx={{ flex: { xs: "unset", md: 1 } }} />
          <SwitchLanguageMenu />
        </Stack>

        {/* Capped spacer: caps the header-to-form gap on tall viewports.
            Weighted above the top spacer so it gets first claim on scarce
            leftover space. Matches the form-to-footer spacer's weight so
            the gaps above and below the form stay equal. */}
        <Box sx={{ flexGrow: 4, flexShrink: 1, flexBasis: 0, maxHeight: { xs: 24, sm: 40, md: 72 } }} />

        {/* 2. Form (Fixed Height) */}
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            maxWidth: 510,
            width: "100%",
            mx: "auto",
            "@media (max-height: 768px)": {
              py: 0,
            },
          }}
        >
          {/* Logo */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              justifyContent: "center",
              mb: { xs: 1.5, md: 2 },
            }}
          >
            <Box
              sx={{
                width: { xs: 140, sm: 170, md: 200, lg: 220 },
                height: "auto",
                display: "flex",
                justifyContent: "center",
                "@media (max-width: 1440px)": {
                  width: 200,
                },
                "@media (max-height: 700px)": {
                  width: 180,
                },
              }}
            >
              <Image
                src="/branding/logo.png"
                alt="SME Bank"
                loading="eager"
                width={220}
                height={220}
                style={{ width: "100%", height: "auto", objectFit: "contain" }}
              />
            </Box>
          </Stack>

          {/* Form Title */}
          <Typography
            variant="h3"
            sx={{
              mb: { xs: 1.5, md: 2.5 },
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
              textAlign: "center",
              color: palette.white,
            }}
          >
            {title}
          </Typography>

          {children}
        </Box>

        {/* Capped spacer: caps the form-to-footer gap on tall viewports.
            Matches the header-to-form spacer's weight so the gaps above
            and below the form stay equal. Also centers optional belowForm
            content (e.g. sign up's "Login" link) within that gap. */}
        <Box
          sx={{
            flexGrow: 4,
            flexShrink: 1,
            flexBasis: 0,
            maxHeight: { xs: 24, sm: 40, md: 72 },
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            // mt: { xs: -3, sm: 1, md: 0, },
            py: 6
          }}
        >
          {belowForm}
        </Box>

        {/* 3. Footer Links (Fixed Height) */}
        <Box
          sx={{
            pt: 1,
            color: glassText.faint,
            display: "flex",
            gap: { xs: 3, sm: 3 },
            flexWrap: "wrap",
            justifyContent: "center",
            flexShrink: 0,

          }}
        >
          {signUp && FOOTER_LINKS.map((label, index) => (
            <Box
              key={label}
              sx={{ display: "flex", alignItems: "center", gap: { xs: 3, sm: 3 } }}
            >
              {index > 0 && (
                <Box
                  component="span"
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    bgcolor: glassText.faint,
                    flexShrink: 0,
                  }}
                />
              )}
              <Link
                href="#"
                underline="hover"
                sx={{
                  color: "#F7F7F7",
                  fontSize: font.size.md,
                  fontWeight: font.weight.regular,
                  "&:hover": { color: glassText.hover },
                }}
              >
                {label}
              </Link>
            </Box>
          ))}
        </Box>

        {/* Uncapped spacer: mirrors the top spacer so leftover height on
            tall viewports splits evenly instead of collecting only above
            the header. Keeps a small minHeight so the footer never sits
            flush against the viewport edge on short viewports or when
            validation errors expand the form above it. */}
        <Box sx={{ flexGrow: 1, flexShrink: 1, flexBasis: 0, minHeight: { xs: 12, sm: 16 } }} />
      </Box>

      {overlays}
    </Box>
  );
}
