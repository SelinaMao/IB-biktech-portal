"use client";

import { useAppSelector } from "@/store/hooks";

import type { ClientPermission } from "./client-permissions";

/**
 * Whether the signed-in user holds a permission.
 *
 * <p>The answer comes from the permissions their roles grant and nothing else. There is no
 * role-name shortcut: a super admin can do everything because their role grants everything, and
 * the moment a name decides access instead, renaming a role changes who may act.
 */
export function useCan(permission?: ClientPermission | string): boolean {
  return useAppSelector((state) => {
    const user = state.auth.user;
    if (!user) return false;
    if (!permission) return true;
    return user.permissions?.includes(permission) ?? false;
  });
}

/** True when the user holds at least one of these — for a nav section covering several screens. */
export function useCanAny(permissions: readonly string[]): boolean {
  return useAppSelector((state) => {
    const held = state.auth.user?.permissions;
    if (!held) return false;
    return permissions.some((permission) => held.includes(permission));
  });
}
