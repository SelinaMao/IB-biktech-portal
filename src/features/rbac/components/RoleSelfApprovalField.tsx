"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";

import { palette } from "@/theme/palette";
import type { RoleWizardValues } from "../rbac.types";

export type RoleSelfApprovalFieldProps = {
  control: Control<RoleWizardValues>;
  disabled?: boolean;
  /** Whether this role signs anything at all — the switch means nothing if it does not. */
  signsSomething?: boolean;
};

/**
 * Whether a holder may sign a request they raised themselves.
 *
 * <p>Off is maker-checker: the person who asks is not the person who agrees, which is the whole
 * point of an approval. On is for the company that is one person, where insisting on a second
 * signature means nothing can ever be done.
 *
 * <p>It is not a way round the rules. The engine still refuses a self-signature on a change that
 * raises the signer's own authority, whatever this says.
 */
export default function RoleSelfApprovalField({
  control,
  disabled,
  signsSomething = true,
}: RoleSelfApprovalFieldProps) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          p: 6,
          border: `1px solid ${palette.slate[200]}`,
          borderRadius: "12px",
          bgcolor: palette.slate[50],
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Self-approval</Typography>
          <Typography sx={{ fontSize: 12, color: palette.slate[400] }}>
            Whether someone with this role may approve a request they raised themselves. Leave it
            off unless one person is the whole company.
          </Typography>
        </Box>

        <Controller
          name="allowSelfApproval"
          control={control}
          render={({ field }) => (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
              <Box
                component="button"
                type="button"
                role="switch"
                aria-checked={Boolean(field.value)}
                aria-label="Allow self-approval"
                disabled={disabled}
                onClick={() => field.onChange(!field.value)}
                sx={{
                  width: 40,
                  height: 22,
                  borderRadius: "999px",
                  border: 0,
                  p: "3px",
                  cursor: disabled ? "default" : "pointer",
                  bgcolor: field.value ? palette.navy[800] : palette.slate[300],
                  display: "flex",
                  justifyContent: field.value ? "flex-end" : "flex-start",
                  transition: "background-color 150ms ease",
                }}
              >
                <Box
                  sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: palette.white }}
                />
              </Box>
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: field.value ? palette.warning.main : palette.slate[400],
                }}
              >
                {field.value ? "Allowed" : "Not allowed"}
              </Typography>
            </Stack>
          )}
        />
      </Stack>

      <Controller
        name="allowSelfApproval"
        control={control}
        render={({ field }) =>
          field.value ? (
            <Alert severity="warning" variant="outlined">
              A holder can raise a request and sign it alone. A change that raises their own
              authority is still refused.
            </Alert>
          ) : signsSomething ? (
            <></>
          ) : (
            <Alert severity="info" variant="outlined">
              This role signs nothing yet, so the setting has no effect until it is given an
              Approve verb.
            </Alert>
          )
        }
      />
    </Stack>
  );
}
