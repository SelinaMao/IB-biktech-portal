"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import MuiLink from "@mui/material/Link";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import BaseTitle from "@core/components/BaseTitle";
import { showToast } from "@core/components/AppToast";
import { toToastError } from "@/utils/api-error";

import RuleForm from "./RuleForm";
import { useCreateOrgRulesMutation, useListOrgRulesQuery, useListWorkflowFunctionsQuery, useUpdateOrgRuleMutation } from "../workflow.api";
import type { OrgRuleBatchPayload, OrgWorkflowRulePayload } from "../workflow.types";

const BACK_HREF = "/approval-workflow";

type Props = {
  /** Omitted when creating. */
  ruleId?: string;
};

/**
 * Creating or editing one of the organization's approval rules.
 *
 * <p>A page rather than a dialog: choosing what it covers, its slabs and a chain per slab is work
 * with its own address, not a decision taken in passing.
 */
export default function RuleEditor({ ruleId }: Props) {
  const router = useRouter();
  const functions = useListWorkflowFunctionsQuery();
  const rules = useListOrgRulesQuery();
  const [createRules, createState] = useCreateOrgRulesMutation();
  const [updateRule, updateState] = useUpdateOrgRuleMutation();

  const rule = ruleId ? (rules.data ?? []).find((r) => r.id === ruleId) : null;
  const isLoading = functions.isLoading || rules.isLoading;
  const isSaving = createState.isLoading || updateState.isLoading;

  /**
   * One request however many actions it covers: the service saves every action's rule or none,
   * so a failure never leaves half of an "all financial" rule behind.
   */
  const create = async (payload: OrgRuleBatchPayload) => {
    try {
      const { created, updated, kept } = await createRules(payload).unwrap();
      const written = created.length + updated.length;
      const done = [created.length ? `${created.length} added` : "", updated.length ? `${updated.length} updated` : "", kept.length ? `${kept.length} left as ${kept.length === 1 ? "it was" : "they were"}` : ""].filter(Boolean);
      showToast("success", {
        title: written > 1 ? `${written} rules saved` : created.length ? "Rule added" : "Rule updated",
        message: `${done.join(", ")}. It applies to requests raised from now on.`,
      });
      router.push(BACK_HREF);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't save the approval rule"));
    }
  };

  const update = async (body: OrgWorkflowRulePayload) => {
    if (!rule) return;
    try {
      await updateRule({ ruleId: rule.id, body }).unwrap();
      showToast("success", {
        title: "Rule updated",
        message: "The change applies to requests raised from now on.",
      });
      router.push(BACK_HREF);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't save the approval rule"));
    }
  };

  if (isLoading) {
    return (
      <Stack spacing={2.5}>
        <Skeleton variant="rounded" height={64} />
        <Skeleton variant="rounded" height={560} />
      </Stack>
    );
  }

  // The rules list is refused until the organization has an approval setup to hold them.
  if (rules.isError) {
    return (
      <Alert severity="info" variant="outlined">
        Your organization has no approval setup yet.{" "}
        <MuiLink component={NextLink} href={BACK_HREF}>
          Start it from the bank&apos;s default rules
        </MuiLink>{" "}
        first.
      </Alert>
    );
  }

  if (ruleId && !rule) {
    return (
      <Alert severity="warning" variant="outlined">
        This approval rule could not be found.{" "}
        <MuiLink component={NextLink} href={BACK_HREF}>
          Back to approval matrix
        </MuiLink>
      </Alert>
    );
  }

  return (
    <Box>
      <Breadcrumbs aria-label="Breadcrumb">
        <MuiLink component={NextLink} href={BACK_HREF} underline="hover" color="text.secondary" variant="body2">
          Approval Matrix
        </MuiLink>
        <Typography variant="body2" color="text.primary">
          {rule ? "Edit rule" : "New rule"}
        </Typography>
      </Breadcrumbs>
      <BaseTitle fontSize={24} fontWeight={600} sx={{ mt: 1 }}>
        {rule ? "Edit approval rule" : "New approval rule"}
      </BaseTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3, maxWidth: "80ch" }}>
        Decides who inside your organization must approve these actions before they go ahead.
      </Typography>

      <RuleForm rule={rule ?? null} functions={functions.data ?? []} existingRules={rules.data ?? []} isSaving={isSaving} onCancel={() => router.push(BACK_HREF)} onCreate={create} onUpdate={update} />
    </Box>
  );
}
