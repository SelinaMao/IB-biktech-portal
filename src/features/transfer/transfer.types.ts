import type React from "react";
import type { AuthenticatorRequest } from "@/features/authenticator";

export interface TransferOption {
  slug: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export interface TransferAccount {
  id: string;
  name: string;
  number: string;
  balance: string;
  currency: string;
}

export interface TemplateTransfer {
  id: string;
  templateName: string;
  toAccountName: string;
  toAccountNumber: string;
  transferType: string;
  dateCreated: string;
}

/** payment-service `PaymentStatus`. */
export type TransferStatus =
  | "AWAITING_AUTHORIZATION"
  | "AWAITING_APPROVAL"
  | "READY"
  | "EXECUTING"
  | "COMPLETED"
  | "REFUSED"
  | "INDETERMINATE";

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
  createdAt: string;
  executedAt?: string | null;
  authenticator?: AuthenticatorRequest | null;
}

export interface OwnAccountTransferRequest {
  fromAccountNumber: string;
  toAccountNumber: string;
  amount: number;
  currency: string;
  remark?: string;
}

export type TransferType = "OWN_ACCOUNT" | "OTHER_SME_ACCOUNT" | "BAKONG_LOCAL_BANK" | "BAKONG_WALLET";

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
