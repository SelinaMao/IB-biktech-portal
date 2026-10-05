"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import type { Control } from "react-hook-form";
import { useController } from "react-hook-form";

import { ControlledBaseInput, ControlledBaseMultiSelect, ControlledBaseSelect } from "@core/form";
import type { UserInfoValues } from "../schema/user.schema";
import { ACCESS_LEVEL_OPTIONS } from "../user.types";
import { useListOrgRolesQuery } from "@/features/rbac";
import { useGetMetaQuery } from "@/features/meta";
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
};

export default function UserFormAction({
  isSubmitting,
  control,
  disabled,
  open = true,
  canDeactivate = true,
  isEdit = false,
}: UserFormActionProps) {
  const { data: orgRoles, isFetching: isLoadingRoles } = useListOrgRolesQuery(undefined, {
    // skip: !open,
  });
  const { data: meta } = useGetMetaQuery();

  const roleOptions = (orgRoles ?? []).map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const accountOptions = (meta?.accounts ?? []).map((account) => ({
    value: account.accountNumber,
    label: account.accountName,
    description: account.accountNumber,
  }));
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
            placeholder="Select a role"
            disabled={isSubmitting || disabled || isLoadingRoles}
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
        placeholder="Select Account List"
        isRequired
        options={accountOptions}
        disabled={isSubmitting || disabled}
      />
      {/* <LimitParametersSection control={control} isSubmitting={isSubmitting} disabled={disabled} /> */}
    </Stack>
  );
}
