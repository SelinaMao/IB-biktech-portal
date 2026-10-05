"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import BaseDialog from "@core/components/BaseDialog";
import { useAuth } from "@/features/auth/use-auth";

import BindPromptContent from "./BindPromptContent";

export type ActivateAppPromptDialogProps = {
  open: boolean;
  onClose: () => void;
  onGetStarted: () => void;
};

export default function ActivateAppPromptDialog({ open, onClose, onGetStarted }: ActivateAppPromptDialogProps) {
  const t = useTranslations("mobileBinding");
  const { logout } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title=""
      hideActions
      hideCloseButton
      disableBackdropClick
      maxWidth="xs"
      titleSx={{ p: 0 }}
    >
      <BindPromptContent
        title={t("activatePrompt.title")}
        description={t("activatePrompt.description")}
        imageHeight={320}
        imageOffsetTop={-5}
        stackSx={{ pt: 0, pb: 1 }}
        textBoxSx={{ py: 4 }}
        secondaryActionTitle={t("activatePrompt.signOut")}
        onSecondaryAction={() => void handleSignOut()}
        secondaryActionLoading={isSigningOut}
        primaryActionTitle={t("activatePrompt.getStarted")}
        onPrimaryAction={onGetStarted}
      />
    </BaseDialog>
  );
}
