"use client";

import { useMemo, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { FileText, Wallet } from "lucide-react";

import { showToast } from "@core/components/AppToast";
import BaseFilterByDay, {
  isDateWithinFilter,
  type BaseFilterByDayValue,
} from "@core/components/BaseFilterByDay";
import BaseSwitch from "@core/form/BaseSwitch";
import {
  ApprovalTable,
  ApprovalDetailDialog,
  ApprovalSummaryCards,
  approvalSummary,
  pendingApprovalEntries as initialPendingApprovalEntries,
  nonFinancialApprovalEntries as initialNonFinancialEntries,
  approvalHistoryEntries as initialApprovalHistoryEntries,
  type ApprovalEntry,
  type ApprovalTab,
} from "@/features/approval";
import { CLIENT_PERMISSIONS, useCan } from "@/features/auth";
import { AuthenticatorDialog, type AuthenticatorRequest } from "@/features/authenticator";
import { useListUsersQuery } from "@/features/user";
import {
  InstanceDetailDialog,
  useActOnInstanceMutation,
  useCancelInstanceMutation,
  useListInstancesQuery,
  useRaiseApprovalAuthenticatorMutation,
  useListMyTasksQuery,
  type InstanceStatus,
} from "@/features/workflow";
import { font, palette } from "@/theme/palette";
import { toToastError } from "@/utils/api-error";

const ROWS_PER_PAGE = 5;
const OPEN_STATUSES: InstanceStatus[] = ["PENDING", "IN_PROGRESS", "ESCALATED"];
const R = 12;            // flare radius
const CARD_RADIUS = 16;  // must match ApprovalTable's top-left radius
const OVERLAP = 2;       // active tab sinks into the card to hide its top edge
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
      // box-shadow trick: crisp concave corners, no gradient seam
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
      mb: 0.75, // lifted above the card (use mb: 2 for a bigger gap)
      borderRadius: "10px",
      bgcolor: "#EDF0F5",
      color: "#0F172A",
      fontWeight: 500,
      "&:hover": { bgcolor: "#E3E8F0" },
    }),
});
export default function ApprovalRequestsPage() {
  const canView = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);
  const canSeeTasks = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_VIEW);
  const canAct = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_EXECUTE);
  const canCancel = useCan(CLIENT_PERMISSIONS.WORKFLOW.INSTANCE_CANCEL);

  const [category, setCategory] = useState<"financial" | "non-financial">("financial");
  const [subTab, setSubTab] = useState<ApprovalTab>("pending");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState<BaseFilterByDayValue | null>(null);
  const [page, setPage] = useState(0);

  // Local fallback entries to guarantee the mockup is shown if the API returns empty
  const [localPendingEntries, setLocalPendingEntries] = useState(initialPendingApprovalEntries);
  const [localNonFinancialEntries, setLocalNonFinancialEntries] = useState(initialNonFinancialEntries);
  const [localHistoryEntries, setLocalHistoryEntries] = useState(initialApprovalHistoryEntries);

  const [openWorkflowId, setOpenWorkflowId] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ApprovalEntry | null>(null);

  const tasks = useListMyTasksQuery({ status: "PENDING" }, { skip: !canSeeTasks });
  const instances = useListInstancesQuery({ size: 50 }, { skip: !canView });
  const users = useListUsersQuery({ page: 0, size: 200 }, { skip: !canView });

  const [act, actState] = useActOnInstanceMutation();
  const [cancel] = useCancelInstanceMutation();
  const [raiseApprovalAuthenticator, raiseAuthenticatorState] = useRaiseApprovalAuthenticatorMutation();

  const [phoneApproval, setPhoneApproval] = useState<{
    authenticator: AuthenticatorRequest;
    reason?: string;
  } | null>(null);

  const nameByUserId = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of users.data?.content ?? []) {
      map.set(entry.user.id, entry.user.fullName || entry.user.username);
    }
    return map;
  }, [users.data]);

  const myTasks = useMemo(() => tasks.data?.content ?? [], [tasks.data]);
  const allInstances = useMemo(
    () => (instances.isError ? [] : (instances.data?.content ?? [])),
    [instances.data, instances.isError],
  );

  // Map real backend workflow tasks if present, otherwise fall back to fixed mock data
  const financialPending = useMemo(() => {
    if (myTasks.length > 0) {
      return myTasks.map((task) => ({
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
        sourceAccountName: (task as any).sourceAccount || "Operating",
        sourceAccountNo: (task as any).sourceAccountNo || "0012 3456 7890",
        pendingOn: "You",
        status: "PENDING",
      }));
    }
    return localPendingEntries;
  }, [myTasks, nameByUserId, localPendingEntries]);

  const activeCategoryEntries = category === "financial" ? financialPending : localNonFinancialEntries;
  const sourceEntries = subTab === "pending" ? activeCategoryEntries : localHistoryEntries;

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

  const pagedEntries = useMemo(
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

  const handleRowClick = (entry: ApprovalEntry) => {
    if (entry.transactionId && allInstances.some((i) => i.id === entry.transactionId)) {
      setOpenWorkflowId(entry.transactionId);
    } else {
      setSelectedEntry(entry);
    }
  };

  const handleApprove = (entry: ApprovalEntry) => {
    if (category === "financial") {
      setLocalPendingEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } else {
      setLocalNonFinancialEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
    setLocalHistoryEntries((prev) => [{ ...entry, status: "APPROVED" }, ...prev]);
    setSelectedEntry(null);
    showToast("success", {
      title: "Transaction approved",
      message: `${entry.transactionType} to ${entry.payToName} has been approved.`,
    });
  };

  const handleReject = (entry: ApprovalEntry, reason: string) => {
    if (category === "financial") {
      setLocalPendingEntries((prev) => prev.filter((e) => e.id !== entry.id));
    } else {
      setLocalNonFinancialEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
    setLocalHistoryEntries((prev) => [{ ...entry, status: "REJECTED", rejectReason: reason }, ...prev]);
    setSelectedEntry(null);
    showToast("error", {
      title: "Transaction rejected",
      message: `${entry.transactionType} to ${entry.payToName} has been rejected.`,
    });
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

  return (
    <Box sx={{ width: "100%" }}>
      {/* 1. Summary Cards */}
      <ApprovalSummaryCards
        pendingCount={financialPending.length}
        entries={financialPending}
        summary={approvalSummary}
      />
      {/* 3. Folder-style Tabs: Pending (5) & History */}
      <Stack
        direction="row"
        spacing={1.5}
        useFlexGap
        sx={{ alignItems: "flex-end", mt: 4, mb: 0, position: "relative", zIndex: 2 }}
      >
        <Box
          component="button"
          type="button"
          onClick={() => { setSubTab("pending"); setPage(0); }}
          sx={[tabSx(subTab === "pending"), { ml: 10.5 }]}   // 36px marginLeft
        >
          {`Pending (${category === "financial" ? financialPending.length : localNonFinancialEntries.length})`}
        </Box>

        <Box
          component="button"
          type="button"
          onClick={() => { setSubTab("history"); setPage(0); }}
          sx={tabSx(subTab === "history")}
        >
          History
        </Box>
      </Stack>

      {/* 4. Transactions Card & Table matching new UI with BaseSearchButton, BaseFilterByDay, and BasePagination */}
      <ApprovalTable
        sx={{ borderTopLeftRadius: `${CARD_RADIUS}px`, border: "none" }}
        entries={pagedEntries}
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

      {/* Dialogs */}
      <ApprovalDetailDialog
        open={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
        entry={selectedEntry}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {openWorkflowId && (
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
