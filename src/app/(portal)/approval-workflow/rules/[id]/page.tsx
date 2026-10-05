"use client";

import Alert from "@mui/material/Alert";
import { useParams } from "next/navigation";

import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { RuleEditor } from "@/features/workflow";

/** Editing one of the organization's approval rules: one action, every slab of it. */
export default function EditApprovalRulePage() {
  const params = useParams<{ id: string }>();
  const canUpdate = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_UPDATE);

  if (!canUpdate) {
    return (
      <Alert severity="error" variant="outlined">
        You do not have permission to edit approval rules.
      </Alert>
    );
  }
  return <RuleEditor ruleId={params.id} />;
}
