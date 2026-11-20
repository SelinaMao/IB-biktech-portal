import type { ScheduledTransaction } from "./schedule.types";

export const INITIAL_SCHEDULED_TRANSACTIONS: ScheduledTransaction[] = [];

export const SCHEDULE_TRANSACTION_TYPES = [
  "Own account transfer",
  "Transfer to other bank",
  "Transfer within bank",
  "Bill payment",
  "Bakong transfer",
  "Consumer bill upload",
] as const;

export const SCHEDULE_FREQUENCIES = ["Daily", "Weekly", "Monthly", "Once"] as const;
