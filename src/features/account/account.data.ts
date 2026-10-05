import type { CashFlowPoint } from "@core/components/CashFlowChartPanel";
import type {
  AccountBalances,
  BankAccountListItem,
  CompanyProfile,
  IAccountDetailResponses,
  RolloverOption,
  RolloverOptionCode,
  TTransactionDetailResponse,
} from "./account.types";

/** Mock data for the Account page. Replace with RTK Query endpoints when wired. */

export const accountSummary = {
  balanceKhr: 16_800_000,
  balanceUsd: 12_781.68,
};

/** Maps each "Latest Transactions" date-range option's label to how many trailing
 *  days it covers — shared by `TransactionsList` (renders the picker) and
 *  `account/page.tsx` (turns the pick into `listTransactions`'s startedDate). */
export const TRANSACTION_DATE_RANGE_DAYS: Record<string, number> = {
  "Last 7 days": 7,
  "Last 30 days": 30,
  "Last 90 days": 90,
};
export const TRANSACTION_DATE_RANGES = Object.keys(TRANSACTION_DATE_RANGE_DAYS);

/** Choices offered by the "Change Rollover Option" flow on a term deposit — no
 *  live API for this yet, so the catalog is static until one exists. */
export const ROLLOVER_OPTIONS: RolloverOption[] = [
  {
    code: "close_at_maturity",
    label: "Close at Maturity",
    description: "The deposit will be closed at maturity and the principal returned to the settlement account.",
  },
  {
    code: "principal_rollover",
    label: "Principal Rollover",
    description: "The principal amount will be reinvested for a new term at the prevailing interest rate.",
  },
  {
    code: "principal_interest_rollover",
    label: "Principal & Interest Rollover",
    description: "The principal and accrued interest will both be reinvested for a new term at the prevailing interest rate.",
  },
];

/** No API-provided code for the term deposit's current rollover setting yet —
 *  this guesses the matching catalog entry from a free-text label well
 *  enough to highlight it in the panel. */
export function matchRolloverOptionCode(label: string): RolloverOptionCode | undefined {
  const normalized = label.toLowerCase();
  if (normalized.includes("close")) return "close_at_maturity";
  if (normalized.includes("principal") && normalized.includes("interest")) {
    return "principal_interest_rollover";
  }
  if (normalized.includes("principal")) return "principal_rollover";
  return undefined;
}


export interface AccountDetails {
  company: CompanyProfile;
  stats: AccountBalances;
  cashFlow: CashFlowPoint[];
  transactions: TTransactionDetailResponse[];
  /** Only present for Fixed Deposit accounts; drives the maturity donut + terms grid. */
  fixedDeposit?: IAccountDetailResponses;
}

