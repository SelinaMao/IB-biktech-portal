'use client';

import { useMeQuery } from "@/features/auth";


/**
 * Use can
 * @param {*} permission
 * @returns boolean
 */
export default function useCan(permissions: string[]) {

  const meQueryResult = useMeQuery(undefined);

  const statusPermission = (meQueryResult.data?.permissions || []).some((p: string) =>
    permissions.includes(p),
  );
  return statusPermission;
}
