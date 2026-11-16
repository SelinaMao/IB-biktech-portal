import dayjs from "dayjs";
import { formatDate } from "@/utils/date-time";
import type { TaskInboxRow, InstanceSummary, WorkflowFunction } from "@/features/workflow";
import type { ApprovalEntry, ApprovalSummary, ApprovalTypeBreakdown } from "./approval.types";

/**
 * Maps a backend workflow task or workflow instance to the UI's ApprovalEntry.
 * Extracts context properties (amount, currency, accounts, beneficiary) dynamically.
 */
export function mapWorkflowToApprovalEntry(
  item: TaskInboxRow | InstanceSummary | (InstanceSummary & { context?: Record<string, unknown> }),
  nameByUserId: Map<string, string>,
  functionByCode?: Map<string, WorkflowFunction>,
): ApprovalEntry {
  const isTask = "taskId" in item;
  const raw = item as any;
  const ctx: Record<string, unknown> = (raw.context as Record<string, unknown> | undefined) || {};

  const id = isTask ? (item as TaskInboxRow).taskId : item.id;
  const transactionId = isTask ? (item as TaskInboxRow).instanceId : item.id;
  const functionCode = item.functionCode || "";
  const fnMeta = functionByCode?.get(functionCode);

  const transactionType =
    item.functionName ||
    fnMeta?.name ||
    (ctx.functionName as string) ||
    (functionCode ? functionCode.replace(/_/g, " ").replace(/:/g, " - ") : "Approval Request");

  const rawAmount =
    raw.amount ??
    ctx.amount ??
    ctx.totalAmount ??
    ctx.originalAmount ??
    ctx.receivedAmount ??
    0;
  const amount = typeof rawAmount === "number" ? rawAmount : Number(rawAmount) || 0;

  const rawFee = raw.fee ?? ctx.fee ?? ctx.feeAmount ?? 0;
  const fee = typeof rawFee === "number" ? rawFee : Number(rawFee) || 0;

  const currency = String(
    raw.currency ??
    ctx.currency ??
    ctx.originalCurrency ??
    ctx.receivedCurrency ??
    "USD"
  ).toUpperCase();

  const initiatorId = item.initiatedBy || raw.initiatedBy || String(ctx.ownerId || "");
  const initiatorName =
    nameByUserId.get(initiatorId) ||
    raw.initiatedByName ||
    (ctx.raisedBy as string) ||
    (initiatorId ? `User ${initiatorId.slice(0, 8)}` : "Requester");

  const payToName =
    raw.payToName ||
    raw.payTo ||
    (ctx.payToName as string) ||
    (ctx.toAccountName as string) ||
    (ctx.beneficiary as string) ||
    (ctx.receiverName as string) ||
    (ctx.ownerName as string) ||
    (Array.isArray(ctx.changes) && (ctx.changes[0] as any)?.subject) ||
    initiatorName;

  const payToAccountNo =
    raw.payToAccountNo ||
    raw.payToAccount ||
    raw.toAccountNumber ||
    (ctx.payToAccountNo as string) ||
    (ctx.payToAccount as string) ||
    (ctx.toAccountNumber as string) ||
    (ctx.targetAccount as string) ||
    (ctx.beneficiaryAccount as string) ||
    "";

  const sourceAccountName =
    raw.sourceAccountName ||
    raw.sourceAccount ||
    raw.fromAccountName ||
    (ctx.sourceAccountName as string) ||
    (ctx.fromAccountName as string) ||
    (ctx.senderAccountName as string) ||
    "Operating Account";

  const sourceAccountNo =
    raw.sourceAccountNo ||
    raw.fromAccountNumber ||
    (ctx.sourceAccountNo as string) ||
    (ctx.fromAccountNumber as string) ||
    (ctx.sourceAccount as string) ||
    "";

  const refNo =
    item.referenceId ||
    raw.refNo ||
    raw.cbsReference ||
    (ctx.referenceId as string) ||
    (ctx.cbsReference as string) ||
    (isTask ? (item as TaskInboxRow).taskId?.slice(0, 12) : item.id?.slice(0, 12)) ||
    "—";

  const isFinancial =
    fnMeta?.approvalCategory === "NON_FINANCIAL"
      ? false
      : fnMeta?.approvalCategory === "FINANCIAL" ||
        (fnMeta?.amountable ?? false) ||
        amount > 0 ||
        functionCode.startsWith("TRANSFER") ||
        functionCode.startsWith("PAYMENT") ||
        functionCode.startsWith("BULK");

  const status = (raw.status as any) || "PENDING";
  const rejectReason =
    raw.rejectReason ||
    raw.reason ||
    (ctx.reason as string) ||
    (ctx.rejectReason as string);

  const pendingOn =
    status === "PENDING"
      ? isTask
        ? "You"
        : raw.awaitingCapabilities?.join(", ") || "Approvers"
      : "Completed";

  return {
    id,
    creationDate: item.createdAt || raw.creationDate || new Date().toISOString(),
    transactionType: String(transactionType),
    transactionId,
    refNo: String(refNo),
    amount,
    fee,
    currency,
    payToName: String(payToName),
    payToAccountNo: String(payToAccountNo),
    sourceAccountName: String(sourceAccountName),
    sourceAccountNo: String(sourceAccountNo),
    pendingOn,
    status,
    rejectReason: rejectReason ? String(rejectReason) : undefined,
    requestedBy: initiatorName,
    category: isFinancial ? "financial" : "non-financial",
  };
}

/**
 * Computes dynamic metrics (counts, oldest date, amounts, type breakdown)
 * directly from live pending entries.
 */
export function computeApprovalSummary(entries: ApprovalEntry[]): ApprovalSummary {
  const pendingCount = entries.length;

  let oldestDateText = "No pending items";
  if (entries.length > 0) {
    const sorted = [...entries]
      .filter((e) => Boolean(e.creationDate))
      .sort((a, b) => new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime());
    if (sorted[0]?.creationDate) {
      oldestDateText = `Oldest from ${formatDate(sorted[0].creationDate, "D MMM YYYY")}`;
    }
  }

  const usdTotal = entries
    .filter((e) => (e.currency || "").toUpperCase() === "USD")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const khrTotal = entries
    .filter((e) => (e.currency || "").toUpperCase() === "KHR")
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const pendingAmountUSDLabel = `USD ${usdTotal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const pendingAmountKHRLabel = `KHR ${khrTotal.toLocaleString("en-US")}`;

  const countByType = new Map<string, number>();
  for (const e of entries) {
    let type = e.transactionType || "Other";
    const lower = type.toLowerCase();
    if (lower.includes("transfer") || lower.includes("bakong")) {
      type = "Transfer";
    } else if (lower.includes("bill") || lower.includes("payment")) {
      type = "Bill payment";
    } else if (lower.includes("payroll")) {
      type = "Payroll";
    } else if (
      lower.includes("role") ||
      lower.includes("user") ||
      lower.includes("limit") ||
      lower.includes("setup")
    ) {
      type = "Admin setup";
    }
    countByType.set(type, (countByType.get(type) || 0) + 1);
  }

  // Ensure standard categories exist so breakdown cards have consistent rows
  if (!countByType.has("Transfer")) countByType.set("Transfer", 0);
  if (!countByType.has("Bill payment")) countByType.set("Bill payment", 0);

  const typeBreakdown: ApprovalTypeBreakdown[] = Array.from(countByType.entries()).map(
    ([label, count]) => ({ label, count })
  );

  return {
    pendingCount,
    oldestDateText,
    pendingAmountUSDLabel,
    pendingAmountKHRLabel,
    pendingAmountSubLabel: pendingAmountKHRLabel,
    typeBreakdown,
  };
}
