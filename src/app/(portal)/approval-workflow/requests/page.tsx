"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChevronRightRounded } from "@mui/icons-material";
import { ClipboardClock, FileClock } from "lucide-react";

import { showToast } from "@core/components/AppToast";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseTable from "@core/components/BaseTable";
import BaseTitle from "@core/components/BaseTitle";
import { baseTableHeaderTextSx } from "@core/components/BaseTableHeader";
import BaseSwitch from "@core/form/BaseSwitch";
import type { BaseTableColumn } from "@core/types/BaseTable.types";
import { ApprovalTypeBreakdownCard } from "@/features/approval";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { AuthenticatorDialog, type AuthenticatorRequest } from "@/features/authenticator";
import { SectionCard, StatCard } from "@/features/dashboard";
import { useListUsersQuery } from "@/features/user";
import {
  InstanceDetailDialog,
  InstanceStatusChip,
  useActOnInstanceMutation,
  useCancelInstanceMutation,
  useListInstancesQuery,
  useRaiseApprovalAuthenticatorMutation,
  useListMyTasksQuery,
  type InstanceStatus,
  type InstanceSummary,
  type TaskInboxRow,
} from "@/features/workflow";
import { font, palette } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";
import { formatDate } from "@/utils/date-time";

type RequestTab = "mine" | "all";

const PAGE_SIZE = 10;

/** Statuses that mean the request is still moving; everything else has settled. */
const OPEN_STATUSES: InstanceStatus[] = ["PENDING", "IN_PROGRESS", "ESCALATED"];

/** The breakdown card is a glance, not a report — a long tail would push the grid out of line. */
const BREAKDOWN_LIMIT = 5;

/**
 * Table chrome shared by both tabs: flat and plain-headed, because the table sits inside
 * SectionCard, which already draws the rounded border and the tint would double up.
 */
const TABLE_CHROME = {
  rounded: false,
  headerBgColor: palette.white,
  headerBorderColor: palette.slate[200],
  headerTextColor: palette.slate[400],
  headerBorderTop: false,
  paginationSx: { px: 5, py: 2 },
};

export default function ApprovalRequestsPage() {
  const canView = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);
  const canSeeTasks = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);
  const canAct = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_EXECUTE);
  const canCancel = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_CANCEL);

  const [tab, setTab] = useState<RequestTab>("mine");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);

  const tasks = useListMyTasksQuery({ status: "PENDING" }, { skip: !canSeeTasks });
  const instances = useListInstancesQuery({ size: 50 }, { skip: !canView });
  const users = useListUsersQuery({ page: 0, size: 200 }, { skip: !canView });

  const [act, actState] = useActOnInstanceMutation();
  const [cancel] = useCancelInstanceMutation();
  const [raiseApprovalAuthenticator, raiseAuthenticatorState] = useRaiseApprovalAuthenticatorMutation();
  // An APPROVE waiting for the approver's phone to scan its QR
  const [phoneApproval, setPhoneApproval] = useState<{
    authenticator: AuthenticatorRequest;
    reason?: string;
  } | null>(null);

  /** Steps name people, not uuids. */
  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of users.data?.content ?? []) {
      map.set(entry.user.id, entry.user.fullName || entry.user.username);
    }
    return map;
  }, [users.data]);

  const myTasks = useMemo(() => tasks.data?.content ?? [], [tasks.data]);
  const allInstances = useMemo(
    // A failed load is not an empty list, so don't let it read as one.
    () => (instances.isError ? [] : (instances.data?.content ?? [])),
    [instances.data, instances.isError],
  );

  const openInstances = useMemo(
    () => allInstances.filter((row) => OPEN_STATUSES.includes(row.status)),
    [allInstances],
  );

  /** What is still pending, by the action that raised it — the card next to the counters. */
  const typeBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of openInstances) {
      counts.set(row.functionName, (counts.get(row.functionName) ?? 0) + 1);
    }
    return Array.from(counts, ([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
      .slice(0, BREAKDOWN_LIMIT);
  }, [openInstances]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return myTasks;
    return myTasks.filter((row) =>
      [row.functionName, row.referenceId, row.requiredCapability]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [myTasks, search]);

  const filteredInstances = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allInstances;
    return allInstances.filter((row) =>
      [
        row.functionName,
        row.referenceId,
        row.status,
        nameByUserId.get(row.initiatedBy) ?? "",
        ...row.awaitingCapabilities,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [allInstances, nameByUserId, search]);

  const filteredCount = tab === "mine" ? filteredTasks.length : filteredInstances.length;

  /**
   * Acting on the last row of a page shortens the list under the pager, and a page that no
   * longer exists renders as an empty table rather than as "nothing matched".
   */
  const safePage = Math.min(page, Math.max(0, Math.ceil(filteredCount / PAGE_SIZE) - 1));
  const sliceFrom = safePage * PAGE_SIZE;

  const pagedTasks = useMemo(
    () => filteredTasks.slice(sliceFrom, sliceFrom + PAGE_SIZE),
    [filteredTasks, sliceFrom],
  );
  const pagedInstances = useMemo(
    () => filteredInstances.slice(sliceFrom, sliceFrom + PAGE_SIZE),
    [filteredInstances, sliceFrom],
  );

  const tabOptions = useMemo(
    () => [
      { value: "mine", label: myTasks.length ? `Waiting on me (${myTasks.length})` : "Waiting on me" },
      { value: "all", label: "All requests" },
    ],
    [myTasks.length],
  );

  const pagination = {
    count: filteredCount,
    page: safePage,
    rowsPerPage: PAGE_SIZE,
    onPageChange: setPage,
  };

  const handleTabChange = (value: RequestTab) => {
    setTab(value);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  // Approving is authorized on the approver's linked phone; rejecting is not
  const onAct = async (decision: "APPROVE" | "REJECT", reason?: string) => {
    if (!openId) return;
    if (decision === "APPROVE") {
      try {
        const authenticator = await raiseApprovalAuthenticator(openId).unwrap();
        setPhoneApproval({ authenticator, reason });
      } catch (error) {
        showToast("error", toToastError(error, "Couldn't start the phone authorization"));
      }
      return;
    }
    try {
      await act({ id: openId, decision, reason }).unwrap();
      showToast("success", {
        title: "Rejected",
        message: "The request is rejected and the remaining steps are skipped.",
      });
      setOpenId(null);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't record your decision"));
    }
  };

  // The phone authorized it: record the approval with that request; a refusal shows in the QR dialog
  const approveWithPhone = async (authenticatorRequestId: string) => {
    if (!openId) return;
    await act({ id: openId, decision: "APPROVE", reason: phoneApproval?.reason, authenticatorRequestId }).unwrap();
    showToast("success", {
      title: "Approved",
      message: "If that met the last level, the request is fully approved.",
    });
    setPhoneApproval(null);
    setOpenId(null);
  };

  const renewApprovalAuthenticator = async () => {
    if (!openId) throw new Error("No request is open");
    return raiseApprovalAuthenticator(openId).unwrap();
  };

  const onCancel = async () => {
    if (!openId) return;
    try {
      await cancel(openId).unwrap();
      showToast("success", {
        title: "Request cancelled",
        message: "The remaining steps were skipped.",
      });
      setOpenId(null);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't cancel the request"));
    }
  };

  const taskColumns: BaseTableColumn<TaskInboxRow>[] = [
    {
      key: "creationDate",
      header: "Creation Date",
      width: 150,
      render: (row) => (
        <Typography variant="body2">{formatDate(row.createdAt, "DD MMM YYYY")}</Typography>
      ),
    },
    {
      key: "what",
      header: "Request Type",
      render: (row) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            {row.functionName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Ref: {row.referenceId}
          </Typography>
        </>
      ),
    },
    {
      key: "step",
      header: "Your Step",
      width: 240,
      render: (row) => (
        <Stack direction="row" sx={{ alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
          <Chip size="small" variant="outlined" label={`Level ${row.level}`} />
          <Chip size="small" variant="outlined" label={row.requiredCapability} />
          {row.overrideAuthority && <Chip size="small" color="warning" label="Override" />}
        </Stack>
      ),
    },
    {
      key: "due",
      header: "Due",
      width: 160,
      render: (row) => <DueCell dueAt={row.dueAt} overdue={row.overdue} />,
    },
    {
      key: "actionable",
      header: "Status",
      align: "right",
      width: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
          {row.actionable ? (
            <Chip size="small" color="primary" label="Your turn" />
          ) : (
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              waiting their turn
            </Typography>
          )}
          <ChevronRightRounded sx={{ color: palette.slate[400] }} />
        </Stack>
      ),
    },
  ];

  const instanceColumns: BaseTableColumn<InstanceSummary>[] = [
    {
      key: "creationDate",
      header: "Creation Date",
      width: 150,
      render: (row) => (
        <Typography variant="body2">{formatDate(row.createdAt, "DD MMM YYYY")}</Typography>
      ),
    },
    {
      key: "what",
      header: "Request Type",
      render: (row) => (
        <>
          <Typography variant="body2" sx={baseTableHeaderTextSx}>
            {row.functionName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
            Ref: {row.referenceId}
          </Typography>
        </>
      ),
    },
    {
      key: "raisedBy",
      header: "Raised By",
      width: 180,
      render: (row) => (
        <Typography variant="body2">{nameByUserId.get(row.initiatedBy) ?? "—"}</Typography>
      ),
    },
    {
      key: "waiting",
      header: "Waiting On",
      width: 200,
      render: (row) =>
        row.awaitingCapabilities.length === 0 ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            —
          </Typography>
        ) : (
          <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap" }}>
            {row.awaitingCapabilities.map((capability) => (
              <Chip key={capability} size="small" variant="outlined" label={capability} />
            ))}
          </Stack>
        ),
    },
    {
      key: "progress",
      header: "Step",
      width: 100,
      align: "center",
      render: (row) => (
        <Typography variant="body2">
          {row.currentLevel} / {row.totalLevels || 1}
        </Typography>
      ),
    },
    {
      key: "due",
      header: "Due",
      width: 160,
      render: (row) => <DueCell dueAt={row.dueAt} overdue={row.overdue} />,
    },
    {
      key: "status",
      header: "Request Status",
      align: "right",
      width: 180,
      render: (row) => (
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
          <InstanceStatusChip status={row.status} />
          <ChevronRightRounded sx={{ color: palette.slate[400] }} />
        </Stack>
      ),
    },
  ];

  if (!canView) {
    return (
      <Alert severity="error" variant="outlined">
        You do not have permission to view approval requests.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
     
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="pending"
            value={String(myTasks.length)}
            icon={<ClipboardClock />}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Pending Amount"
            value={String(openInstances.length)}
            icon={<FileClock />}
            tone="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
          <ApprovalTypeBreakdownCard title="Pending by type" items={typeBreakdown} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, mb: 3 }}>
        <BaseTitle fontSize={font.size.xxl} fontWeight={font.weight.medium}>
          Approval requests
        </BaseTitle>
        <Typography variant="body2" sx={{ mt: 0.5, maxWidth: "80ch", color: "text.secondary" }}>
          Requests raised in your organization that are waiting for a decision. Open one to see
          every step, who is eligible at each, and whose turn it is now.
        </Typography>
      </Box>

      <SectionCard
        title="Approval Lists"
        titleSx={{ fontSize: font.size.lg, fontWeight: font.weight.medium, p: 6 }}
        noPadding
        header={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", pl: 6, pr: 6, pt: 3, pb: 3 }}>
            <BaseSearchButton value={search} onChange={handleSearchChange} placeholder="Search requests…" />
            <BaseSwitch options={tabOptions} value={tab} onChange={handleTabChange} />
          </Stack>
        }
      >
        {tab === "mine" ? (
          <BaseTable
            {...TABLE_CHROME}
            rows={pagedTasks}
            columns={taskColumns}
            getRowKey={(row) => row.taskId}
            isLoading={tasks.isLoading || tasks.isFetching}
            onRowClick={(row) => setOpenId(row.instanceId)}
            minWidth={980}
            pagination={pagination}
            emptyTitle={search ? "No matching requests" : "Nothing is waiting on you"}
            emptyDescription={
              search
                ? "No request in your queue matches that search."
                : "A request reaches you when a rule names a capability you hold for that action."
            }
          />
        ) : (
          <>
            {/* An empty table and a failed request look identical otherwise, and "nothing here"
                is the more reassuring of the two — which is how a broken list read as no data. */}
            {instances.isError && (
              <Alert severity="error" variant="outlined" sx={{ mx: 5, mb: 2 }}>
                The requests could not be loaded, so this list is not empty — it is unknown. Try
                again, and tell your bank if it keeps happening.
              </Alert>
            )}
            <BaseTable
              {...TABLE_CHROME}
              rows={pagedInstances}
              columns={instanceColumns}
              getRowKey={(row) => row.id}
              isLoading={instances.isLoading || instances.isFetching}
              onRowClick={(row) => setOpenId(row.id)}
              minWidth={1180}
              pagination={pagination}
              emptyTitle={
                instances.isError
                  ? "Couldn't load requests"
                  : search
                    ? "No matching requests"
                    : "No approval requests yet"
              }
              emptyDescription={
                instances.isError
                  ? "The list did not load. This is not the same as having none."
                  : search
                    ? "No request matches that search."
                    : "An action only lands here once a rule matches it — otherwise it simply goes through."
              }
            />
          </>
        )}
      </SectionCard>

      {openId && (
        <InstanceDetailDialog
          instanceId={openId}
          nameByUserId={nameByUserId}
          canAct={canAct}
          canCancel={canCancel}
          isActing={actState.isLoading || raiseAuthenticatorState.isLoading}
          onAct={onAct}
          onCancel={onCancel}
          onClose={() => setOpenId(null)}
        />
      )}

      {openId && phoneApproval && (
        <AuthenticatorDialog
          key={openId}
          open
          authenticator={phoneApproval.authenticator}
          subject="approval"
          onAuthorized={approveWithPhone}
          onRenew={renewApprovalAuthenticator}
          onClose={() => setPhoneApproval(null)}
        />
      )}
    </Box>
  );
}

/**
 * When the decision is owed, in the reviewer's own terms.
 *
 * <p>Not every rule sets a time limit, and a dash says "no deadline" better than a blank cell or
 * an invented one.
 */
function DueCell({ dueAt, overdue }: { dueAt: string | null; overdue: boolean }) {
  if (!dueAt) {
    return (
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        —
      </Typography>
    );
  }
  return (
    <Typography variant="body2" sx={{ color: overdue ? "warning.main" : "text.secondary" }}>
      {formatDate(dueAt, "DD MMM YYYY")}
      {overdue ? " · overdue" : ""}
    </Typography>
  );
}
