import type { CashFlowPoint } from "@core/components/CashFlowChartPanel";
import type {
  BorrowerProfile,
  LoanAccountListItem,
  LoanScheduleDetails,
  LoanStat,
  LoanTransaction,
} from "./loan.types";

/** Mock data for the Loan page. Replace with RTK Query endpoints when wired. */

export const loanSummary = {
  outstandingKhr: 295_000_000,
  outstandingUsd: 71_912.31,
};

export const loanAccounts: LoanAccountListItem[] = [
  {
    id: "term-loan",
    name: "Term Loan",
    number: "000 000 021",
    type: "Term Loan",
    balance: 250_000_000,
    currency: "KHR",
  },
  {
    id: "overdraft",
    name: "Overdraft Facility",
    number: "000 000 022",
    type: "Overdraft",
    balance: 45_000_000,
    currency: "KHR",
  },
];

export const borrowerProfile: BorrowerProfile = {
  name: "BIKTECH SOLUTION Co., Ltd.",
  accountNumber: "000 000 021",
  status: "active",
  creditRemark: "No Credit",
};

export interface LoanDetails {
  borrower: BorrowerProfile;
  stats: LoanStat[];
  cashFlow: CashFlowPoint[];
  transactions: LoanTransaction[];
  schedule: LoanScheduleDetails;
}

/** Per-loan overview data, keyed by LoanAccountListItem.id. Drives the right-hand
 *  panel of the Loan page so it reflects whichever facility is selected in the sidebar. */
export const loanDetailsById: Record<string, LoanDetails> = {
  "term-loan": {
    borrower: borrowerProfile,
    stats: [
      { label: "Outstanding Principal", value: 250_000_000 },
      { label: "Approved Limit", value: 300_000_000 },
      { label: "Next Installment", value: 8_500_000 },
      { label: "Interest Rate", value: 7.5 },
    ],
    cashFlow: [
      { date: "22", inflow: 0, outflow: 8_500_000 },
      { date: "27", inflow: 0, outflow: 0 },
      { date: "02", inflow: 0, outflow: 0 },
      { date: "07", inflow: 0, outflow: 8_500_000 },
      { date: "12", inflow: 0, outflow: 0 },
      { date: "17", inflow: 0, outflow: 0 },
    ],
    transactions: [
      { title: "Loan disbursement", ref: "LN-2026-00087", date: "05 Jun 2026", amount: "+250,000,000.00 ៛", direction: "in", status: "processed" },
      { title: "Installment repayment", ref: "LN-RPY-2026-00087", date: "05 Jul 2026", amount: "-8,500,000.00 ៛", direction: "out", status: "processed" },
      { title: "Installment repayment", ref: "LN-RPY-2026-00088", date: "05 Aug 2026", amount: "-8,500,000.00 ៛", direction: "out", status: "pending" },
    ],
    schedule: {
      approvedLimit: 300_000_000,
      outstandingPrincipal: 250_000_000,
      interestRatePct: 7.5,
      nextInstallmentAmount: 8_500_000,
      nextInstallmentDate: "05 Aug 2026",
      disbursementDate: "05 Jun 2026",
      maturityDate: "05 Jun 2031",
      repaymentMethod: "Monthly",
      remainingInstallments: 58,
      totalInstallments: 60,
      overdueCount: 0,
      currency: "KHR",
      accountType: "Long Term Loan",
      tenorLabel: "60 months",
      settlementAccountName: borrowerProfile.name,
      settlementAccountNumber: borrowerProfile.accountNumber,
    },
  },
  overdraft: {
    borrower: borrowerProfile,
    stats: [
      { label: "Outstanding Balance", value: 45_000_000 },
      { label: "Approved Limit", value: 100_000_000 },
      { label: "Available to Draw", value: 55_000_000 },
      { label: "Interest Rate", value: 9 },
    ],
    cashFlow: [
      { date: "22", inflow: 5_000_000, outflow: 12_000_000 },
      { date: "27", inflow: 0, outflow: 3_000_000 },
      { date: "02", inflow: 10_000_000, outflow: 0 },
      { date: "07", inflow: 0, outflow: 8_000_000 },
      { date: "12", inflow: 0, outflow: 0 },
      { date: "17", inflow: 0, outflow: 0 },
    ],
    transactions: [
      { title: "Overdraft drawdown", ref: "OD-2026-00014", date: "03 Jun 2026", amount: "-12,000,000.00 ៛", direction: "out", status: "processed" },
      { title: "Overdraft repayment", ref: "OD-RPY-2026-00014", date: "10 Jun 2026", amount: "+5,000,000.00 ៛", direction: "in", status: "processed" },
    ],
    schedule: {
      approvedLimit: 100_000_000,
      outstandingPrincipal: 45_000_000,
      interestRatePct: 9,
      nextInstallmentAmount: 0,
      nextInstallmentDate: "—",
      disbursementDate: "01 Jan 2026",
      maturityDate: "31 Dec 2026",
      repaymentMethod: "Interest Only, Revolving",
      remainingInstallments: 5,
      totalInstallments: 12,
      overdueCount: 1,
      currency: "KHR",
      accountType: "Overdraft Facility",
      tenorLabel: "12 months",
      settlementAccountName: borrowerProfile.name,
      settlementAccountNumber: borrowerProfile.accountNumber,
    },
  },
};

export const loanStats: LoanStat[] = loanDetailsById["term-loan"].stats;
export const loanCashFlowSample: CashFlowPoint[] = loanDetailsById["term-loan"].cashFlow;
export const loanTransactions: LoanTransaction[] = loanDetailsById["term-loan"].transactions;
