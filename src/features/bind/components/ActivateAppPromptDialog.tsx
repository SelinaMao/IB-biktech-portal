"use client";

import { useTranslations } from "next-intl";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { X } from "lucide-react";

import BaseDialog from "@core/components/BaseDialog";

import BindPromptContent from "./BindPromptContent";
import { padding, Width } from "@/theme/palette";

export type ActivateAppPromptDialogProps = {
  open: boolean;
  onClose: () => void;
  onGetStarted: () => void;
};

export default function ActivateAppPromptDialog({ open, onClose, onGetStarted }: ActivateAppPromptDialogProps) {
  const t = useTranslations("mobileBinding");

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title=""
      hideActions
      hideCloseButton
      disableBackdropClick
      maxWidth="xs"
      paperSx={{ width: Width.sm }}
      contentSx={{ p: padding.sm, }}
    >
      <Box sx={{ position: "relative" }}>
        <IconButton
          onClick={onClose}
          aria-label="Close"
          size="small"
          sx={{
            position: "absolute",
            top: `-${padding.sm}px`,
            right: `-${padding.sm}px`,
            width: 32,
            height: 32,
            bgcolor: "#EDF0F4",
            color: "#1E293B",
            borderRadius: "50%",
            p: 0,
            transition: "all 0.15s ease-in-out",
            "&:hover": {
              bgcolor: "#E2E8F0",
            },
          }}
        >
          <X size={18} />
        </IconButton>

        <BindPromptContent
          title={t("activatePrompt.title")}
          description={t("activatePrompt.description")}
          stackSx={{ pt: 8, pb: 2 }}
          textBoxSx={{ py: 4 }}
          primaryActionTitle={t("activatePrompt.getStarted")}
          onPrimaryAction={onGetStarted}
        />
      </Box>
    </BaseDialog>
  );
}
