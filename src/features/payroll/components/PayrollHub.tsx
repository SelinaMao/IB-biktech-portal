"use client";

import React, { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { font, palette } from "@/theme/palette";
import {
  INITIAL_HISTORY_PAYROLLS,
  INITIAL_PENDING_PAYROLLS,
} from "../payroll.data";
import type { PayrollItem } from "../payroll.types";
import PayrollDetailDialog from "./PayrollDetailDialog";
import PayrollEmptyState from "./PayrollEmptyState";
import PayrollHistoryDrawer from "./PayrollHistoryDrawer";
import PayrollTable from "./PayrollTable";
import UploadPayrollDialog from "./UploadPayrollDialog";
import UploadPayrollWizard from "./UploadPayrollWizard";

const R = 12; // flare radius for folder-style tab
const OVERLAP = 2; // active tab sinks into the card to seamlessly blend
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
  const [pendingList, setPendingList] = useState<PayrollItem[]>(INITIAL_PENDING_PAYROLLS);
  const [historyList, setHistoryList] = useState<PayrollItem[]>(INITIAL_HISTORY_PAYROLLS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(5);

  // View state: "list" or "upload"
  const [viewMode, setViewMode] = useState<"list" | "upload">("list");

  // Toggle for testing Empty State
  const [forceEmptyState, setForceEmptyState] = useState(false);

  // Modal / Drawer states
  const [selectedPendingItem, setSelectedPendingItem] = useState<PayrollItem | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<PayrollItem | null>(null);

  const isEmpty =
    forceEmptyState || (pendingList.length === 0 && historyList.length === 0);

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
    setPendingList((prev) => [newPayroll, ...prev]);
    setViewMode("list");
    setActiveTab("pending");
    setForceEmptyState(false);
    showToast("success", {
      title: "Payroll Submitted",
      message: `Payroll batch ${newPayroll.referenceNo} submitted successfully.`,
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
    setPendingList((prev) => prev.filter((p) => p.id !== item.id));
    const approvedItem: PayrollItem = {
      ...item,
      status: "Completed",
    };
    setHistoryList((prev) => [approvedItem, ...prev]);
    showToast("success", {
      title: "Payroll Approved",
      message: `Payroll ${item.referenceNo} has been approved.`,
    });
  };

  const handleRejectPayroll = (item: PayrollItem) => {
    setPendingList((prev) => prev.filter((p) => p.id !== item.id));
    const rejectedItem: PayrollItem = {
      ...item,
      status: "Rejected",
    };
    setHistoryList((prev) => [rejectedItem, ...prev]);
    showToast("info", {
      title: "Payroll Rejected",
      message: `Payroll ${item.referenceNo} has been rejected.`,
    });
  };

  // If currently in upload wizard view (Images 2, 3, 4)
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
      {/* View Switcher Bar for easy demo */}
      <Stack
        direction="row"
        sx={{
          justifyContent: "flex-end",
          alignItems: "center",
          mb: 1.5,
          gap: 1.5,
        }}
      >
        <Button
          size="small"
          variant="outlined"
          onClick={() => setForceEmptyState((prev) => !prev)}
          sx={{
            fontSize: 12,
            height: 28,
            px: 1.5,
            borderRadius: "6px",
            textTransform: "none",
            color: "#64748B",
            borderColor: palette.slate[200],
            bgcolor: "#FFFFFF",
            "&:hover": { bgcolor: "#F8FAFC", borderColor: palette.slate[300] },
          }}
        >
          {isEmpty ? "Switch to List View" : "Preview Empty State"}
        </Button>
      </Stack>

      {isEmpty ? (
        <PayrollEmptyState onMakePayroll={() => setViewMode("upload")} />
      ) : (
        <>
          {/* Folder Tabs: Pending (5) & History */}
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
                setPage(1);
              }}
              sx={[tabSx(activeTab === "pending"), { ml: { xs: 2, sm: 6 } }]}
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
            totalPages={12}
            onPageChange={setPage}
            onUploadClick={() => setViewMode("upload")}
            onRowClick={handleRowClick}
          />
        </>
      )}

      {/* History Detail Drawer (Image 1) */}
      <PayrollHistoryDrawer
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
