'use client';

import { AuthState } from "@/features/auth/auth.slice";
import { useAppSelector } from "./hooks";

/** get auth state */
export function useAuthSelect(): AuthState {
  return useAppSelector((s: any) => s.auth);
}
