"use client";

import React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { ChevronLeft } from "lucide-react";

import { palette, radius } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import Bakong from "./Bakong";
import LocalBank from "./LocalBank";

export type LocalTransferProps = {
  open: boolean;
  onClose: () => void;
};

type Mode = "choose" | "local" | "bakong";

/**
 * Entry point for the "Local Bank" hub card: an inline chooser (Local Bank
 * Transfer vs. Bakong Account) that hands off to the transfer page views.
 */
export default function LocalTransfer({ open, onClose }: LocalTransferProps) {
  const [mode, setMode] = React.useState<Mode>("choose");

  if (!open) return null;

  const handleClose = () => {
    setMode("choose");
    onClose();
  };

  if (mode === "local") {
    return <LocalBank open={open} onClose={handleClose} />;
  }

  if (mode === "bakong") {
    return <Bakong open={open} onClose={handleClose} />;
  }

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ mb: 3 }}>
        <Box
          component="button"
          type="button"
          onClick={handleClose}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            border: "none",
            bgcolor: "transparent",
            p: 0,
            mb: 1,
            cursor: "pointer",
            "&:hover": { opacity: 0.85 },
          }}
        >
          <Box
            sx={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              bgcolor: "#E6EEF8",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={15} color={palette.primary[40]} />
          </Box>
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: palette.primary[40],
            }}
          >
            Transfer
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 700,
            color: "#0F172A",
            lineHeight: 1.25,
          }}
        >
          Local Transfer
        </Typography>
      </Box>

      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderRadius: "20px",
          p: { xs: 3, md: 5 },
          maxWidth: 720,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
          <ChooserCard
            icon={<Image src="/assets/icons/local_bank.svg" alt="" width={32} height={34} />}
            iconBg={palette.primary[100]}
            label="Local Bank Transfer"
            subtitle="Transfer to another local bank"
            onClick={() => setMode("local")}
          />
          <ChooserCard
            icon={<Image src="/assets/icons/bakong.svg" alt="" width={32} height={34} />}
            iconBg={palette.danger[100]}
            label="Bakong Account"
            subtitle="Transfer via Bakong"
            onClick={() => setMode("bakong")}
          />
        </Stack>
      </Box>
    </Box>
  );
}

function ChooserCard({
  icon,
  iconBg,
  label,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <BaseCard
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        p: 5,
        flex: 1,
        display: "block",
        border: `1px solid ${palette.slate[200]}`,
        borderRadius: `${radius.lg}px`,
        font: "inherit",
        textAlign: "center",
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": { boxShadow: 2, borderColor: palette.primary[300] },
      }}
    >
      <Stack spacing={1} sx={{ alignItems: "center" }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontWeight: 600, fontSize: 14, color: "text.primary" }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: palette.slate[400] }}>
          {subtitle}
        </Typography>
      </Stack>
    </BaseCard>
  );
}
