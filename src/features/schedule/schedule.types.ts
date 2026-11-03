export type ScheduledTransactionStatus = "Active" | "Paused" | "Completed" | "Cancelled";

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
  currency: "USD" | "KHR";
  status: ScheduledTransactionStatus;
  frequency?: ScheduleFrequency;
  category?: string;
  startDate?: string;
  endDate?: string;
  remarks?: string;
}

export type CreateScheduleInput = Omit<ScheduledTransaction, "id" | "refNo" | "status">;
