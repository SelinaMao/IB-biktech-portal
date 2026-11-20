import type {
  BillCategory,
  BillProvider,
  PaymentActionCardItem,
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
