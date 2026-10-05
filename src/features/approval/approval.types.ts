/**
 * Approval domain types — the client-side "Approval Lists" screen shown at
 * /approval (maker-checker queue for transfers, payroll, etc.).
 *
 * TODO(api): no confirmed backend contract for the approvals list/summary
 * exists yet (only `adminApi.DASHBOARD.PENDING_APPROVAL`, which appears to
 * back the dashboard's single pending-count card, not this richer list).
 * Types here are shaped off the mockup; adjust field names once the real
 * endpoint is confirmed and swap `approval.data.ts` for an RTK Query hook,
 * mirroring `src/features/user/user.api.ts`.
 */

export type ApprovalTab = "pending" | "history";

export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED" | (string & {});

type ChipColor = "success" | "warning" | "default" | "error" | "info";

/** Status → label + chip colour. Unknown statuses use the fallback. */
export const APPROVAL_STATUS_META: Record<
  string,
  { label: string; color: ChipColor }
> = {
  PENDING: { label: "Pending", color: "warning" },
  APPROVED: { label: "Approved", color: "success" },
  REJECTED: { label: "Rejected", color: "error" },
};

export const approvalStatusMeta = (status: ApprovalStatus) =>
  APPROVAL_STATUS_META[status] ?? { label: status, color: "default" as const };

/** One row in the Approval Lists table. */
export type ApprovalEntry = {
  id: string;
  /** ISO timestamp. */
  creationDate: string;
  transactionType: string;
  /** Bank-assigned transaction ID, shown on the detail panel. */
  transactionId: string;
  refNo: string;
  amount: number;
  fee: number;
  currency: string;
  payToName: string;
  payToAccountNo: string;
  sourceAccountName: string;
  sourceAccountNo: string;
  /** Who the approval is currently pending on, e.g. "You". */
  pendingOn: string;
  status: ApprovalStatus;
  /** Reason entered by the reviewer when rejecting this entry. */
  rejectReason?: string;
};

/** One row in the "Pending Transaction Type" breakdown card. */
export type ApprovalTypeBreakdown = { label: string; count: number };

export type ApprovalSummary = {
  pendingCount: number;
  pendingAmountKHRLabel: string;
  pendingAmountUSDLabel: string;
  typeBreakdown: ApprovalTypeBreakdown[];
};
