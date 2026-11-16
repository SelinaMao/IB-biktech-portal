"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { font, padding, palette, radius } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";
import { formatDateTime } from "@/utils/date-time";
import { showToast } from "@core/components/AppToast";
import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import BaseOTP from "@core/components/BaseOTP";
import BaseTermsLabel from "@core/components/BaseTermsLabel";
import BaseCheckbox from "@core/form/BaseCheckbox";
import BaseInput from "@core/form/BaseInput";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Button, ButtonBase, Link } from "@mui/material";
import { useCreateDeviceBindingSessionMutation, useLazyDeviceBindingSessionStatusQuery, useUnlinkCurrentDeviceMutation } from "../bind.api";
import type { DeviceBindingSession, DeviceBindingStatus } from "../bind.types";
import BindPromptContent from "./BindPromptContent";
import { ChevronRight, X } from "lucide-react";

type DialogView = "starting" | "session" | "bound" | "error" | "getStarted";

export type MobileBindingDialogProps = {
  open: boolean;
  onClose: () => void;
  linked?: boolean;
  deviceModel?: string | null;
  lastSeenAt?: string | null;
  onUseSms?: () => void;
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

export default function MobileBindingDialog({
  open,
  onClose,
  linked = false,
  deviceModel,
  lastSeenAt,
  onUseSms,
}: MobileBindingDialogProps) {
  const t = useTranslations("mobileBinding");
  const requestedForOpen = useRef(false);
  const [view, setView] = useState<DialogView>("starting");
  const [session, setSession] = useState<DeviceBindingSession | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [unlinkConfirmOpen, setUnlinkConfirmOpen] = useState(false);
  const [unlinkSuccessOpen, setUnlinkSuccessOpen] = useState(false);
  const [unlinkPassword, setUnlinkPassword] = useState("");
  const [showUnlinkPassword, setShowUnlinkPassword] = useState(false);
  const [unlinkAgreedTerms, setUnlinkAgreedTerms] = useState(false);
  const [successCountdown, setSuccessCountdown] = useState(3);
  const [unlinkSuccessCountdown, setUnlinkSuccessCountdown] = useState(3);
  const [smsVerifyOpen, setSmsVerifyOpen] = useState(false);

  const handleUseSms = () => {
    if (onUseSms) {
      onUseSms();
      return;
    }
    setSmsVerifyOpen(true);
  };

  const handleSmsVerify = async () => {
    setSmsVerifyOpen(false);
    showToast("success", {
      title: "Device Linked",
      message: "Your device has been verified successfully via SMS.",
    });
    handleClose();
  };

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
      <BaseDialog
        open={open && !unlinkConfirmOpen && !unlinkSuccessOpen}
        onClose={handleClose}
        title={title}
        subtitle={subtitle}
        hideActions
        hideCloseButton
        disableBackdropClick
        maxWidth="xs"
        paperSx={{
          borderRadius: "28px",
          maxWidth: 440,
          boxShadow: "0 24px 48px -12px rgba(0, 0, 0, 0.12)",
        }}

        titleSx={isScanView ? { display: "none" } : undefined}
        contentSx={isScanView ? { p: padding.sm } : undefined}
      >
        {dialogView === "starting" ? (
          <Stack sx={{ alignItems: "center", py: 8 }} spacing={3}>
            <CircularProgress size={36} />
            <Typography variant="body2" color="text.secondary">
              {isCreating ? t("creating") : t("loading")}
            </Typography>
          </Stack>
        ) : null}

        {dialogView === "bound" ? (
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={handleClose}
              aria-label="Close"
              size="small"
              sx={{
                position: "absolute",
                top: 6,
                right: 6,
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
          </Box>
        ) : null}

        {dialogView === "getStarted" ? (
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={handleClose}
              aria-label="Close"
              size="small"
              sx={{
                position: "absolute",
                top: 6,
                right: 6,
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
              imageInset={20}
              stackSx={{ pt: 2, px: 8 }}
              primaryActionTitle={t("activatePrompt.getStarted")}
              onPrimaryAction={requestQr}
            />
          </Box>
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
          <Stack sx={{ alignItems: "start", textAlign: "center" }} spacing={3}>
            {status === "PENDING" ? (
              <Box sx={{ width: "100%", textAlign: "left" }}>
                <Stack
                  direction="row"
                  sx={{ width: "100%", alignItems: "center", justifyContent: "space-between" }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "20px", sm: "22px" },
                      color: "#0F172A",
                      lineHeight: 1.25,
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {t("scan.title")}
                  </Typography>

                  <IconButton
                    onClick={handleClose}
                    aria-label="Close"
                    size="small"
                    sx={{
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
                    <CloseRoundedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>

                <Box sx={{ mt: 3, textAlign: "left" }}>
                  <Typography
                    sx={{
                      fontSize: "15px",
                      fontWeight: 700,
                      color: "#0F172A",
                    }}
                  >
                    {t("scan.instruction")}
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "14px",
                      color: "#475569",
                      mt: 0.5,
                      lineHeight: 1.5,
                    }}
                  >
                    {t.rich("scan.subTitle", {
                      appName: "Biktech Banking App",
                      link: (chunks) => (
                        <Link
                          href="https://example.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            color: "#0969DA",
                            textDecoration: "underline",
                            fontWeight: 500,
                            "&:hover": {
                              color: "#054DA7",
                            },
                          }}
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </Typography>
                </Box>
                {/* OR Handle */}
                <Box
                  sx={{
                    width: "100%",
                    bgcolor: "#F5F7FA",
                    borderRadius: "16px",
                    py: 3.5,
                    px: 2,
                    mt: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <QRCodeSVG
                    value={session.qrPayload}
                    size={180}
                    level="M"
                    marginSize={0}
                    title={t("qrAlt")}
                  />
                </Box>

                <ButtonBase
                  onClick={handleUseSms}
                  sx={{
                    width: "100%",
                    bgcolor: "#F5F7FA",
                    borderRadius: "16px",
                    p: 2,
                    mt: 3,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                    transition: "background-color 0.15s ease",
                    "&:hover": {
                      bgcolor: "#EDF0F4",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#0F172A",
                        flexShrink: 0,
                      }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h3" />
                        <path d="M14 2a2 2 0 0 1 2 2v7" />
                        <circle cx="7" cy="18" r="0.75" fill="currentColor" />
                        <circle cx="17.5" cy="14" r="2.5" />
                        <path d="M13.5 22c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5" />
                      </svg>
                    </Box>

                    <Box>
                      <Typography
                        sx={{
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#0F172A",
                          lineHeight: 1.3,
                        }}
                      >
                        {t("scan.useSms")}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13px",
                          fontWeight: 400,
                          color: "#64748B",
                          mt: 0.25,
                        }}
                      >
                        {t("scan.useSmsDesc")}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      bgcolor: "#EDF0F4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#1E293B",
                      flexShrink: 0,
                    }}
                  >
                    <ChevronRight size={16} />
                  </Box>
                </ButtonBase>
              </Box>
            ) : null}

            {status === "SCANNED" ? (
              <Box
                sx={{

                  position: "relative",
                  alignSelf: "center",
                  p: 2.5,
                  bgcolor: palette.white,
                  border: `1px solid ${palette.slate[200]}`,
                  borderRadius: `${radius.xl}px`,
                  boxShadow: "0 12px 32px rgba(31, 27, 75, 0.08)",
                  lineHeight: 0,
                }}
              >
                <QRCodeSVG value={session.qrPayload} size={208} level="Q" marginSize={3} title={t("qrAlt")} />
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

      <BaseOTP
        open={smsVerifyOpen}
        onClose={() => setSmsVerifyOpen(false)}
        title="SMS Verification"
        description="We've sent a 6-digit verification code to your registered mobile number."
        onVerify={handleSmsVerify}
        onResend={() => {
          showToast("info", {
            title: "SMS Sent",
            message: "A new verification code has been sent to your phone.",
          });
        }}
      />
    </>
  );
}
