"use client";

import React from "react";

import { showToast } from "@core/components/AppToast";
import { useAppSelector } from "@/store/hooks";
import { selectAccountsResponse, useListAccountsMutation } from "@/features/account";
import { toToastError } from "@/utils/api-error";
import { mapAccountEntry } from "./transfer.utils";

/**
 * The org's live accounts for a transfer dialog's account pickers. `listAccounts` is a mutation
 * with no fetch-on-mount of its own, so it is fired when the dialog opens and read back from the
 * account slice (see `account/page.tsx`). Accounts already in the slice show at once while the
 * list refreshes; `loading` is only true while there is nothing to show yet.
 */
export function useTransferAccounts(open: boolean) {
  const [listAccounts, { isLoading }] = useListAccountsMutation();

  React.useEffect(() => {
    if (!open) return;
    listAccounts()
      .unwrap()
      .catch((error) => showToast("error", toToastError(error, "Could not load your accounts")));
  }, [open, listAccounts]);

  const response = useAppSelector(selectAccountsResponse);
  const accounts = React.useMemo(() => (response?.accounts ?? []).map(mapAccountEntry), [response]);

  return { accounts, loading: isLoading && accounts.length === 0 };
}
