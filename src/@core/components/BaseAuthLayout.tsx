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
  /** Rendered inside the shared title Typography or node, above the form. */
  title: ReactNode;
  /** Form content, rendered below the title. */
  children: ReactNode;
  /** Optional content (e.g. a "Login" link) rendered below the form. */
  belowForm?: ReactNode;
  /** Dialogs / overlays (OTP, password setup, etc.) rendered outside the main panel. */
  overlays?: ReactNode;
  signUp?: boolean;
  symmetricSpacing?: boolean;
};

/**
 * Shared responsive shell for auth screens:
 * - Left column: Financial Decision Hero graphic (Desktop)
 * - Right column: Language switcher, brand logo, title, form, and footer links (Responsive)
 */
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
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        bgcolor: "#FFFFFF",
        position: "relative",
      }}
    >
      {/* ======================================================== */}
      {/* LEFT COLUMN: Hero Financial Decision Banner (Desktop)   */}
      {/* ======================================================== */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flex: { md: "1 1 50%", lg: "1 1 48%", xl: "1 1 50%" },
          minHeight: "100vh",
          bgcolor: "#051329",
          backgroundImage:
            "radial-gradient(circle at 18% 46%, #0B254E 0%, #06162D 58%, #030B17 100%)",
          position: "relative",
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          p: { md: 4, lg: 6, xl: 8 },
        }}
      >
        {/* Decorative Concentric Rings */}
        <Box
          component="svg"
          viewBox="0 0 800 800"
          sx={{
            position: "absolute",
            top: "50%",
            left: "15%",
            transform: "translate(-50%, -50%)",
            width: 950,
            height: 950,
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.35,
          }}
        >
          <circle
            cx="400"
            cy="400"
            r="160"
            fill="none"
            stroke="rgba(56, 189, 248, 0.16)"
            strokeWidth="1"
          />
          <circle
            cx="400"
            cy="400"
            r="260"
            fill="none"
            stroke="rgba(56, 189, 248, 0.12)"
            strokeWidth="1"
          />
          <circle
            cx="400"
            cy="400"
            r="370"
            fill="none"
            stroke="rgba(56, 189, 248, 0.08)"
            strokeWidth="1"
          />
          <circle
            cx="400"
            cy="400"
            r="480"
            fill="none"
            stroke="rgba(56, 189, 248, 0.05)"
            strokeWidth="1"
          />
        </Box>

        {/* Hero Content Container */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 460,
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Main Headline */}
          <Typography
            variant="h3"
            sx={{
              color: "#FFFFFF",
              fontWeight: 700,
              fontSize: { md: "2.1rem", lg: "2.5rem" },
              lineHeight: 1.22,
              letterSpacing: "-0.02em",
              mb: 2,
            }}
          >
            Clarity for every financial decision.
          </Typography>

          {/* Subtitle */}
          <Typography
            sx={{
              color: "#94A3B8",
              fontSize: "1rem",
              lineHeight: 1.6,
              mb: 5,
              maxWidth: 420,
            }}
          >
            See the full picture, move money with confidence, and make progress
            toward what matters.
          </Typography>

          {/* Financial Preview Card */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              maxWidth: 450,
              bgcolor: "rgba(11, 26, 48, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "20px",
              p: 3,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(14px)",
            }}
          >
            {/* Card Header */}
            <Stack
              direction="row"
              sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 1,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    color: "#64748B",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  TOTAL WEALTH
                </Typography>
                <Typography
                  sx={{
                    color: "#FFFFFF",
                    fontSize: "2rem",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    mt: 0.5,
                    letterSpacing: "-0.02em",
                  }}
                >
                  $284,620
                </Typography>
              </Box>

              {/* YTD Pill Badge */}
              <Box
                sx={{
                  bgcolor: "rgba(16, 185, 129, 0.15)",
                  color: "#34D399",
                  border: "1px solid rgba(52, 211, 153, 0.25)",
                  borderRadius: "20px",
                  px: 1.5,
                  py: 0.5,
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  whiteSpace: "nowrap",
                }}
              >
                ~ 8.4% YTD
              </Box>
            </Stack>

            {/* Smooth Glowing Wave SVG Chart */}
            <Box
              sx={{
                width: "100%",
                height: 105,
                my: 1,
                position: "relative",
              }}
            >
              <svg
                viewBox="0 0 380 95"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: "100%", height: "100%", overflow: "visible" }}
              >
                <defs>
                  <linearGradient id="wealthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                    <stop
                      offset="65%"
                      stopColor="#10B981"
                      stopOpacity="0.08"
                    />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                  <filter
                    id="glowFilter"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="2"
                      stdDeviation="3"
                      floodColor="#10B981"
                      floodOpacity="0.5"
                    />
                  </filter>
                </defs>

                {/* Gradient Area Fill */}
                <path
                  d="M 0,72 C 35,72 65,64 100,60 C 135,56 160,63 195,58 C 235,50 265,30 305,27 C 330,25 355,16 370,12 L 370,95 L 0,95 Z"
                  fill="url(#wealthGrad)"
                />

                {/* Wave Curve Line */}
                <path
                  d="M 0,72 C 35,72 65,64 100,60 C 135,56 160,63 195,58 C 235,50 265,30 305,27 C 330,25 355,16 370,12"
                  stroke="#34D399"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  filter="url(#glowFilter)"
                />

                {/* Glowing End Dot */}
                <circle
                  cx="370"
                  cy="12"
                  r="7"
                  fill="#34D399"
                  fillOpacity="0.25"
                />
                <circle cx="370" cy="12" r="4" fill="#34D399" />
              </svg>
            </Box>

            {/* Bottom Metrics Row */}
            <Stack
              direction="row"
              spacing={4}
              sx={{
                mt: 1.5,
                pt: 1.5,
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontSize: "10px",
                    color: "#64748B",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  CASH
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                >
                  $42,810
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: "10px",
                    color: "#64748B",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  INVESTED
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    mt: 0.5,
                  }}
                >
                  $193,240
                </Typography>
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: "10px",
                    color: "#64748B",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  RETURNS
                </Typography>
              </Box>
            </Stack>

            {/* Floating TRANSFER COMPLETE Badge */}
            <Box
              sx={{
                position: "absolute",
                bottom: -22,
                right: { xs: 8, sm: 16 },
                bgcolor: "#0E2442",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "14px",
                px: 2,
                py: 1.25,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                boxShadow: "0 14px 28px rgba(0, 0, 0, 0.45)",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  bgcolor: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#042F1A"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "#94A3B8",
                    letterSpacing: "0.05em",
                    lineHeight: 1.2,
                  }}
                >
                  TRANSFER COMPLETE
                </Typography>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    lineHeight: 1.2,
                    mt: 0.25,
                  }}
                >
                  $2,400.00
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ======================================================== */}
      {/* RIGHT COLUMN: Signup / Auth Form Panel                  */}
      {/* ======================================================== */}
      <Box
        sx={{
          flex: { xs: "1 1 100%", md: "1 1 50%", lg: "1 1 52%", xl: "1 1 50%" },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          bgcolor: "#FFFFFF",
          overflowY: "auto",
          px: { xs: 2.5, sm: 4, md: 6, lg: 8 },
          py: { xs: 2, sm: 3, md: 3.5 },
        }}
      >
        {/* Top Header: Language Switcher */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            flexShrink: 0,
            pt: { xs: 1, sm: 1.5 },
          }}
        >
          <SwitchLanguageMenu />
        </Box>

        {/* Center: Main Form Content Area */}
        <Box
          sx={{
            width: "100%",
            maxWidth: 420,
            mx: "auto",
            my: "auto",
            py: { xs: 2.5, md: 4 },
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Brand Logo */}
          <Box
            sx={{
              mb: { xs: 2, sm: 2.5 },
              display: "flex",
              justifyContent: "flex-start",
            }}
          >
            <Image
              src="/branding/BiKTECH.png"
              alt="BiKTECH Solution"
              width={190}
              height={50}
              style={{
                width: "auto",
                maxWidth: "190px",
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
              sx={{
                fontWeight: 700,
                fontSize: { xs: "1.35rem", sm: "1.55rem" },
                color: "#0F172A",
                mb: { xs: 2.5, sm: 3 },
                textAlign: "left",
              }}
            >
              {title}
            </Typography>
          ) : (
            <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>{title}</Box>
          )}

          {/* Form Content */}
          {children}

          {/* Below Form Content (e.g. Login link) */}
          {belowForm}
        </Box>

        {/* Footer Links */}
        <Stack
          direction="row"
          spacing={{ xs: 1.5, sm: 2.5, md: 3 }}
          sx={{
            justifyContent: "center",
            alignItems: "center",
            flexWrap: "wrap",
            rowGap: 1,
            pt: 2,
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

      {/* Dialogs / Overlays */}
      {overlays}
    </Box>
  );
}
