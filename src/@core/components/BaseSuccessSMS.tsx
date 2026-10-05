"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

import { controlBTNHeight, font, palette } from "@/theme/palette";
import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@/@core/components/BaseDialog";

export type BaseSuccessSMSProps = {
  open: boolean;
  onDone: () => void;
  title?: string;
  description?: string;
  subtitle?: string;
  doneLabel?: string;
};

/** Final confirmation dialog closing out the forgot-password flow. */
export default function BaseSuccessSMS({
  open,
  onDone,
  title = "Success",
  description = "Password has been updated successfully.",
  subtitle = "You can now sign in using your new password.",
  doneLabel = "Done",
}: BaseSuccessSMSProps) {
  return (
    <BaseDialog
      open={open}
      onClose={onDone}
      title=""
      maxWidth="xs"
      variant="action"
      hideCloseButton
      hideActions
      dividers={false}
    >
      <Stack sx={{ alignItems: "center", textAlign: "center", gap: 1.5 }}>
        <CheckCircleOutlineRoundedIcon sx={{ fontSize: 64, color: palette.success.main }} />
        <Typography sx={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: palette.slate[950] }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ fontSize: font.size.base, color: palette.slate[950], lineHeight: 1.5 }}>
          {description}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: palette.slate[950], lineHeight: 1.5, fontSize: font.size.base }}>
            {subtitle}
          </Typography>
        )}
        <BaseButton
          fullWidth
          title={doneLabel}
          onClick={onDone}
          sx={{ height: controlBTNHeight, mt: 1.5 }}
        />
      </Stack>
    </BaseDialog>
  );
}
