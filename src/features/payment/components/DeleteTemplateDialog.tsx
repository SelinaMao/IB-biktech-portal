"use client";

import Typography from "@mui/material/Typography";

import { palette } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import type { PaymentTemplate } from "../payment.types";

export interface DeleteTemplateDialogProps {
  open: boolean;
  template: PaymentTemplate | null;
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteTemplateDialog({
  open,
  template,
  onClose,
  onConfirm,
}: DeleteTemplateDialogProps) {
  if (!template) return null;

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Delete template"
      confirmTitle="Delete"
      confirmColor="error"
      onConfirm={onConfirm}
      cancelTitle="Cancel"
      maxWidth="xs"
    >
      <Typography sx={{ fontSize: 14, color: palette.slate[700], mt: 1 }}>
        Are you sure you want to delete template{" "}
        <strong style={{ color: palette.slate[900] }}>&quot;{template.name}&quot;</strong>? This
        action cannot be undone.
      </Typography>
    </BaseDialog>
  );
}
