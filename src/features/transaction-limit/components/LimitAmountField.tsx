"use client";

import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { memo, useState } from "react";

import { BaseInput } from "@core/form";

import type { LimitField } from "../transaction-limit.types";

type Props = {
  /** limitRowKey of the row being edited, handed back on every edit. */
  rowKey: string;
  field: LimitField;
  label: string;
  /** "amount" gets a USD prefix and separators; "count" is a plain integer. */
  kind: "amount" | "count";
  value: string;
  disabled: boolean;
  isOwn: boolean;
  followsLabel: string;
  /** The company ceiling. A corporate admin cannot raise it themselves. */
  ceiling: number | null;
  onEdit: (rowKey: string, field: LimitField, value: string) => void;
};

const groupDigits = (value: number) =>
  value.toLocaleString(undefined, { maximumFractionDigits: 2 });

/** 0 is the stored convention for "no limit". Never show a bare zero — it reads as "nothing". */
export const displayLimit = (value: number | null | undefined) =>
  value === null || value === undefined || value === 0 ? "Unlimited" : groupDigits(value);

/**
 * One figure, with the separators and the unit that make a mistyped zero obvious.
 *
 * <p>Grouped while you are not in the field, raw digits while you are — typing into a string
 * with commas in it fights the caret. Memoised so a keystroke re-renders one field rather than
 * every field on the screen.
 */
function LimitAmountField({
  rowKey,
  field,
  label,
  kind,
  value,
  disabled,
  isOwn,
  followsLabel,
  ceiling,
  onEdit,
}: Props) {
  const [focused, setFocused] = useState(false);

  const entered = value.trim() === "" ? null : Number(value);
  const isNumeric = entered !== null && Number.isFinite(entered);
  const overCeiling =
    ceiling !== null && ceiling !== 0 && isNumeric && entered !== 0 && entered! > ceiling;

  // Raw while typing so the caret behaves; grouped once the field is left.
  const shown = focused
    ? value
    : isNumeric
      ? displayLimit(entered)
      : value;

  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {label}
        </Typography>
        <Chip
          size="small"
          color={isOwn ? "primary" : "default"}
          label={isOwn ? "Set here" : followsLabel}
          sx={{ height: 20, fontSize: 11 }}
        />
      </Stack>

      <BaseInput
        value={shown}
        disabled={disabled}
        inputMode="decimal"
        placeholder="0 = unlimited"
        error={overCeiling}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(event) => onEdit(rowKey, field, event.target.value)}
        slotProps={{
          input: {
            startAdornment:
              kind === "amount" ? (
                <InputAdornment position="start">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    USD
                  </Typography>
                </InputAdornment>
              ) : undefined,
            endAdornment:
              kind === "count" ? (
                <InputAdornment position="end">
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    txns
                  </Typography>
                </InputAdornment>
              ) : undefined,
          },
        }}
      />

      <Typography
        variant="caption"
        sx={{ color: overCeiling ? "error.main" : "text.secondary" }}
      >
        {overCeiling
          ? `Your company allows ${displayLimit(ceiling)} — ask your bank to raise it`
          : ceiling !== null && ceiling !== undefined
            ? `Your company allows ${displayLimit(ceiling)}`
            : "No ceiling set for this type"}
      </Typography>
    </Stack>
  );
}

export default memo(LimitAmountField);
