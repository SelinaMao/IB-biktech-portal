"use client";

import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useMemo } from "react";

import { palette, radius } from "@/theme/palette";

import { limitRowKey, type OwnerLimits, type TransactionLimitRow } from "../transaction-limit.types";

import { displayLimit } from "./TransactionLimitsGrid";

type Props = {
  limits?: OwnerLimits;
  /** Who the right-hand tile describes, e.g. the selected user's name. */
  ownerLabel: string;
  /** Which transaction type to trace, as its limitRowKey. The list beside it owns the selection. */
  rowKey: string;
};

function Node({
  tier,
  who,
  amount,
  pinned,
  emphasis,
}: {
  tier: string;
  who: string;
  amount: string;
  pinned: boolean;
  emphasis?: boolean;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: 1,
        minWidth: 160,
        px: 2,
        py: 1.5,
        border: `1px solid ${emphasis ? palette.primary[400] : palette.slate[200]}`,
        borderRadius: `${radius.lg}px`,
        backgroundColor: emphasis ? palette.primary[50] : undefined,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.08em" }}
      >
        {tier}
      </Typography>
      <Typography variant="h6" sx={{ mt: 0.25, fontVariantNumeric: "tabular-nums" }}>
        {amount}
      </Typography>
      <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }} noWrap>
        {who}
      </Typography>
      <Chip
        size="small"
        color={pinned ? "primary" : "default"}
        label={pinned ? "Set here" : "Follows above"}
        sx={{ mt: 0.75, height: 20, fontSize: 11 }}
      />
    </Paper>
  );
}

/**
 * The company ceiling beside this user's figure, for one transaction type.
 *
 * <p>Replaces a separate company-limits screen: the ceiling is only ever useful next to the
 * number being set against it, and the bank owns it either way.
 */
export default function LimitChainStrip({ limits, ownerLabel, rowKey }: Props) {
  const rows = useMemo(() => limits?.rows ?? [], [limits]);

  const row: TransactionLimitRow | undefined =
    rows.find((entry) => limitRowKey(entry) === rowKey) ?? rows[0];

  if (!row) return null;

  const pinned = row.srcMaxAmountPerTransaction === "OWN";

  return (
    <Stack spacing={1.25}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { sm: "stretch" } }}
      >
        <Node
          tier="Company"
          who={limits?.parentLabel ?? "Set by your bank"}
          amount={displayLimit(row.parentMaxAmountPerTransaction)}
          pinned={false}
        />
        <Stack sx={{ justifyContent: "center", color: palette.slate[400] }}>
          <ChevronRightRoundedIcon fontSize="small" />
        </Stack>
        <Node
          tier="User"
          who={ownerLabel}
          amount={displayLimit(row.maxAmountPerTransaction)}
          pinned={pinned}
          emphasis
        />
      </Stack>
    </Stack>
  );
}
