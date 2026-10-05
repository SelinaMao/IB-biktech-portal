"use client";

import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Box from "@mui/material/Box";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";

import BaseSideDialog from "@core/components/BaseSideDialog";
import { getUserInfoDefaultValues, getUserInfoValuesFromUser, type UserInfoValues } from "../schema/user.schema";
import { useGetUserAccountScopeQuery, useGetUserDetailQuery } from "../user.api";
import type { AdminUser } from "../user.types";

import UserFormAction from "./UserFormAction";

export type UserDetailFormProps = {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
};

/**
 * Read-only user profile, opened by clicking a row in UsersTable. Reuses
 * UserFormAction (same fields/layout as UserFormDialog's edit form) with
 * every field disabled, so the view stays in sync with the edit form.
 */
export default function UserDetailForm({ open, onClose, user }: UserDetailFormProps) {
  const { data: userDetail, isFetching: isLoadingDetail } = useGetUserDetailQuery(
    user?.id ?? "",
    { skip: !open || !user?.id },
  );
  const { data: accountScope } = useGetUserAccountScopeQuery(user?.id ?? "", {
    skip: !open || !user?.id,
  });

  const provider = useForm<UserInfoValues>({
    defaultValues: getUserInfoDefaultValues(),
  });
  const { control, reset } = provider;

  useEffect(() => {
    if (!open) return;
    const accountIds = accountScope?.scopeType === "SELECTED" ? accountScope.accountNumbers : [];
    reset(user ? { ...getUserInfoValuesFromUser(userDetail?.user ?? user), accountIds } : getUserInfoDefaultValues());
  }, [open, user, userDetail, accountScope, reset]);

  return (
    <FormProvider {...provider}>
      <BaseSideDialog
        open={open}
        onClose={onClose}
        title={user ? user.fullName || user.username : "User"}
        icon={<PersonRoundedIcon fontSize="small" />}
        width={700}
      >
        <Box component="form" noValidate>
          <UserFormAction isSubmitting={false} control={control} disabled open={open} />
        </Box>
      </BaseSideDialog>
    </FormProvider>
  );
}
