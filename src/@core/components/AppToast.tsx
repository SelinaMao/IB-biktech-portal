"use client";

import React from "react";
import { Box, Typography, Stack, IconButton, Tooltip } from "@mui/material";
import {
  ErrorOutlineRounded,
  CheckCircleOutlineRounded,
  WarningAmberRounded,
  InfoOutlined,
  ContentCopyRounded,
} from "@mui/icons-material";
import { toast, type ToastOptions } from "react-toastify";

import { openErrorDialog } from "./AppErrorDialog";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AppToastData {
  /** Bold heading shown at the top of the toast. */
  title: string;
  /** Human-readable description of what happened. */
  message?: string;
  /** Customer-facing support reference (for example S0102001-60C462AA). */
  referenceCode?: string;
}

type Severity = "error" | "success" | "warning" | "info";

/* ------------------------------------------------------------------ */
/*  Severity → icon + colour mapping                                   */
/* ------------------------------------------------------------------ */

const severityConfig: Record<
  Severity,
  { icon: React.ReactNode; bg: string; accent: string }
> = {
  error: {
    icon: <ErrorOutlineRounded sx={{ fontSize: 22, color: "#fff" }} />,
    bg: "#D32F2F",
    accent: "rgba(255,255,255,0.25)",
  },
  success: {
    icon: <CheckCircleOutlineRounded sx={{ fontSize: 22, color: "#fff" }} />,
    bg: "#2E7D32",
    accent: "rgba(255,255,255,0.25)",
  },
  warning: {
    icon: <WarningAmberRounded sx={{ fontSize: 22, color: "#fff" }} />,
    bg: "#ED6C02",
    accent: "rgba(255,255,255,0.25)",
  },
  info: {
    icon: <InfoOutlined sx={{ fontSize: 22, color: "#fff" }} />,
    bg: "#0288D1",
    accent: "rgba(255,255,255,0.25)",
  },
};

/* ------------------------------------------------------------------ */
/*  Toast body component                                               */
/* ------------------------------------------------------------------ */

function AppToastBody({
  data,
  severity,
}: {
  data: AppToastData;
  severity: Severity;
}) {
  const cfg = severityConfig[severity];

  if (!data) return null;

  const handleCopy = () => {
    const parts = [data.title];
    if (data.message) parts.push(data.message);
    if (data.referenceCode) parts.push(`Reference: ${data.referenceCode}`);
    navigator.clipboard.writeText(parts.join("\n"));
  };

  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
      {/* Icon */}
      <Box sx={{ pt: 0.25, flexShrink: 0 }}>{cfg.icon}</Box>

      {/* Content */}
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{ fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1.4 }}
        >
          {data.title}
        </Typography>

        {data.message && (
          <Typography
            sx={{
              fontSize: 13,
              color: "rgba(255,255,255,0.85)",
              mt: 0.25,
              lineHeight: 1.4,
            }}
          >
            {data.message}
          </Typography>
        )}

        {/* Meta row: [reference] + copy */}
        {data.referenceCode && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              mt: 0.75,
              flexWrap: "wrap",
              rowGap: 0.5,
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                fontFamily: "monospace",
                color: "rgba(255,255,255,0.7)",
                bgcolor: cfg.accent,
                px: 0.75,
                py: 0.15,
                borderRadius: 0.5,
              }}
            >
              Reference: {data.referenceCode}
            </Typography>
            <Tooltip
              title="Copy details"
              arrow
              slotProps={{
                popper: { sx: { zIndex: 99999 } },
              }}
            >
              <IconButton
                size="small"
                onClick={handleCopy}
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  "&:hover": { color: "#fff" },
                  p: 0.25,
                }}
              >
                <ContentCopyRounded sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        )}
      </Box>
    </Stack>
  );
}

/* ------------------------------------------------------------------ */
/*  Public helper: showToast()                                         */
/* ------------------------------------------------------------------ */

/**
 * Success / info / warning are toasts. Errors open the error dialog instead (AppErrorDialog) — a
 * failure needs to be read and acknowledged, and its reference quoted to support.
 */
export function showToast(
  severity: Severity,
  data: AppToastData,
  options?: ToastOptions,
) {
  if (severity === "error") {
    openErrorDialog(data);
    return;
  }

  const cfg = severityConfig[severity];

  toast(() => <AppToastBody data={data} severity={severity} />, {
    style: {
      background: cfg.bg,
      borderRadius: 12,
      boxShadow: "0 8px 24px rgba(0,0,0,0.20)",
      padding: "12px 16px",
    },
    icon: false,
    ...options,
  });
}
