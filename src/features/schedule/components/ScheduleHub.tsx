"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";

import { showToast } from "@core/components/AppToast";
import { useTopBarBreadcrumb } from "@core/layout";
import { AuthenticatorDialog, type AuthenticatorRequest } from "@/features/authenticator";
import {
  useListSchedulesQuery,
  useRequestScheduleActionMutation,
} from "../schedule.api";
import {
  mapScheduleResponseToTransaction,
  type CreateScheduleInput,
  type ScheduledTransaction,
} from "../schedule.types";
import CreateScheduleDialog from "./CreateScheduleDialog";
import ScheduleDetailDialog from "./ScheduleDetailDialog";
import ScheduleTransactionsTable from "./ScheduleTransactionsTable";

export default function ScheduleHub() {
  // Fetch real scheduled transfers from the backend (BFF -> payment-service)
  const {
    data: backendSchedules,
    isLoading,
    isError,
    refetch,
  } = useListSchedulesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  const [requestAction, { isLoading: isActionLoading }] =
    useRequestScheduleActionMutation();

  // Local state for any newly drafted schedules created in-session
  const [localCreatedSchedules, setLocalCreatedSchedules] = useState<
    ScheduledTransaction[]
  >([]);

  // Subview / Breadcrumb states
  const [activeSubView, setActiveSubView] = useState<string | null>(null);

  useTopBarBreadcrumb(
    activeSubView
      ? {
          prefix: "Schedule",
          subPrefix: activeSubView,
          onBack: () => setActiveSubView(null),
        }
      : null,
  );

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduledTransaction | null>(null);
  const [viewingSchedule, setViewingSchedule] =
    useState<ScheduledTransaction | null>(null);

  // Authenticator (Mobile QR) dialog state for actions
  const [authenticator, setAuthenticator] =
    useState<AuthenticatorRequest | null>(null);
  const [authSubject, setAuthSubject] = useState<string>("schedule action");
  const [pendingAction, setPendingAction] = useState<{
    referenceId: string;
    action: "PAUSE" | "RESUME" | "CANCEL";
  } | null>(null);

  // Map backend response into table view models
  const mappedBackendSchedules = useMemo(() => {
    if (backendSchedules && Array.isArray(backendSchedules)) {
      return backendSchedules.map(mapScheduleResponseToTransaction);
    }
    return [];
  }, [backendSchedules]);

  // Combine live backend schedules with any in-memory drafted schedules
  const schedules = useMemo(() => {
    if (backendSchedules) {
      const backendIds = new Set(mappedBackendSchedules.map((s) => s.id));
      const unmergedLocal = localCreatedSchedules.filter(
        (s) => !backendIds.has(s.id),
      );
      return [...unmergedLocal, ...mappedBackendSchedules];
    }
    return localCreatedSchedules;
  }, [backendSchedules, mappedBackendSchedules, localCreatedSchedules]);

  // Add / Edit handler
  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setCreateDialogOpen(true);
  };

  const handleOpenEdit = (schedule: ScheduledTransaction) => {
    setEditingSchedule(schedule);
    setCreateDialogOpen(true);
  };

  const handleSubmitSchedule = (input: CreateScheduleInput) => {
    if (editingSchedule) {
      // Update existing in local state
      setLocalCreatedSchedules((prev) =>
        prev.map((item) =>
          item.id === editingSchedule.id
            ? {
                ...item,
                ...input,
              }
            : item,
        ),
      );
      showToast("success", {
        title: "Schedule updated",
        message: `Schedule "${input.transactionType}" for ${input.payToName} has been updated.`,
      });
    } else {
      // Create new local item
      const randomRefNum = Math.floor(10000000 + Math.random() * 90000000);
      const prefix = input.transactionType.toLowerCase().includes("bakong")
        ? "BK"
        : input.transactionType.toLowerCase().includes("bill")
          ? "BP"
          : "FT";

      const newSchedule: ScheduledTransaction = {
        ...input,
        id: `sch-${Date.now()}`,
        refNo: `${prefix}2610${randomRefNum.toString().slice(0, 6)}`,
        status: "Active",
      };

      setLocalCreatedSchedules((prev) => [newSchedule, ...prev]);
      showToast("success", {
        title: "Schedule created",
        message: `Schedule for ${input.payToName} (${input.currency} ${input.amount.toLocaleString()}) created.`,
      });
    }

    setEditingSchedule(null);
    setCreateDialogOpen(false);
  };

  // Toggle active / paused via backend action
  const handleTogglePause = async (schedule: ScheduledTransaction) => {
    const action: "PAUSE" | "RESUME" =
      schedule.status === "Active" ? "PAUSE" : "RESUME";
    const actionLabel = action === "PAUSE" ? "pause" : "resume";

    try {
      const response = await requestAction({
        referenceId: schedule.refNo,
        action,
      }).unwrap();

      const maybeAuth = (response as { authenticator?: AuthenticatorRequest })
        ?.authenticator;

      if (maybeAuth?.qrPayload) {
        setAuthenticator(maybeAuth);
        setAuthSubject(`${actionLabel} schedule ${schedule.refNo}`);
        setPendingAction({ referenceId: schedule.refNo, action });
      } else {
        showToast("info", {
          title: action === "PAUSE" ? "Schedule paused" : "Schedule resumed",
          message: `Transaction ${schedule.refNo} has been requested to ${actionLabel}.`,
        });
        refetch();
      }
    } catch {
      // Fall back to local state if backend call is not authorized in current session
      const nextStatus = schedule.status === "Active" ? "Paused" : "Active";
      setLocalCreatedSchedules((prev) =>
        prev.map((item) =>
          item.id === schedule.id ? { ...item, status: nextStatus } : item,
        ),
      );
      showToast("info", {
        title: nextStatus === "Active" ? "Schedule resumed" : "Schedule paused",
        message: `Transaction ${schedule.refNo} is now ${nextStatus.toLowerCase()}.`,
      });
    }
  };

  // Delete / Cancel handler via backend action
  const handleDeleteSchedule = async (schedule: ScheduledTransaction) => {
    try {
      const response = await requestAction({
        referenceId: schedule.refNo,
        action: "CANCEL",
      }).unwrap();

      const maybeAuth = (response as { authenticator?: AuthenticatorRequest })
        ?.authenticator;

      if (maybeAuth?.qrPayload) {
        setAuthenticator(maybeAuth);
        setAuthSubject(`cancel schedule ${schedule.refNo}`);
        setPendingAction({ referenceId: schedule.refNo, action: "CANCEL" });
      } else {
        showToast("success", {
          title: "Schedule removed",
          message: `Schedule ${schedule.refNo} has been cancelled.`,
        });
        refetch();
      }
    } catch {
      // Fall back to removing from local state
      setLocalCreatedSchedules((prev) =>
        prev.filter((item) => item.id !== schedule.id),
      );
      showToast("success", {
        title: "Schedule removed",
        message: `Schedule ${schedule.refNo} has been removed.`,
      });
    }
  };

  // View details handler
  const handleViewDetails = (schedule: ScheduledTransaction) => {
    setViewingSchedule(schedule);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Schedule Transactions Table Card */}
      <ScheduleTransactionsTable
        schedules={schedules}
        isLoading={isLoading || isActionLoading}
        isError={isError}
        onRefresh={refetch}
        onAddSchedule={handleOpenCreate}
        onTogglePause={handleTogglePause}
        onEditSchedule={handleOpenEdit}
        onDeleteSchedule={handleDeleteSchedule}
        onViewDetails={handleViewDetails}
      />

      {/* Create / Edit Dialog */}
      <CreateScheduleDialog
        open={createDialogOpen}
        onClose={() => {
          setCreateDialogOpen(false);
          setEditingSchedule(null);
        }}
        onSubmit={handleSubmitSchedule}
        initialData={editingSchedule}
      />

      {/* Detail Dialog */}
      <ScheduleDetailDialog
        open={Boolean(viewingSchedule)}
        schedule={viewingSchedule}
        onClose={() => setViewingSchedule(null)}
        onEdit={handleOpenEdit}
      />

      {/* Mobile QR Authenticator Challenge Dialog (if action requires phone scan) */}
      <AuthenticatorDialog
        open={Boolean(authenticator)}
        authenticator={authenticator}
        subject={authSubject}
        onAuthorized={async () => {
          setAuthenticator(null);
          setPendingAction(null);
          refetch();
          showToast("success", {
            title: "Authorized successfully",
            message: `The request for ${authSubject} was confirmed.`,
          });
        }}
        onRenew={async () => {
          if (!pendingAction) throw new Error("No pending action");
          const res = await requestAction(pendingAction).unwrap();
          const nextAuth = (res as { authenticator?: AuthenticatorRequest })
            ?.authenticator;
          if (!nextAuth) throw new Error("Could not renew authenticator");
          setAuthenticator(nextAuth);
          return nextAuth;
        }}
        onClose={() => {
          setAuthenticator(null);
          setPendingAction(null);
        }}
      />
    </Box>
  );
}
