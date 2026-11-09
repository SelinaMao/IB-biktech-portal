import type { CashFlowPoint } from "@core/components/CashFlowChartPanel";
import type {
  AccountBalances,
  CompanyProfile,
  CoreAccountEntry,
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

/** Mock Deposit Account (Term Deposit / Fixed Deposit) */
export const MOCK_DEPOSIT_ACCOUNT: CoreAccountEntry = {
  id: "mock-td-account-001",
  accountNumber: "101200000905",
  accountName: "BIKTECH SOLUTION CO., LTD.",
  accountClass: "TD",
  accountClassDescription: "Term Deposit",
  ccy: "USD",
  status: "active",
  accountType: "TD",
  availableBalance: 50000,
  type: "TD",
};

/** Mock Detail data for Term Deposit */
export const MOCK_DEPOSIT_DETAIL: IAccountDetailResponses = {
  accountNumber: "101200000905",
  accountName: "BIKTECH SOLUTION CO., LTD.",
  accountType: "TD",
  ownershipType: "individual",
  signatureType: null,
  currencyCode: "USD",
  ccy: "USD",
  status: "active",
  branchCode: "001",
  openedDate: "2026-01-15",
  availableBalance: 50000,
  currentBalance: 50000,
  ledgerBalance: 50000,
  interestRate: 6.5,
  productCode: "TD01",
  productDesc: "Fixed Deposit Account",
  placementAmt: 50000,
  tenorMonths: 12,
  maturityDate: "2027-01-15",
  renewalOption: "Principal & Interest Rollover",
  interestAmount: 3250,
  interestType: "Fixed Rate",
  taxRate: 6,
  taxAmount: 195,
  totalAmountToReceive: 53055,
  accountSettlementNumber: "101200000903",
  settlementAccountName: "BIKTECH SOLUTION CO., LTD.",
  currencySettlementCode: "USD",
  onGoingMaturityDays: 140,
  totalMaturityDays: 365,
};

/** Mock Transactions for the Term Deposit account */
export const MOCK_DEPOSIT_TRANSACTIONS: TTransactionDetailResponse[] = [
  {
    transactionId: "TXN-TD-001",
    transactionCode: "INT_CREDIT",
    transactionType: "C",
    transactionAmount: 270.83,
    transactionCurrency: "USD",
    transactionDate: "2026-06-15",
    transactionTime: "10:00:00",
    transactionDescription: "Monthly Interest Accrual",
    transactionReferenceCode: "REF-TD-INT-001",
    fromAccountName: "Bakong Settlement",
    fromAccountNumber: "000190001",
    toAccountName: "BIKTECH SOLUTION CO., LTD.",
    toAccountNumber: "101200000905",
    amountBalance: 50270.83,
    fields: [],
  },
  {
    transactionId: "TXN-TD-000",
    transactionCode: "DEP_PLACEMENT",
    transactionType: "C",
    transactionAmount: 50000.0,
    transactionCurrency: "USD",
    transactionDate: "2026-01-15",
    transactionTime: "09:30:00",
    transactionDescription: "Term Deposit Placement",
    transactionReferenceCode: "REF-TD-PLACE-000",
    fromAccountName: "BIKTECH SOLUTION CO., LTD.",
    fromAccountNumber: "101200000903",
    toAccountName: "BIKTECH SOLUTION CO., LTD.",
    toAccountNumber: "101200000905",
    amountBalance: 50000.0,
    fields: [],
  },
];
