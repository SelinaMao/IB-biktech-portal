"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { showToast } from "@core/components/AppToast";
import { font } from "@/theme/palette";
import type { PayrollItem } from "../payroll.types";
import PayrollDetailDialog from "./PayrollDetailDialog";
import PayrollEmptyState from "./PayrollEmptyState";
import PayrollHistoryDialog from "./PayrollHistoryDialog";
import PayrollTable from "./PayrollTable";
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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [pendingList, setPendingList] = useState<PayrollItem[]>([]);
  const [historyList] = useState<PayrollItem[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
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
    setPendingList((prev) => [newPayroll, ...prev]);
    setViewMode("list");
    setActiveTab("pending");
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
    showToast("info", {
      title: "Open approval workflow",
      message: `Payroll ${item.referenceNo} stays pending until a checker approves it in the workflow.`,
    });
    router.push("/approval-workflow");
  };

  const handleRejectPayroll = (item: PayrollItem) => {
    showToast("info", {
      title: "Open approval workflow",
      message: `Payroll ${item.referenceNo} stays pending until a checker records a decision in the workflow.`,
    });
    router.push("/approval-workflow");
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

      {/* History Detail Dialog (Centered Modal matching design) */}
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
