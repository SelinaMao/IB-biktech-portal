"use client";

import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import { palette, radius } from "@/theme/palette";
import { showToast } from "@core/components/AppToast";
import { toToastError } from "@/utils/api-error";

import {
  useGetUserLimitsQuery,
  useResetUserLimitRowMutation,
  useUpdateUserLimitsMutation,
} from "../transaction-limit.api";
import {
  limitRowKey,
  type LimitField,
  type LimitFieldSetting,
  type TransactionLimitRow,
  type UpdateLimitRow,
} from "../transaction-limit.types";
import TransactionLimitsGrid, { type LimitDraft } from "./TransactionLimitsGrid";

type Props = {
  userId: string;
  userName?: string;
  canUpdate?: boolean;
  canReset?: boolean;
};

export default function UserLimitsPanel({ userId, userName, canUpdate = false, canReset = false }: Props) {
  const { data, isLoading, isError, refetch } = useGetUserLimitsQuery(userId);
  const [saveLimits, { isLoading: isSaving }] = useUpdateUserLimitsMutation();
  const [resetRow, { isLoading: isResetting }] = useResetUserLimitRowMutation();
  const [draft, setDraft] = useState<LimitDraft>({});

  const isDirty = Object.keys(draft).length > 0;

  // Stable identity: a new function each render would defeat the memo on LimitInputCell.
  const edit = useCallback(
    (rowKey: string, field: LimitField, value: string) =>
      setDraft((current) => ({ ...current, [rowKey]: { ...current[rowKey], [field]: value } })),
    [],
  );

  const save = async () => {
    const rows = data?.rows ?? [];
    const payload: UpdateLimitRow[] = rows
      .filter((row) => draft[limitRowKey(row)])
      .map((row) => {
        const edited = draft[limitRowKey(row)];
        return {
          functionCode: row.functionCode,
          method: row.method,
          maxAmountPerTransaction: setting(edited?.maxAmountPerTransaction),
          maxAmountPerDay: setting(edited?.maxAmountPerDay),
          maxNumberTransactionPerDay: setting(edited?.maxNumberTransactionPerDay),
        };
      });

    if (payload.length === 0) return;

    try {
      await saveLimits({ userId, rows: payload }).unwrap();
      setDraft({});
      showToast("success", {
        title: "Limits saved",
        message: `${userName ?? "This user"} now transacts within the limits you set.`,
      });
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't save these limits"));
    }
  };

  const reset = async (row: TransactionLimitRow) => {
    try {
      await resetRow({ userId, functionCode: row.functionCode, method: row.method }).unwrap();
      setDraft((current) => {
        const next = { ...current };
        delete next[limitRowKey(row)];
        return next;
      });
      showToast("success", { title: "Reset", message: `${row.name} now follows the company limit.` });
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't reset this row"));
    }
  };

  if (isError) {
    return (
      <Alert
        severity="error"
        action={<BaseButton title="Retry" size="small" onClick={() => refetch()} />}
      >
        These limits could not be loaded.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <Alert severity="info">
        A value of 0 means unlimited. Nothing here can go above what your bank allows the company —
        a higher value is rejected, and if the company limit is later lowered, this user follows it down.
      </Alert>

      <TransactionLimitsGrid
        limits={data}
        isLoading={isLoading}
        readOnly={!canUpdate}
        draft={draft}
        onEdit={edit}
        onReset={canReset ? reset : undefined}
        isResetting={isResetting}
      />

      {/* Sticks to the bottom of the viewport while there are unsaved changes: the grid is
          taller than the screen, so a bar at the end of the page cannot be reached without
          scrolling past everything you just edited. */}
      {canUpdate && isDirty && (
        <Paper
          elevation={0}
          sx={{
            position: "sticky",
            bottom: 16,
            zIndex: 2,
            px: 2,
            py: 1.5,
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: `${radius.lg}px`,
            backgroundColor: palette.white,
            boxShadow: "0 6px 20px rgba(15, 23, 42, 0.10)",
          }}
        >
          <Stack direction="row" spacing={1.5} justifyContent="flex-end" alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
              {Object.keys(draft).length} row(s) changed
            </Typography>
            <BaseButton title="Discard" variant="text" onClick={() => setDraft({})} />
            <BaseButton
              title="Save limits"
              variant="contained"
              isLoading={isSaving}
              onClick={save}
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}

/** An untouched field keeps its stored value; a cleared one is left alone rather than zeroed. */
/**
 * What one field is being set to, or null when this save is not changing it.
 *
 * <p>The server takes the three states outright. Clearing the box falls back to the level above;
 * anything typed is this tier's own figure, where a zero blocks the transaction type rather than
 * meaning "no ceiling".
 */
function setting(edited: string | undefined): LimitFieldSetting | null {
  if (edited === undefined) return null;
  if (edited.trim() === "") return { source: "INHERITED", value: null };
  const parsed = Number(edited);
  return Number.isFinite(parsed) ? { source: "OWN", value: parsed } : null;
}
