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
 * Chrome for authenticated portal screens:
 * Full-width top bar across the top.
 * ClientSidebar below on the left (responsive to toggle button in TopBar).
 * Main content scroll area on the right.
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
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", bgcolor: palette.slate[100] }}>
        {/* Full-width TopBar */}
        <PortalTopBar
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          hideAmount={hideAmount}
          onToggleHideAmount={handleToggleHideAmount}
        />

        {/* Content area: Sidebar on left, main content on right */}
        <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
          <ClientSidebar collapsed={collapsed} />

          <Box
            component="main"
            sx={{
              flex: 1,
              minWidth: 0,
              p: { xs: 2.5, sm: 3, md: 4 },
              backgroundColor: palette.slate[100],
            }}
          >
            {children}
          </Box>
        </Box>
      </Box>
    </SessionProvider>
  );
}
