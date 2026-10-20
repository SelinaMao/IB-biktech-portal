import type React from "react";
import type { AuthenticatorRequest } from "@/features/authenticator";

export interface TransferOption {
  slug: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  /** The catalogue functions it starts; the card is under maintenance when BOS has switched every one off. */
  functionCodes?: string[];
}

export interface TransferAccount {
  id: string;
  name: string;
  number: string;
  balance: string;
  currency: string;
}

/** `GET payment/templates` row: a company's saved receiver. */
export interface TransferTemplate {
  id: string;
  templateName: string;
  transferType: TransferType;
  toAccountNumber: string;
  toAccountName?: string | null;
  toAccountCurrency?: string | null;
  /** Absent for an SME Bank receiver. */
  bankCode?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}


/** payment-service `PaymentStatus`. */
export type TransferStatus =
  | "AWAITING_AUTHORIZATION"
  | "AWAITING_APPROVAL"
  | "SCHEDULED"
  | "READY"
  | "EXECUTING"
  | "COMPLETED"
  | "REFUSED"
  | "INDETERMINATE"
  | "PAUSED"
  | "CANCELLED";

/** `POST payment/transfers/*` and `.../authorize` response `data`. */
export interface TransferResult {
  referenceId: string;
  transferType: string;
  /** How the receiver was entered: typed, or read from a scanned KHQR code. */
  method: TransferMethod;
  /** The catalogue function, e.g. TRANSFER:OWN_ACCOUNT. */
  functionCode: string;
  status: TransferStatus;
  failureReason?: string | null;
  cbsReference?: string | null;
  workflowInstanceId?: string | null;
  fromAccountNumber: string;
  fromAccountName?: string | null;
  toAccountNumber?: string | null;
  toAccountName?: string | null;
  amount: number;
  currency: string;
  remark?: string | null;
  schedule?: TransferSchedule | null;
  createdAt: string;
  executedAt?: string | null;
  authenticator?: AuthenticatorRequest | null;
}

export type TransferFrequency = "ONCE" | "WEEKLY" | "MONTHLY";

export type DayOfWeek = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

/**
 * payment-service `TransferSchedule`; absent means now. Local Phnom Penh times, no offset.
 * ONCE and MONTHLY run at dateTime (MONTHLY on that day each month); WEEKLY runs on dayOfWeek
 * from startDate to endDate, at dateTime's time when given.
 */
export interface TransferSchedule {
  frequency: TransferFrequency;
  /** yyyy-MM-ddTHH:mm:ss */
  dateTime?: string;
  dayOfWeek?: DayOfWeek;
  /** yyyy-MM-dd */
  startDate?: string;
  endDate?: string;
}

export interface OwnAccountTransferRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
  remark?: string;
  /** Absent: the transfer runs as soon as it is authorized and approved. */
  schedule?: TransferSchedule;
}

/** The server looks the receiver up again before saving it. */
export interface OtherSmeAccountTransferRequest extends OwnAccountTransferRequest {
  /** Keep the receiver as a template once the phone authorizes the transfer. */
  isSaveTemplate?: boolean;
  /** Defaults to the receiver's account name. */
  templateName?: string;
}

/** `POST payment/inquiry/sme-account` response `data`. */
export interface SmeAccountInquiryResult {
  accountNumber: string;
  accountName: string;
  /** USD or KHR; sent as toAccountCurrency to calculate. */
  currency: string;
}

export type TransferType ="OWN_ACCOUNT" | "OTHER_SME_ACCOUNT" | "BAKONG_LOCAL_BANK" | "BAKONG_WALLET";

/** `GET payment/banks` row: a Bakong member bank a local bank transfer can pay. */
export interface BakongBank {
  id: string;
  name: string;
  /** Sent as bankCode, e.g. ABAAKHPP. */
  code: string;
  logoId?: string | null;
  url?: string | null;
  operations?: string[] | null;
}

/** `POST payment/inquiry/external-bank-account`: an account at another bank (BANK) or a Bakong wallet (BAKONG). */
export interface ExternalAccountInquiryRequest {
  accountNumber: string;
  transferPlatform: "BANK" | "BAKONG";
  /** The bank's code for BANK; Bakong's own for BAKONG. */
  transferPlatformCode: string;
  boundType: "LOCAL";
}

/** Its response `data`; refused when the account is not found, cannot receive or is frozen. */
export interface ExternalAccountInquiryResult extends SmeAccountInquiryResult {
  currencies?: string[] | null;
  kycStatus?: string | null;
  status?: string | null;
  bankCode?: string | null;
  type?: string | null;
}

/** The server looks the receiver up again before saving it. */
export interface BakongLocalBankTransferRequest {
  fromAccountNumber: string;
  bankCode: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
  remark?: string;
  /** Keep the receiver as a template, named after them, once the phone authorizes the transfer. */
  isSaveTemplate?: boolean;
  schedule?: TransferSchedule;
}

/** To a Bakong wallet by its Bakong ID or phone number. */
export interface BakongWalletTransferRequest {
  fromAccountNumber: string;
  bakongId: string;
  amount: number;
  currency: string;
  remark?: string;
  isSaveTemplate?: boolean;
  schedule?: TransferSchedule;
}

/**
 * One row of a bulk file, as read from it or edited on Review. Values stay as written, so a wrong
 * one comes back as a row message instead of failing the request.
 */
export interface BulkRow {
  /** Counted from the header row; the row's identity for edit and delete. */
  rowNumber: number;
  /** As written: "Own Account", "Other SME Account", "Local Bank", "Bakong Wallet", or a code. */
  transferType?: string | null;
  toAccount?: string | null;
  bankCode?: string | null;
  receiverName?: string | null;
  /** Absent when the cell was not a number. */
  amount?: number | null;
  currency?: string | null;
  remark?: string | null;
}

export type BulkRowStatus = "VALID" | "DUPLICATE" | "INVALID";

/** `POST payment/bulk-transfers/validate` row. */
export interface BulkRowResult {
  rowNumber: number;
  /** A TransferType when recognised, else as written. */
  transferType?: string | null;
  toAccount?: string | null;
  toAccountCurrency?: string | null;
  /** The receiving bank's or Bakong's record of the name; the file's when the receiver could not be found. */
  toAccountName?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  amount?: number | null;
  currency: string;
  remark?: string | null;
  /** The name as the file gave it; sent back unchanged when the row is edited. */
  receiverName?: string | null;
  status: BulkRowStatus;
  messageCode?: string | null;
  message?: string | null;
  /** How many rows pay this receiver; 1 when only this one. */
  duplicates: number;
}

export interface BulkValidationResult {
  fromAccountNumber: string;
  fromAccountName?: string | null;
  currency: string;
  fileName?: string | null;
  /** INVALID first (by account), then DUPLICATE grouped by receiver, then VALID in file order. */
  rows: BulkRowResult[];
  summary: {
    records: number;
    validRecords: number;
    invalidRecords: number;
    duplicateRecords: number;
    transferAmount: number;
    fee: number;
    totalDebitAmount: number;
    currency: string;
  };
}

export interface BulkTransferRequest {
  fromAccountNumber: string;
  fileName: string;
  rows: BulkRow[];
  /** Absent: runs once authorized and approved. Only ONCE is accepted. */
  schedule?: TransferSchedule;
}

/** `POST payment/bulk-transfers` and `GET payment/bulk-transfers/{ref}` response `data`. */
export interface BulkTransferResult {
  referenceId: string;
  status: TransferStatus;
  failureReason?: string | null;
  workflowInstanceId?: string | null;
  fromAccountNumber: string;
  fromAccountName?: string | null;
  fileName: string;
  amount: number;
  /** 0 until fees are wired to transfers. */
  fee: number;
  totalDebitAmount: number;
  currency: string;
  records: number;
  completedRecords: number;
  failedRecords: number;
  duplicateRecords: number;
  schedule?: TransferSchedule | null;
  createdAt: string;
  executedAt?: string | null;
  authenticator?: AuthenticatorRequest | null;
  rows: {
    rowNumber: number;
    referenceId: string;
    transferType: TransferType;
    toAccount?: string | null;
    toAccountName?: string | null;
    toAccountCurrency?: string | null;
    bankCode?: string | null;
    /** SME Bank, Bakong for a wallet, else the receiving bank's code. */
    bankName?: string | null;
    amount: number;
    currency: string;
    remark?: string | null;
    status: TransferStatus;
    failureReason?: string | null;
    cbsReference?: string | null;
    executedAt?: string | null;
    /** How many rows pay this receiver; 1 when only this one. */
    duplicates: number;
  }[];
}

export type TransferMethod = "MANUAL" | "KHQR";

export interface CalculateTransferRequest {
  transferType: TransferType;
  /** Defaults to MANUAL; a KHQR transfer pays a QR code rather than an account number. */
  method?: TransferMethod;
  fromAccountNumber: string;
  fromAccountCurrency: string;
  toAccountNumber?: string;
  toAccountCurrency?: string;
  amount: number;
  currency: string;
}

/** `POST payment/transfers/calculate` response `data`. */
export interface CalculateTransferResult {
  receivedAmount: number;
  receivedCurrency: string;
  originalAmount: number;
  originalCurrency: string;
  amount: number;
  currency: string;
  feeAmount: number;
  feeCurrency: string;
  exchangeRate?: number | null;
  totalAmount: number;
}
