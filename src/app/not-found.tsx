"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import BaseButton from "@core/components/BaseButton";
import { font, palette, radius } from "@/theme/palette";

/**
 * The app-wide 404.
 *
 * <p>Next renders this for any URL that matches no route, and it sits outside the portal shell —
 * there is no sidebar to navigate from, so the way out has to be on the page itself.
 *
 * <p>Usually the reader is signed in and followed something broken, because `proxy.ts` sends
 * anyone without a session to /login first. Not always, though: its matcher skips any path
 * containing a dot, so a signed-out visitor hitting /something.txt lands here too. That is why the
 * primary action points at /dashboard rather than deeper in — the proxy bounces them to /login if
 * they have no session, so the button works either way.
 */
export default function NotFound() {
  const t = useTranslations("notFound");
  const router = useRouter();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: palette.slate[100],
        display: "grid",
        placeItems: "center",
        p: 3,
      }}
    >
      <Stack
        sx={{
          alignItems: "center",
          textAlign: "center",
          gap: 3,
          maxWidth: 480,
          width: "100%",
          bgcolor: palette.white,
          borderRadius: `${radius.xl}px`,
          border: `1px solid ${palette.slate[200]}`,
          px: { xs: 4, sm: 8 },
          py: { xs: 6, sm: 8 },
        }}
      >
        <Image
          src="/branding/BiKTECH.png"
          alt="SME Bank"
          width={120}
          height={120}
          priority
          style={{ width: 120, height: "auto", objectFit: "contain" }}
        />

        <Typography
          component="p"
          sx={{
            fontSize: font.size["4xl"],
            fontWeight: font.weight.bold,
            color: palette.danger[400],
            lineHeight: 1,
          }}
        >
          404
        </Typography>

        <Stack sx={{ gap: 1 }}>
          <Typography
            component="h1"
            sx={{ fontSize: font.size.xl, fontWeight: font.weight.semibold, color: "text.primary" }}
          >
            {t("title")}
          </Typography>
          <Typography sx={{ fontSize: font.size.md, color: "text.secondary" }}>
            {t("message")}
          </Typography>
        </Stack>

        <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1.5, width: "100%", justifyContent: "center" }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <BaseButton title={t("backToDashboard")} sx={{padding:"2 3", width: { xs: "100%", sm: "auto" } }} />
          </Link>
          {/* router.back() rather than a link: whatever they came from is the page they wanted. */}
          <Button
            onClick={() => router.back()}
            sx={{
              padding: "4 2",
              color: palette.primary[40],
              fontWeight: font.weight.medium,
              "&:hover": { bgcolor: palette.slate[100] },
            }}
          >
            {t("goBack")}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
