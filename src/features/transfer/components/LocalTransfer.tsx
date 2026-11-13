"use client";

import React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import { useTopBarBreadcrumb } from "@core/layout";
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
 * Rendered as the content column of the transfer split view — the route
 * (`transfer/[slug]/page.tsx`) owns the type sidebar, not this component.
 */
export default function LocalTransfer({ open, onClose }: LocalTransferProps) {
  const [mode, setMode] = React.useState<Mode>("choose");

  const handleClose = () => {
    setMode("choose");
    onClose();
  };

  // Only the chooser needs its own breadcrumb — "local"/"bakong" delegate to
  // LocalBank/Bakong, which set their own via PreviewTransfer.
  useTopBarBreadcrumb(
    open && mode === "choose" ? { prefix: "Transfer", subPrefix: "Local Transfer", onBack: handleClose } : null
  );

  if (!open) return null;

  if (mode === "local") {
    return <LocalBank open={open} onClose={handleClose} />;
  }

  if (mode === "bakong") {
    return <Bakong open={open} onClose={handleClose} />;
  }

  return (
    <Box
      sx={{
        bgcolor: "#FFFFFF",
        borderRadius: "20px",
        border: "1px solid #EDEDEC",
        p: 4,
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      <Typography
        sx={{
          fontSize: 28,
          fontWeight: 700,
          color: "#0F172A",
          lineHeight: 1.25,
          textAlign: "center",
          mb: 4,
        }}
      >
        Local Transfer
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ChooserCard
            icon={<Image src="/assets/icons/local_bank.svg" alt="" width={28} height={30} />}
            iconBg={palette.primary[100]}
            label="Local Bank Transfer"
            subtitle="Transfer to another local bank"
            onClick={() => setMode("local")}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <ChooserCard
            icon={<Image src="/assets/icons/bakong.svg" alt="" width={28} height={30} />}
            iconBg={palette.danger[100]}
            label="Bakong Account"
            subtitle="Transfer via Bakong"
            onClick={() => setMode("bakong")}
          />
        </Grid>
      </Grid>
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
        p: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 3,
        width: "100%",
        border: `1px solid ${palette.slate[200]}`,
        borderRadius: `${radius.xl}px`,
        font: "inherit",
        textAlign: "left",
        cursor: "pointer",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        "&:hover": { boxShadow: 2, borderColor: palette.primary[300] },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          flexShrink: 0,
          borderRadius: "50%",
          bgcolor: iconBg,
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14, color: "text.primary" }}>
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: palette.slate[400] }}>
          {subtitle}
        </Typography>
      </Box>
    </BaseCard>
  );
}
