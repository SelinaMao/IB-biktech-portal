import type {
  BillCategory,
  BillProvider,
  PaymentAccount,
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
];

export const INITIAL_BILL_PROVIDERS: BillProvider[] = [
  {
    id: "bp-1",
    name: "Electricity Authority",
    category: "Electricity",
    initials: "EA",
    slug: "electricity-authority",
  },
  {
    id: "bp-2",
    name: "City Water Supply",
    category: "Water",
    initials: "PW",
    slug: "city-water-supply",
  },
  {
    id: "bp-3",
    name: "FibreNet Internet",
    category: "Internet",
    initials: "FI",
    slug: "fibrenet-internet",
  },
  {
    id: "bp-4",
    name: "Tax Department",
    category: "Government",
    initials: "TX",
    slug: "tax-department",
  },
  {
    id: "bp-5",
    name: "Waste Management",
    category: "Utilities",
    initials: "WM",
    slug: "waste-management",
  },
];

export const MOCK_PAYMENT_ACCOUNTS: PaymentAccount[] = [
  {
    id: "acc-1",
    name: "Operating Account",
    accountNumber: "111-001-998",
    balance: "12,450.00",
    currency: "USD",
  },
  {
    id: "acc-2",
    name: "Payroll & Tax Reserve",
    accountNumber: "111-022-998",
    balance: "45,820.50",
    currency: "USD",
  },
  {
    id: "acc-3",
    name: "KHR Savings Account",
    accountNumber: "111-045-231",
    balance: "58,200,000",
    currency: "KHR",
  },
];
