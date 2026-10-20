import type { TemplateTransfer, TransferAccount } from "./transfer.types";

/** Mock accounts for transfer flows. Replace with RTK Query endpoints when wired. */
export const transferAccounts: TransferAccount[] = [
  { id: "acc-1", name: "Personal Saving", number: "111-001-998", balance: "1,012.77", currency: "USD" },
  { id: "acc-2", name: "Saving Account", number: "111-022-998", balance: "12.00", currency: "USD" },
  { id: "acc-3", name: "Business Current", number: "111-045-231", balance: "8,420.10", currency: "USD" },
];

/** Mock saved transfer templates. Replace with RTK Query endpoints when wired. */
export const templateTransfers: TemplateTransfer[] = [
  {
    id: "tpl-1",
    templateName: "Chamrouen",
    toAccountName: "SME Bank",
    toAccountNumber: "300 050 756",
    transferType: "Other",
    dateCreated: "2026-07-20",
  },
  {
    id: "tpl-2",
    templateName: "Sok Chea",
    toAccountName: "Bakong",
    toAccountNumber: "012 934 085",
    transferType: "Bakong Account",
    dateCreated: "2026-06-01",
  },
  {
    id: "tpl-3",
    templateName: "Vannak Chhay",
    toAccountName: "Acleda Bank Plc",
    toAccountNumber: "789 456 123",
    transferType: "Local Bank",
    dateCreated: "2026-08-15",
  },
];

export const localBanks = [
  "ABA Bank",
  "ACLEDA Bank",
  "Canadia Bank",
  "Wing Bank",
  "Vattanac Bank",
];

export const transferCountries = [
  "United States",
  "Singapore",
  "Thailand",
  "Vietnam",
  "Japan",
  "Australia",
];

export const transferPurposes = [
  "Family Support",
  "Business Payment",
  "Education",
  "Other",
];

export const scheduleFrequencies = [
  { value: "once", label: "One Time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

/** Mock directory used to resolve a beneficiary name from an "Other SME Bank" account number. */
export const otherSmeBankDirectory = [
  { number: "000 000 096", name: "Sarah Jenkins" },
  { number: "111 022 998", name: "Rous Soboros" },
  { number: "500 987 654", name: "Khalid" },
  { number: "300 050 756", name: "Chamrouen" },
];
