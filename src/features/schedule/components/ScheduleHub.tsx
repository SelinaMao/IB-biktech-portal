"use client";

import { useState } from "react";
import Box from "@mui/material/Box";

import { showToast } from "@core/components/AppToast";
import { useTopBarBreadcrumb } from "@core/layout";
import { INITIAL_SCHEDULED_TRANSACTIONS } from "../schedule.data";
import type { CreateScheduleInput, ScheduledTransaction } from "../schedule.types";
import CreateScheduleDialog from "./CreateScheduleDialog";
import ScheduleDetailDialog from "./ScheduleDetailDialog";
import ScheduleTransactionsTable from "./ScheduleTransactionsTable";

export default function ScheduleHub() {
  const [schedules, setSchedules] = useState<ScheduledTransaction[]>(
    INITIAL_SCHEDULED_TRANSACTIONS,
  );

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
  const [editingSchedule, setEditingSchedule] = useState<ScheduledTransaction | null>(null);
  const [viewingSchedule, setViewingSchedule] = useState<ScheduledTransaction | null>(null);

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
      // Update existing
      setSchedules((prev) =>
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
      // Create new
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

      setSchedules((prev) => [newSchedule, ...prev]);
      showToast("success", {
        title: "Schedule created",
        message: `Schedule for ${input.payToName} (${input.currency} ${input.amount.toLocaleString()}) created.`,
      });
    }

    setEditingSchedule(null);
    setCreateDialogOpen(false);
  };

  // Toggle active / paused
  const handleTogglePause = (schedule: ScheduledTransaction) => {
    const nextStatus = schedule.status === "Active" ? "Paused" : "Active";
    setSchedules((prev) =>
      prev.map((item) =>
        item.id === schedule.id ? { ...item, status: nextStatus } : item,
      ),
    );
    showToast("info", {
      title: nextStatus === "Active" ? "Schedule resumed" : "Schedule paused",
      message: `Transaction ${schedule.refNo} is now ${nextStatus.toLowerCase()}.`,
    });
  };

  // Delete handler
  const handleDeleteSchedule = (schedule: ScheduledTransaction) => {
    setSchedules((prev) => prev.filter((item) => item.id !== schedule.id));
    showToast("success", {
      title: "Schedule removed",
      message: `Schedule ${schedule.refNo} has been deleted.`,
    });
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
    </Box>
  );
}
