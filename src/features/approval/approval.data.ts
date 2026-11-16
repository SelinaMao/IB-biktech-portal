import type { ApprovalEntry, ApprovalSummary } from "./approval.types";

export const approvalSummary: ApprovalSummary = {
  pendingCount: 0,
  oldestDateText: "No pending items",
  pendingAmountUSDLabel: "USD 0.00",
  pendingAmountKHRLabel: "KHR 0",
  pendingAmountSubLabel: "KHR 0",
  typeBreakdown: [],
};

export const pendingApprovalEntries: ApprovalEntry[] = [];

export const nonFinancialApprovalEntries: ApprovalEntry[] = [];

export const approvalHistoryEntries: ApprovalEntry[] = [];
