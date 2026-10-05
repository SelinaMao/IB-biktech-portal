"use client";

import * as React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { createAppTheme } from "./theme";

const theme = createAppTheme();

/**
 * Client boundary that provides emotion cache (SSR-safe via the Next.js App
 * Router integration) and the MUI theme to the whole app.
 *
 * `enableCssLayer` makes emotion inject MUI styles into the `mui` CSS layer.
 * Combined with the layer order declared in app/globals.css, this lets Tailwind
 * utility classes win over MUI defaults without `!important` — see globals.css.
 */
export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
