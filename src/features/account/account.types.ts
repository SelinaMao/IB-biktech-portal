import type React from "react";

export type CompanyStatus = "active" | "dormant" | "frozen";

export type SummaryTone = "success" | "warning" | "info" | "purple";

export interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  action?: string;
  icon?: React.ReactNode;
  tone?: SummaryTone;
}

export type TxnDirection = "in" | "out";

export type TxnStatus = "processed" | "pending";

export interface BankAccountListItem {
  id: string;
  name: string;
  number: string;
  type: string;
  /** Raw core account type code (`typeAcct`, e.g. "CA", "CL") — drives which
   *  mock detail layout (current/fixed-deposit/loan) the Account page shows. */
  typeAcct: string;
  balance: number;
  currency: string;
}

/** Raw core account row, as returned inside `GET accounts`'s `data.accounts[]`. */
export interface CoreAccountEntry {
  accountNumber: string;
  accountName: string;
  accountClass: string;
  accountClassDescription: string;
  ccy: string;
  status: string;
  accountType: string;
  availableBalance: number;
  type?: string;
  color?: string;
}

/** `GET accounts`'s unwrapped `data` shape. */
export interface CoreAccountsResponse {
  accounts: CoreAccountEntry[];
  summary: {
    totalBalanceUSD: number;
    totalBalanceKHR: number;
  };
}

export interface CoreJointHolder {
  accountNumber: string;
  accountName: string;
  joinType: string | null;
}

export interface CoreInstalment {
  instNo: number;
  dueDate: string;
  principal: number;
  interest: number;
  penalty: number;
  totalInstalment: number;
}

/** Request body for `POST accounts/detail`. */
export interface AccountDetailRequest {
  accountNumber: string;
  accountBranch?: string;
  type?: string;
  numberOfInstallment?: number;
}

/** Request body for `POST accounts/summary` — drives the cash-flow chart on
 *  the account overview card. */
export interface AccountSummaryRequest {
  accountNumber: string;
  accountBranch?: string;
  type: string;
  numberOfInstallment?: number;
}

/** Request body for `GET accounts` — optional filters. Every field is
 *  optional so the unfiltered call (`account/page.tsx`) can still pass no
 *  body, while callers that only want one account type (e.g. `loan/page.tsx`
 *  requesting `type: "CL"`) can narrow the result server-side. `type` and
 *  `accountType` are aliases for the same filter — both are accepted since
 *  callers have used either spelling. */
export interface AccountListRequest {
  accountNumber?: string;
  type?: string;
  accountType?: string;
}

/** Raw core row returned by `POST accounts/summary`. */
export interface CoreAccountSummaryEntry {
  summaryBalance: {
    ledgerBalance: number;
    odLimit: number;
    amountBlock: number;
    availableBalance: number;
  };
  transactionSummary: {
    data: Array<{
      /** ISO date, "YYYY-MM-DD". */
      date: string;
      transactionIn: number;
      transactionOut: number;
    }>;
  };
}

/** Request body for `POST accounts/download` — fetches the account/term-deposit certificate file. */
export interface AccountDownloadRequest {
  accountNumber: string;
  type: string;
}

/** Raw core row returned by `POST accounts/detail`. Shape varies by
 *  `type`/`accountType` — current/loan accounts return the balance-oriented
 *  fields, term deposit (`accountType === "TD"`) accounts return the
 *  placement/maturity fields below instead, so most fields are optional. */
export interface IAccountDetailResponses {
  accountNumber: string;
  accountName: string;
  accountClass?: string;
  accountType: string;
  /** "join" | "individual". */
  ownershipType?: string;
  signatureType?: string | null;
  /** Present on current/loan accounts; term deposit accounts return `currencyCode` instead. */
  ccy?: string;
  currencyCode?: string;
  status: string;
  branchCode?: string;
  /** ISO date, "YYYY-MM-DD". */
  openedDate: string | null;
  ledgerBalance?: number;
  availableBalance: number;
  currentBalance: number;
  blockedBalance?: number;
  pendingBalance?: number;
  overdraftLimit?: number;
  interestRate?: number;
  /** Not present on every response — only join accounts return co-holders. */
  joinHolderDto?: CoreJointHolder[];
  /** Underlying customer behind the account. */
  customerNumber?: string;
  fullName?: string;
  shortName?: string;
  productCode?: string;
  productDesc?: string;
  channelCode?: string;
  levelKYC?: string;
  restrictCode?: string;
  rateIntCredit?: number;
  rateIntDebit?: number;
  transactionLimitPerDay?: number;
  transactionLimitPerTransaction?: number;

  // Term deposit fields (`accountType === "TD"`) — see `selectFixedDepositDetail`.
  placementAmt?: number;
  tenorMonths?: number;
  /** ISO date, "YYYY-MM-DD". */
  maturityDate?: string;
  renewalOption?: string;
  interestAmount?: number;
  interestType?: string;
  taxRate?: number;
  taxAmount?: number;
  totalAmountToReceive?: number;
  accountSettlementNumber?: string;
  settlementAccountName?: string;
  currencySettlementCode?: string;
  onGoingMaturityDays?: number;
  totalMaturityDays?: number;

  // Loan fields (`accountType === "CL"`).
  loanAmount?: number;
  tenorOriginal?: number;
  tenorRemaining?: number;
  tenorUnit?: string;
  /** ISO date, "YYYY-MM-DD". */
  disbursementDate?: string;
  /** ISO date, "YYYY-MM-DD". */
  nextPaymentDate?: string;
  installmentAmount?: number;
  installmentFrequency?: string;
  totalInstalmentRemain?: number;
  instalments?: CoreInstalment[];

  /** Generic label/value pairs the core wants shown but doesn't map to a
   *  fixed property — rendered as extra rows on the Account Details panel
   *  after the mapped fields (mirrors `CoreTransactionEntry.fields`). */
  fields?: CoreAccountField[];
}

export interface CoreAccountField {
  key: string;
  label: string;
  value: string;
}

export interface CompanyProfile {
  name: string;
  accountNumber: string;
  /** No live API mapping yet — omitted (and any status UI hidden) until one exists. */
  status?: CompanyStatus;
}

/** The balance figures shown as stat tiles on the account overview card and
 *  details panel — mirrors `POST accounts/detail`'s response 1:1 so both
 *  the live API result and mock fallbacks share one shape. */
export interface AccountBalances {
  accountNumber?: string;
  accountName?: string;
  accountClass?: string;
  accountType?: string;
  /** "join" | "individual". */
  ownershipType?: string;
  signatureType?: string;
  status?: string;
  branchCode?: string;
  /** ISO date, "YYYY-MM-DD". */
  openedDate?: string;
  ledgerBalance?: number;
  availableBalance?: number;
  currentBalance?: number;
  blockedBalance?: number;
  pendingBalance?: number;
  odLimit?: number;
  interestRate?: number;
  currency: string;
}

/** Request body for `POST transactions` — the statement list for one account. */
export interface TransactionListRequest {
  accountNumber: string;
  type: string;
  startedDate?: string;
  endedDate?: string;
  limit: number;
  offset: number;
  /** TODO(api): unconfirmed against the core contract — title/reference keyword match. */
  search?: string;
}

/** `POST transactions` pages on the server: `data` holds `limit` rows from `offset`
 *  (newest first) and this, beside `data` in the envelope, says how many there are in all. */
export interface CorePageInfo {
  offset: number;
  limit: number;
  total: number;
}

/** One page of `POST transactions`, unwrapped from the envelope. */
export interface TransactionListPage {
  rows: CoreTransactionEntry[];
  /** Rows across all pages — drives the Previous/Next pager. */
  total: number;
}

/** `fileType` for `POST transactions/download` — picks the exported statement format. */
export type TransactionDownloadFileType = "PDF" | "CSV" | "EXCEL";

/** Request body for `POST transactions/download` — the statement file for one account,
 *  in the format given by `fileType`. */
export interface TransactionDownloadRequest {
  accountNumber: string;
  type: string;
  startedDate: string;
  endedDate: string;
  fileType: TransactionDownloadFileType;
}

/** Request body for `POST transactions/download-detail` — the single-transaction
 *  receipt/advice file behind the Transaction Details panel's "Download in PDF". */
export interface TransactionDownloadDetailRequest {
  transactionId: string;
  transactionDate: string;
  transactionReferenceCode: string;
  transactionDescription: string;
  transactionCurrency: string;
  transactionType: string;
  transactionAmount: number;
  fromAccountName: string;
  fromAccountNumber: string;
  toAccountName: string;
  toAccountNumber: string;
  transactionCurrentBalance: number;
  transactionTime: string;
}

export interface CoreTransactionField {
  key: string;
  label: string;
  value: string;
}

/** Raw core row returned by `POST transactions`. */
export interface CoreTransactionEntry {
  transactionId: string;
  transactionDate: string;
  transactionCode: string;
  transactionDescription: string;
  transactionCurrency: string;
  transactionType: string;
  transactionAmount: number;
  amountBalance: number;
  toAccountNumber: string;
  toAccountName: string;
  transactionReferenceCode: string;
  transactionTime: string;
  fields: CoreTransactionField[];
}

/** Variant of `CoreTransactionEntry` returned by an endpoint that also sends
 *  `imageUrl` (receipt/attachment) and `transactionMemo`, but omits
 *  `amountBalance`. Kept separate from `CoreTransactionEntry` since the
 *  existing transaction list/mapper flow depends on `amountBalance`. */
export interface TTransactionDetailResponse {
  /** Only present when this came from the single-transaction detail endpoint,
   *  not when mapped from a `CoreTransactionEntry` list row. */
  imageUrl?: string;
  transactionId: string;
  transactionDate: string;
  transactionTime: string;
  transactionCode: string;
  transactionDescription: string;
  /** Only present when this came from the single-transaction detail endpoint,
   *  not when mapped from a `CoreTransactionEntry` list row. */
  transactionMemo?: string;
  transactionCurrency: string;
  transactionType: string;
  transactionReferenceCode: string;
  transactionAmount: number;
  toAccountNumber: string;
  toAccountName: string;
  fromAccountNumber: string;
  fromAccountName: string;
  amountBalance: number;
  fields: CoreTransactionField[];
}



export type RolloverOptionCode = "close_at_maturity" | "principal_rollover" | "principal_interest_rollover";

export interface RolloverOption {
  code: RolloverOptionCode;
  label: string;
  description: string;
}

