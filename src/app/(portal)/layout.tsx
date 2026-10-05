"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { toggleHideAmount } from "@/store/global/global.slice";

import { ClientSidebar, PortalTopBar } from "@core/layout";
import { palette } from "@/theme/palette";
import { SessionProvider } from "@/features/auth";
import { useGetMetaQuery } from "@/features/meta";
import { SIDEBAR_COLLAPSED_KEY } from "@/theme/layout";
import React from "react";

/**
 * Chrome for every authenticated screen: collapsible navy sidebar + white
 * top bar. SessionProvider restores the Redux session mirror from the
 * httpOnly cookie (via /me) after a full page load. Collapsed state is
 * remembered in localStorage (read after mount to avoid SSR hydration
 * mismatch). useGetMetaQuery is warmed here so every dropdown category is
 * cached before any screen needs it; later calls elsewhere reuse this entry.
 */
export default function PortalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [collapsed, setCollapsed] = useState(false);
  const dispatch = useAppDispatch();
  const hideAmount = useAppSelector((s) => s.global.hideAmount);
  const handleToggleHideAmount = () => dispatch(toggleHideAmount());
  useGetMetaQuery();
  useEffect(() => {
    setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true");
  }, []);

  const toggleSidebar = () =>
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(!prev));
      return !prev;
    });

  return (
    <SessionProvider>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <ClientSidebar collapsed={collapsed} />

        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0, // allow content (tables) to shrink instead of overflowing
            // columnGap: 2,
            // rowGap: 2
          }}
        >
          <PortalTopBar collapsed={collapsed} onToggleSidebar={toggleSidebar} hideAmount={hideAmount}
            onToggleHideAmount={handleToggleHideAmount} />

          {/* Tinted ground so cards and tables read as surfaces on it. slate[100] is the
              app background the palette already names — it was never applied. */}
          <Box component="main" sx={{ flex: 1, p: 6, backgroundColor: palette.slate[100] }}>
            {children}
          </Box>
        </Box>
      </Box>
    </SessionProvider>
  );
}
