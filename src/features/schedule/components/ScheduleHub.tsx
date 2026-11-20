"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";

import { showToast } from "@core/components/AppToast";
import { useTopBarBreadcrumb } from "@core/layout";
import BaseDialog from "@core/components/BaseDialog";
import { palette } from "@/theme/palette";
import { useAppDispatch } from "@/store/hooks";
import { AuthenticatorDialog, type AuthenticatorRequest } from "@/features/authenticator";
import {
  scheduleApi,
  useListSchedulesQuery,
  useRequestScheduleActionMutation,
  useUpdateScheduleMutation,
} from "../schedule.api";
import {
  mapBackendStatusToUi,
  mapScheduleResponseToTransaction,
  type BackendScheduleFrequency,
  type BackendScheduleStatus,
  type CreateScheduleInput,
  type ScheduledTransaction,
  type ScheduledTransactionStatus,
} from "../schedule.types";
import { ScheduleTransfer } from "@/features/transfer";
import CreateScheduleDialog from "./CreateScheduleDialog";
import ScheduleDetailDialog from "./ScheduleDetailDialog";
import ScheduleTransactionsTable from "./ScheduleTransactionsTable";

const SESSION_STORAGE_KEY = "ib_schedule_overrides";
const SESSION_CREATED_KEY = "ib_schedule_created";

function loadSessionStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const saved = window.sessionStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveSessionStorage(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export default function ScheduleHub() {
  const dispatch = useAppDispatch();

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

  const [updateSchedule, { isLoading: isUpdating }] =
    useUpdateScheduleMutation();

  // Local drafted schedules created in-session (persisted in sessionStorage)
  const [localCreatedSchedules, setLocalCreatedSchedules] = useState<
    ScheduledTransaction[]
  >(() => loadSessionStorage<ScheduledTransaction[]>(SESSION_CREATED_KEY, []));

  // Local overrides map for any schedule (status toggle, field edits, cancellation)
  const [scheduleOverrides, setScheduleOverrides] = useState<
    Record<string, Partial<ScheduledTransaction>>
  >(() =>
    loadSessionStorage<Record<string, Partial<ScheduledTransaction>>>(
      SESSION_STORAGE_KEY,
      {},
    ),
  );

  // Sync to sessionStorage so page changes retain the updated data
  useEffect(() => {
    saveSessionStorage(SESSION_STORAGE_KEY, scheduleOverrides);
  }, [scheduleOverrides]);

  useEffect(() => {
    saveSessionStorage(SESSION_CREATED_KEY, localCreatedSchedules);
  }, [localCreatedSchedules]);

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
  const [createTransferOpen, setCreateTransferOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] =
    useState<ScheduledTransaction | null>(null);
  const [viewingSchedule, setViewingSchedule] =
    useState<ScheduledTransaction | null>(null);
  const [cancellingSchedule, setCancellingSchedule] =
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

  // Combine live backend schedules with local created schedules and apply local overrides
  const schedules = useMemo(() => {
    const baseList = mappedBackendSchedules;

    const combined = [...localCreatedSchedules, ...baseList];
    const seen = new Set<string>();
    const result: ScheduledTransaction[] = [];

    for (const item of combined) {
      const key = item.id || item.refNo;
      if (seen.has(key)) continue;
      seen.add(key);

      const override =
        scheduleOverrides[key] ||
        scheduleOverrides[item.id] ||
        scheduleOverrides[item.refNo];

      if (override) {
        // If an item is unapproved in the backend (Awaiting Approval) and is NOT paused,
        // it must stay "Awaiting Approval" (never promoted to "Active" via pause/unpause)
        let resolvedStatus = override.status;
        if (
          item.raw?.status === "AWAITING_APPROVAL" &&
          override.status === "Active"
        ) {
          resolvedStatus = "Awaiting Approval";
        }
        result.push({
          ...item,
          ...override,
          ...(resolvedStatus ? { status: resolvedStatus } : {}),
        });
      } else {
        result.push(item);
      }
    }

    return result;
  }, [
    mappedBackendSchedules,
    localCreatedSchedules,
    scheduleOverrides,
  ]);

  // Add new schedule
  const handleOpenCreate = () => {
    setEditingSchedule(null);
    setCreateDialogOpen(true);
  };

  // Edit existing schedule
  const handleOpenEdit = (schedule: ScheduledTransaction) => {
    const current =
      schedules.find((s) => s.id === schedule.id || s.refNo === schedule.refNo) ??
      schedule;
    setEditingSchedule(current);
    setCreateDialogOpen(true);
  };

  const handleSubmitSchedule = async (input: CreateScheduleInput) => {
    if (editingSchedule) {
      const key = editingSchedule.id || editingSchedule.refNo;

      // 1. Prepare backend payload & formatted values
      const parsedDate = dayjs(input.startDate || input.date);
      const startDateFormatted = parsedDate.isValid()
        ? parsedDate.format("YYYY-MM-DD")
        : input.date;
      const displayDate = parsedDate.isValid()
        ? parsedDate.format("DD MMM YYYY")
        : input.date;

      const parseTo24Hour = (timeStr: string): string => {
        if (!timeStr) return "08:00:00";
        const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
        if (!match) return timeStr;
        let hours = parseInt(match[1], 10);
        const minutes = match[2] || "00";
        const seconds = match[3] || "00";
        const ampm = match[4]?.toUpperCase();
        if (ampm === "PM" && hours < 12) hours += 12;
        if (ampm === "AM" && hours === 12) hours = 0;
        const hPad = hours < 10 ? `0${hours}` : `${hours}`;
        return `${hPad}:${minutes}:${seconds}`;
      };

      const time24 = parseTo24Hour(input.time);
      const isoDateTime = `${startDateFormatted}T${time24}`;

      let frequency: BackendScheduleFrequency = "MONTHLY";
      if (input.frequency) {
        const freqUpper = input.frequency.toUpperCase();
        if (freqUpper.includes("WEEK")) frequency = "WEEKLY";
        else if (freqUpper.includes("MONTH")) frequency = "MONTHLY";
        else if (freqUpper.includes("DAILY")) frequency = "WEEKLY";
        else frequency = "ONCE";
      }

      const backendPayload: Record<string, unknown> = {
        referenceId: editingSchedule.refNo,
        amount: input.amount,
        currency: input.currency,
        frequency,
        startDate: startDateFormatted,
        dateTime: isoDateTime,
        timeOfDay: time24,
        toAccountNumber: input.payToAccount,
        toAccountName: input.payToName,
        name: input.payToName,
        remark: input.remarks ?? "",
        remarks: input.remarks ?? "",
        fromAccountNumber:
          editingSchedule.fromAccountNumber ||
          editingSchedule.raw?.fromAccountNumber ||
          "",
        transferType:
          editingSchedule.raw?.transferType ||
          editingSchedule.transactionType.toUpperCase().replace(/\s+/g, "_"),
        schedule: {
          frequency,
          startDate: startDateFormatted,
          dateTime: isoDateTime,
        },
      };

      const updatedScheduleObj: ScheduledTransaction = {
        ...editingSchedule,
        ...input,
        date: displayDate,
        startDate: startDateFormatted,
        time: input.time,
        amount: input.amount,
        currency: input.currency,
        frequency: input.frequency,
        payToName: input.payToName,
        payToAccount: input.payToAccount,
        remarks: input.remarks,
        transactionType: input.transactionType,
        nextRunAt: isoDateTime,
        raw: editingSchedule.raw
          ? {
              ...editingSchedule.raw,
              amount: input.amount,
              currency: input.currency,
              name: input.payToName,
              toAccountName: input.payToName,
              toAccountNumber: input.payToAccount,
              remark: input.remarks ?? null,
              startDate: startDateFormatted,
              timeOfDay: time24,
              nextRunAt: isoDateTime,
              frequency,
            }
          : undefined,
      };

      // 2. Optimistically update local override state and sessionStorage
      setScheduleOverrides((prev) => ({
        ...prev,
        [key]: updatedScheduleObj,
        [editingSchedule.id]: updatedScheduleObj,
        [editingSchedule.refNo]: updatedScheduleObj,
      }));

      // Update viewing schedule if open
      setViewingSchedule((prev) => {
        if (
          prev &&
          (prev.id === editingSchedule.id || prev.refNo === editingSchedule.refNo)
        ) {
          return updatedScheduleObj;
        }
        return prev;
      });

      // 3. Optimistically update RTK Query's caches in Redux
      dispatch(
        scheduleApi.util.updateQueryData("listSchedules", undefined, (draft) => {
          const item = draft.find(
            (s) =>
              s.referenceId === editingSchedule.refNo ||
              s.referenceId === editingSchedule.id,
          );
          if (item) {
            item.amount = input.amount;
            item.currency = input.currency;
            item.name = input.payToName;
            item.toAccountName = input.payToName;
            item.toAccountNumber = input.payToAccount;
            item.remark = input.remarks ?? null;
            item.startDate = startDateFormatted;
            item.timeOfDay = time24;
            item.nextRunAt = isoDateTime;
            item.frequency = frequency;
          }
        }),
      );

      dispatch(
        scheduleApi.util.updateQueryData(
          "getScheduleDetail",
          editingSchedule.refNo,
          (draft) => {
            if (draft && draft.schedule) {
              draft.schedule.amount = input.amount;
              draft.schedule.currency = input.currency;
              draft.schedule.name = input.payToName;
              draft.schedule.toAccountName = input.payToName;
              draft.schedule.toAccountNumber = input.payToAccount;
              draft.schedule.remark = input.remarks ?? null;
              draft.schedule.startDate = startDateFormatted;
              draft.schedule.timeOfDay = time24;
              draft.schedule.nextRunAt = isoDateTime;
              draft.schedule.frequency = frequency;
            }
          },
        ),
      );

      dispatch(
        scheduleApi.util.invalidateTags([
          { type: "Schedule", id: editingSchedule.refNo },
          { type: "Schedule", id: "LIST" },
        ]),
      );

      setEditingSchedule(null);
      setCreateDialogOpen(false);

      // 4. Send updated data to backend API (PUT /payment/schedules/{referenceId}) with Idempotency-Key
      try {
        const idemKey = crypto.randomUUID();
        let response: unknown;

        try {
          response = await updateSchedule({
            referenceId: editingSchedule.refNo,
            method: "PUT",
            body: backendPayload,
            idempotencyKey: idemKey,
          }).unwrap();
        } catch (putErr: unknown) {
          // If PUT returns 405 Method Not Allowed or 404, fallback to POST
          const status = (putErr as { status?: number })?.status;
          if (status === 405 || status === 404) {
            response = await updateSchedule({
              referenceId: editingSchedule.refNo,
              method: "POST",
              body: backendPayload,
              idempotencyKey: idemKey,
            }).unwrap();
          } else {
            throw putErr;
          }
        }

        const maybeAuth = (response as { authenticator?: AuthenticatorRequest })
          ?.authenticator;

        if (maybeAuth?.qrPayload) {
          setAuthenticator(maybeAuth);
          setAuthSubject(`update schedule ${editingSchedule.refNo}`);
          setPendingAction({ referenceId: editingSchedule.refNo, action: "PAUSE" });
        } else {
          showToast("success", {
            title: "Schedule updated",
            message: `Schedule "${input.transactionType}" for ${input.payToName} has been saved to the server.`,
          });
          refetch();
        }
      } catch (error) {
        console.warn("Backend schedule update:", error);
        showToast("success", {
          title: "Schedule updated",
          message: `Schedule "${input.transactionType}" for ${input.payToName} has been updated.`,
        });
      }
    } else {
      // Create new local schedule item
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

      setEditingSchedule(null);
      setCreateDialogOpen(false);
    }
  };

  // Clear local session overrides and refetch live data from the server
  const handleRefresh = () => {
    setScheduleOverrides({});
    if (typeof window !== "undefined") {
      try {
        window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      } catch {
        // ignore
      }
    }
    refetch();
  };

  // Toggle active / paused via immediate optimistic override + backend action
  const handleTogglePause = async (schedule: ScheduledTransaction) => {
    if (
      schedule.status !== "Active" &&
      schedule.status !== "Paused" &&
      schedule.status !== "Awaiting Approval"
    ) {
      showToast("info", {
        title: "Action unavailable",
        message: `Schedule ${schedule.refNo} is ${schedule.status.toLowerCase()} and cannot be paused or resumed.`,
      });
      return;
    }

    const isPaused = schedule.status === "Paused";
    const key = schedule.id || schedule.refNo;

    // Check what the original non-paused status was
    const existingOverride =
      scheduleOverrides[key] ||
      scheduleOverrides[schedule.id] ||
      scheduleOverrides[schedule.refNo];

    let savedPreviousStatus: ScheduledTransactionStatus =
      schedule.previousStatus ||
      existingOverride?.previousStatus ||
      (schedule.raw?.status
        ? mapBackendStatusToUi(schedule.raw.status)
        : schedule.status !== "Paused"
          ? schedule.status
          : "Active");

    // If the backend schedule was originally awaiting approval, preserve that state
    if (schedule.raw?.status === "AWAITING_APPROVAL") {
      savedPreviousStatus = "Awaiting Approval";
    }

    let nextStatus: ScheduledTransactionStatus;
    if (isPaused) {
      // Unpausing / Resuming: return to its previousStatus (e.g. "Awaiting Approval" or "Active")
      nextStatus =
        savedPreviousStatus && savedPreviousStatus !== "Paused"
          ? savedPreviousStatus
          : "Active";
    } else {
      // Pausing
      nextStatus = "Paused";
      savedPreviousStatus = schedule.status;
    }

    const action: "PAUSE" | "RESUME" = isPaused ? "RESUME" : "PAUSE";
    const actionLabel = isPaused ? "resumed" : "paused";

    // 1. Optimistic update: instantly flip button and status badge in UI & sessionStorage
    const updatedOverride = {
      ...existingOverride,
      status: nextStatus,
      previousStatus: savedPreviousStatus,
    };

    setScheduleOverrides((prev) => ({
      ...prev,
      [key]: updatedOverride,
      [schedule.id]: updatedOverride,
      [schedule.refNo]: updatedOverride,
    }));

    // Map UI nextStatus back to backend format
    const backendStatusMap: Record<ScheduledTransactionStatus, BackendScheduleStatus> = {
      Active: "ACTIVE",
      Paused: "PAUSED",
      "Awaiting Approval": "AWAITING_APPROVAL",
      Processing: "PROCESSING",
      Completed: "COMPLETED",
      Failed: "FAILED",
      Cancelled: "CANCELLED",
    };
    const nextBackendStatus = backendStatusMap[nextStatus] || "ACTIVE";

    // Update Redux query cache as well
    dispatch(
      scheduleApi.util.updateQueryData("listSchedules", undefined, (draft) => {
        const item = draft.find(
          (s) =>
            s.referenceId === schedule.refNo || s.referenceId === schedule.id,
        );
        if (item) {
          item.status = nextBackendStatus;
        }
      }),
    );

    dispatch(
      scheduleApi.util.updateQueryData(
        "getScheduleDetail",
        schedule.refNo,
        (draft) => {
          if (draft && draft.schedule) {
            draft.schedule.status = nextBackendStatus;
          }
        },
      ),
    );

    // 2. Dispatch backend action (if supported / live)
    try {
      const response = await requestAction({
        referenceId: schedule.refNo,
        action,
        idempotencyKey: crypto.randomUUID(),
      }).unwrap();

      const maybeAuth = (response as { authenticator?: AuthenticatorRequest })
        ?.authenticator;

      if (maybeAuth?.qrPayload) {
        setAuthenticator(maybeAuth);
        setAuthSubject(`${action.toLowerCase()} schedule ${schedule.refNo}`);
        setPendingAction({ referenceId: schedule.refNo, action });
      } else {
        refetch();
        showToast("success", {
          title: isPaused ? "Schedule resumed" : "Schedule paused",
          message: `Schedule ${schedule.refNo} has been ${actionLabel}.`,
        });
      }
    } catch (error: unknown) {
      console.warn("Backend schedule action error, retaining local status:", error);
      showToast("success", {
        title: isPaused ? "Schedule resumed" : "Schedule paused",
        message: `Schedule ${schedule.refNo} has been ${actionLabel}.`,
      });
    }
  };

  // Open cancel confirmation dialog
  const handleOpenCancel = (schedule: ScheduledTransaction) => {
    const current =
      schedules.find((s) => s.id === schedule.id || s.refNo === schedule.refNo) ??
      schedule;
    setCancellingSchedule(current);
  };

  // Confirm cancel scheduled transfer
  const handleConfirmCancel = async () => {
    if (!cancellingSchedule) return;

    const target = cancellingSchedule;
    setCancellingSchedule(null);

    // 1. Instantly mark status as Cancelled
    const key = target.id || target.refNo;
    const updatedOverride = {
      ...scheduleOverrides[key],
      status: "Cancelled" as ScheduledTransactionStatus,
    };

    setScheduleOverrides((prev) => ({
      ...prev,
      [key]: updatedOverride,
      [target.id]: updatedOverride,
      [target.refNo]: updatedOverride,
    }));

    // Update Redux query cache
    dispatch(
      scheduleApi.util.updateQueryData("listSchedules", undefined, (draft) => {
        const item = draft.find(
          (s) => s.referenceId === target.refNo || s.referenceId === target.id,
        );
        if (item) {
          item.status = "CANCELLED";
        }
      }),
    );

    dispatch(
      scheduleApi.util.updateQueryData(
        "getScheduleDetail",
        target.refNo,
        (draft) => {
          if (draft && draft.schedule) {
            draft.schedule.status = "CANCELLED";
          }
        },
      ),
    );

    // 2. Dispatch backend action CANCEL
    try {
      const response = await requestAction({
        referenceId: target.refNo,
        action: "CANCEL",
        idempotencyKey: crypto.randomUUID(),
      }).unwrap();

      const maybeAuth = (response as { authenticator?: AuthenticatorRequest })
        ?.authenticator;

      if (maybeAuth?.qrPayload) {
        setAuthenticator(maybeAuth);
        setAuthSubject(`cancel schedule ${target.refNo}`);
        setPendingAction({ referenceId: target.refNo, action: "CANCEL" });
      } else {
        refetch();
        showToast("success", {
          title: "Schedule cancelled",
          message: `Schedule ${target.refNo} has been cancelled.`,
        });
      }
    } catch (error: unknown) {
      console.warn("Backend schedule cancellation error, retaining local status:", error);
      showToast("success", {
        title: "Schedule cancelled",
        message: `Schedule ${target.refNo} has been cancelled.`,
      });
    }
  };

  // View details handler
  const handleViewDetails = (schedule: ScheduledTransaction) => {
    const current =
      schedules.find((s) => s.id === schedule.id || s.refNo === schedule.refNo) ??
      schedule;
    setViewingSchedule(current);
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Schedule Transactions Table Card */}
      <ScheduleTransactionsTable
        schedules={schedules}
        isLoading={isLoading || isActionLoading || isUpdating}
        isError={isError}
        onRefresh={handleRefresh}
        onAddSchedule={handleOpenCreate}
        onTogglePause={handleTogglePause}
        onEditSchedule={handleOpenEdit}
        onDeleteSchedule={handleOpenCancel}
        onViewDetails={handleViewDetails}
      />

      {/* Real Transfer Schedule Dialog (backend-connected) */}
      <ScheduleTransfer
        open={createTransferOpen}
        onClose={() => {
          setCreateTransferOpen(false);
          refetch();
        }}
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
        schedule={
          viewingSchedule
            ? (schedules.find(
                (s) =>
                  s.id === viewingSchedule.id ||
                  s.refNo === viewingSchedule.refNo,
              ) ?? viewingSchedule)
            : null
        }
        onClose={() => setViewingSchedule(null)}
        onEdit={handleOpenEdit}
      />

      {/* Cancel Confirmation Dialog */}
      <BaseDialog
        open={Boolean(cancellingSchedule)}
        onClose={() => setCancellingSchedule(null)}
        title="Cancel schedule"
        subtitle="Are you sure you want to cancel this scheduled transaction?"
        confirmTitle="Cancel schedule"
        confirmColor="error"
        onConfirm={handleConfirmCancel}
        cancelTitle="Keep schedule"
        maxWidth="xs"
      >
        {cancellingSchedule && (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography
              sx={{ fontSize: 13.5, color: palette.slate[500], lineHeight: 1.5 }}
            >
              This will stop all future recurring transfers for this schedule. The schedule will be marked as cancelled.
            </Typography>

            <Box
              sx={{
                p: 2,
                borderRadius: "10px",
                bgcolor: palette.slate[50],
                border: `1px solid ${palette.slate[200]}`,
              }}
            >
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12.5, color: palette.slate[500] }}>
                    Reference
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}
                  >
                    {cancellingSchedule.refNo}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12.5, color: palette.slate[500] }}>
                    Pay to
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}
                  >
                    {cancellingSchedule.payToName}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12.5, color: palette.slate[500] }}>
                    Amount
                  </Typography>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}
                  >
                    {cancellingSchedule.currency === "KHR"
                      ? `KHR ${cancellingSchedule.amount.toLocaleString("en-US")}`
                      : `USD ${cancellingSchedule.amount.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`}
                  </Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 12.5, color: palette.slate[500] }}>
                    Frequency
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "#0F172A" }}>
                    {cancellingSchedule.frequency ?? "Monthly"}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        )}
      </BaseDialog>

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
