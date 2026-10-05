"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import BaseActionBar from "@core/components/BaseActionBar";
import BaseButton from "@core/components/BaseButton";
import BaseCard from "@core/components/BaseCard";
import BaseDialog from "@core/components/BaseDialog";
import BaseListSection from "@core/components/BaseListSection";
import BaseTitle from "@core/components/BaseTitle";
import { showToast } from "@core/components/AppToast";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { RuleTable, useCloneTemplateMutation, useDeleteOrgRuleMutation, useListApproverGroupsQuery, useListOrgRulesQuery, useListWorkflowFunctionsQuery, type OrgWorkflowRule } from "@/features/workflow";
import { toToastError } from "@/utils/api-error";

export default function ApprovalWorkflowSetupPage() {
  const router = useRouter();
  const canView = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_VIEW);
  const canCreate = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_CREATE);
  const canUpdate = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_UPDATE);
  const canDelete = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_DELETE);

  const rules = useListOrgRulesQuery(undefined, { skip: !canView });
  const functions = useListWorkflowFunctionsQuery(undefined, { skip: !canView });
  const groups = useListApproverGroupsQuery(undefined, { skip: !canView });

  const [deleteRule, deleteState] = useDeleteOrgRuleMutation();
  const [cloneTemplate, cloneState] = useCloneTemplateMutation();

  const [deleteTarget, setDeleteTarget] = useState<OrgWorkflowRule | null>(null);

  const groupNameByKey = useMemo(() => new Map((groups.data ?? []).map((group) => [group.groupKey, group.name])), [groups.data]);

  // Grouped by what they approve, financial first, then by name — an "All financial" rule arrives
  // as one rule per action, and listed by priority alone those would interleave with everything else.
  const list = useMemo(() => {
    const byCode = new Map((functions.data ?? []).map((fn) => [fn.code, fn]));
    const rank = (code: string) => (byCode.get(code)?.approvalCategory === "FINANCIAL" ? 0 : 1);
    const nameOf = (code: string) => byCode.get(code)?.name ?? code;
    return [...(rules.data ?? [])].sort((a, b) => rank(a.functionCode) - rank(b.functionCode) || nameOf(a.functionCode).localeCompare(nameOf(b.functionCode)) || a.priority - b.priority);
  }, [rules.data, functions.data]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteRule(deleteTarget.id).unwrap();
      showToast("success", {
        title: "Rule deleted",
        message: "Requests for this action now follow the bank's default rule.",
      });
      setDeleteTarget(null);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't delete the rule"));
    }
  };

  const seedFromTemplate = async () => {
    try {
      await cloneTemplate().unwrap();
      showToast("success", {
        title: "Approval Matrix created",
        message: "Your organization now has a copy of the bank's default rules.",
      });
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't copy the bank's default rules"));
    }
  };

  if (!canView) {
    return (
      <Alert severity="error" variant="outlined">
        You do not have permission to view the approval setup.
      </Alert>
    );
  }

  const noConfigYet = rules.isError && !rules.isLoading;
  const deleteName = deleteTarget ? ((functions.data ?? []).find((fn) => fn.code === deleteTarget.functionCode)?.name ?? deleteTarget.functionCode) : "";

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <BaseTitle fontSize={24} fontWeight={600}>
          Approval Matrix
        </BaseTitle>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: "80ch" }}>
          Which of your actions need approval, and who must give it. Each action has one rule; a financial rule can ask for more approvals as the amount grows. An action with no rule of its own here follows the bank&apos;s default rule.
        </Typography>
      </Box>

      {noConfigYet && (
        <Alert
          severity="info"
          variant="outlined"
          sx={{ mb: 2 }}
          action={
            canCreate ? (
              <Button size="small" variant="outlined" disabled={cloneState.isLoading} onClick={seedFromTemplate}>
                Copy the bank&apos;s default rules
              </Button>
            ) : undefined
          }
        >
          Your organization has no approval setup of its own yet.
        </Alert>
      )}

      <BaseCard>
        <BaseListSection>
          <BaseActionBar>
            <Stack direction="row" alignItems="center" sx={{ gap: 1, flex: 1, flexWrap: "wrap" }}>
              <Typography variant="body2" color="text.secondary">
                {list.length} rule{list.length === 1 ? "" : "s"}
              </Typography>
            </Stack>
            {canCreate && <BaseButton title="Add rule" variant="contained" startIcon={<AddRoundedIcon />} disabled={noConfigYet} onClick={() => router.push("/approval-workflow/rules/new")} />}
          </BaseActionBar>

          <RuleTable rules={list} functions={functions.data ?? []} groupNameByKey={groupNameByKey} isLoading={rules.isLoading || rules.isFetching} canEdit={canUpdate} canDelete={canDelete} onEdit={(rule) => router.push(`/approval-workflow/rules/${rule.id}`)} onDelete={setDeleteTarget} />
        </BaseListSection>
      </BaseCard>

      {deleteTarget && (
        <BaseDialog open title="Delete this rule?" subtitle={deleteName} confirmTitle="Delete" confirmColor="error" isLoading={deleteState.isLoading} onConfirm={confirmDelete} onClose={() => setDeleteTarget(null)}>
          <Typography variant="body2">Requests for this action will follow the bank&apos;s default rule instead. Requests already in flight keep the chain they started with.</Typography>
        </BaseDialog>
      )}
    </>
  );
}
