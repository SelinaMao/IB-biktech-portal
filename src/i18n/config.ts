export const locales = ["en", "km"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

/** Cookie carrying the user's locale — read server-side by i18n/request.ts. */
export const LOCALE_COOKIE = "bo-locale";

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}
