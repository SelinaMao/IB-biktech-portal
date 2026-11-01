"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import { ClipboardClock, Smartphone } from "lucide-react";

import { showToast } from "@core/components/AppToast";
import BaseSearchButton from "@core/components/BaseSearchButton";
import BaseTitle from "@core/components/BaseTitle";
import BaseSwitch from "@core/form/BaseSwitch";
import { StatCard, SectionCard } from "@/features/dashboard";
import {
  ApprovalTable,
  ApprovalDetailDialog,
  ApprovalTypeBreakdownCard,
  approvalSummary,
  pendingApprovalEntries as initialPendingApprovalEntries,
  approvalHistoryEntries as initialApprovalHistoryEntries,
  type ApprovalEntry,
  type ApprovalTab,
} from "@/features/approval";
import BaseListSection from "@/@core/components/BaseListSection";
import { font } from "@/theme/palette";

const TAB_OPTIONS: { value: ApprovalTab; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "history", label: "History" },
];

const PAGE_SIZE = 10;

export default function ApprovalPage() {
  const [tab, setTab] = useState<ApprovalTab>("pending");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pendingEntries, setPendingEntries] = useState(initialPendingApprovalEntries);
  const [historyEntries, setHistoryEntries] = useState(initialApprovalHistoryEntries);
  const [selectedEntry, setSelectedEntry] = useState<ApprovalEntry | null>(null);

  const sourceEntries = tab === "pending" ? pendingEntries : historyEntries;

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sourceEntries;
    return sourceEntries.filter((entry) =>
      [entry.transactionType, entry.refNo, entry.payToName, entry.sourceAccountName]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [sourceEntries, search]);

  const entries = useMemo(
    () => filteredEntries.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [filteredEntries, page],
  );

  const handleTabChange = (value: ApprovalTab) => {
    setTab(value);
    setPage(0);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleApprove = (entry: ApprovalEntry) => {
    setPendingEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setHistoryEntries((prev) => [{ ...entry, status: "APPROVED" }, ...prev]);
    setSelectedEntry(null);
    showToast("success", {
      title: "Transaction approved",
      message: `${entry.transactionType} to ${entry.payToName} has been approved.`,
    });
  };

  const handleReject = (entry: ApprovalEntry, reason: string) => {
    setPendingEntries((prev) => prev.filter((e) => e.id !== entry.id));
    setHistoryEntries((prev) => [{ ...entry, status: "REJECTED", rejectReason: reason }, ...prev]);
    setSelectedEntry(null);
    showToast("error", {
      title: "Transaction rejected",
      message: `${entry.transactionType} to ${entry.payToName} has been rejected.`,
    });
  };

  return (
    <Box sx={{ width: "100%" }}>

      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Pending Approval"
            value={String(pendingEntries.length)}
            icon={<ClipboardClock />}
            tone="warning"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
          <StatCard
            label="Pending Amount"
            sub={approvalSummary.pendingAmountKHRLabel}
            value={approvalSummary.pendingAmountUSDLabel}
            icon={<Smartphone />}
            tone="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 12, lg: 4 }}>
          <ApprovalTypeBreakdownCard title="Pending by type" items={approvalSummary.typeBreakdown} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, mb: 3 }}>
        <BaseTitle fontSize={font.size.xxl} fontWeight={font.weight.medium}>
          Approvals
        </BaseTitle>
      </Box>

      <SectionCard
        title="Approval Lists"
        titleSx={{ fontSize: font.size.lg, fontWeight: font.weight.medium, p: 6 }}
        noPadding
        header={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", pl: 6, pr: 6, pt: 3, pb: 3 }}>
            <BaseSearchButton value={search} onChange={handleSearchChange} placeholder="Search approvals…" />
            <BaseSwitch options={TAB_OPTIONS} value={tab} onChange={handleTabChange} />
          </Stack>
        }
      >
        <ApprovalTable
          entries={entries}
          pagination={{
            count: filteredEntries.length,
            page,
            rowsPerPage: PAGE_SIZE,
            onPageChange: setPage,
          }}
          paginationSx={{ px: 5, py: 2 }}
          onRowClick={setSelectedEntry}
        />
      </SectionCard>

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
