"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo } from "react";
import type { Control } from "react-hook-form";
import { useController, useWatch } from "react-hook-form";

import { ControlledBaseInput, ControlledBaseMultiSelect, ControlledBaseSelect } from "@core/form";
import type { UserInfoValues } from "../schema/user.schema";
import { ACCESS_LEVEL_OPTIONS, MANAGE_ACCOUNT_OPTIONS, type AdminUser } from "../user.types";
import { useListRolesQuery } from "@/features/rbac";
import { useMeQuery } from "@/features/auth";
import { useGetMetaQuery } from "@/features/meta";
import { selectAccountsResponse, useListAccountsMutation } from "@/features/account";
import { useAppSelector } from "@/store/hooks";
import { formatAccountNumber } from "@/utils/format-account-number";
import { font, palette } from "@/theme/palette";
import { PHONE_DIAL_CODE } from "@/utils/phone";

import LimitParametersSection from "./LimitParametersSection";

export type UserFormActionProps = {
  isSubmitting: boolean;
  control: Control<UserInfoValues>;
  disabled?: boolean;
  /** Whether the parent dialog is open — role options are only fetched while open. */
  open?: boolean;
  /** Gates the Active/Inactive status switch specifically. Defaults to true. */
  canDeactivate?: boolean;
  /** Editing an existing person: the login ID is shown but never editable. */
  isEdit?: boolean;
  /** Current user being viewed/edited, so their assigned role can be pre-filled seamlessly. */
  user?: AdminUser | null;
  /** Available roles in the organization passed from the parent users view. */
  availableRoles?: { id: string; name: string }[];
};

export default function UserFormAction({
  isSubmitting,
  control,
  disabled,
  open = true,
  canDeactivate = true,
  isEdit = false,
  user = null,
  availableRoles = [],
}: UserFormActionProps) {
  const { data: meData } = useMeQuery(undefined);
  const {
    data: rolesData,
    isFetching: isLoadingRoles,
    isError: isRolesError,
    refetch: refetchRoles,
  } = useListRolesQuery(undefined, {
    skip: !open,
    refetchOnMountOrArgChange: true,
  });
  const { data: meta } = useGetMetaQuery();

  const rolesList = Array.isArray(rolesData)
    ? rolesData
    : Array.isArray((rolesData as any)?.content)
      ? (rolesData as any).content
      : Array.isArray((rolesData as any)?.roles)
        ? (rolesData as any).roles
        : [];

  const roleMap = new Map<string, string>();

  // 1. Roles returned from RBAC roles endpoint
  for (const role of rolesList) {
    if (role) {
      const id = String(role.id ?? role.roleId ?? role.code ?? "");
      const label = String(role.name ?? role.roleName ?? role.code ?? id);
      if (id && label) roleMap.set(id, label);
    }
  }

  // 2. Roles gathered across organization users
  for (const r of availableRoles ?? []) {
    const roleId = String((r as any)?.id ?? (r as any)?.roleId ?? "");
    const roleName = String(r?.name ?? (r as any)?.roleName ?? "");
    if (roleId && roleName && !roleMap.has(roleId)) {
      roleMap.set(roleId, roleName);
    }
  }

  // 3. Roles from current user session
  for (const r of (meData?.roles ?? []) as any[]) {
    const roleId = r?.id != null ? String(r.id) : "";
    const roleName = String(r?.name ?? r?.code ?? "");
    if (roleId && roleName && !roleMap.has(roleId)) {
      roleMap.set(roleId, roleName);
    }
  }

  // 4. Ensure any roles assigned to the user being edited are present
  const assignedRoles = user?.roles ?? [];
  for (const assigned of assignedRoles) {
    const roleId = String((assigned as any)?.id ?? (assigned as any)?.roleId ?? "");
    const roleName = String(assigned?.name ?? (assigned as any)?.roleName ?? (assigned as any)?.code ?? "");
    if (roleId && roleName && !roleMap.has(roleId)) {
      roleMap.set(roleId, roleName);
    }
  }

  const roleOptions: { value: string; label: string }[] = Array.from(roleMap.entries()).map(
    ([value, label]) => ({
      value,
      label,
    }),
  );

  const rolePlaceholder = roleOptions.length > 0
    ? "Select a role"
    : isLoadingRoles
      ? "Loading roles..."
      : isRolesError
        ? "Failed to load roles (click to retry)"
        : "No roles available";

  const [listAccounts, { isLoading: isLoadingAccounts }] = useListAccountsMutation();
  const accountsData = useAppSelector(selectAccountsResponse);

  useEffect(() => {
    if (open) {
      listAccounts().catch(() => {});
    }
  }, [open, listAccounts]);

  const selectedAccountIds = useWatch({ control, name: "accountIds" }) ?? [];

  const accountOptions = useMemo(() => {
    const accountMap = new Map<string, { label: React.ReactNode; description?: React.ReactNode }>();

    // 1. Live accounts from account-service
    const liveAccounts = accountsData?.accounts ?? [];
    for (const acc of liveAccounts) {
      const accNum = String(acc?.accountNumber || acc?.id || "").trim();
      if (accNum) {
        const name = acc.accountName || acc.accountClassDescription || "Account";
        const formattedNum = formatAccountNumber(accNum) || accNum;
        const ccy = acc.ccy ? ` • ${acc.ccy}` : "";
        accountMap.set(accNum, {
          label: name,
          description: `${formattedNum}${ccy}`,
        });
      }
    }

    // 2. Meta accounts (if provided by meta lookup)
    const metaAccounts = Array.isArray((meta as any)?.accounts)
      ? (meta as any).accounts
      : Array.isArray((meta as any)?.account)
        ? (meta as any).account
        : [];
    for (const acc of metaAccounts) {
      const accNum = String(acc?.accountNumber || acc?.id || "").trim();
      if (accNum && !accountMap.has(accNum)) {
        const name = acc.accountName || acc.accountClassDescription || "Account";
        const formattedNum = formatAccountNumber(accNum) || accNum;
        const ccy = acc.ccy ? ` • ${acc.ccy}` : "";
        accountMap.set(accNum, {
          label: name,
          description: `${formattedNum}${ccy}`,
        });
      }
    }

    // 3. Keep any accounts currently assigned to the user being edited/viewed
    for (const accNum of selectedAccountIds) {
      const cleanNum = String(accNum).trim();
      if (cleanNum && !accountMap.has(cleanNum)) {
        accountMap.set(cleanNum, {
          label: `Account ${formatAccountNumber(cleanNum) || cleanNum}`,
          description: formatAccountNumber(cleanNum) || cleanNum,
        });
      }
    }

    // 4. Fallback to default account options if backend returns no accounts
    if (accountMap.size === 0) {
      for (const opt of MANAGE_ACCOUNT_OPTIONS) {
        accountMap.set(opt.id, {
          label: opt.type,
          description: opt.number,
        });
      }
    }

    return Array.from(accountMap.entries()).map(([value, { label, description }]) => ({
      value,
      label,
      description,
    }));
  }, [accountsData?.accounts, meta, selectedAccountIds]);

  const accountPlaceholder =
    isLoadingAccounts && accountOptions.length === 0
      ? "Loading accounts..."
      : "Select Account List";
  const {
    field: { value: statusValue, onChange: onStatusChange },
  } = useController({ name: "status", control });

  return (
    <Stack spacing={5}>
      <Typography sx={{ fontSize: font.size.md, fontWeight: font.weight.medium }}>User Info</Typography>
      <Stack direction="row" spacing={3}>
        <Box sx={{ flex: 1 }}>
          <ControlledBaseInput
            name="firstName"
            control={control}
            label="First Name"
            isRequired
            placeholder="e.g. Bopha"
            disabled={isSubmitting || disabled}
          />
        </Box>
        <Box sx={{ flex: 1 }}>
          <ControlledBaseInput
            name="lastName"
            control={control}
            label="Last Name"
            isRequired
            placeholder="e.g. Nhem"
            disabled={isSubmitting || disabled}
          />
        </Box>
      </Stack>
      <ControlledBaseInput
        name="username"
        control={control}
        label="Login ID"
        isRequired
        placeholder="e.g. bopha.nhem"
        // Permanent: it appears in audit trails and approval records, so changing it would
        // rewrite who did what.
        disabled={isSubmitting || disabled || isEdit}
        helperText={
          isEdit
            ? "A login ID can never be changed."
            : "At least 6 characters. Letters, digits, full stops and underscores."
        }
      />
      <ControlledBaseInput
        name="email"
        control={control}
        label="Email"
        type="email"
        placeholder="user@example.com"
        helperText="Optional. The password always goes by text message."
        disabled={isSubmitting || disabled}
      />
      <ControlledBaseInput
        name="phone"
        control={control}
        label="Phone"
        isRequired
        prefix={PHONE_DIAL_CODE}
        placeholder="e.g. 12 345 678"
        slotProps={{ htmlInput: { inputMode: "tel" } }}
        disabled={isSubmitting || disabled}
      />
      <Stack direction="row" spacing={3} sx={{ alignItems: "flex-end" }}>
        <Box sx={{ flex: 1 }}>
          <ControlledBaseSelect
            name="roleId"
            control={control}
            label="Role"
            isRequired
            options={roleOptions}
            placeholder={rolePlaceholder}
            helperText={
              isRolesError && roleOptions.length === 0
                ? "Could not connect to backend roles service. Click to retry."
                : undefined
            }
            disabled={isSubmitting || disabled || (isLoadingRoles && roleOptions.length === 0)}
            onClick={() => {
              if (isRolesError) {
                refetchRoles();
              }
            }}
          />
        </Box>
        {/* <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexShrink: 0, pb: 1 }}>
          <Typography sx={{ fontSize: font.size.base, color: palette.slate[950] }}>Status</Typography>
          <Switch
            checked={Boolean(statusValue)}
            onChange={(event) => onStatusChange(event.target.checked)}
            disabled={isSubmitting || disabled || !canDeactivate}
          />
          <Typography
            sx={{
              fontSize: font.size.sm,
              fontWeight: font.weight.medium,
              color: statusValue ? palette.success.main : palette.slate[400],
            }}
          >
            {statusValue ? "Active" : "Inactive"}
          </Typography>
        </Stack> */}
      </Stack>
      {/* <ControlledBaseSelect
        name="accessLevel"
        control={control}
        label="Access Level"
        options={ACCESS_LEVEL_OPTIONS}
        placeholder="Select access level"
        disabled={isSubmitting || disabled}
      /> */}
      <ControlledBaseMultiSelect
        name="accountIds"
        control={control}
        label="Manage Account"
        placeholder={accountPlaceholder}
        isRequired
        options={accountOptions}
        disabled={isSubmitting || disabled}
      />
      {/* <LimitParametersSection control={control} isSubmitting={isSubmitting} disabled={disabled} /> */}
    </Stack>
  );
}
