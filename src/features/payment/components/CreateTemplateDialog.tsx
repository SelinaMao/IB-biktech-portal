"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { palette, radius } from "@/theme/palette";
import BaseDialog from "@core/components/BaseDialog";
import type { PaymentTemplate, PaymentTemplateType } from "../payment.types";

export interface CreateTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (template: Omit<PaymentTemplate, "id" | "createdAt">) => void;
}

export default function CreateTemplateDialog({
  open,
  onClose,
  onCreate,
}: CreateTemplateDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<PaymentTemplateType>("Bill payment");
  const [providerName, setProviderName] = useState("");
  const [correspondentId, setCorrespondentId] = useState("");

  const handleSubmit = () => {
    if (!name.trim() || !providerName.trim() || !correspondentId.trim()) return;

    // Generate initials (e.g., "Electricity Authority" -> "EA")
    const words = providerName.trim().split(/\s+/);
    const initials =
      words.length >= 2
        ? `${words[0][0]}${words[1][0]}`.toUpperCase()
        : providerName.substring(0, 2).toUpperCase();

    onCreate({
      name: name.trim(),
      type,
      providerName: providerName.trim(),
      providerInitials: initials,
      correspondentId: correspondentId.trim(),
    });

    handleClose();
  };

  const handleClose = () => {
    setName("");
    setType("Bill payment");
    setProviderName("");
    setCorrespondentId("");
    onClose();
  };

  const isValid = Boolean(name.trim() && providerName.trim() && correspondentId.trim());

  return (
    <BaseDialog
      open={open}
      onClose={handleClose}
      title="Create payment template"
      subtitle="Save payment details for fast recurring execution."
      confirmTitle="Create template"
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
            placeholder="e.g. Head office electricity"
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
            placeholder="e.g. Electricity Authority or FibreNet Internet"
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
            placeholder="e.g. Consumer ID 0091 2207 or Mobile no. 011 222 2222"
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
