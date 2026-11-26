"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import type { PaymentTemplate } from "../payment.types";

export interface EditTemplateDialogProps {
  open: boolean;
  template: PaymentTemplate | null;
  onClose: () => void;
  onUpdate: (updated: PaymentTemplate) => void;
}

export default function EditTemplateDialog({ open, template, onClose, onUpdate }: EditTemplateDialogProps) {
  const [name, setName] = useState("");

  useEffect(() => setName(template?.name ?? ""), [template]);

  const handleSubmit = () => {
    if (!template || !name.trim()) return;
    onUpdate({ ...template, name: name.trim() });
  };

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Rename saved receiver"
      subtitle="Change the name used to identify this saved receiving account."
      confirmTitle="Save name"
      onConfirm={handleSubmit}
      confirmDisabled={!name.trim() || name.trim() === template?.name}
      cancelTitle="Cancel"
      maxWidth="sm"
    >
      <Stack spacing={2.5} sx={{ mt: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Receiver name
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={(event) => setName(event.target.value)}
            inputProps={{ maxLength: 50 }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: `${radius.md}px` } }}
          />
        </Box>
      </Stack>
    </BaseDialog>
  );
}
