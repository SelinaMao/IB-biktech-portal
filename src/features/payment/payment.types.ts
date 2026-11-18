import type { TransferSchedule } from "@/features/transfer";

export type PaymentActionSlug = "bill-payment" | "mobile-topup" | "charity-donation";

export interface PaymentActionCardItem {
  id: string;
  slug: PaymentActionSlug;
  title: string;
  description: string;
  iconName: "receipt" | "smartphone" | "charity";
}

export type PaymentTemplateType = "Bill payment" | "Mobile top-up" | "Charity & donation";

export interface PaymentTemplate {
  id: string;
  name: string;
  type: PaymentTemplateType;
  providerName: string;
  providerInitials: string;
  providerSubtitle?: string;
  correspondentId: string;
  createdAt: string;
}

export type BillCategory = "All" | "Electricity" | "Water" | "Internet" | "Government" | "Utilities";

export interface BillProvider {
  providerId: string;
  name: string;
  category: string;
  initials: string;
  sampleConsumerId: string;
  paymentSupported: boolean;
}

export interface BillPaymentRequest {
  fromAccountNumber: string;
  providerId: string;
  customerNumber: string;
  amount: number;
  currency: string;
  remark?: string;
  schedule?: TransferSchedule;
}

export interface PhoneTopUpTransferRequest {
  fromAccountNumber: string;
  currency: string;
  amount: number;
  phone?: string;
  remark?: string;
  isSaveTemplate?: boolean;
  templateName?: string;
  schedule?: TransferSchedule;
}

export interface PhoneInquiryRequest {
  phone: string;
}

export interface PhoneInquiryResult {
  providerId?: string;
  providerName?: string;
  customerPhone?: string;
  customerName?: string;
  consumerId?: string;
  providerAccountNumber?: string;
  billingPeriod?: string;
  dueDate?: string;
  invoiceDate?: string;
  paymentStatus?: string;
  totalAmountUSD?: number;
  totalAmountRiel?: number;
}

export interface BillInquiryRequest {
  providerId: string;
  customerNumber: string;
}
