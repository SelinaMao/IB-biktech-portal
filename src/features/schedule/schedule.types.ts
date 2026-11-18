import { formatDate } from "@/utils/date-time";

// ==========================================
// Backend API Schemas (OpenAPI 3.1 Contract)
// ==========================================

export type BackendScheduleStatus =
  | "AWAITING_APPROVAL"
  | "ACTIVE"
  | "PAUSED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type BackendTransferType =
  | "OWN_ACCOUNT"
  | "OTHER_SME_ACCOUNT"
  | "BAKONG_LOCAL_BANK"
  | "BAKONG_WALLET"
  | "BAKONG_SCAN"
  | "BULK";

export type BackendScheduleFrequency = "ONCE" | "WEEKLY" | "MONTHLY";

export interface ScheduleResponse {
  referenceId: string;
  name?: string | null;
  transferType?: BackendTransferType | null;
  transferTypeLabel?: string | null;
  frequency?: BackendScheduleFrequency | null;
  status: BackendScheduleStatus;
  nextRunAt?: string | null;
  amount: number;
  currency: string;
  fromAccountNumber?: string | null;
  fromAccountName?: string | null;
  toAccountNumber?: string | null;
  toAccountName?: string | null;
  toBankName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  dayOfWeek?: string | null;
  dayOfMonth?: number | null;
  timeOfDay?: string | null;
  remark?: string | null;
  createdAt?: string | null;
  changedAt?: string | null;
  failedCount?: number | null;
}

export interface ScheduleDetailResponse {
  schedule: ScheduleResponse;
  pendingCount?: number;
  historyCount?: number;
}

export interface ScheduleRunResponse {
  referenceId: string;
  runNumber?: number | null;
  attempt?: number | null;
  date: string;
  status:
    | "AWAITING_APPROVAL"
    | "ACTIVE"
    | "PAUSED"
    | "PROCESSING"
    | "SUCCESS"
    | "FAILED"
    | "UNCONFIRMED"
    | "CANCELLED";
  externalReference?: string | null;
  amount: number;
  currency: string;
  failureReason?: string | null;
}

export interface PageScheduleRunResponse {
  content: ScheduleRunResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface ScheduleActionRequest {
  action: "PAUSE" | "RESUME" | "CANCEL";
}

// ==========================================
// Frontend Portal View Models
// ==========================================

export type ScheduledTransactionStatus =
  | "Active"
  | "Paused"
  | "Completed"
  | "Cancelled"
  | "Awaiting Approval"
  | "Processing"
  | "Failed";

export type ScheduleFrequency = "Daily" | "Weekly" | "Monthly" | "Once";

export interface ScheduledTransaction {
  id: string;
  date: string;
  time: string;
  transactionType: string;
  refNo: string;
  payToName: string;
  payToAccount: string;
  amount: number;
  currency: "USD" | "KHR" | string;
  status: ScheduledTransactionStatus;
  previousStatus?: ScheduledTransactionStatus;
  frequency?: ScheduleFrequency;
  category?: string;
  startDate?: string;
  endDate?: string;
  remarks?: string;
  fromAccountNumber?: string;
  fromAccountName?: string;
  toBankName?: string;
  nextRunAt?: string;
  failedCount?: number;
  raw?: ScheduleResponse;
}

export type CreateScheduleInput = Omit<ScheduledTransaction, "id" | "refNo" | "status">;

// ==========================================
// Mappers and Helpers
// ==========================================

export function mapBackendStatusToUi(
  status: BackendScheduleStatus | string,
): ScheduledTransactionStatus {
  switch (status?.toUpperCase()) {
    case "ACTIVE":
      return "Active";
    case "PAUSED":
      return "Paused";
    case "COMPLETED":
      return "Completed";
    case "CANCELLED":
      return "Cancelled";
    case "AWAITING_APPROVAL":
      return "Awaiting Approval";
    case "PROCESSING":
      return "Processing";
    case "FAILED":
      return "Failed";
    default:
      return (status as ScheduledTransactionStatus) || "Active";
  }
}

export function mapBackendFrequencyToUi(
  frequency?: BackendScheduleFrequency | string | null,
): ScheduleFrequency {
  switch (frequency?.toUpperCase()) {
    case "ONCE":
      return "Once";
    case "WEEKLY":
      return "Weekly";
    case "MONTHLY":
      return "Monthly";
    case "DAILY":
      return "Daily";
    default:
      return "Monthly";
  }
}

export function formatTimeOfDay(time?: string | null): string {
  if (!time) return "12:00 AM";
  const [hoursStr, minutesStr] = time.split(":");
  const h = parseInt(hoursStr, 10);
  const m = parseInt(minutesStr || "0", 10);
  if (isNaN(h)) return time;
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHours = h % 12 || 12;
  const paddedHours = formattedHours < 10 ? `0${formattedHours}` : `${formattedHours}`;
  const paddedMins = m < 10 ? `0${m}` : `${m}`;
  return `${paddedHours}:${paddedMins} ${ampm}`;
}

export function mapScheduleResponseToTransaction(
  item: ScheduleResponse,
): ScheduledTransaction {
  let displayDate = "-";
  let displayTime = "-";

  if (item.nextRunAt) {
    displayDate = formatDate(item.nextRunAt, "DD MMM YYYY");
    displayTime = formatDate(item.nextRunAt, "hh:mm A");
  } else if (item.startDate) {
    displayDate = formatDate(item.startDate, "DD MMM YYYY");
    displayTime = item.timeOfDay ? formatTimeOfDay(item.timeOfDay) : "-";
  } else if (item.createdAt) {
    displayDate = formatDate(item.createdAt, "DD MMM YYYY");
    displayTime = formatDate(item.createdAt, "hh:mm A");
  }

  const payToName =
    item.toAccountName
      ? item.toBankName
        ? `${item.toAccountName} · ${item.toBankName}`
        : item.toAccountName
      : item.name || "—";

  const payToAccount =
    item.toAccountNumber ||
    (item.toBankName ? item.toBankName : item.name || "—");

  return {
    id: item.referenceId,
    refNo: item.referenceId,
    date: displayDate,
    time: displayTime,
    transactionType: item.transferTypeLabel || item.transferType?.replace(/_/g, " ") || "Scheduled Transfer",
    payToName,
    payToAccount,
    amount: Number(item.amount) || 0,
    currency: (item.currency as "USD" | "KHR") || "USD",
    status: mapBackendStatusToUi(item.status),
    previousStatus: mapBackendStatusToUi(item.status),
    frequency: mapBackendFrequencyToUi(item.frequency),
    startDate: item.startDate || undefined,
    endDate: item.endDate || undefined,
    remarks: item.remark || undefined,
    fromAccountNumber: item.fromAccountNumber || undefined,
    fromAccountName: item.fromAccountName || undefined,
    toBankName: item.toBankName || undefined,
    nextRunAt: item.nextRunAt || undefined,
    failedCount: item.failedCount ?? undefined,
    raw: item,
  };
}
