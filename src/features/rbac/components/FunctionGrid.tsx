"use client";

import LockRoundedIcon from "@mui/icons-material/LockRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import InputAdornment from "@mui/material/InputAdornment";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import { palette, radius } from "@/theme/palette";

import { useBusinessFunctionsQuery, useRoleGridQuery } from "../rbac.api";
import type { FunctionVerb } from "../rbac.types";

/** The order a row reads best in, whichever verbs a function declares. */
const VERB_ORDER: FunctionVerb[] = [
  "INITIATE", "CREATE", "VIEW", "EDIT", "DISABLE", "CANCEL", "DELETE", "APPROVE",
];

const VERB_LABEL: Record<FunctionVerb, string> = {
  INITIATE: "Initiate", CREATE: "Create", VIEW: "View", EDIT: "Edit",
  DISABLE: "Disable", CANCEL: "Cancel", DELETE: "Delete", APPROVE: "Approve",
};

type Cell = { verb: FunctionVerb; permissionCode: string | null; approvalRequired: boolean };
type Row = { code: string; name: string; moduleCode: string; needsApproval: boolean; cells: Cell[] };

export type FunctionGridProps = {
  /** Codes currently ticked. The form still submits permission codes. */
  value: string[];
  onChange: (next: string[]) => void;
  /** Pre-fills from a saved role; omit on create. */
  roleId?: string;
  disabled?: boolean;
};

/**
 * The role grid: one row per function, one cell per verb it declares.
 *
 * <p>Approve is an ordinary verb here, not a separate screen and not a stored flag — a role signs
 * a function because that box is ticked, which is why the count below is derived rather than read.
 *
 * <p>The grid only offers what this customer may actually hold: the server narrows it to the
 * organization's permission ceiling, so there is no tick the save would then refuse.
 */
export default function FunctionGrid({ value, onChange, roleId, disabled }: FunctionGridProps) {
  const catalogue = useBusinessFunctionsQuery();
  const grid = useRoleGridQuery(roleId ?? "", { skip: !roleId });
  const [filter, setFilter] = useState("");

  const rows: Row[] = useMemo(() => {
    const source = grid.data?.functions?.length
      ? grid.data.functions.map((f) => ({
          code: f.code,
          name: f.name,
          moduleCode: f.moduleCode,
          needsApproval: f.needsApproval,
          cells: f.verbs.map((v) => ({
            verb: v.verb,
            permissionCode: v.permissionCode,
            approvalRequired: v.approvalRequired,
          })),
        }))
      : (catalogue.data ?? [])
          // A new role has no grid yet; the catalogue stands in, corporate side only.
          .filter((f) => f.active && (f.channel === "CORPORATE" || f.channel === "BOTH"))
          .map((f) => ({
            code: f.code,
            name: f.name,
            moduleCode: f.moduleCode,
            needsApproval: f.needsApproval,
            cells: f.verbs.map((v) => ({
              verb: v.verb,
              permissionCode: v.permissionCode,
              approvalRequired: v.approvalRequired,
            })),
          }));

    return source.map((row) => ({
      ...row,
      cells: [...row.cells].sort((a, b) => VERB_ORDER.indexOf(a.verb) - VERB_ORDER.indexOf(b.verb)),
    }));
  }, [grid.data, catalogue.data]);

  // Thirty-odd functions is too many to scroll for one. Matching the code as well as the name
  // means "LIMIT" finds the limit rows even when someone is thinking in codes.
  const visible = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.code.toLowerCase().includes(needle) ||
        row.moduleCode.toLowerCase().includes(needle),
    );
  }, [rows, filter]);

  const byModule = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const row of visible) map.set(row.moduleCode, [...(map.get(row.moduleCode) ?? []), row]);
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  const selected = useMemo(() => new Set(value), [value]);

  /**
   * Permissions the save adds on its own, because the ticks above cannot work without them.
   *
   * Raising an approval request is how an approval-required verb is used, and the inbox is where
   * a signature is given — neither is an extra power to choose, so neither is shown as a choice.
   * The server derives the same set; this only makes it visible.
   */
  const derived = useMemo(() => {
    const cells = rows.flatMap((row) => row.cells);
    const tickedApprovalRequired = cells.some(
      (cell) => cell.approvalRequired && cell.permissionCode && selected.has(cell.permissionCode),
    );
    const tickedApprove = cells.some(
      (cell) => cell.verb === "APPROVE" && cell.permissionCode && selected.has(cell.permissionCode),
    );
    const codes = new Set<string>();
    if (tickedApprovalRequired) codes.add("WORKFLOW:REQUEST:INITIATE");
    if (tickedApprove) {
      // ApprovalCompanions on the server grants the same three.
      codes.add("WORKFLOW:REQUEST:VIEW");
      codes.add("WORKFLOW:TASK:VIEW");
      codes.add("WORKFLOW:TASK:APPROVE");
    }
    return codes;
  }, [rows, selected]);

  const signedCount = rows.filter((r) =>
    r.cells.some((c) => c.verb === "APPROVE" && c.permissionCode && selected.has(c.permissionCode)),
  ).length;
  const functionCount = rows.filter((r) =>
    r.cells.some((c) => c.permissionCode && selected.has(c.permissionCode)),
  ).length;

  const toggle = (code: string | null) => {
    if (!code || disabled) return;
    onChange(selected.has(code) ? value.filter((c) => c !== code) : [...value, code]);
  };

  if (catalogue.isLoading || grid.isLoading) {
    return <Skeleton variant="rounded" height={260} sx={{ borderRadius: `${radius.lg}px` }} />;
  }
  if (catalogue.isError) {
    return (
      <Alert severity="warning" variant="outlined">
        The function catalogue could not be loaded, so there is nothing to grant here yet.
      </Alert>
    );
  }
  if (rows.length === 0) {
    return (
      <Alert severity="info" variant="outlined">
        Your organization holds no functions it can pass on, so this role has nothing to grant.
      </Alert>
    );
  }

  return (
    <Stack spacing={2}>
      <TextField
        size="small"
        fullWidth
        value={filter}
        placeholder="Search a function…"
        onChange={(event) => setFilter(event.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon sx={{ fontSize: 18, color: palette.slate[400] }} />
              </InputAdornment>
            ),
          },
        }}
      />

      {byModule.length === 0 && (
        <Alert severity="info" variant="outlined">
          Nothing matches “{filter}”. Ticks you have already made are kept.
        </Alert>
      )}

      {byModule.map(([moduleCode, moduleRows]) => (
        <Box
          key={moduleCode}
          sx={{
            border: `1px solid ${palette.slate[200]}`,
            borderRadius: `${radius.lg}px`,
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: palette.slate[50],
              // Rounded here rather than clipping the card: an `overflow` on the ancestor is
              // exactly what stops `position: sticky` working.
              borderTopLeftRadius: `${radius.lg}px`,
              borderTopRightRadius: `${radius.lg}px`,
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, color: palette.slate[700] }}>
              {moduleCode}
            </Typography>
          </Box>

          {moduleRows.map((row) => (
            <Stack
              key={row.code}
              direction={{ xs: "column", md: "row" }}
              spacing={1}
              sx={{
                px: 2,
                py: 1.25,
                borderTop: `1px solid ${palette.slate[100]}`,
                alignItems: { md: "center" },
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: palette.slate[900] }}>
                    {row.name}
                  </Typography>
                  {row.needsApproval && (
                    <Tooltip title="The bank requires a second signature on this function.">
                      <LockRoundedIcon sx={{ fontSize: 14, color: palette.slate[400] }} />
                    </Tooltip>
                  )}
                </Stack>
              </Box>

              <Stack
                direction="row"
                sx={{ flexWrap: "wrap", gap: 1, justifyContent: { md: "flex-end" } }}
              >
                {row.cells.map((cell) => {
                  const isDerived = Boolean(cell.permissionCode && derived.has(cell.permissionCode));
                  const ticked =
                    isDerived || Boolean(cell.permissionCode && selected.has(cell.permissionCode));
                  return (
                    <Stack
                      key={`${row.code}-${cell.verb}`}
                      direction="row"
                      spacing={0.25}
                      sx={{ alignItems: "center" }}
                    >
                      <Tooltip
                        title={
                          isDerived
                            ? "Comes with the approval-required actions ticked above; it cannot be removed on its own."
                            : ""
                        }
                      >
                        <span>
                          <Checkbox
                            size="small"
                            checked={ticked}
                            disabled={disabled || isDerived || !cell.permissionCode}
                            onChange={() => toggle(cell.permissionCode)}
                            sx={{ p: 0.5 }}
                          />
                        </span>
                      </Tooltip>
                      <Typography
                        variant="caption"
                        sx={{
                          color: cell.verb === "APPROVE" ? palette.primary[700] : palette.slate[700],
                          fontWeight: cell.verb === "APPROVE" ? 700 : 500,
                        }}
                      >
                        {VERB_LABEL[cell.verb]}
                      </Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>
          ))}
        </Box>
      ))}

      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
        <Chip
          size="small"
          label={`${functionCount} function${functionCount === 1 ? "" : "s"} granted`}
          sx={{ fontWeight: 600 }}
        />
        <Chip
          size="small"
          color={signedCount > 0 ? "primary" : "default"}
          label={`${signedCount} signed`}
          sx={{ fontWeight: 600 }}
        />
        {derived.size > 0 && (
          <Typography variant="caption" sx={{ color: palette.slate[500], alignSelf: "center" }}>
            Raising and reviewing requests is included — the ticks above cannot work without it.
          </Typography>
        )}
      </Stack>
    </Stack>
  );
}
