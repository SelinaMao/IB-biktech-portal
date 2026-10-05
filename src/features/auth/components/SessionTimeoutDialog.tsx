"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { TimerReset } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import { controlBTNHeight, font, palette } from "@/theme/palette";
import { useSessionTimeout } from "../use-session-timeout";

function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * The session-timeout prompt. Mounted once for the signed-in portal (SessionProvider); it opens by
 * itself when the session nears an end — inactivity, token expiry or the absolute limit — and counts
 * down to it. It can't be dismissed without an answer: staying, or logging out.
 */
export default function SessionTimeoutDialog() {
  const t = useTranslations("session");
  const { prompt, policy, isExtending, refreshFailed, staySignedIn, signOut } =
    useSessionTimeout();

  // Keep the last prompt through the close animation, so the text doesn't change as it fades.
  const [lastPrompt, setLastPrompt] = useState(prompt);
  if (prompt && prompt !== lastPrompt) setLastPrompt(prompt);
  const shown = prompt ?? lastPrompt;
  const warning = shown?.warning ?? "idle";

  return (
    <BaseDialog
      open={prompt !== null}
      onClose={signOut}
      title={t(`${warning}.title`)}
      maxWidth="xs"
      hideCloseButton
      hideActions
    >
      <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center", pt: 1 }}>
        <Box
          sx={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: palette.warning[50],
            color: palette.warning[500],
          }}
        >
          <TimerReset size={28} strokeWidth={1.75} aria-hidden />
        </Box>

        <Typography variant="body2" sx={{ color: palette.slate[950], fontSize: font.size.base }}>
          {t(`${warning}.description`, { hours: policy?.absoluteTimeoutHours ?? 0 })}
        </Typography>

        <Typography
          role="timer"
          aria-live="off"
          sx={{
            fontSize: font.size["5xl"],
            fontWeight: font.weight.bold,
            fontVariantNumeric: "tabular-nums",
            color: palette.slate[950],
            lineHeight: 1,
          }}
        >
          {formatCountdown(shown?.remainingMs ?? 0)}
        </Typography>

        {refreshFailed ? (
          <Typography variant="body2" sx={{ color: palette.danger[500] }}>
            {t("refreshFailed")}
          </Typography>
        ) : null}

        {/* BaseDialog's own footer paints Cancel exactly like Confirm; logging out must not look
            like the default answer. Same secondary style as the mobile-binding dialogs. */}
        <Stack direction="row" spacing={2} sx={{ width: "100%", pt: 1 }}>
          <BaseButton
            fullWidth
            title={t("logout")}
            onClick={signOut}
            disabled={isExtending}
            sx={{
              height: controlBTNHeight,
              backgroundColor: palette.slate[100],
              color: palette.text.primary,
              "&:hover": { backgroundColor: palette.slate[200] },
            }}
          />
          <BaseButton
            fullWidth
            autoFocus
            title={warning === "limit" ? t("limit.confirm") : t("staySignedIn")}
            onClick={() => void staySignedIn()}
            isLoading={isExtending}
            sx={{ height: controlBTNHeight }}
          />
        </Stack>
      </Stack>
    </BaseDialog>
  );
}
