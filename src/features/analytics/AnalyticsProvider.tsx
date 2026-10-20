"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import { useAppSelector } from "@/store/hooks";
import { identifyUser, initAnalytics, setUserProperties, trackPageView } from "./analytics";

/**
 * Loads Google Analytics and keeps it in step with the app: who is signed in, which language the
 * portal is in, and a page view per screen (App Router navigations never reload the page, so GA
 * can't see them by itself). Mounted once in the root layout, inside StoreProvider.
 *
 * `measurementId` comes from the server's GA_MEASUREMENT_ID at request time, so one image can
 * report to a different property per environment. Without it nothing is loaded.
 */
export default function AnalyticsProvider({
  measurementId,
  debug = false,
}: Readonly<{ measurementId?: string; debug?: boolean }>) {
  const pathname = usePathname();
  const locale = useLocale();
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id;
  const roleKey = user?.roles.map((role) => role.code).join(",");

  // Effects run in order: start gtag, say who the user is, then count the page — so the first
  // page view after sign-in already carries the user.
  useEffect(() => {
    initAnalytics({ measurementId, debug });
  }, [measurementId, debug]);

  useEffect(() => {
    identifyUser(userId ? { id: userId, roles: user?.roles ?? [] } : null);
    // The user object is replaced on every /me refetch; only a different user or role set matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, roleKey]);

  useEffect(() => {
    setUserProperties({ ui_language: locale });
  }, [locale]);

  useEffect(() => {
    trackPageView();
  }, [pathname]);

  if (!measurementId) return null;

  return (
    <Script
      id="google-analytics"
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
    />
  );
}
