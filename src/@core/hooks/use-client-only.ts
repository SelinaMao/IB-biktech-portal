'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Custom hook that ensures the component renders only on the client-side.
 * This avoids hydration issues in Next.js.
 * `useSyncExternalStore` returns the server snapshot (false) during SSR and
 * hydration, then the client snapshot (true) — no cascading setState needed.
 * @returns {boolean} - True if the component is running on the client-side, false if server-side.
 */
export function useClientOnly(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}
