export type LoanStatus = "active" | "overdue" | "closed";

export type TxnDirection = "in" | "out";

export type TxnStatus = "processed" | "pending";

export interface LoanAccountListItem {
  id: string;
  name: string;
  number: string;
  type: string;
  balance: number;
  currency: string;
}

export interface BorrowerProfile {
  name: string;
  accountNumber: string;
  status: LoanStatus;
  /** Secondary badge next to the status pill, e.g. "No Credit". */
  creditRemark?: string;
}

export interface LoanStat {
  label: string;
  value: number;
  currency?: string;
}

export interface LoanTransaction {
  title: string;
  ref: string;
  date: string;
  amount: string;
  direction: TxnDirection;
  status: TxnStatus;
}

/** Drives the Loan overview panel (donut + terms grid). */
export interface LoanScheduleDetails {
  approvedLimit: number;
  outstandingPrincipal: number;
  interestRatePct: number;
  nextInstallmentAmount: number;
  nextInstallmentDate: string;
  disbursementDate: string;
  maturityDate: string;
  repaymentMethod: string;
  /** Installments left to pay, out of `totalInstallments` — drives the donut ring. */
  remainingInstallments: number;
  totalInstallments: number;
  overdueCount: number;
  currency?: string;
  /** e.g. "Long Term Loan" — shown on the Loan Details panel. */
  accountType?: string;
  /** e.g. "12 months" — shown on the Loan Details panel. */
  tenorLabel?: string;
  /** Account the disbursement/repayments settle against — shown on the Loan Details panel. */
  settlementAccountName?: string;
  settlementAccountNumber?: string;
}
