"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale as useIntlLocale } from "next-intl";
import { setLocale as setLocaleAction } from "./locale-actions";
import type { Locale } from "./config";

export type LanguageMeta = {
  label: string;
  short: string;
  flag: string;
};

export const languages: Record<Locale, LanguageMeta> = {
  km: { label: "ខ្មែរ", short: "ខ្មែរ", flag: "/branding/flags/km.svg" },
  en: { label: "English", short: "English", flag: "/branding/flags/en.svg" },
};

/**
 * Client-side locale API on top of next-intl's cookie-based setup.
 * `setLocale` stores the cookie via a server action and refreshes the router
 * so the whole tree re-renders in the new locale (and the MUI theme swaps to
 * the Khmer-first font stack — see theme/ThemeRegistry.tsx).
 *
 * For translations use `useTranslations` from "next-intl" directly.
 */
export function useLocale() {
  const locale = useIntlLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  };

  return { locale, setLocale, languages, isPending };
}

export type { Locale };
