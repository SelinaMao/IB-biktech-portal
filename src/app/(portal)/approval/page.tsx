"use client";

import { useMemo, useState, useEffect } from "react";
import dayjs from "dayjs";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { resolveBaseFilterRange, type BaseFilterValue } from "@core/components/BaseFilter";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { useListMyTasksQuery, useActOnInstanceMutation } from "@/features/workflow";
import { useListUsersQuery } from "@/features/user";
import {
  ApprovalTable,
  ApprovalDetailDialog,
  type ApprovalEntry,
  type ApprovalTab,
  ApprovalSummaryCards,
} from "@/features/approval";

const ROWS_PER_PAGE = 5;
const DEFAULT_FILTER: BaseFilterValue = { type: "last7Days", from: null, to: null };

export default function ApprovalPage() {
  const canSeeTasks = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);
  const canViewUsers = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);

  // Dynamic API queries
  const { data: myTasksData, isLoading: tasksLoading } = useListMyTasksQuery(
    { status: "PENDING" },
    { skip: !canSeeTasks }
  );
  const { data: allTasksData, isLoading: allTasksLoading } = useListMyTasksQuery(
    undefined,
    { skip: !canSeeTasks }
  );
  const [actOnInstance, { isLoading: isActing }] = useActOnInstanceMutation();

  const { data: usersData } = useListUsersQuery(
    { page: 0, size: 200 },
    { skip: !canViewUsers }
  );

  const [category, setCategory] = useState<"financial" | "non-financial">("financial");
  const [tab, setTab] = useState<ApprovalTab>("pending");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterValue>(DEFAULT_FILTER);
  const [page, setPage] = useState(0);

  const [pendingEntries, setPendingEntries] = useState<ApprovalEntry[]>([]);
  const [nonFinancialEntries, setNonFinancialEntries] = useState<ApprovalEntry[]>([]);
  const [historyEntries, setHistoryEntries] = useState<ApprovalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<ApprovalEntry | null>(null);

  // Map users for initiator names
  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of usersData?.content ?? []) {
      map.set(entry.user.id, entry.user.fullName || entry.user.username);
    }
    return map;
  }, [usersData]);

  // Synchronize dynamic API tasks into pendingEntries
  useEffect(() => {
    const tasks = myTasksData?.content ?? [];
    const mapped: ApprovalEntry[] = tasks.map((task) => ({
      id: task.taskId,
      creationDate: task.createdAt,
      transactionType: task.functionName || "Approval Request",
      transactionId: task.instanceId,
      refNo: task.referenceId || task.taskId.slice(0, 12),
      amount: (task as any).amount || 0,
      fee: 0,
      currency: (task as any).currency || "USD",
      payToName: (task as any).payTo || nameByUserId.get(task.initiatedBy) || "Beneficiary",
      payToAccountNo: (task as any).payToAccount || "",
      sourceAccountName: (task as any).sourceAccount || "",
      sourceAccountNo: (task as any).sourceAccountNo || "",
      pendingOn: "You",
      status: (task.status as any) || "PENDING",
    }));
    setPendingEntries(mapped);
  }, [myTasksData, nameByUserId]);

  // Synchronize dynamic history tasks from API
  useEffect(() => {
    if (allTasksData?.content) {
      const nonPending = allTasksData.content.filter((task) => task.status !== "PENDING");
      const mapped: ApprovalEntry[] = nonPending.map((task) => ({
        id: task.taskId,
        creationDate: task.createdAt,
        transactionType: task.functionName || "Approval Request",
        transactionId: task.instanceId,
        refNo: task.referenceId || task.taskId.slice(0, 12),
        amount: (task as any).amount || 0,
        fee: 0,
        currency: (task as any).currency || "USD",
        payToName: (task as any).payTo || nameByUserId.get(task.initiatedBy) || "Beneficiary",
        payToAccountNo: (task as any).payToAccount || "",
        sourceAccountName: (task as any).sourceAccount || "",
        sourceAccountNo: (task as any).sourceAccountNo || "",
        pendingOn: "You",
        status: (task.status as any) || "APPROVED",
      }));
      setHistoryEntries(mapped);
    }
  }, [allTasksData, nameByUserId]);

  const activeCategoryEntries = category === "financial" ? pendingEntries : nonFinancialEntries;
  const sourceEntries = tab === "pending" ? activeCategoryEntries : historyEntries;

  const filteredEntries = useMemo(() => {
    let result = sourceEntries;

    // Apply date filter like account page via resolveBaseFilterRange
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
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    return result;
  }, [sourceEntries, search, dateFilter]);

  const entries = useMemo(
    () => filteredEntries.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE),
    [filteredEntries, page],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleDateFilterChange = (filter: BaseFilterValue) => {
    setDateFilter(filter);
    setPage(0);
  };

  const handleApprove = async (entry: ApprovalEntry) => {
    try {
      if (entry.transactionId) {
        await actOnInstance({ id: entry.transactionId, decision: "APPROVE" }).unwrap();
      }
      if (category === "financial") {
        setPendingEntries((prev) => prev.filter((e) => e.id !== entry.id));
      } else {
        setNonFinancialEntries((prev) => prev.filter((e) => e.id !== entry.id));
      }
      setHistoryEntries((prev) => [{ ...entry, status: "APPROVED" }, ...prev]);
      setSelectedEntry(null);
      showToast("success", {
        title: "Transaction approved",
        message: `${entry.transactionType} to ${entry.payToName} has been approved.`,
      });
    } catch {
      showToast("error", {
        title: "Approval failed",
        message: "Could not approve the transaction. Please try again.",
      });
    }
  };

  const handleReject = async (entry: ApprovalEntry, reason: string) => {
    try {
      if (entry.transactionId) {
        await actOnInstance({ id: entry.transactionId, decision: "REJECT", reason }).unwrap();
      }
      if (category === "financial") {
        setPendingEntries((prev) => prev.filter((e) => e.id !== entry.id));
      } else {
        setNonFinancialEntries((prev) => prev.filter((e) => e.id !== entry.id));
      }
      setHistoryEntries((prev) => [{ ...entry, status: "REJECTED", rejectReason: reason }, ...prev]);
      setSelectedEntry(null);
      showToast("error", {
        title: "Transaction rejected",
        message: `${entry.transactionType} to ${entry.payToName} has been rejected.`,
      });
    } catch {
      showToast("error", {
        title: "Rejection failed",
        message: "Could not reject the transaction. Please try again.",
      });
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* 1. Summary Cards */}
      <ApprovalSummaryCards entries={pendingEntries} isLoading={tasksLoading} />

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
          Pending ({pendingEntries.length})
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
          History
        </Box>
      </Stack>

      {/* 3. Transactions Card & Table */}
      <ApprovalTable
        entries={entries}
        isLoading={tab === "pending" ? tasksLoading : allTasksLoading}
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
