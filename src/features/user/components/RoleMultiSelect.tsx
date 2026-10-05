"use client";

import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { useListRolesQuery } from "@/features/rbac";

/**
 * Assigns RBAC roles to a user. Value is the list of role NAMES (matching
 * AdminUser.roles and the create/update payloads). Options come from the RBAC
 * role list — a single large page is enough for the admin surface.
 */
export type RoleMultiSelectProps = {
  value: string[];
  onChange: (roles: string[]) => void;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
};

export default function RoleMultiSelect({
  value,
  onChange,
  disabled = false,
  error = false,
  helperText,
}: RoleMultiSelectProps) {
  const { data, isLoading } = useListRolesQuery();
  const options = (data ?? []).map((role) => role.name);

  // Keep any already-assigned role that isn't in the fetched options (e.g. a
  // legacy or system role) so it isn't silently dropped on save.
  const merged = Array.from(new Set([...options, ...value]));

  return (
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={merged}
      value={value}
      onChange={(_e, next) => onChange(next)}
      disabled={disabled}
      loading={isLoading}
      renderTags={(tags, getTagProps) =>
        tags.map((tag, index) => {
          const { key, ...chipProps } = getTagProps({ index });
          return <Chip key={key} label={tag} size="small" {...chipProps} />;
        })
      }
      renderOption={(props, option) => {
        const { key, ...liProps } = props as { key: string } & Record<
          string,
          unknown
        >;
        return (
          <li key={key} {...liProps}>
            <Typography variant="body2">{option}</Typography>
          </li>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={value.length === 0 ? "Assign roles…" : undefined}
          error={error}
          helperText={helperText}
        />
      )}
    />
  );
}
