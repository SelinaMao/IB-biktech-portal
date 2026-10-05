"use client";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { Breakpoint } from "@mui/material/styles";
import type { ButtonProps } from "@mui/material/Button";
import type { SxProps, Theme } from "@mui/material/styles";

import { controlBTNHeight, font } from "@/theme/palette";
import BaseButton from "./BaseButton";

export type BaseDialogProps = {
  open: boolean;
  title: string;
  /** Optional line under the title. */
  subtitle?: string;
  onClose: () => void;
  children?: React.ReactNode;
  maxWidth?: Breakpoint;
  /** Caps the dialog paper's height at the theme breakpoint's pixel value. */
  maxHeight?: Breakpoint;
  /** Primary action — omit for a plain informational dialog. */
  confirmTitle?: string;
  onConfirm?: () => void;
  /** e.g. "error" for destructive confirms (delete, revoke). */
  confirmColor?: ButtonProps["color"];
  /** Disables the primary action regardless of loading state (e.g. unmet form requirements). */
  confirmDisabled?: boolean;
  /** Disables both buttons and shows a spinner on the primary action. */
  isLoading?: boolean;
  cancelTitle?: string;
  /** Hide the footer entirely (fully custom content). */
  hideActions?: boolean;
  hideCloseButton?: boolean;
  /** Defaults to true — dialogs don't close on outside click unless explicitly opted out. */
  disableBackdropClick?: boolean;
  /** Draw dividers between header / content / footer. Defaults to true for "action" variant, false otherwise. */
  dividers?: boolean;
  /**
   * "standard" (default): compact header, Cancel + Confirm footer — used by
   * management dialogs (user/role CRUD, transfers).
   * "action": spacious header/content/footer padding, larger title, single
   * full-width confirm button and no Cancel — used by auth-flow dialogs
   * (OTP, setup password) where dismissal is via the close icon only.
   */
  variant?: "standard" | "action";
  /** Override the DialogTitle's own sx (e.g. to collapse its padding when title is empty). */
  titleSx?: SxProps<Theme>;
  /** Override the DialogContent's own sx (e.g. to disable scrolling for short, fixed-height content). */
  contentSx?: SxProps<Theme>;
};

/**
 * Standard app dialog: title + close, content, footer. The single base for
 * every dialog in the app — pick `variant="action"` for auth-flow dialogs
 * (OTP, setup password) instead of hand-rolling the MUI Dialog shell again.
 * Radius/typography come from the theme. For destructive actions pass
 * confirmColor="error" — dual-control flows should confirm through this.
 */
export default function BaseDialog({
  open,
  title,
  subtitle,
  onClose,
  children,
  maxWidth = "sm",
  maxHeight,
  confirmTitle,
  onConfirm,
  confirmColor = "primary",
  confirmDisabled = false,
  isLoading = false,
  cancelTitle = "Cancel",
  hideActions = false,
  hideCloseButton = false,
  disableBackdropClick = true,
  dividers,
  variant = "standard",
  titleSx,
  contentSx,
}: BaseDialogProps) {
  const isAction = variant === "action";
  const spacingSx = isAction ? { p: { xs: 4, sm: 4.5, md: 6 } } : undefined;
  const showDividers = dividers ?? isAction;

  return (
    <Dialog
      open={open}
      onClose={
        isLoading ? undefined : disableBackdropClick ? undefined : onClose
      }
      maxWidth={maxWidth}
      fullWidth
      PaperProps={
        maxHeight
          ? { sx: (theme) => ({ maxHeight: theme.breakpoints.values[maxHeight] }) }
          : undefined
      }
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          pb: subtitle ? 1 : undefined,
          ...spacingSx,
          ...titleSx,
        }}
      >
        <span>
          {isAction ? (
            <Typography
              variant="h6"
              component="span"
              sx={{ fontWeight: font.weight.semibold, fontSize: font.size.xxl }}
            >
              {title}
            </Typography>
          ) : (
            title
          )}
          {subtitle ? (
            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 0.25 }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </span>
        {!hideCloseButton && (
          <IconButton
            size="small"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            sx={{ mt: -0.5, mr: -1 }}
          >
            <CloseRoundedIcon fontSize="small" sx={{ color: "#1F1F1F" }} />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent
        dividers={showDividers}
        sx={{ ...spacingSx, ...(isAction && { borderBottom: "none" }), ...contentSx }}
      >
        {children}
      </DialogContent>

      {!hideActions && (
        <DialogActions sx={{ px: 3, pb: 2.5, ...spacingSx }}>
          {isAction ? (
            confirmTitle && onConfirm ? (
              <BaseButton
                fullWidth
                title={confirmTitle}
                isLoading={isLoading}
                disabled={confirmDisabled}
                onClick={onConfirm}
                sx={{ height: controlBTNHeight }}
              />
            ) : null
          ) : (
            <>
              <BaseButton
                title={cancelTitle}
                color="error"
                variant="outlined"
                // color="inherit"
                onClick={onClose}
                disabled={isLoading}
              />
              {confirmTitle && onConfirm ? (
                <BaseButton
                  title={confirmTitle}
                  variant="contained"
                  color={confirmColor}
                  onClick={onConfirm}
                  disabled={confirmDisabled}
                  isLoading={isLoading}
                />
              ) : null}
            </>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
