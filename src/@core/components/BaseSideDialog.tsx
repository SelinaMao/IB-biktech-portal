"use client";

import React, { useState } from "react";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { font, palette } from "@/theme/palette";
import BaseDialog from "./BaseDialog";

export type BaseSideDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional line under the title. */
  subtitle?: string;
  /** Small round icon shown before the title. */
  icon?: React.ReactNode;
  width?: number | string;
  /** Step labels for a wizard-style dialog, e.g. ["Details", "Review", "Success"]. Omit for a plain dialog. */
  steps?: string[];
  /** 0-based index of the current step (only used when `steps` is set). */
  activeStep?: number;
  children: React.ReactNode;
  /** Footer content — e.g. Back/Next buttons. Omit for no footer. */
  footer?: React.ReactNode;
  /** Defaults to true — dialog doesn't close on outside click unless explicitly opted out. */
  disableBackdropClick?: boolean;
  /** When true, clicking the close icon asks for confirmation before closing. */
  confirmClose?: boolean;
  /** Confirm dialog title. Defaults to "Discard changes?". */
  confirmCloseTitle?: string;
  /** Confirm dialog message. Defaults to a generic unsaved-changes warning. */
  confirmCloseMessage?: string;
};

/**
 * Right-anchored sliding panel dialog — the wizard/detail-flow counterpart to
 * BaseDialog's centered modal. Use for multi-step flows (transfers, approvals)
 * that need more room than a centered dialog and benefit from a step header.
 */
export default function BaseSideDialog({
  open,
  onClose,
  title,
  subtitle,
  icon,
  width = 480,
  steps,
  activeStep = 0,
  children,
  footer,
  disableBackdropClick = true,
  confirmClose = false,
  confirmCloseTitle = "Discard changes?",
  confirmCloseMessage = "You have unsaved changes. Are you sure you want to close? Your changes will be lost.",
}: BaseSideDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleCloseClick = () => {
    if (confirmClose) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleConfirmDiscard = () => {
    setConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={disableBackdropClick ? undefined : handleCloseClick}
        slotProps={{
          paper: {
            sx: {
              width,
              maxWidth: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              borderTopLeftRadius: "16px",
              borderBottomLeftRadius: "16px",
              gap: 6,
            },
          },
        }}
      >
        <Stack
          direction="row"
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            p: 8,
            pb: 0,
            flexShrink: 0,
          }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {/* {icon && (
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  bgcolor: palette.primary[100],
                  color: palette.primary[600],
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {icon}
              </Box>
            )} */}
            <Box>
              <Typography sx={{ fontSize: 24, fontWeight: 600 }}>{title}</Typography>
              {subtitle && (
                <Typography sx={{ fontSize: 13, color: "text.secondary", mt: 0.25 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
          </Stack>
          <IconButton size="small" onClick={handleCloseClick} aria-label="Close dialog">
            <CloseRoundedIcon sx={{ fontSize: 28, color: "#000000" }} />
          </IconButton>
        </Stack>

        <Divider sx={{ borderColor: palette.slate[200] }} />

        {steps && steps.length > 0 && (
          <Box
            sx={{
              px: 12,
              py: 4,
              flexShrink: 0,
            }}
          >
            <SideDialogStepper steps={steps} activeStep={activeStep} />
          </Box>
        )}

        <Box sx={{ flex: 1, overflowY: "auto", px: 10, pb: 8 }}>{children}</Box>

        {footer && (
          <Box sx={{ px: 8, pb: 6, flexShrink: 0 }}>{footer}</Box>
        )}
      </Drawer>

      {confirmClose && (
        <BaseDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title={confirmCloseTitle}
          confirmTitle="Discard"
          confirmColor="error"
          cancelTitle="Keep editing"
          onConfirm={handleConfirmDiscard}
        >
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {confirmCloseMessage}
          </Typography>
        </BaseDialog>
      )}
    </>
  );
}

function SideDialogStepper({
  steps,
  activeStep,
}: {
  steps: string[];
  activeStep: number;
}) {
  return (
    <Stack direction="row" sx={{ alignItems: "flex-start" }}>
      {steps.map((label, i) => {
        const isCurrentOrDone = i <= activeStep;
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={label}>
            <Stack spacing={0.75} sx={{ alignItems: "center", minWidth: 0 }}>
              <Box
                sx={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontSize: font.size.sm,
                  fontWeight: font.weight.bold,
                  bgcolor: isCurrentOrDone ? palette.info[900] : palette.white,
                  color: isCurrentOrDone ? palette.white : palette.slate[400],
                  border: isCurrentOrDone
                    ? "none"
                    : `1px solid ${palette.slate[300]}`,
                }}
              >
                {i + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: font.size.md,
                  fontWeight: font.weight.regular,
                  letterSpacing: 0.4,
                  color: isCurrentOrDone ? palette.slate[950] : palette.slate[400],
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Typography>
            </Stack>
            {!isLast && (
              <Box
                sx={{
                  flex: 1,
                  height: "1px",
                  bgcolor: i < activeStep ? palette.info[900] : palette.slate[200],
                  mt: "14px",
                  mx: 1,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </Stack>
  );
}
