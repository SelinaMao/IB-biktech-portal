import type {
  BillCategory,
  BillProvider,
  PaymentActionCardItem,
  PaymentTemplate,
} from "./payment.types";

export const PAYMENT_ACTION_CARDS: PaymentActionCardItem[] = [
  {
    id: "action-bill",
    slug: "bill-payment",
    title: "Bill payment",
    description: "Electricity, water, internet and more",
    iconName: "receipt",
  },
  {
    id: "action-topup",
    slug: "mobile-topup",
    title: "Mobile top-up",
    description: "Prepaid credit for any network",
    iconName: "smartphone",
  },
  {
    id: "action-charity",
    slug: "charity-donation",
    title: "Charity & donation",
    description: "Give to registered organisations",
    iconName: "charity",
  },
];

export const INITIAL_PAYMENT_TEMPLATES: PaymentTemplate[] = [
  {
    id: "tpl-1",
    name: "Head office electricity",
    type: "Bill payment",
    providerName: "Electricity Authority",
    providerInitials: "EA",
    correspondentId: "Consumer ID 0091 2207",
    createdAt: "02 Sep 2026",
  },
  {
    id: "tpl-2",
    name: "Internet — HQ",
    type: "Bill payment",
    providerName: "FibreNet Internet",
    providerInitials: "FI",
    correspondentId: "Consumer ID 7781 0042",
    createdAt: "15 Aug 2026",
  },
  {
    id: "tpl-3",
    name: "Sales team top-up",
    type: "Mobile top-up",
    providerName: "Smart · prepaid",
    providerInitials: "SM",
    correspondentId: "Mobile no. 011 222 2222",
    createdAt: "10 Jul 2026",
  },
  {
    id: "tpl-4",
    name: "Children's Hospital Fund",
    type: "Charity & donation",
    providerName: "Health · registered charity",
    providerInitials: "CH",
    correspondentId: "Organisation ID CH-0021",
    createdAt: "01 Jun 2026",
  },
];

export const BILL_CATEGORIES: BillCategory[] = [
  "All",
  "Electricity",
  "Water",
  "Internet",
  "Government",
  "Utilities",
];

export const BILL_PROVIDERS: BillProvider[] = [
  {
    providerId: "electricity-authority",
    name: "Electricity Authority",
    category: "Electricity",
    initials: "EA",
    sampleConsumerId: "EDC-100001",
    paymentSupported: true,
  },
  {
    providerId: "city-water-supply",
    name: "City Water Supply",
    category: "Water",
    initials: "PW",
    sampleConsumerId: "WTR-200001",
    paymentSupported: true,
  },
  {
    providerId: "fibrenet-internet",
    name: "FibreNet Internet",
    category: "Internet",
    initials: "FI",
    sampleConsumerId: "FNI-300001",
    paymentSupported: true,
  },
  {
    providerId: "tax-department",
    name: "Tax Department",
    category: "Government",
    initials: "TX",
    sampleConsumerId: "TAX-400001",
    paymentSupported: true,
  },
  {
    providerId: "waste-management",
    name: "Waste Management",
    category: "Utilities",
    initials: "WM",
    sampleConsumerId: "WST-500001",
    paymentSupported: true,
  },
];
