"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";

import BaseButton from "@core/components/BaseButton";
import BaseDialog from "@core/components/BaseDialog";
import BaseTextArea from "@core/form/BaseTextArea";

import ApprovalSteps from "./ApprovalSteps";
import InstanceStatusChip from "./InstanceStatusChip";
import { useGetInstanceQuery } from "../workflow.api";

type Props = {
  instanceId: string;
  /** userId → display name, so a step can say who rather than show a uuid. */
  nameByUserId: Map<string, string>;
  canAct: boolean;
  canCancel?: boolean;
  isActing?: boolean;
  onAct: (decision: "APPROVE" | "REJECT", reason?: string) => void;
  onCancel?: () => void;
  onClose: () => void;
};

/**
 * Field names as a customer would say them.
 *
 * A key the raising service chose is a developer's name for it; unmapped keys are shown with the
 * camel case broken up rather than hidden, so a new one is readable before anyone maps it.
 */
const FIELD_LABELS: Record<string, string> = {
  ownerType: "Applies to",
  ownerId: "Record",
  raisedBy: "Raised by",
  amount: "Largest figure in the change",
  liftsOwnAuthority: "Would raise the requester's own authority",
  operation: "Operation",
  request: "Full request",
};

const labelFor = (key: string) =>
  FIELD_LABELS[key] ??
  key.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/^./, (first) => first.toUpperCase());

const readValue = (value: unknown) => {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === null || value === undefined) return "—";
  return typeof value === "object" ? JSON.stringify(value) : String(value);
};

/** One "before → after" line the raising service wrote for the approver. */
type ChangeLine = { subject: string; field?: string; before?: string; after: string };

export default function InstanceDetailDialog({
  instanceId,
  nameByUserId,
  canAct,
  canCancel,
  isActing,
  onAct,
  onCancel,
  onClose,
}: Props) {
  const { data: instance, isLoading } = useGetInstanceQuery(instanceId);
  const [reason, setReason] = useState("");
  const [showReference, setShowReference] = useState(false);

  const isOpen = instance?.status === "PENDING" || instance?.status === "IN_PROGRESS";

  /**
   * The readable part of the request, written by the service that raised it.
   *
   * The rest of the context is plumbing — owner ids, the raw body, flags the engine uses — which
   * an approver should not have to read to know what they are agreeing to. It stays on the screen
   * under a quieter heading for support, rather than being the whole explanation.
   */
  const changes = useMemo(() => {
    const raw = (instance?.context as Record<string, unknown> | undefined)?.changes;
    if (!Array.isArray(raw)) return [] as ChangeLine[];
    return raw.filter(
      (line): line is ChangeLine =>
        typeof line === "object" && line !== null && "subject" in line && "after" in line,
    );
  }, [instance?.context]);

  /**
   * Who the change is about, said as a name.
   *
   * <p>The context carries `ownerType: "USER"` and a uuid, which together mean "Sokha Pheng's
   * limits" — the single fact an approver most needs, and the one thing the screen was not saying.
   */
  const subject = useMemo(() => {
    const context = (instance?.context ?? {}) as Record<string, unknown>;
    const ownerType = String(context.ownerType ?? "");
    const ownerId = String(context.ownerId ?? "");
    if (ownerType === "USER") {
      const name = nameByUserId.get(ownerId);
      return name ? `For ${name}` : null;
    }
    if (ownerType === "CORPORATE") return "For the whole company";
    return null;
  }, [instance?.context, nameByUserId]);

  /** The engine's own reason for refusing a self-signature, worth saying out loud. */
  const liftsOwnAuthority = Boolean(
    (instance?.context as Record<string, unknown> | undefined)?.liftsOwnAuthority,
  );

  const technical = useMemo(() => {
    const context = (instance?.context ?? {}) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(context).filter(([key]) => key !== "changes"));
  }, [instance?.context]);

  return (
    <BaseDialog
      open
      title={instance ? instance.functionName : "Approval request"}
      subtitle={instance ? `Reference ${instance.referenceId}` : undefined}
      onClose={onClose}
      hideActions
      maxWidth="md"
    >
      {isLoading || !instance ? (
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      ) : (
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" sx={{ gap: 1, flexWrap: "wrap" }}>
            <InstanceStatusChip status={instance.status} />
            {isOpen && (
              <Chip
                size="small"
                variant="outlined"
                label={`Level ${instance.currentLevel} of ${instance.totalLevels || 1}`}
              />
            )}
            {instance.overdue && <Chip size="small" color="warning" label="Overdue" />}
            <Box sx={{ flex: 1 }} />
            <Typography variant="caption" color="text.secondary">
              Raised by {nameByUserId.get(instance.initiatedBy) ?? instance.initiatedBy} ·{" "}
              {new Date(instance.createdAt).toLocaleString()}
            </Typography>
            {/* The function code is the engine's name for this, not the customer's; the title
                above already says what it is, so the code lives in the technical drawer. */}
          </Stack>

          {liftsOwnAuthority && (
            <Alert severity="warning" variant="outlined">
              This would raise the authority of the person who asked for it, so they cannot sign it
              themselves.
            </Alert>
          )}

          {changes.length > 0 && (
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Stack
                direction="row"
                sx={{
                  px: 1.75,
                  py: 0.875,
                  gap: 1,
                  alignItems: "baseline",
                  bgcolor: "action.hover",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  What is being changed
                </Typography>
                {subject && (
                  <Typography variant="caption" color="text.secondary">
                    {subject}
                  </Typography>
                )}
              </Stack>
              <Stack>
                {changes.map((line, index) => (
                  <Stack
                    key={`${line.subject}-${line.field}-${index}`}
                    direction={{ xs: "column", sm: "row" }}
                    sx={{
                      px: 1.75,
                      py: 1.25,
                      gap: 1,
                      alignItems: { sm: "center" },
                      borderTop: index === 0 ? 0 : 1,
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {line.subject}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {line.field}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexShrink: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{ color: "text.secondary", textDecoration: "line-through" }}
                      >
                        {line.before}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        →
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {line.after}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {Object.keys(technical).length > 0 && (
            <Box>
              {changes.length > 0 ? (
                <Box
                  component="button"
                  type="button"
                  onClick={() => setShowReference((open) => !open)}
                  sx={{
                    border: 0,
                    bgcolor: "transparent",
                    p: 0,
                    cursor: "pointer",
                    color: "text.secondary",
                    font: "inherit",
                    fontSize: 12,
                  }}
                >
                  {showReference ? "Hide technical details" : "Technical details, for support"}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  What is being approved
                </Typography>
              )}
              <Box
                sx={{
                  mt: 0.5,
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  p: 1.25,
                  display: changes.length > 0 && !showReference ? "none" : "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "auto 1fr" },
                  columnGap: 2,
                  rowGap: 0.5,
                }}
              >
                {Object.entries(technical).map(([key, value]) => (
                  <Box key={key} sx={{ display: "contents" }}>
                    <Typography variant="body2" color="text.secondary">
                      {labelFor(key)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        wordBreak: "break-all",
                        fontFamily: typeof value === "object" ? "monospace" : undefined,
                        fontSize: typeof value === "object" ? 12 : undefined,
                      }}
                    >
                      {readValue(value)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              overflow: "hidden",
            }}
          >
            <Stack
              direction="row"
              sx={{
                px: 1.75,
                py: 0.875,
                gap: 1,
                alignItems: "baseline",
                bgcolor: "action.hover",
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Who signs it
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {instance.totalLevels > 1
                  ? `${instance.totalLevels} levels`
                  : "one level"}
              </Typography>
            </Stack>
            <Box sx={{ px: 1.75, py: 1.25 }}>
              <ApprovalSteps instance={instance} nameByUserId={nameByUserId} />
            </Box>
          </Box>

          {isOpen && canAct && (
            <>
              <Divider />
              <Stack spacing={1}>
                <BaseTextArea
                  label="Reason (required to reject)"
                  value={reason}
                  minRows={2}
                  onChange={(event) => setReason(event.target.value)}
                />
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <BaseButton
                    title="Reject"
                    color="error"
                    variant="outlined"
                    isLoading={isActing}
                    disabled={!reason.trim()}
                    onClick={() => onAct("REJECT", reason.trim())}
                  />
                  <BaseButton
                    title="Approve"
                    isLoading={isActing}
                    onClick={() => onAct("APPROVE", reason.trim() || undefined)}
                  />
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  You can only act if a step above says it is your turn. The engine refuses an
                  approval from the person who raised the request.
                </Typography>
              </Stack>
            </>
          )}

          {isOpen && !canAct && (
            <Alert severity="info" variant="outlined">
              You can see this request but not act on it.
            </Alert>
          )}

          {isOpen && canCancel && onCancel && (
            <Stack direction="row" justifyContent="flex-start">
              <BaseButton
                title="Cancel this request"
                variant="text"
                color="error"
                onClick={onCancel}
              />
            </Stack>
          )}
        </Stack>
      )}
    </BaseDialog>
  );
}
