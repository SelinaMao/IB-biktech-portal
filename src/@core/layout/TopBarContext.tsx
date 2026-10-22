"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export type TopBarBreadcrumb = {
  prefix: string;
  subPrefix: string;
  onBack?: () => void;
  backHref?: string;
};

export type TopBarContextValue = {
  breadcrumb: TopBarBreadcrumb | null;
  setBreadcrumb: (breadcrumb: TopBarBreadcrumb | null) => void;
  clearBreadcrumb: () => void;
};

const TopBarContext = createContext<TopBarContextValue>({
  breadcrumb: null,
  setBreadcrumb: () => {},
  clearBreadcrumb: () => {},
});

export function TopBarProvider({ children }: { children: React.ReactNode }) {
  const [breadcrumb, setBreadcrumb] = useState<TopBarBreadcrumb | null>(null);
  const pathname = usePathname();

  // Reset in-page breadcrumb when navigating between routes
  useEffect(() => {
    setBreadcrumb(null);
  }, [pathname]);

  return (
    <TopBarContext.Provider
      value={{
        breadcrumb,
        setBreadcrumb,
        clearBreadcrumb: () => setBreadcrumb(null),
      }}
    >
      {children}
    </TopBarContext.Provider>
  );
}

export function useTopBar() {
  return useContext(TopBarContext);
}

/**
 * Convenient hook for components/pages to set a topbar breadcrumb on mount
 * and clean it up on unmount or when dependencies change.
 */
export function useTopBarBreadcrumb(breadcrumb: TopBarBreadcrumb | null) {
  const { setBreadcrumb, clearBreadcrumb } = useTopBar();

  useEffect(() => {
    if (breadcrumb) {
      setBreadcrumb(breadcrumb);
      return () => {
        clearBreadcrumb();
      };
    } else {
      clearBreadcrumb();
    }
  }, [breadcrumb?.prefix, breadcrumb?.subPrefix, breadcrumb?.backHref]);
}
