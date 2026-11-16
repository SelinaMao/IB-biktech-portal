"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { resolveBaseFilterRange, type BaseFilterValue } from "@core/components/BaseFilter";
import {
  ApprovalTable,
  ApprovalSummaryCards,
  mapWorkflowToApprovalEntry,
  type ApprovalEntry,
  type ApprovalTab,
} from "@/features/approval";
import { CLIENT_PERMISSIONS, useCan, useCanAny } from "@/features/auth";
import { AuthenticatorDialog, type AuthenticatorRequest } from "@/features/authenticator";
import { useListUsersQuery } from "@/features/user";
import {
  InstanceDetailDialog,
  useActOnInstanceMutation,
  useCancelInstanceMutation,
  useListInstancesQuery,
  useListWorkflowFunctionsQuery,
  useRaiseApprovalAuthenticatorMutation,
  useListMyTasksQuery,
  type InstanceStatus,
  DetailDialog,
  type DetailDialogEntry,
  type WorkflowFunction,
} from "@/features/workflow";
import { font } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";

const ROWS_PER_PAGE = 5;
const OPEN_STATUSES: InstanceStatus[] = ["PENDING", "IN_PROGRESS", "ESCALATED"];
const R = 12; // flare radius
const CARD_RADIUS = 16; // must match ApprovalTable's top-left radius
const OVERLAP = 2; // active tab sinks into the card to hide its top edge
const PANEL_BG = "#FFFFFF";
const ACTIVE_TEXT = "#2764A5";

const tabSx = (active: boolean) => ({
  border: "none",
  outline: "none",
  cursor: "pointer",
  position: "relative" as const,
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box" as const,
  px: 3,
  fontSize: `${font.size.sm}`,
  fontFamily: "inherit",
  transition: "background-color 0.15s ease, color 0.15s ease",

  ...(active
    ? {
        height: 36 + OVERLAP,
        pb: `${OVERLAP}px`,
        mb: `-${OVERLAP}px`,
        zIndex: 1,
        borderRadius: `${R + 2}px ${R + 2}px 0 0`,
        bgcolor: PANEL_BG,
        color: ACTIVE_TEXT,
        fontWeight: 600,
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          bottom: `${OVERLAP}px`,
          width: R,
          height: R,
          pointerEvents: "none",
        },
        "&::before": {
          left: -R,
          borderBottomRightRadius: R,
          boxShadow: `${R / 2}px ${R / 2}px 0 ${R / 2}px ${PANEL_BG}`,
        },
        "&::after": {
          right: -R,
          borderBottomLeftRadius: R,
          boxShadow: `-${R / 2}px ${R / 2}px 0 ${R / 2}px ${PANEL_BG}`,
        },
      }
    : {
        height: 29,
        mb: 0.75,
        borderRadius: "10px",
        bgcolor: "#EDF0F5",
        color: "#0F172A",
        fontWeight: 500,
        "&:hover": { bgcolor: "#E3E8F0" },
      }),
});

export default function ApprovalRequestsPage() {
  const canView = useCanAny([
    CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW,
    CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_EXECUTE,
  ]);
  const canSeeTasks = canView;
  const canAct = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_EXECUTE);
  const canCancel = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_CANCEL);

  const [subTab, setSubTab] = useState<ApprovalTab>("pending");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue | null>(null);
  const [page, setPage] = useState(0);

  const [openWorkflowId, setOpenWorkflowId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ApprovalEntry | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(true);

  // Live API queries
  const tasksPending = useListMyTasksQuery({ status: "PENDING" }, { skip: !canSeeTasks });
  const tasksAll = useListMyTasksQuery(undefined, { skip: !canSeeTasks });
  const instances = useListInstancesQuery({ size: 100 }, { skip: !canView });
  const users = useListUsersQuery({ page: 0, size: 200 }, { skip: !canView });
  const workflowFunctions = useListWorkflowFunctionsQuery(undefined, { skip: !canView });

  const [act, actState] = useActOnInstanceMutation();
  const [cancel, cancelState] = useCancelInstanceMutation();
  const [raiseApprovalAuthenticator, raiseAuthenticatorState] =
    useRaiseApprovalAuthenticatorMutation();

  const [phoneApproval, setPhoneApproval] = useState<{
    authenticator: AuthenticatorRequest;
    reason?: string;
  } | null>(null);

  // Map users for initiator names
  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of users.data?.content ?? []) {
      map.set(entry.user.id, entry.user.fullName || entry.user.username);
    }
    return map;
  }, [users.data]);

  // Map workflow functions for function names and categories
  const functionByCode = useMemo(() => {
    const map = new Map<string, WorkflowFunction>();
    for (const fn of workflowFunctions.data ?? []) {
      map.set(fn.code, fn);
    }
    return map;
  }, [workflowFunctions.data]);

  const allInstances = useMemo(
    () => (instances.isError ? [] : (instances.data?.content ?? [])),
    [instances.data, instances.isError]
  );

  // Map live pending tasks + open organization instances
  const dynamicPendingEntries = useMemo(() => {
    const taskRows = tasksPending.data?.content ?? [];
    const openInstances = (instances.data?.content ?? []).filter((inst) =>
      OPEN_STATUSES.includes(inst.status)
    );

    const taskInstanceIds = new Set<string>();
    const entries: ApprovalEntry[] = [];

    for (const task of taskRows) {
      taskInstanceIds.add(task.instanceId);
      entries.push(mapWorkflowToApprovalEntry(task, nameByUserId, functionByCode));
    }

    for (const inst of openInstances) {
      if (!taskInstanceIds.has(inst.id)) {
        entries.push(mapWorkflowToApprovalEntry(inst, nameByUserId, functionByCode));
      }
    }

    return entries.sort(
      (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
    );
  }, [tasksPending.data, instances.data, nameByUserId, functionByCode]);

  // Map live history (closed tasks + closed organization instances)
  const dynamicHistoryEntries = useMemo(() => {
    const closedTasks = (tasksAll.data?.content ?? []).filter((t) => t.status !== "PENDING");
    const closedInstances = (instances.data?.content ?? []).filter(
      (inst) => !OPEN_STATUSES.includes(inst.status)
    );

    const seenIds = new Set<string>();
    const entries: ApprovalEntry[] = [];

    for (const task of closedTasks) {
      seenIds.add(task.instanceId);
      entries.push(mapWorkflowToApprovalEntry(task, nameByUserId, functionByCode));
    }

    for (const inst of closedInstances) {
      if (!seenIds.has(inst.id)) {
        entries.push(mapWorkflowToApprovalEntry(inst, nameByUserId, functionByCode));
      }
    }

    return entries.sort(
      (a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime()
    );
  }, [tasksAll.data, instances.data, nameByUserId, functionByCode]);

  const sourceEntries = subTab === "pending" ? dynamicPendingEntries : dynamicHistoryEntries;

  const filteredEntries = useMemo(() => {
    let result = sourceEntries;

    // Apply date filter
    if (dateFilter && dateFilter.type !== "all") {
      const range = resolveBaseFilterRange(dateFilter);
      if (range) {
        result = result.filter((entry) => {
          if (!entry.creationDate) return false;
          const d = dayjs(entry.creationDate);
          return !d.isBefore(range.start) && !d.isAfter(range.end);
        });
      }
    }

    // Apply search filter
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((entry) =>
        [
          entry.transactionType,
          entry.refNo,
          entry.payToName,
          entry.payToAccountNo,
          entry.sourceAccountName,
          entry.sourceAccountNo,
          entry.requestedBy,
          entry.pendingOn,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [sourceEntries, dateFilter, search]);

  const pagedEntries = useMemo(
    () => filteredEntries.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [filteredEntries, page]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleDateFilterChange = (filter: BaseFilterValue | null) => {
    setDateFilter(filter);
    setPage(0);
  };

  const handleRowClick = (entry: ApprovalEntry) => {
    const isWorkflowInstance = Boolean(
      entry.transactionId && allInstances.some((i) => i.id === entry.transactionId)
    );

    if (showDetailDialog) {
      setSelectedEntry(entry);
      if (isWorkflowInstance) {
        setOpenWorkflowId(entry.transactionId);
      }
    } else {
      if (isWorkflowInstance) {
        setOpenWorkflowId(entry.transactionId);
      } else {
        setSelectedEntry(entry);
      }
    }
  };

  const handleApprove = async (
    entry?: DetailDialogEntry | null,
    authenticatorRequestId?: string
  ) => {
    const target = (entry as ApprovalEntry) || selectedEntry;
    if (!target) return;
    const workflowId =
      target.transactionId ||
      (allInstances.some((i) => i.id === target.id) ? target.id : target.id);

    if (workflowId && canAct) {
      if (authenticatorRequestId) {
        try {
          await act({
            id: workflowId,
            decision: "APPROVE",
            authenticatorRequestId,
          }).unwrap();
          setSelectedEntry(null);
          setOpenWorkflowId(null);
          showToast("success", {
            title: "Transaction approved",
            message: `${target.transactionType} has been approved.`,
          });
          return;
        } catch (error) {
          showToast("error", toToastError(error, "Could not record approval"));
          return;
        }
      }
      try {
        const authenticator = await raiseApprovalAuthenticator(workflowId).unwrap();
        setOpenWorkflowId(workflowId);
        setPhoneApproval({ authenticator });
        setSelectedEntry(null);
        return;
      } catch (error) {
        showToast("error", toToastError(error, "Couldn't start the phone authorization"));
        return;
      }
    }
  };

  const handleCancel = async (entry?: DetailDialogEntry | null) => {
    const target = (entry as ApprovalEntry) || selectedEntry;
    if (!target) return;
    const workflowId =
      target.transactionId ||
      (allInstances.some((i) => i.id === target.id) ? target.id : target.id);

    if (workflowId && canCancel) {
      try {
        await cancel(workflowId).unwrap();
        setSelectedEntry(null);
        setOpenWorkflowId(null);
        showToast("success", {
          title: "Request cancelled",
          message: `${target.transactionType} has been cancelled.`,
        });
        return;
      } catch (error) {
        showToast("error", toToastError(error, "Couldn't cancel the request"));
        return;
      }
    }
  };

  const handleReject = async (entry?: DetailDialogEntry | null, reason?: string) => {
    const target = (entry as ApprovalEntry) || selectedEntry;
    if (!target) return;
    const workflowId =
      target.transactionId ||
      (allInstances.some((i) => i.id === target.id) ? target.id : target.id);

    if (workflowId && canAct) {
      try {
        await act({ id: workflowId, decision: "REJECT", reason }).unwrap();
        setSelectedEntry(null);
        setOpenWorkflowId(null);
        showToast("success", {
          title: "Transaction rejected",
          message: `${target.transactionType} has been rejected.`,
        });
        return;
      } catch (error) {
        showToast("error", toToastError(error, "Couldn't record your decision"));
        return;
      }
    }
  };

  const onAct = async (decision: "APPROVE" | "REJECT", reason?: string) => {
    if (!openWorkflowId) return;
    if (decision === "APPROVE") {
      try {
        const authenticator = await raiseApprovalAuthenticator(openWorkflowId).unwrap();
        setPhoneApproval({ authenticator, reason });
      } catch (error) {
        showToast("error", toToastError(error, "Couldn't start the phone authorization"));
      }
      return;
    }
    try {
      await act({ id: openWorkflowId, decision, reason }).unwrap();
      showToast("success", {
        title: "Rejected",
        message: "The request is rejected and the remaining steps are skipped.",
      });
      setOpenWorkflowId(null);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't record your decision"));
    }
  };

  const approveWithPhone = async (authenticatorRequestId: string) => {
    if (!openWorkflowId) return;
    await act({
      id: openWorkflowId,
      decision: "APPROVE",
      reason: phoneApproval?.reason,
      authenticatorRequestId,
    }).unwrap();
    showToast("success", {
      title: "Approved",
      message: "If that met the last level, the request is fully approved.",
    });
    setPhoneApproval(null);
    setOpenWorkflowId(null);
  };

  const renewApprovalAuthenticator = async () => {
    if (!openWorkflowId) throw new Error("No request is open");
    return raiseApprovalAuthenticator(openWorkflowId).unwrap();
  };

  const onCancel = async () => {
    if (!openWorkflowId) return;
    try {
      await cancel(openWorkflowId).unwrap();
      showToast("success", {
        title: "Request cancelled",
        message: "The remaining steps were skipped.",
      });
      setOpenWorkflowId(null);
    } catch (error) {
      showToast("error", toToastError(error, "Couldn't cancel the request"));
    }
  };

  if (!canView) {
    return (
      <Alert severity="error" variant="outlined">
        You do not have permission to view approval requests.
      </Alert>
    );
  }

  const isDataLoading =
    tasksPending.isLoading ||
    tasksAll.isLoading ||
    instances.isLoading ||
    users.isLoading ||
    workflowFunctions.isLoading;

  return (
    <Box sx={{ width: "100%" }}>
      {/* 1. Summary Cards dynamically calculated from live pending entries */}
      <ApprovalSummaryCards
        entries={dynamicPendingEntries}
        isLoading={isDataLoading}
      />

      {/* 2. Folder-style Tabs: Pending (count) & History (count) */}
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ alignItems: "flex-end", mt: 4, mb: 0, position: "relative", zIndex: 2 }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => {
            setSubTab("pending");
            setPage(0);
          }}
          sx={[tabSx(subTab === "pending"), { ml: 10.5 }]}
        >
          {`Pending (${dynamicPendingEntries.length})`}
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => {
            setSubTab("history");
            setPage(0);
          }}
          sx={tabSx(subTab === "history")}
        >
          {`History (${dynamicHistoryEntries.length})`}
        </Box>
      </Stack>

      {/* 3. Dynamic Transactions Table with BaseFilter, search, and pagination */}
      <ApprovalTable
        sx={{ borderTopLeftRadius: `${CARD_RADIUS}px`, border: "none" }}
        entries={pagedEntries}
        isLoading={isDataLoading}
        totalCount={filteredEntries.length}
        search={search}
        onSearchChange={handleSearchChange}
        dateFilter={dateFilter}
        onDateFilterChange={handleDateFilterChange}
        page={page}
        rowsPerPage={ROWS_PER_PAGE}
        onPageChange={setPage}
        onRowClick={handleRowClick}
      />

      {/* Detail Dialog with live instance context, approval QR authenticator, and cancel request flow */}
      {showDetailDialog && (
        <DetailDialog
          open={Boolean(selectedEntry)}
          onClose={() => {
            setSelectedEntry(null);
            setOpenWorkflowId(null);
          }}
          entry={selectedEntry}
          onApprove={handleApprove}
          onCancel={handleCancel}
          onReject={handleReject}
          canCancel={canCancel}
          canAct={canAct}
          isApproving={actState.isLoading || raiseAuthenticatorState.isLoading}
          isRejecting={actState.isLoading}
          isCancelling={cancelState.isLoading}
        />
      )}

      {/* InstanceDetailDialog fallback when showDetailDialog is toggled off */}
      {openWorkflowId && (!showDetailDialog || !selectedEntry) && (
        <InstanceDetailDialog
          instanceId={openWorkflowId}
          nameByUserId={nameByUserId}
          canAct={canAct}
          canCancel={canCancel}
          isActing={actState.isLoading || raiseAuthenticatorState.isLoading}
          onAct={onAct}
          onCancel={onCancel}
          onClose={() => setOpenWorkflowId(null)}
        />
      )}

      {/* Mobile / Authenticator QR modal for Approver phone scan */}
      {openWorkflowId && phoneApproval && (
        <AuthenticatorDialog
          key={openWorkflowId}
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
