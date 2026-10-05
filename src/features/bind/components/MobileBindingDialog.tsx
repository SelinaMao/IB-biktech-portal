"use client";

import AppleIcon from "@mui/icons-material/Apple";
import GoogleIcon from "@mui/icons-material/Google";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import { showToast } from "@core/components/AppToast";
import BaseTermsLabel from "@core/components/BaseTermsLabel";
import BaseCheckbox from "@core/form/BaseCheckbox";
import BaseInput from "@core/form/BaseInput";
import { useAuth } from "@/features/auth/use-auth";
import { font, palette, radius } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";
import { formatDateTime } from "@/utils/date-time";

import { useCreateDeviceBindingSessionMutation, useLazyDeviceBindingSessionStatusQuery, useUnlinkCurrentDeviceMutation } from "../bind.api";
import type { DeviceBindingSession, DeviceBindingStatus } from "../bind.types";
import BindPromptContent from "./BindPromptContent";
import { useAppSelector } from "@/store/hooks";

type DialogView = "starting" | "session" | "bound" | "error" | "getStarted";

export type MobileBindingDialogProps = {
  open: boolean;
  onClose: () => void;
  linked?: boolean;
  deviceModel?: string | null;
  lastSeenAt?: string | null;
};

function errorCode(error: unknown) {
  return (error as { data?: { errorCode?: string } } | undefined)?.data?.errorCode;
}

function secondsUntil(value?: string | null) {
  if (!value) return 0;
  return Math.max(0, Math.ceil((new Date(value).getTime() - Date.now()) / 1000));
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

export default function MobileBindingDialog({ open, onClose, linked = false, deviceModel, lastSeenAt }: MobileBindingDialogProps) {
  const t = useTranslations("mobileBinding");
  const { logout } = useAuth();
  const requestedForOpen = useRef(false);
  const [view, setView] = useState<DialogView>("starting");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [session, setSession] = useState<DeviceBindingSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [unlinkSuccessOpen, setUnlinkSuccessOpen] = useState(false);
  const [unlinkPassword, setUnlinkPassword] = useState("");
  const [showUnlinkPassword, setShowUnlinkPassword] = useState(false);
  const [unlinkAgreedTerms, setUnlinkAgreedTerms] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(3);
  const [unlinkSuccessCountdown, setUnlinkSuccessCountdown] = useState(3);

  const [createSession, { isLoading: isCreating }] = useCreateDeviceBindingSessionMutation();
  const [unlinkCurrent, { isLoading: isUnlinking }] = useUnlinkCurrentDeviceMutation();
  const [loadStatus, { data: statusData, reset: resetStatus }] = useLazyDeviceBindingSessionStatusQuery();

  const bindingSessionId = session?.bindingSessionId ?? "";
  const dialogView: DialogView = linked && view === "starting" ? "bound" : view;

  const status: DeviceBindingStatus = statusData?.status ?? "PENDING";
  const terminal = status === "CONSUMED" || status === "EXPIRED" || status === "CANCELLED";
  const activeDeadline = useMemo(() => {
    if (status === "SCANNED") return statusData?.pinSetupExpiresAt;
    return session?.expiresAt;
  }, [session?.expiresAt, status, statusData?.pinSetupExpiresAt]);

  const requestQr = useCallback(async () => {
    resetStatus();
    setView("starting");
    setSession(null);
    try {
      const created = await createSession().unwrap();
      setSession(created);
      setRemainingSeconds(secondsUntil(created.expiresAt));
      setView("session");
    } catch (error) {
      if (errorCode(error) === "AUTH-10-011") {
        setView("bound");
        return;
      }
      setView("error");
      showToast("error", toToastError(error, t("errors.createTitle")));
    }
  }, [createSession, resetStatus, t]);

  useEffect(() => {
    if (!open) {
      requestedForOpen.current = false;
      return;
    }
    if (requestedForOpen.current) return;
    requestedForOpen.current = true;
    resetStatus();
    setSession(null);
    setView("starting");
    if (linked) return;
    const timer = window.setTimeout(() => void requestQr(), 0);
    return () => window.clearTimeout(timer);
  }, [linked, open, requestQr, resetStatus]);

  useEffect(() => {
    if (!open || view !== "session" || !bindingSessionId) return;
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const latest = await loadStatus(bindingSessionId, false).unwrap();
        if (cancelled) return;
        const isTerminal = latest.status === "CONSUMED" || latest.status === "EXPIRED" || latest.status === "CANCELLED";
        if (!isTerminal) timer = window.setTimeout(poll, 2_000);
      } catch (error) {
        if (cancelled) return;
        setView("error");
        showToast("error", toToastError(error, t("errors.statusTitle")));
      }
    };

    void poll();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [bindingSessionId, loadStatus, open, t, view]);

  useEffect(() => {
    if (!open || view !== "session" || terminal) return;
    const update = () => setRemainingSeconds(secondsUntil(activeDeadline));
    update();
    const timer = window.setInterval(update, 1_000);
    return () => window.clearInterval(timer);
  }, [activeDeadline, open, terminal, view]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleUnlink = async () => {
    if (!unlinkPassword.trim() || !unlinkAgreedTerms) return;
    try {
      await unlinkCurrent({ password: unlinkPassword }).unwrap();
      setUnlinkSuccessOpen(true);
      setUnlinkConfirmOpen(false);
      setUnlinkPassword("");
      setShowUnlinkPassword(false);
      setUnlinkAgreedTerms(false);
      setUnlinkSuccessOpen(true);
    } catch (error) {
      setUnlinkPassword("");
      showToast("error", toToastError(error, t("errors.unlinkTitle")));
    }
  };

  const closeUnlinkConfirm = () => {
    setUnlinkConfirmOpen(false);
    setUnlinkPassword("");
    setShowUnlinkPassword(false);
    setUnlinkAgreedTerms(false);
  };

  const closeUnlinkSuccess = () => {
    setUnlinkSuccessOpen(false);
    setSession(null);
    setView("getStarted");
  };

  useEffect(() => {
    if (!unlinkSuccessOpen) {
      setUnlinkSuccessCountdown(3);
      return;
    }
    if (unlinkSuccessCountdown <= 0) {
      closeUnlinkSuccess();
      return;
    }
    const timer = window.setTimeout(() => setUnlinkSuccessCountdown((seconds) => seconds - 1), 1_000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlinkSuccessOpen, unlinkSuccessCountdown]);

  const isScanView = dialogView === "session" && status === "PENDING";
  const isSuccessView = dialogView === "session" && status === "CONSUMED";
  // Every view without a way out gets one. "bound" has its close button; success closes itself.
  const showSignOut = dialogView !== "bound" && !isSuccessView;
  const title = dialogView === "bound" || dialogView === "getStarted" ? "" : isScanView || isSuccessView ? "" : t("title");
  const subtitle = dialogView === "bound" || dialogView === "getStarted" ? undefined : isScanView || isSuccessView ? undefined : t("subtitle");

  const handleClose = () => {
    closeUnlinkConfirm();
    setUnlinkSuccessOpen(false);
    onClose();
  };

  useEffect(() => {
    if (!open || !isSuccessView) {
      setSuccessCountdown(3);
      return;
    }
    if (successCountdown <= 0) {
      handleClose();
      return;
    }
    const timer = window.setTimeout(() => setSuccessCountdown((seconds) => seconds - 1), 1_000);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccessView, open, successCountdown]);

  return (
    <>
      <BaseDialog open={open && !unlinkConfirmOpen && !unlinkSuccessOpen} onClose={handleClose} title={title} subtitle={subtitle} hideActions hideCloseButton={dialogView !== "bound"} disableBackdropClick maxWidth="xs">
        {dialogView === "starting" ? (
          <Stack sx={{ alignItems: "center", py: 8 }} spacing={3}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary">
              {isCreating ? t("creating") : t("loading")}
            </Typography>
          </Stack>
        ) : null}

        {dialogView === "bound" ? (
          <BindPromptContent
            title={t("bound.heading")}
            titleSx={{ fontWeight: font.weight.regular, fontSize: font.size["xxl"] }}
            imageInset={20}
            stackSx={{ pt: 2, px: 8 }}
            bodyExtra={
              <>
                {deviceModel ? (
                  <Typography variant="body2" sx={{ fontSize: font.size.base, maxWidth: font.weight.regular, mx: "auto", color: palette.slate[950] }}>
                    {deviceModel}
                  </Typography>
                ) : null}
                {lastSeenAt ? (
                  <Box
                    sx={{
                      width: "100%",
                      textAlign: "center",
                      py: 1.5,
                      px: 2,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontSize: font.size.xs, color: palette.slate[400] }}>
                      {t("bound.lastLogin")}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.25, fontSize: font.size.xs, color: palette.slate[400] }}>
                      {formatDateTime(lastSeenAt)}
                    </Typography>
                  </Box>
                ) : null}
              </>
            }
          >
            <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
              <BaseButton
                fullWidth
                title={t("bound.unlink")}
                onClick={() => setUnlinkConfirmOpen(true)}
                sx={{
                  backgroundColor: palette.danger[500],
                  color: palette.white,
                  "&:hover": { backgroundColor: palette.danger[500] },
                }}
              />
            </Stack>
          </BindPromptContent>
        ) : null}

        {dialogView === "getStarted" ? (
          <BindPromptContent
            title={t("activatePrompt.title")}
            description={t("activatePrompt.description")}
            imageInset={20}
            stackSx={{ pt: 2, px: 8 }}
            secondaryActionTitle={t("activatePrompt.signOut")}
            onSecondaryAction={() => void handleSignOut()}
            secondaryActionLoading={isSigningOut}
            primaryActionTitle={t("activatePrompt.getStarted")}
            onPrimaryAction={requestQr}
          />
        ) : null}

        {dialogView === "error" ? (
          <Stack sx={{ alignItems: "center", textAlign: "center", py: 4 }} spacing={3}>
            <ErrorOutlineRoundedIcon color="error" sx={{ fontSize: 48 }} />
            <Typography variant="body2" color="text.secondary">
              {t("errors.description")}
            </Typography>
            <BaseButton title={t("retry")} onClick={requestQr} />
          </Stack>
        ) : null}

        {dialogView === "session" && session ? (
          <Stack sx={{ alignItems: "center", textAlign: "center" }} spacing={3}>
            {status === "PENDING" ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: font.weight.regular, fontSize: font.size["xxl"], color: palette.slate[950] }}>
                  {t("scan.title")}
                </Typography>
                <Typography variant="body2" sx={{ fontSize: font.size.base, color: palette.slate[950] }}>
                  {t("scan.instruction")}{" "}
                  <Box component="span" sx={{ fontWeight: font.weight.bold }}>
                    {t("scan.appName")}
                  </Box>
                </Typography>
                <Box sx={{ lineHeight: 0 }}>
                  <QRCodeSVG value={session.qrPayload} size={208} level="Q" marginSize={1} title={t("qrAlt")} />
                </Box>
                <Typography variant="body2" sx={{ fontSize: font.size.base, color: palette.slate[400] }}>
                  {t("scan.expireIn", { seconds: remainingSeconds })}
                </Typography>
                <Box sx={{ pt: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: font.weight.bold, mb: 0.5, fontSize: font.size.lg, color: palette.slate[950] }}>
                    {t("scan.noAppQuestion")}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5, color: palette.slate[950], fontSize: font.size.base }}>
                    {t("scan.availableIn")}
                  </Typography>
                  <Stack direction="row" spacing={3} py={1} sx={{ width: "100%" }}>
                    <BaseButton
                      fullWidth
                      title={t("scan.playStore")}
                      startIcon={<GoogleIcon />}
                      component="a"
                      href="https://play.google.com/store/apps/details?id=jp.co.soramitsu.bakong&hl=en"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        backgroundColor: palette.slate[100],
                        color: palette.text.secondary,
                        "&:hover": { backgroundColor: palette.slate[200] },
                      }}
                    />
                    <BaseButton
                      fullWidth
                      title={t("scan.appStore")}
                      href="https://www.apple.com/app-store/"
                      target="_blank"
                      startIcon={<AppleIcon />}
                      sx={{
                        backgroundColor: palette.text.primary,
                        color: palette.white,
                        "&:hover": { backgroundColor: palette.text.primary },
                      }}
                    />
                  </Stack>
                </Box>
              </>
            ) : null}

            {status === "SCANNED" ? (
              <Box
                sx={{
                  position: "relative",
                  p: 2.5,
                  bgcolor: palette.white,
                  border: `1px solid ${palette.slate[200]}`,
                  borderRadius: `${radius.xl}px`,
                  boxShadow: "0 12px 32px rgba(31, 27, 75, 0.08)",
                  lineHeight: 0,
                }}
              >
                <QRCodeSVG value={session.qrPayload} size={208} level="Q" marginSize={1} title={t("qrAlt")} />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(255, 255, 255, 0.88)",
                    borderRadius: `${radius.xl}px`,
                  }}
                >
                  <CircularProgress size={52} thickness={3} />
                </Box>
              </Box>
            ) : null}

            {status === "SCANNED" ? (
              <Box>
                <Typography variant="h5" sx={{ mb: 0.75 }}>
                  {t("scanned.heading")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("scanned.description")}
                </Typography>
              </Box>
            ) : null}

            {status === "CONSUMED" ? (
              <Stack sx={{ alignItems: "center", textAlign: "center", py: 4 }} spacing={2}>
                <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 72 }} />
                <Box py={6}>
                  <Typography variant="body2" sx={{ color: palette.slate[950], fontWeight: font.weight.medium, mb: 0.5, fontSize: font.size.xl }}>
                    {t("success.label")}
                  </Typography>
                  <Typography variant="h5" sx={{ mb: 0.75, py: 3, fontWeight: font.weight.bold, fontSize: font.size["5xl"], color: palette.slate[950] }}>
                    {t("success.heading")}
                  </Typography>
                  <Typography variant="body2" sx={{ color: palette.slate[950], fontSize: font.size.base }}>
                    {t("success.description")}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ fontSize: font.size.base, color: palette.slate[400] }}>
                  {t("success.closing", { seconds: successCountdown })}
                </Typography>
              </Stack>
            ) : null}

            {status === "EXPIRED" || status === "CANCELLED" ? (
              <>
                <QrCode2RoundedIcon sx={{ fontSize: 64, color: palette.slate[400] }} />
                <Box>
                  <Typography variant="h5" sx={{ mb: 0.75 }}>
                    {status === "EXPIRED" ? t("expired.heading") : t("cancelled.heading")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {status === "EXPIRED" ? t("expired.description") : t("cancelled.description")}
                  </Typography>
                </Box>
                <BaseButton title={t("generateAgain")} onClick={requestQr} />
              </>
            ) : null}

            {status === "SCANNED" ? (
              <Box
                sx={{
                  width: "100%",
                  py: 2,
                  px: 3,
                  borderRadius: `${radius.lg}px`,
                  bgcolor: palette.slate[50],
                  border: `1px solid ${palette.slate[200]}`,
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {t("pinTimeLabel")}
                </Typography>
                <Typography variant="h4" sx={{ mt: 0.5, fontVariantNumeric: "tabular-nums" }}>
                  {formatCountdown(remainingSeconds)}
                </Typography>
              </Box>
            ) : null}
          </Stack>
        ) : null}

        {showSignOut ? <SignOutFooter /> : null}
      </BaseDialog>

      <BaseDialog
        open={unlinkConfirmOpen}
        onClose={closeUnlinkConfirm}
        title={t("unlink.title")}
        variant="action"
        maxWidth="xs"
        confirmTitle={t("unlink.confirm")}
        confirmDisabled={!unlinkPassword.trim() || !unlinkAgreedTerms}
        onConfirm={handleUnlink}
        isLoading={isUnlinking}
        disableBackdropClick
      >
        <Typography variant="body2" sx={{ color: palette.slate[950], mb: 3 }}>
          {t("unlink.description")}
        </Typography>
        <BaseInput
          label={t("unlink.passwordLabel")}
          isRequired
          type={showUnlinkPassword ? "text" : "password"}
          value={unlinkPassword}
          placeholder={t("unlink.passwordPlaceholder")}
          disabled={isUnlinking}
          autoFocus
          onChange={(event) => setUnlinkPassword(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && unlinkPassword.trim() && unlinkAgreedTerms) {
              event.preventDefault();
              void handleUnlink();
            }
          }}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" disabled={isUnlinking} aria-label={showUnlinkPassword ? t("unlink.hidePassword") : t("unlink.showPassword")} onClick={() => setShowUnlinkPassword((visible) => !visible)}>
                    {showUnlinkPassword ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Box sx={{ mt: 2.5 }}>
          <BaseCheckbox
            checked={unlinkAgreedTerms}
            disabled={isUnlinking}
            onChange={(event) => setUnlinkAgreedTerms(event.target.checked)}
            sx={{ "&.Mui-checked": { color: palette.navy[800] } }}
            label={
              <BaseTermsLabel
                text={t("unlink.termsLabel")}
                sx={{ color: palette.slate[950], fontSize: font.size.base }}
                linkSx={{ color: palette.slate[950], fontWeight: font.weight.bold, fontSize: font.size.base }}
              />
            }
          />
        </Box>
      </BaseDialog>

      <BaseDialog open={unlinkSuccessOpen} onClose={closeUnlinkSuccess} title="" hideActions hideCloseButton disableBackdropClick maxWidth="xs">
        <Stack sx={{ alignItems: "center", textAlign: "center", py: 3 }} spacing={3}>
          <CheckCircleOutlineRoundedIcon color="success" sx={{ fontSize: 72 }} />
          <Box py={6}>
            <Typography variant="body2" sx={{ color: palette.black40, fontWeight: font.weight.medium, mb: 0.5, fontSize: font.size.xl }}>
              {t("unlink.successLabel")}
            </Typography>
            <Typography variant="h5" sx={{ mb: 0.75, fontWeight: font.weight.bold, fontSize: font.size["5xl"] }}>
              {t("unlink.successTitle")}
            </Typography>
            <Typography variant="body2" sx={{ color: palette.slate[950], fontSize: font.size.base }}>
              {t("unlink.successMessage")}
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ fontsize: font.size.base, color: palette.slate[400] }}>
            {t("unlink.closing", { seconds: unlinkSuccessCountdown })}
          </Typography>
        </Stack>
      </BaseDialog>
    </>
  );
}

/**
 * The scan dialog can't be dismissed, so this is the way out for a user who can't activate now.
 * Naming the account also shows whose login the phone is about to be linked to.
 */
function SignOutFooter() {
  const t = useTranslations("mobileBinding");
  const { logout } = useAuth();
  const username = useAppSelector((state) => state.auth.user?.name);
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
    <Stack
      direction="row"
      sx={{
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        mt: 3,
        pt: 2,
        borderTop: `1px solid ${palette.slate[200]}`,
      }}
    >
      <Typography variant="body2" noWrap sx={{ minWidth: 0, fontSize: font.size.sm, color: palette.slate[400] }}>
        {t.rich("signedInAs", {
          name: username ?? "",
          user: (chunks) => (
            <Box component="span" sx={{ fontWeight: font.weight.medium, color: palette.slate[950] }}>
              {chunks}
            </Box>
          ),
        })}
      </Typography>
      <BaseButton
        title={t("activatePrompt.signOut")}
        startIcon={<LogOut size={16} aria-hidden />}
        onClick={() => void handleSignOut()}
        isLoading={isSigningOut}
        sx={{
          flexShrink: 0,
          padding: "6px 10px",
          backgroundColor: "transparent",
          color: palette.danger[500],
          "&:hover": { backgroundColor: palette.danger[50] },
        }}
      />
    </Stack>
  );
}
