"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Check, Copy, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";

import { controlBTNHeight, font, palette, radius } from "@/theme/palette";
import type { AppToastData } from "./AppToast";
import BaseButton from "./BaseButton";
import BaseDialog from "./BaseDialog";

/* ------------------------------------------------------------------ */
/*  Queue — errors raised anywhere, shown one at a time                 */
/* ------------------------------------------------------------------ */

const ICON_SIZE = font.icon.xl * 1.5;

const EMPTY: AppToastData[] = [];
let queue: AppToastData[] = EMPTY;
const listeners = new Set<() => void>();

const sameError = (a: AppToastData, b: AppToastData) =>
  a.title === b.title && (a.message ?? "") === (b.message ?? "");

/**
 * Show an error in the app's error dialog. Callable from anywhere (no hook): `showToast("error", …)`
 * routes here. A second error waits until the first is dismissed; the same error raised again while
 * one is pending — several queries failing on one screen — is shown once.
 */
export function openErrorDialog(data: AppToastData) {
  if (queue.some((pending) => sameError(pending, data))) return;
  queue = [...queue, data];
  listeners.forEach((listener) => listener());
}

function dismissErrorDialog() {
  queue = queue.length > 1 ? queue.slice(1) : EMPTY;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `S0102001-C6D9832F` → `S0102001 - C6D9832F`, as the design shows it. The copy stays raw. */
function formatReference(referenceCode: string) {
  return referenceCode.replace(/\s*-\s*/, " - ");
}

/* ------------------------------------------------------------------ */
/*  Host — mounted once in the root layout                              */
/* ------------------------------------------------------------------ */

export function AppErrorDialogHost() {
  const t = useTranslations("errorDialog");
  const pending = useSyncExternalStore(subscribe, () => queue, () => EMPTY);
  const current = pending[0];

  // Keep the last error through the close animation, so the text doesn't vanish as it fades.
  const [shown, setShown] = useState(current);
  if (current && current !== shown) setShown(current);
  const error = current ?? shown;

  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const copied = Boolean(error?.referenceCode) && copiedRef === error?.referenceCode;

  const copyReference = async () => {
    if (!error?.referenceCode) return;
    try {
      await navigator.clipboard.writeText(error.referenceCode);
      setCopiedRef(error.referenceCode);
    } catch {
      // Clipboard blocked (permissions, insecure context) — the code is on screen to read out.
    }
  };

  return (
    <BaseDialog
      open={current !== undefined}
      onClose={dismissErrorDialog}
      title=""
      titleSx={{ p: 0 }}
      // `&&`: MUI zeroes the top padding of content that follows a DialogTitle, with a more
      // specific selector than a plain sx rule.
      contentSx={{ "&&": { p: 5 } }}
      hideActions
      hideCloseButton
      maxWidth="xs"
    >
      {/* The icon spans the title and the reference together, as in the design. */}
      <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
        <Box sx={{ color: palette.danger[700], flexShrink: 0, lineHeight: 0 }}>
          <Info size={ICON_SIZE} strokeWidth={1.5} aria-hidden />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            component="h2"
            sx={{
              fontSize: font.size.xl,
              fontWeight: font.weight.semibold,
              color: palette.slate[950],
              lineHeight: 1.3,
              overflowWrap: "anywhere",
            }}
          >
            {error?.title}
          </Typography>
          {error?.referenceCode ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mt: 1.5 }}>
              <Box
                component="span"
                sx={{
                  px: 1.5,
                  py: 0.5,
                  borderRadius: `${radius.sm / 2}px`,
                  bgcolor: palette.danger[100],
                  color: palette.danger[700],
                  fontSize: font.size.md,
                  fontVariantNumeric: "tabular-nums",
                  whiteSpace: "nowrap",
                }}
              >
                {formatReference(error.referenceCode)}
              </Box>
              <Tooltip title={copied ? t("copied") : t("copyReference")} arrow>
                <IconButton
                  size="small"
                  onClick={() => void copyReference()}
                  aria-label={t("copyReference")}
                  sx={{ color: copied ? palette.success[500] : palette.slate[950] }}
                >
                  {copied ? <Check size={18} aria-hidden /> : <Copy size={18} aria-hidden />}
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null}
        </Box>
      </Stack>

      {error?.message ? (
        <Typography sx={{ mt: 4, fontSize: font.size.base, color: palette.slate[900], overflowWrap: "anywhere" }}>
          {error.message}
        </Typography>
      ) : null}

      <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 5 }}>
        <BaseButton
          autoFocus
          title={t("okay")}
          onClick={dismissErrorDialog}
          sx={{ minWidth: 144, height: controlBTNHeight, borderRadius: `${radius.xl}px` }}
        />
      </Stack>
    </BaseDialog>
  );
}
