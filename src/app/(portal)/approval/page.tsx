"use client";

import { useMemo, useState } from "react";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { resolveBaseFilterRange, type BaseFilterValue } from "@core/components/BaseFilter";
import { CLIENT_PERMISSIONS, useCan, useCanAny } from "@/features/auth";
import {
  useListMyTasksQuery,
  useListInstancesQuery,
  useListWorkflowFunctionsQuery,
  useActOnInstanceMutation,
  type InstanceStatus,
  type WorkflowFunction,
} from "@/features/workflow";
import { useListUsersQuery } from "@/features/user";
import { toToastError } from "@/utils/api-error";
import {
  ApprovalTable,
  ApprovalDetailDialog,
  mapWorkflowToApprovalEntry,
  type ApprovalEntry,
  type ApprovalTab,
  ApprovalSummaryCards,
} from "@/features/approval";

const ROWS_PER_PAGE = 5;
const DEFAULT_FILTER: BaseFilterValue = { type: "all", from: null, to: null };
const OPEN_STATUSES: InstanceStatus[] = ["PENDING", "IN_PROGRESS", "ESCALATED"];

export default function ApprovalPage() {
  const canView = useCanAny([
    CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW,
    CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_EXECUTE,
  ]);
  const canSeeTasks = canView;
  const canAct = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_EXECUTE);

  // Dynamic API queries
  const tasksPending = useListMyTasksQuery({ status: "PENDING" }, { skip: !canSeeTasks });
  const tasksAll = useListMyTasksQuery(undefined, { skip: !canSeeTasks });
  const instances = useListInstancesQuery({ size: 100 }, { skip: !canView });
  const users = useListUsersQuery({ page: 0, size: 200 }, { skip: !canView });
  const workflowFunctions = useListWorkflowFunctionsQuery(undefined, { skip: !canView });

  const [actOnInstance, { isLoading: isActing }] = useActOnInstanceMutation();

  const [tab, setTab] = useState<ApprovalTab>("pending");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>(DEFAULT_FILTER);
  const [page, setPage] = useState(0);
  const [selectedEntry, setSelectedEntry] = useState<ApprovalEntry | null>(null);

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

  const sourceEntries = tab === "pending" ? dynamicPendingEntries : dynamicHistoryEntries;

  const filteredEntries = useMemo(() => {
    let result = sourceEntries;

    // Apply date filter
    if (dateFilter && dateFilter.type !== "all") {
      const range = resolveBaseFilterRange(dateFilter);
      if (range) {
        result = result.filter((entry) => {
          if (!entry.creationDate) return false;
          const d = dayjs(entry.creationDate);
          return (
            (d.isAfter(range.start, "day") || d.isSame(range.start, "day")) &&
            (d.isBefore(range.end, "day") || d.isSame(range.end, "day"))
          );
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
  }, [sourceEntries, search, dateFilter]);

  const pagedEntries = useMemo(
    () => filteredEntries.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [filteredEntries, page]
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleDateFilterChange = (filter: BaseFilterValue) => {
    setDateFilter(filter);
    setPage(0);
  };

  const handleApprove = async (entry: ApprovalEntry, authenticatorRequestId?: string) => {
    const workflowId = entry.transactionId || entry.id;
    if (!workflowId || !canAct) return;

    try {
      await actOnInstance({
        id: workflowId,
        decision: "APPROVE",
        authenticatorRequestId,
      }).unwrap();
      setSelectedEntry(null);
      showToast("success", {
        title: "Transaction approved",
        message: `${entry.transactionType} to ${entry.payToName} has been approved.`,
      });
    } catch (error) {
      showToast("error", toToastError(error, "Could not approve the transaction. Please try again."));
    }
  };

  const handleReject = async (entry: ApprovalEntry, reason: string) => {
    const workflowId = entry.transactionId || entry.id;
    if (!workflowId || !canAct) return;

    try {
      await actOnInstance({ id: workflowId, decision: "REJECT", reason }).unwrap();
      setSelectedEntry(null);
      showToast("error", {
        title: "Transaction rejected",
        message: `${entry.transactionType} to ${entry.payToName} has been rejected.`,
      });
    } catch (error) {
      showToast("error", toToastError(error, "Could not reject the transaction. Please try again."));
    }
  };

  const isDataLoading =
    tasksPending.isLoading ||
    tasksAll.isLoading ||
    instances.isLoading ||
    users.isLoading ||
    workflowFunctions.isLoading;

  return (
    <Box sx={{ width: "100%" }}>
      {/* 1. Summary Cards */}
      <ApprovalSummaryCards entries={dynamicPendingEntries} isLoading={isDataLoading} />

      {/* 2. Tabs: Pending & History */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mt: 4, mb: 2 }}>
        <Box
          component="button"
          type="button"
          onClick={() => {
            setTab("pending");
            setPage(0);
          }}
          sx={{
            border: "none",
            outline: "none",
            cursor: "pointer",
            px: 2.5,
            py: 1,
            borderRadius: "8px",
            bgcolor: tab === "pending" ? "#2764A5" : "transparent",
            color: tab === "pending" ? "#FFFFFF" : "#64748B",
            fontSize: 14,
            fontWeight: tab === "pending" ? 600 : 500,
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            "&:hover": {
              color: tab === "pending" ? "#FFFFFF" : "#0F172A",
              bgcolor: tab === "pending" ? "#20558C" : "#F1F5F9",
            },
          }}
        >
          {`Pending (${dynamicPendingEntries.length})`}
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => {
            setTab("history");
            setPage(0);
          }}
          sx={{
            border: "none",
            outline: "none",
            cursor: "pointer",
            px: 2.5,
            py: 1,
            borderRadius: "8px",
            bgcolor: tab === "history" ? "#2764A5" : "transparent",
            color: tab === "history" ? "#FFFFFF" : "#64748B",
            fontSize: 14,
            fontWeight: tab === "history" ? 600 : 500,
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            "&:hover": {
              color: tab === "history" ? "#FFFFFF" : "#0F172A",
              bgcolor: tab === "history" ? "#20558C" : "#F1F5F9",
            },
          }}
        >
          {`History (${dynamicHistoryEntries.length})`}
        </Box>
      </Stack>

      {/* 3. Transactions Card & Table */}
      <ApprovalTable
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
        onRowClick={setSelectedEntry}
      />

      {/* Transaction Detail Dialog */}
      <ApprovalDetailDialog
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
        onApprove={handleApprove}
        onReject={handleReject}
        isApproving={isActing}
        isRejecting={isActing}
      />
    </Box>
  );
}
