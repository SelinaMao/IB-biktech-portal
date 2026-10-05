"use client";

import Alert from "@mui/material/Alert";

import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { RuleEditor } from "@/features/workflow";

/** Adding an approval rule — for one action, several, or every action of a kind. */
export default function NewApprovalRulePage() {
  const canCreate = useCan(CLIENT_PERMISSIONS.WORKFLOW.CONFIGURATION_CREATE);

  if (!canCreate) {
    return (
      <Alert severity="error" variant="outlined">
        You do not have permission to add approval rules.
      </Alert>
    );
  }
  return <RuleEditor />;
}
