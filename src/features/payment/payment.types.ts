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

export type BillCategory = "All" | "Electricity" | "Water" | "Internet" | "Government";

export interface BillProvider {
  id: string;
  name: string;
  category: string;
  initials: string;
  slug: string;
}

export interface PaymentAccount {
  id: string;
  name: string;
  accountNumber: string;
  balance: string;
  currency: string;
}
