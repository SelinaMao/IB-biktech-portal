"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { showToast } from "@core/components/AppToast";
import {
  PAYROLL_STORAGE_KEY_HISTORY,
  PAYROLL_STORAGE_KEY_PENDING,
  type PayrollItem,
} from "../payroll.types";
import PayrollDetailDialog from "./PayrollDetailDialog";
import PayrollEmptyState from "./PayrollEmptyState";
import PayrollHistoryDialog from "./PayrollHistoryDialog";
import PayrollTable from "./PayrollTable";
import UploadPayrollWizard from "./UploadPayrollWizard";

const R = 12; // flare radius for folder-style tab
const OVERLAP = 2; // active tab sinks into the card to seamlessly blend
const PANEL_BG = "#FFFFFF";
const ACTIVE_TEXT = "#2764A5";

const loadStoredList = (key: string): PayrollItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PayrollItem[]) : [];
  } catch {
    return [];
  }
};

const tabSx = (active: boolean) => ({
  border: "none",
  outline: "none",
  cursor: "pointer",
  position: "relative" as const,
  display: "inline-flex",
  alignItems: "center",
  boxSizing: "border-box" as const,
  px: 3,
  fontSize: "14px",
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
        height: 31,
        mb: 0.75,
        borderRadius: "10px",
        bgcolor: "#EDF0F5",
        color: "#0F172A",
        fontWeight: 500,
        "&:hover": { bgcolor: "#E3E8F0" },
      }),
});

export default function PayrollHub() {
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [pendingList, setPendingList] = useState<PayrollItem[]>(() =>
    loadStoredList(PAYROLL_STORAGE_KEY_PENDING),
  );
  const [historyList, setHistoryList] = useState<PayrollItem[]>(() =>
    loadStoredList(PAYROLL_STORAGE_KEY_HISTORY),
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(5);

  // View state: "list" or "upload"
  const [viewMode, setViewMode] = useState<"list" | "upload">("list");

  // Modal / Drawer states
  const [selectedPendingItem, setSelectedPendingItem] = useState<PayrollItem | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PayrollItem | null>(null);

  const isEmpty = pendingList.length === 0 && historyList.length === 0;

  // Filter current active list by search query
  const currentList = activeTab === "pending" ? pendingList : historyList;

  const filteredEntries = useMemo(() => {
    if (!search.trim()) return currentList;
    const q = search.toLowerCase();
    return currentList.filter(
      (item) =>
        item.referenceNo.toLowerCase().includes(q) ||
        item.fileName.toLowerCase().includes(q) ||
        item.sourceAccountName.toLowerCase().includes(q) ||
        item.sourceAccountNumber.toLowerCase().includes(q) ||
        item.processingDate.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q) ||
        String(item.totalAmount).includes(q),
    );
  }, [currentList, search]);

  const handleUploadSuccess = (newPayroll: PayrollItem) => {
    setPendingList((prev) => {
      const updated = [newPayroll, ...prev.filter((p) => p.id !== newPayroll.id)];
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY_PENDING, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    setViewMode("list");
    setActiveTab("pending");
    setPage(0);
    showToast("success", {
      title: "Payroll Submitted",
      message: `Payroll batch ${newPayroll.referenceNo} is waiting for checker approval.`,
    });
  };

  const handleRowClick = (item: PayrollItem) => {
    if (activeTab === "history" || item.status === "Completed") {
      setSelectedHistoryItem(item);
    } else {
      setSelectedPendingItem(item);
    }
  };

  const handleApprovePayroll = (item: PayrollItem) => {
    setPendingList((prev) => {
      const nextPending = prev.filter((p) => p.id !== item.id);
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY_PENDING, JSON.stringify(nextPending));
      } catch {
        // ignore
      }
      return nextPending;
    });
    const approvedItem: PayrollItem = {
      ...item,
      status: "Completed",
    };
    setHistoryList((prev) => {
      const nextHistory = [approvedItem, ...prev.filter((p) => p.id !== approvedItem.id)];
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY_HISTORY, JSON.stringify(nextHistory));
      } catch {
        // ignore
      }
      return nextHistory;
    });
    showToast("success", {
      title: "Payroll Approved",
      message: `Payroll ${item.referenceNo} has been approved.`,
    });
  };

  const handleRejectPayroll = (item: PayrollItem, reason?: string) => {
    setPendingList((prev) => {
      const nextPending = prev.filter((p) => p.id !== item.id);
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY_PENDING, JSON.stringify(nextPending));
      } catch {
        // ignore
      }
      return nextPending;
    });
    const rejectedItem: PayrollItem = {
      ...item,
      status: "Rejected",
      remarks: reason || item.remarks,
    };
    setHistoryList((prev) => {
      const nextHistory = [rejectedItem, ...prev.filter((p) => p.id !== rejectedItem.id)];
      try {
        localStorage.setItem(PAYROLL_STORAGE_KEY_HISTORY, JSON.stringify(nextHistory));
      } catch {
        // ignore
      }
      return nextHistory;
    });
    showToast("info", {
      title: "Payroll Rejected",
      message: `Payroll ${item.referenceNo} has been rejected.`,
    });
  };

  // If currently in upload wizard view
  if (viewMode === "upload") {
    return (
      <UploadPayrollWizard
        onBackToList={() => setViewMode("list")}
        onSuccess={handleUploadSuccess}
      />
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Conditional rendering: Empty State vs Table with data */}
      {isEmpty ? (
        <PayrollEmptyState onMakePayroll={() => setViewMode("upload")} />
      ) : (
        <Box sx={{ width: "100%", pb: 4 }}>
          {/* Page Title */}
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: 22, sm: 26 },
              fontWeight: 700,
              color: "#0F172A",
              mb: 3,
            }}
          >
            Payroll
          </Typography>

          {/* Folder Tabs: Pending (count) & History */}
          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{
              alignItems: "flex-end",
              mt: 0.5,
              mb: 0,
              position: "relative",
              zIndex: 2,
            }}
          >
            <Box
              component="button"
              type="button"
              onClick={() => {
                setActiveTab("pending");
                setPage(0);
              }}
              sx={[tabSx(activeTab === "pending"), { ml: { xs: 2, sm: 3 } }]}
            >
              {`Pending (${pendingList.length})`}
            </Box>

            <Box
              component="button"
              type="button"
              onClick={() => {
                setActiveTab("history");
                setPage(0);
              }}
              sx={tabSx(activeTab === "history")}
            >
              History
            </Box>
          </Stack>

          {/* Main Table Card */}
          <PayrollTable
            entries={filteredEntries}
            search={search}
            onSearchChange={(val) => {
              setSearch(val);
              setPage(0);
            }}
            page={page}
            rowsPerPage={rowsPerPage}
            totalPages={Math.max(1, Math.ceil(filteredEntries.length / rowsPerPage))}
            onPageChange={setPage}
            onUploadClick={() => setViewMode("upload")}
            onRowClick={handleRowClick}
          />
        </Box>
      )}

      {/* History Detail Dialog */}
      <PayrollHistoryDialog
        open={Boolean(selectedHistoryItem)}
        onClose={() => setSelectedHistoryItem(null)}
        item={selectedHistoryItem}
      />

      {/* Pending Detail Dialog */}
      <PayrollDetailDialog
        open={Boolean(selectedPendingItem)}
        onClose={() => setSelectedPendingItem(null)}
        item={selectedPendingItem}
        onApprove={handleApprovePayroll}
        onReject={handleRejectPayroll}
      />
    </Box>
  );
}
