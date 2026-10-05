"use client";

import React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { font, palette, radius } from "@/theme/palette";
import BaseCard from "@core/components/BaseCard";
import BaseDialog from "@core/components/BaseDialog";
import BakongDialog from "./BakongDialog";
import LocalBankDialog from "./LocalBankDialog";

export type LocalTransferDialogProps = {
  open: boolean;
  onClose: () => void;
};

type Mode = "choose" | "local" | "bakong";

/**
 * Entry point for the "Local Bank" hub card: a chooser modal (Local Bank
 * Transfer vs. Bakong Account) that hands off to the existing wizard
 * dialogs. Closing either wizard closes the whole flow rather than
 * returning to the chooser.
 */
export default function LocalTransferDialog({ open, onClose }: LocalTransferDialogProps) {
  const [mode, setMode] = React.useState<Mode>("choose");

  const handleClose = () => {
    onClose();
    setTimeout(() => setMode("choose"), 200);
  };

  return (
    <>
      <BaseDialog
        open={open && mode === "choose"}
        onClose={handleClose}
        title="Local Transfer"
        maxWidth="sm"
        maxHeight="lg"
        titleSx={{
          fontSize: font.size.xl
          , fontWeight: font.weight.semibold,
        }}
        hideActions
        dividers

      >
        <Stack direction="row" spacing={3}>
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
      </BaseDialog>

      <LocalBankDialog open={open && mode === "local"} onClose={handleClose} />
      <BakongDialog open={open && mode === "bakong"} onClose={handleClose} />
    </>
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
