"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import type { PaymentTemplate, PaymentTemplateType } from "../payment.types";

export interface EditTemplateDialogProps {
  open: boolean;
  template: PaymentTemplate | null;
  onClose: () => void;
  onUpdate: (updated: PaymentTemplate) => void;
}

export default function EditTemplateDialog({
  open,
  template,
  onClose,
  onUpdate,
}: EditTemplateDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentTemplateType>("Bill payment");
  const [providerName, setProviderName] = useState("");
  const [correspondentId, setCorrespondentId] = useState("");

  useEffect(() => {
    if (template) {
      setName(template.name);
      setType(template.type);
      setProviderName(template.providerName);
      setCorrespondentId(template.correspondentId);
    }
  }, [template]);

  const handleSubmit = () => {
    if (!template || !name.trim() || !providerName.trim() || !correspondentId.trim()) return;

    const words = providerName.trim().split(/\s+/);
    const initials =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : providerName.substring(0, 2).toUpperCase();

    onUpdate({
      ...template,
      name: name.trim(),
      type,
      providerName: providerName.trim(),
      providerInitials: initials,
      correspondentId: correspondentId.trim(),
    });

    onClose();
  };

  const isValid = Boolean(name.trim() && providerName.trim() && correspondentId.trim());

  return (
    <BaseDialog
      open={open}
      onClose={onClose}
      title="Edit payment template"
      subtitle="Modify the details of your saved template."
      confirmTitle="Save changes"
      onConfirm={handleSubmit}
      confirmDisabled={!isValid}
      cancelTitle="Cancel"
      maxWidth="sm"
    >
      <Stack spacing={2.5} sx={{ mt: 1 }}>
        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Template name
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Payment type
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as PaymentTemplateType)}
              sx={{ borderRadius: `${radius.md}px` }}
            >
              <MenuItem value="Bill payment">Bill payment</MenuItem>
              <MenuItem value="Mobile top-up">Mobile top-up</MenuItem>
              <MenuItem value="Charity & donation">Charity & donation</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Service provider
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={providerName}
            onChange={(e) => setProviderName(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
        </Box>

        <Box>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: palette.slate[700], mb: 0.75 }}>
            Correspondent ID / Account reference
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={correspondentId}
            onChange={(e) => setCorrespondentId(e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${radius.md}px`,
              },
            }}
          />
        </Box>
      </Stack>
    </BaseDialog>
  );
}
