"use client";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo } from "react";

import BaseTable from "@core/components/BaseTable";
import type { BaseTableColumn } from "@core/types/BaseTable.types";

import { describeChain, rangeWords } from "../rule-words";
import type { OrgWorkflowRule, RuleSlab, WorkflowFunction } from "../workflow.types";

type Props = {
  rules: OrgWorkflowRule[];
  functions: WorkflowFunction[];
  groupNameByKey: Map<string, string>;
  isLoading?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (rule: OrgWorkflowRule) => void;
  onDelete: (rule: OrgWorkflowRule) => void;
};

/** Every slab of the rule; a server older than slabs only sends the first one's range and chain. */
const slabsOf = (rule: OrgWorkflowRule): RuleSlab[] =>
  rule.slabs?.length ? rule.slabs : [{ amountFrom: rule.amountFrom ?? null, amountTo: rule.amountTo ?? null, chain: rule.chain ?? [] }];

/** One action per row, every slab of it on a line of its own. */
export default function RuleTable({
  rules,
  functions,
  groupNameByKey,
  isLoading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: Props) {
  const byCode = useMemo(() => new Map(functions.map((fn) => [fn.code, fn])), [functions]);

  const columns: BaseTableColumn<OrgWorkflowRule>[] = [
    {
      key: "function",
      header: "Action",
      width: 280,
      render: (rule) => {
        const fn = byCode.get(rule.functionCode);
        return (
          <Stack sx={{ gap: 0.5, alignItems: "flex-start" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {fn?.name ?? rule.functionCode}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "monospace" }}>
              {rule.functionCode}
            </Typography>
            {fn && (
              <Chip
                size="small"
                variant="outlined"
                color={fn.approvalCategory === "FINANCIAL" ? "primary" : "default"}
                label={fn.approvalCategory === "FINANCIAL" ? "Financial" : "Non-financial"}
              />
            )}
          </Stack>
        );
      },
    },
    {
      key: "slabs",
      header: "Slabs and approvers",
      render: (rule) => {
        const slabs = slabsOf(rule);
        const split = slabs.length > 1 || slabs.some((slab) => Boolean(slab.amountFrom) || slab.amountTo != null);
        return (
          <Stack sx={{ gap: 0.5 }}>
            {slabs.map((slab, index) => (
              <Typography key={index} variant="body2">
                {split && (
                  <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                    {rangeWords(slab.amountFrom, slab.amountTo)}:{" "}
                  </Typography>
                )}
                {slab.chain.length ? describeChain(slab.chain, groupNameByKey) : "nobody has to approve"}
              </Typography>
            ))}
            {rule.overrideAuthority && (
              <Typography variant="caption" color="text.secondary">
                {rule.overrideAuthority.requiredCount} with higher authority may approve outright
              </Typography>
            )}
          </Stack>
        );
      },
    },
    {
      key: "origin",
      header: "Origin",
      width: 170,
      render: (rule) => (
        <Stack sx={{ gap: 0.5, alignItems: "flex-start" }}>
          {rule.derivedFromMandatory && <Chip size="small" color="primary" variant="outlined" label="Bank floor" />}
          {rule.fromAll ? (
            <Chip size="small" variant="outlined" label="Set by “All”" />
          ) : rule.templateRuleId ? (
            <Chip size="small" variant="outlined" label="Bank default" />
          ) : (
            <Typography variant="body2" color="text.secondary">
              Yours
            </Typography>
          )}
        </Stack>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      width: 96,
      render: (rule) => (
        <Stack direction="row" justifyContent="flex-end" sx={{ gap: 0.5 }}>
          <Tooltip title={canEdit ? "Edit rule" : "You cannot edit rules"}>
            <span>
              <IconButton size="small" disabled={!canEdit} onClick={() => onEdit(rule)}>
                <EditOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip
            title={
              rule.derivedFromMandatory ? "The bank pinned this rule" : canDelete ? "Delete rule" : "You cannot delete rules"
            }
          >
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={!canDelete || rule.derivedFromMandatory}
                onClick={() => onDelete(rule)}
              >
                <DeleteOutlineRoundedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <BaseTable
      rows={rules}
      columns={columns}
      getRowKey={(rule) => rule.id}
      isLoading={isLoading}
      minWidth={900}
      emptyTitle="No approval rules yet"
      emptyDescription="An action with no rule of its own here follows the bank's default rule."
    />
  );
}
