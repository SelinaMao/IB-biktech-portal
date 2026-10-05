"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import RestartAltRoundedIcon from "@mui/icons-material/RestartAltRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useCallback, useMemo, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import { BaseInput } from "@core/form";
import { palette, radius } from "@/theme/palette";

import LimitAmountField, { displayLimit } from "./LimitAmountField";
import LimitChainStrip from "./LimitChainStrip";

import {
  limitRowKey,
  type LimitField,
  type OwnerLimits,
  type TransactionLimitRow,
} from "../transaction-limit.types";

export { displayLimit };

/** Keyed by limitRowKey: one entry per function and method. */
export type LimitDraft = Record<string, Partial<Record<LimitField, string>>>;

type Props = {
  limits?: OwnerLimits;
  isLoading?: boolean;
  /** Company limits are set by the bank, so that grid is always read-only. */
  readOnly?: boolean;
  draft?: LimitDraft;
  onEdit?: (rowKey: string, field: LimitField, value: string) => void;
  onReset?: (row: TransactionLimitRow) => void;
  isResetting?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

const SRC_FIELD: Record<LimitField, keyof TransactionLimitRow> = {
  maxAmountPerTransaction: "srcMaxAmountPerTransaction",
  maxAmountPerDay: "srcMaxAmountPerDay",
  maxNumberTransactionPerDay: "srcMaxNumberTransactionPerDay",
};

const CEILING_FIELD: Record<LimitField, keyof TransactionLimitRow> = {
  maxAmountPerTransaction: "parentMaxAmountPerTransaction",
  maxAmountPerDay: "parentMaxAmountPerDay",
  maxNumberTransactionPerDay: "parentMaxNumberTransactionPerDay",
};

const FIELDS: { key: LimitField; label: string; kind: "amount" | "count" }[] = [
  { key: "maxAmountPerTransaction", label: "Maximum per transaction", kind: "amount" },
  { key: "maxAmountPerDay", label: "Maximum per day", kind: "amount" },
  { key: "maxNumberTransactionPerDay", label: "Transactions per day", kind: "count" },
];

/**
 * One transaction type at a time: the catalogue on the left, the figures on the right.
 *
 * <p>Presentational — the draft and the save live in UserLimitsPanel. Only the search and the
 * selected type are held here, because neither matters outside this screen.
 */
export default function TransactionLimitsGrid({
  limits,
  isLoading,
  readOnly = false,
  draft = {},
  onEdit,
  onReset,
  isResetting,
  emptyTitle = "No transaction types",
  emptyDescription = "Your bank has not configured any transaction types yet.",
}: Props) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState("");

  const rows = useMemo(() => limits?.rows ?? [], [limits]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.name, row.code, row.functionCode].some((value) => value?.toLowerCase().includes(query)),
    );
  }, [rows, search]);

  const selected = rows.find((row) => limitRowKey(row) === selectedKey) ?? visible[0] ?? rows[0];

  const valueOf = useCallback(
    (row: TransactionLimitRow, field: LimitField): string => {
      const edited = draft[limitRowKey(row)]?.[field];
      if (edited !== undefined) return edited;
      const stored = row[field] as number | null;
      return stored === null || stored === undefined ? "" : String(stored);
    },
    [draft],
  );

  const edit = useCallback(
    (rowKey: string, field: LimitField, value: string) => onEdit?.(rowKey, field, value),
    [onEdit],
  );

  const isOwn = (row: TransactionLimitRow, field: LimitField) =>
    (row[SRC_FIELD[field]] as string) === "OWN";

  if (!isLoading && rows.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${palette.slate[200]}`,
          borderRadius: `${radius.xl}px`,
          p: 6,
          textAlign: "center",
        }}
      >
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {emptyTitle}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {emptyDescription}
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: "stretch" }}>
      {/* Catalogue. Searchable because the list grows every time the bank adds a type. */}
      <Paper
        elevation={0}
        sx={{
          width: { xs: "100%", md: 320 },
          flexShrink: 0,
          border: `1px solid ${palette.slate[200]}`,
          borderRadius: `${radius.xl}px`,
          overflow: "hidden",
          alignSelf: "flex-start",
        }}
      >
        <Box sx={{ p: 1.5 }}>
          <BaseInput
            value={search}
            placeholder="Search transaction types"
            onChange={(event) => setSearch(event.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon fontSize="small" sx={{ color: palette.slate[400] }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>
        <Divider />

        {isLoading ? (
          <Stack spacing={1} sx={{ p: 1.5 }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} variant="rounded" height={52} />
            ))}
          </Stack>
        ) : visible.length === 0 ? (
          <Box sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Nothing matches “{search}”.
            </Typography>
          </Box>
        ) : (
          <List disablePadding sx={{ maxHeight: 560, overflowY: "auto" }}>
            {visible.map((row) => {
              const rowKey = limitRowKey(row);
              const active = selected !== undefined && limitRowKey(selected) === rowKey;
              const pinned = FIELDS.some((field) => isOwn(row, field.key));
              const changed = Boolean(draft[rowKey]);
              return (
                <ListItemButton
                  key={rowKey}
                  selected={active}
                  onClick={() => setSelectedKey(rowKey)}
                  sx={{
                    display: "block",
                    py: 1.25,
                    borderLeft: `3px solid ${
                      active ? palette.primary.main : changed ? palette.warning.main : "transparent"
                    }`,
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                      {row.name}
                    </Typography>
                    {changed && (
                      <Chip
                        size="small"
                        color="warning"
                        label="Changed"
                        sx={{ height: 18, fontSize: 10 }}
                      />
                    )}
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", justifyContent: "space-between", mt: 0.25 }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
                    >
                      {displayLimit(row.maxAmountPerTransaction)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: palette.slate[400] }} noWrap>
                      {pinned ? "Set for this user" : "Follows company"}
                    </Typography>
                  </Stack>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Paper>

      {/* Detail for the selected type. */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          minWidth: 0,
          border: `1px solid ${palette.slate[200]}`,
          borderRadius: `${radius.xl}px`,
          p: 3,
        }}
      >
        {isLoading || !selected ? (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={32} width="40%" />
            <Skeleton variant="rounded" height={96} />
            <Skeleton variant="rounded" height={240} />
          </Stack>
        ) : (
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6">{selected.name}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {selected.code}
                </Typography>
              </Box>
              {!readOnly && onReset && FIELDS.some((field) => isOwn(selected, field.key)) && (
                <BaseButton
                  title="Follow the company limit"
                  size="small"
                  startIcon={<RestartAltRoundedIcon fontSize="small" />}
                  isLoading={isResetting}
                  onClick={() => onReset(selected)}
                />
              )}
            </Stack>

            <LimitChainStrip limits={limits} ownerLabel="This user" rowKey={limitRowKey(selected)} />

            {selected.validatePerTransactionType && (
              <Alert severity="info">
                Each row inside the file is checked against its own transaction type, so the figures
                below are not applied to the file as a whole.
              </Alert>
            )}

            <Divider />

            {readOnly ? (
              <Stack spacing={2}>
                {FIELDS.map((field) => (
                  <Stack key={field.key} spacing={0.25}>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {field.label}
                    </Typography>
                    <Typography variant="h6" sx={{ fontVariantNumeric: "tabular-nums" }}>
                      {displayLimit(selected[field.key] as number | null)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                {FIELDS.map((field) => (
                  <LimitAmountField
                    key={field.key}
                    rowKey={limitRowKey(selected)}
                    field={field.key}
                    label={field.label}
                    kind={field.kind}
                    value={valueOf(selected, field.key)}
                    disabled={false}
                    isOwn={isOwn(selected, field.key)}
                    followsLabel="Follows company"
                    ceiling={selected[CEILING_FIELD[field.key]] as number | null}
                    onEdit={edit}
                  />
                ))}
              </Stack>
            )}

            <Divider />

            <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  Minimum, USD
                </Typography>
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {displayLimit(selected.minTransactionAmount)}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
                  Minimum, KHR
                </Typography>
                <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {displayLimit(selected.minTransactionAmountKhr)}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: palette.slate[400], maxWidth: 320 }}>
                Minimums are set by your bank on the transaction type and are the same for everyone.
              </Typography>
            </Stack>
          </Stack>
        )}
      </Paper>
    </Stack>
  );
}
