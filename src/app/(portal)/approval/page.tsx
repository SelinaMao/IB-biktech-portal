"use client";

import { useMemo, useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { ClipboardClock, FileText, Grid, Smartphone, Wallet } from "lucide-react";

import { showToast } from "@core/components/AppToast";
import BaseFilterByDay, {
  isDateWithinFilter,
  type BaseFilterByDayValue,
} from "@core/components/BaseFilterByDay";
import BaseSwitch from "@core/form/BaseSwitch";
import { palette } from "@/theme/palette";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { useListMyTasksQuery } from "@/features/workflow";
import { useListUsersQuery } from "@/features/user";
import {
  ApprovalTable,
  ApprovalDetailDialog,
  pendingApprovalEntries as initialPendingApprovalEntries,
  nonFinancialApprovalEntries as initialNonFinancialEntries,
  approvalHistoryEntries as initialApprovalHistoryEntries,
  type ApprovalEntry,
  type ApprovalTab,
  ApprovalTypeBreakdownCard,
  ApprovalSummaryCards,
  approvalSummary,
} from "@/features/approval";
import StatCard from "@/features/dashboard/components/StatCard";

const ROWS_PER_PAGE = 5;

export default function ApprovalPage() {
  const canSeeTasks = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);
  const canViewUsers = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);

  // Dynamic API queries
  const { data: myTasksData, isLoading: tasksLoading } = useListMyTasksQuery(
    { status: "PENDING" },
    { skip: !canSeeTasks }
  );
  const { data: usersData } = useListUsersQuery(
    { page: 0, size: 200 },
    { skip: !canViewUsers }
  );

  const [category, setCategory] = useState<"financial" | "non-financial">("financial");
  const [tab, setTab] = useState<ApprovalTab>("pending");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterByDayValue | null>(null);
  const [page, setPage] = useState(0);

  const [pendingEntries, setPendingEntries] = useState(initialPendingApprovalEntries);
  const [nonFinancialEntries, setNonFinancialEntries] = useState(initialNonFinancialEntries);
  const [historyEntries, setHistoryEntries] = useState(initialApprovalHistoryEntries);
  const [selectedEntry, setSelectedEntry] = useState<ApprovalEntry | null>(null);

  // Map users for initiator names
  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of usersData?.content ?? []) {
      map.set(entry.user.id, entry.user.fullName || entry.user.username);
    }
    return map;
  }, [usersData]);

  // Synchronize dynamic API tasks into pendingEntries if API returns records
  useEffect(() => {
    const tasks = myTasksData?.content;
    if (tasks && tasks.length > 0) {
      const mapped = tasks.map((task) => ({
        id: task.taskId,
        creationDate: task.createdAt,
        transactionType: task.functionName,
        transactionId: task.instanceId,
        refNo: task.referenceId || task.taskId.slice(0, 12),
        amount: (task as any).amount || 0,
        fee: 0,
        currency: (task as any).currency || "USD",
        payToName: (task as any).payTo || nameByUserId.get(task.initiatedBy) || "Beneficiary",
        payToAccountNo: (task as any).payToAccount || "001 234 567",
        sourceAccountName: (task as any).sourceAccount || "Operating Account",
        sourceAccountNo: (task as any).sourceAccountNo || "0012 3456 7890",
        pendingOn: "You",
        status: "PENDING" as const,
      }));
      setPendingEntries(mapped);
    }
  }, [myTasksData, nameByUserId]);

  const activeCategoryEntries = category === "financial" ? pendingEntries : nonFinancialEntries;
  const sourceEntries = tab === "pending" ? activeCategoryEntries : historyEntries;

  const filteredEntries = useMemo(() => {
    let result = sourceEntries;

    // Apply date filter via isDateWithinFilter
    if (dateFilter && dateFilter.type !== "all") {
      result = result.filter((entry) => isDateWithinFilter(entry.creationDate, dateFilter));
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

  const handleDateFilterChange = (filter: BaseFilterByDayValue | null) => {
    setDateFilter(filter);
    setPage(0);
  };

  const handleApprove = (entry: ApprovalEntry) => {
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
  };

  const handleReject = (entry: ApprovalEntry, reason: string) => {
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
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* 1. Summary Cards */}
      <ApprovalSummaryCards summary={approvalSummary} entries={pendingEntries} />
      {/* 2. Category Tabs: Financial & Non-financial */}
      <Box sx={{ borderBottom: `1px solid ${palette.slate[200]}`, mt: 4, mb: 2.5 }}>
        <Stack direction="row" spacing={3}>
          {/* Financial Tab */}
          <Box
            component="button"
            type="button"
            onClick={() => {
              setCategory("financial");
              setPage(0);
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              pb: 1.5,
              border: "none",
              borderBottom: category === "financial" ? "2px solid #2764A5" : "2px solid transparent",
              bgcolor: "transparent",
              color: category === "financial" ? "#0F172A" : "#64748B",
              cursor: "pointer",
              fontWeight: category === "financial" ? 600 : 500,
              fontSize: 14,
              transition: "all 0.15s ease",
            }}
          >
            <Wallet size={17} color={category === "financial" ? "#2764A5" : "#64748B"} />
            <span>Financial</span>
            <Box
              sx={{
                bgcolor: category === "financial" ? "#2764A5" : "#E7EEF5",
                color: category === "financial" ? "#FFFFFF" : "#64748B",
                fontSize: 11,
                fontWeight: 600,
                px: 0.9,
                py: 0.2,
                borderRadius: "999px",
                minWidth: 18,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {pendingEntries.length}
            </Box>
          </Box>

          {/* Non-financial Tab */}
          <Box
            component="button"
            type="button"
            onClick={() => {
              setCategory("non-financial");
              setPage(0);
            }}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 1,
              pb: 1.5,
              border: "none",
              borderBottom: category === "non-financial" ? "2px solid #2764A5" : "2px solid transparent",
              bgcolor: "transparent",
              color: category === "non-financial" ? "#0F172A" : "#64748B",
              cursor: "pointer",
              fontWeight: category === "non-financial" ? 600 : 500,
              fontSize: 14,
              transition: "all 0.15s ease",
            }}
          >
            <FileText size={17} color={category === "non-financial" ? "#2764A5" : "#64748B"} />
            <span>Non-financial</span>
            <Box
              sx={{
                bgcolor: category === "non-financial" ? "#2764A5" : "#E7EEF5",
                color: category === "non-financial" ? "#FFFFFF" : "#64748B",
                fontSize: 11,
                fontWeight: 600,
                px: 0.9,
                py: 0.2,
                borderRadius: "999px",
                minWidth: 18,
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {nonFinancialEntries.length}
            </Box>
          </Box>
        </Stack>
      </Box>

      {/* 3. Folder-style Tabs: Pending (5) & History */}
      <Stack direction="row" spacing={0.5} sx={{ alignItems: "flex-end", mb: 0 }}>
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
            px: 3,
            py: 1.35,
            borderRadius: "14px 14px 0 0",
            bgcolor: tab === "pending" ? "#2764A5" : "transparent",
            color: tab === "pending" ? "#FFFFFF" : "#64748B",
            fontSize: 14.5,
            fontWeight: tab === "pending" ? 600 : 500,
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            "&:hover": {
              color: tab === "pending" ? "#FFFFFF" : "#0F172A",
            },
          }}
        >
          {`Pending (${category === "financial" ? pendingEntries.length : nonFinancialEntries.length})`}
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
            px: 3,
            py: 1.35,
            borderRadius: "14px 14px 0 0",
            bgcolor: tab === "history" ? "#2764A5" : "transparent",
            color: tab === "history" ? "#FFFFFF" : "#64748B",
            fontSize: 14.5,
            fontWeight: tab === "history" ? 600 : 500,
            transition: "all 0.15s ease",
            display: "inline-flex",
            alignItems: "center",
            "&:hover": {
              color: tab === "history" ? "#FFFFFF" : "#0F172A",
            },
          }}
        >
          History
        </Box>
      </Stack>

      {/* 4. Transactions Card & Table using BaseSearchButton, BaseFilterByDay, and BasePagination */}
      <ApprovalTable
        sx={{ borderTopLeftRadius: tab === "pending" ? 0 : "16px" }}
        entries={entries}
        isLoading={tasksLoading}
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
      />
    </Box>
  );
}
