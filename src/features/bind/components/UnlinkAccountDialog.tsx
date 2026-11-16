"use client";

import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import { X } from "lucide-react";

import BaseDialog from "@core/components/BaseDialog";

export type UnlinkAccountDialogProps = {
  open: boolean;
  onClose: () => void;
  onDeactivate: () => void;
  title?: string;
  description?: string;
  deactivateLabel?: string;
  imageSrc?: string;
};

export default function UnlinkAccountDialog({
  open,
  onClose,
  onDeactivate,
  title,
  description,
  deactivateLabel,
  imageSrc = "/assets/icons/ImageUnlinkMobile.svg",
}: UnlinkAccountDialogProps) {
  const t = useTranslations("mobileBinding");

  const heading = title ?? t("bound.heading");
  const subtitle = description ?? t("bound.description");
  const buttonLabel = deactivateLabel ?? t("bound.deactivate");

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title=""
      hideActions
      hideCloseButton
      disableBackdropClick
      maxWidth="xs"
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(6px)",
            backgroundColor: "rgba(15, 23, 42, 0.25)",
          },
        },
      }}
      paperSx={{
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        borderRadius: "24px",
        overflow: "hidden",
        background: "radial-gradient(circle at 85% 12%, rgba(255, 240, 228, 0.75) 0%, rgba(255, 255, 255, 0.95) 50%, #FFFFFF 100%)",
        boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.15), 0 0 1px rgba(0, 0, 0, 0.08)",
      }}
      contentSx={{
        p: 3.5,
        pt: 3,
        pb: 3.5,
      }}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{
            position: "absolute",
            top: -12,
            right: -12,
            width: 28,
            height: 28,
            color: "#334155",
            p: 0,
            transition: "all 0.15s ease-in-out",
            "&:hover": {
              color: "#0F172A",
              bgcolor: "rgba(0, 0, 0, 0.04)",
            },
          }}
        >
          <X size={16} strokeWidth={2.2} />
        </IconButton>

        <Stack sx={{ alignItems: "center", textAlign: "center" }} spacing={0}>
          {/* Phone Illustration with Red Minus badge */}
          <Box
            sx={{
              position: "relative",
              width: 125,
              height: 105,
              mt: 1.5,
              mb: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Image
              src={imageSrc}
              alt="Activated Account"
              width={125}
              height={105}
              priority
              style={{ objectFit: "contain" }}
            />
          </Box>

          {/* Heading */}
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: "23px",
              lineHeight: 1.25,
              letterSpacing: "-0.01em",
              color: "#0F172A",
              mb: 1,
            }}
          >
            {heading}
          </Typography>

          {/* Description */}
          <Typography
            sx={{
              fontSize: "13.5px",
              fontWeight: 400,
              color: "#475569",
              lineHeight: 1.4,
              whiteSpace: "nowrap",
              mb: 3.5,
            }}
          >
            {subtitle}
          </Typography>

          {/* Red Pill Action Button */}
          <Button
            fullWidth
            onClick={onDeactivate}
            variant="contained"
            disableElevation
            sx={{
              height: 48,
              borderRadius: "9999px",
              bgcolor: "#D92D20",
              color: "#FFFFFF",
              fontSize: "15px",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              transition: "all 0.15s ease-in-out",
              "&:hover": {
                bgcolor: "#B42318",
              },
            }}
          >
            {buttonLabel}
          </Button>
        </Stack>
      </Box>
    </BaseDialog>
  );
}
