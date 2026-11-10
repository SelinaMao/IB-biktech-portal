"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";

import BaseIconButton from "@core/components/BaseIconButton";
import BaseTable, { type BaseTablePagination } from "@core/components/BaseTable";
import type { BaseTableColumn } from "@core/types/BaseTable.types";
import { font, palette } from "@/theme/palette";

import { describeChain, rangeWords } from "../rule-words";
import type { OrgWorkflowRule, RuleSlab, WorkflowFunction } from "../workflow.types";

export type RuleTableProps = {
  rules: OrgWorkflowRule[];
  functions: WorkflowFunction[];
  groupNameByKey: Map<string, string>;
  isLoading?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (rule: OrgWorkflowRule) => void;
  onDelete: (rule: OrgWorkflowRule) => void;
  pagination?: BaseTablePagination;
  onRowClick?: (rule: OrgWorkflowRule) => void;
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
  pagination,
  onRowClick,
}: RuleTableProps) {
  const byCode = useMemo(() => new Map(functions.map((fn) => [fn.code, fn])), [functions]);

  const headSx = {
    color: palette.slate[400],
    fontWeight: 400,
    fontSize: "14px",
  };

  const columns: BaseTableColumn<OrgWorkflowRule>[] = [
    {
      key: "function",
      header: "Action",
      width: "25%",
      headSx: { ...headSx, pl: { xs: 2, sm: 2.5 } },
      cellSx: { pl: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (rule) => {
        const fn = byCode.get(rule.functionCode);
        return (
          <Stack sx={{ gap: 0.5, alignItems: "flex-start" }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, fontSize: "14px", color: "#0F172A" }}
            >
              {fn?.name ?? rule.functionCode}
            </Typography>
            <Typography
              variant="caption"
              sx={{ fontWeight: 400, fontSize: "12px", color: palette.slate[400], fontFamily: "monospace" }}
            >
              {rule.functionCode}
            </Typography>
            {fn && (
              <Box
                component="span"
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  width: "fit-content",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: "6px",
                  bgcolor: fn.approvalCategory === "FINANCIAL" ? "#EFF6FF" : "#F1F5F9",
                  color: fn.approvalCategory === "FINANCIAL" ? "#1B5299" : "#475569",
                  fontSize: "12px",
                  fontWeight: 600,
                  lineHeight: 1.4,
                }}
              >
                {fn.approvalCategory === "FINANCIAL" ? "Financial" : "Non-financial"}
              </Box>
            )}
          </Stack>
        );
      },
    },
    {
      key: "slabs",
      header: "Slabs and approvers",
      width: "45%",
      headSx,
      cellSx: { py: 2.2 },
      render: (rule) => {
        const slabs = slabsOf(rule);
        const split = slabs.length > 1 || slabs.some((slab) => Boolean(slab.amountFrom) || slab.amountTo != null);
        return (
          <Stack sx={{ gap: 0.5 }}>
            {slabs.map((slab, index) => (
              <Typography key={index} variant="body2" sx={{ fontSize: "14px", color: "#0F172A" }}>
                {split && (
                  <Typography component="span" variant="body2" sx={{ fontWeight: 600, fontSize: "14px", color: "#0F172A" }}>
                    {rangeWords(slab.amountFrom, slab.amountTo)}:{" "}
                  </Typography>
                )}
                <Typography component="span" variant="body2" sx={{ fontWeight: 400, fontSize: "14px", color: palette.slate[700] }}>
                  {slab.chain.length ? describeChain(slab.chain, groupNameByKey) : "nobody has to approve"}
                </Typography>
              </Typography>
            ))}
            {rule.overrideAuthority && (
              <Typography variant="caption" sx={{ color: palette.slate[400], fontSize: "13px" }}>
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
      width: "15%",
      headSx,
      cellSx: { py: 2.2 },
      render: (rule) => (
        <Stack sx={{ gap: 0.5, alignItems: "flex-start" }}>
          {rule.derivedFromMandatory ? (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                bgcolor: "#EFF6FF",
                color: "#1E40AF",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Bank floor
            </Box>
          ) : rule.fromAll ? (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                bgcolor: "#F1F5F9",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Set by “All”
            </Box>
          ) : rule.templateRuleId ? (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                bgcolor: "#F1F5F9",
                color: "#475569",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Bank default
            </Box>
          ) : (
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                px: 1.5,
                py: 0.5,
                borderRadius: "6px",
                bgcolor: "#ECFDF5",
                color: "#065F46",
                fontSize: "12px",
                fontWeight: 600,
              }}
            >
              Yours
            </Box>
          )}
        </Stack>
      ),
    },
    {
      key: "actions",
      header: "Action",
      width: "15%",
      align: "right",
      headSx: { ...headSx, pr: { xs: 2, sm: 2.5 } },
      cellSx: { pr: { xs: 2, sm: 2.5 }, py: 2.2 },
      render: (rule) => {
        const fn = byCode.get(rule.functionCode);
        return (
          <Stack
            direction="row"
            spacing={1.5}
            onClick={(e) => e.stopPropagation()}
            sx={{ justifyContent: "flex-end", alignItems: "center" }}
          >
            {canEdit && (
              <BaseIconButton
                isBorder
                icon={<Pencil size={font.size.md} color={palette.icon.default} />}
                tooltip="Edit rule"
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onEdit(rule);
                }}
                aria-label={`Edit ${fn?.name ?? rule.functionCode}`}
              />
            )}
            {canDelete && (
              <BaseIconButton
                isBorder
                icon={<Trash2 size={font.size.md} color={palette.danger.main} />}
                tooltip={
                  rule.derivedFromMandatory
                    ? "The bank pinned this rule"
                    : "Delete rule"
                }
                color="error"
                disabled={rule.derivedFromMandatory}
                onClick={(e) => {
                  e?.stopPropagation?.();
                  onDelete(rule);
                }}
                aria-label={`Delete ${fn?.name ?? rule.functionCode}`}
              />
            )}
          </Stack>
        );
      },
    },
  ];

  return (
    <BaseTable
      columns={columns}
      rows={rules}
      getRowKey={(rule) => rule.id}
      isLoading={isLoading}
      minWidth={850}
      emptyTitle="No approval rules found"
      emptyDescription="Try a different search, or add a new rule."
      pagination={pagination}
      paginationVariant="compact"
      onRowClick={onRowClick}
      rounded={false}
      headerBgColor="transparent"
      headerBorderColor={palette.slate[200]}
      headerTextColor={palette.slate[400]}
      headerBorderTop={false}
    />
  );
}
