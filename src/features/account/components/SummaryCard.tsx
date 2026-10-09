"use client";

import { Box, Typography, Stack } from "@mui/material";
import { Eye, EyeOff } from "lucide-react";
import BaseBlurText from "@core/components/BaseBlurText";
import type { SummaryCardProps } from "../account.types";
import { toggleHideAmount } from "@/store/global/global.slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

export default function SummaryCard({
  label = "Summary",
  value,
  sub,
}: SummaryCardProps) {
  const dispatch = useAppDispatch();
  const hideAmount = useAppSelector((state) => state.global.hideAmount);

  return (
    <Box
      sx={{
        width: "100%",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #257DCF 0%, #1660A9 100%)",
        color: "#FFFFFF",
        p: { xs: 3, sm: 5 },
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: 160,
        mb:3,
        // boxShadow: "0 8px 24px rgba(10, 76, 19, 0.22)",
      }}
    >
      {/* Header Row: Title & Hide/Show Toggle Pill */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 3 }}
      >
        <Typography
          sx={{
            fontSize: 16,
            fontWeight: 500,
            color: "#FFFFFF",
            letterSpacing: 0.2,
          }}
        >
          {label || "Summary"}
        </Typography>

        <Box
          component="button"
          type="button"
          onClick={() => dispatch(toggleHideAmount())}
          aria-label={hideAmount ? "Show balance" : "Hide balance"}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.75,
            py: 0.6,
            borderRadius: "9999px",
            bgcolor: "#EDF0F4",
            border: "none",
            cursor: "pointer",
            color: "#0F172A",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.08)",
            transition: "all 0.15s ease",
            "&:hover": {
              bgcolor: "#F8FAFC",
              transform: "scale(1.02)",
            },
            "&:active": {
              transform: "scale(0.98)",
            },
          }}
        >
          {hideAmount ? <Eye size={16} strokeWidth={2.2} /> : <EyeOff size={16} strokeWidth={2.2} />}
          <span>{hideAmount ? "Show" : "Hide"}</span>
        </Box>
      </Stack>

      {/* Amounts */}
      <Stack spacing={1}>
        {value && (
          <Typography
            sx={{
              fontSize: { xs: 18, sm: 20, md: 22 },
              fontWeight: 600,
              color: "#FFFFFF",
              lineHeight: 1.25,
              letterSpacing: "-0.2px",
            }}
          >
            <BaseBlurText>{value}</BaseBlurText>
          </Typography>
        )}

        {sub && (
          <Typography
            sx={{
              fontSize: { xs: 18, sm: 20, md: 22 },
              fontWeight: 600,
              color: "#FFFFFF",
              lineHeight: 1.25,
              letterSpacing: "-0.2px",
            }}
          >
            <BaseBlurText>{sub}</BaseBlurText>
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
