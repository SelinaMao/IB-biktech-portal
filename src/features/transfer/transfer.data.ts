import type { InternationalBank, TransferAccount, TransferTemplate } from "./transfer.types";

/** Mock accounts for transfer flows. Replace with RTK Query endpoints when wired. */
export const transferAccounts: TransferAccount[] = [
  { id: "acc-1", name: "Personal Saving", number: "111-001-998", balance: "1,012.77", currency: "USD" },
  { id: "acc-2", name: "Saving Account", number: "111-022-998", balance: "12.00", currency: "USD" },
  { id: "acc-3", name: "Business Current", number: "111-045-231", balance: "8,420.10", currency: "USD" },
];

/** Mock saved transfer templates. Replace with RTK Query endpoints when wired. */
export const templateTransfers: TransferTemplate[] = [
  {
    id: "tpl-1",
    templateName: "Chamrouen",
    toAccountName: "BiKTECH BANK",
    toAccountNumber: "300 050 756",
    transferType: "OTHER_SME_ACCOUNT",
    createdBy: "system",
    createdAt: "2026-07-20T00:00:00Z",
    updatedAt: "2026-07-20T00:00:00Z",
  },
  {
    id: "tpl-2",
    templateName: "Sok Chea",
    toAccountName: "Bakong",
    toAccountNumber: "012 934 085",
    transferType: "BAKONG_WALLET",
    createdBy: "system",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
  },
  {
    id: "tpl-3",
    templateName: "Vannak Chhay",
    toAccountName: "Acleda Bank Plc",
    toAccountNumber: "789 456 123",
    transferType: "BAKONG_LOCAL_BANK",
    createdBy: "system",
    createdAt: "2026-08-15T00:00:00Z",
    updatedAt: "2026-08-15T00:00:00Z",
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

/** CBS SWIFT/BIC directory used by the international transfer form. */
export const internationalBanks: InternationalBank[] = [
  { bankCode: "BOFAUS3N", swiftCode: "BOFAUS3N", bankName: "Bank of America, N.A.", countryCode: "US", countryName: "United States" },
  { bankCode: "DBSSSGSG", swiftCode: "DBSSSGSG", bankName: "DBS Bank Ltd.", countryCode: "SG", countryName: "Singapore" },
  { bankCode: "CTBAAU2S", swiftCode: "CTBAAU2S", bankName: "Commonwealth Bank of Australia", countryCode: "AU", countryName: "Australia" },
  { bankCode: "HBUKGB4B", swiftCode: "HBUKGB4B", bankName: "HSBC UK Bank plc", countryCode: "GB", countryName: "United Kingdom" },
  { bankCode: "DEUTDEFF", swiftCode: "DEUTDEFF", bankName: "Deutsche Bank AG", countryCode: "DE", countryName: "Germany" },
  { bankCode: "ROYCCAT2", swiftCode: "ROYCCAT2", bankName: "Royal Bank of Canada", countryCode: "CA", countryName: "Canada" },
  { bankCode: "BOTKJPJT", swiftCode: "BOTKJPJT", bankName: "MUFG Bank, Ltd.", countryCode: "JP", countryName: "Japan" },
  { bankCode: "ICBKCNBJ", swiftCode: "ICBKCNBJ", bankName: "Industrial and Commercial Bank of China", countryCode: "CN", countryName: "China" },
  { bankCode: "HDFCINBB", swiftCode: "HDFCINBB", bankName: "HDFC Bank Limited", countryCode: "IN", countryName: "India" },
  { bankCode: "KOEXKRSE", swiftCode: "KOEXKRSE", bankName: "Hana Bank", countryCode: "KR", countryName: "South Korea" },
  { bankCode: "EBILAEAD", swiftCode: "EBILAEAD", bankName: "Emirates NBD Bank PJSC", countryCode: "AE", countryName: "United Arab Emirates" },
  { bankCode: "ANZBNZ22", swiftCode: "ANZBNZ22", bankName: "ANZ Bank New Zealand Limited", countryCode: "NZ", countryName: "New Zealand" },
  { bankCode: "UBSWCHZH80A", swiftCode: "UBSWCHZH80A", bankName: "UBS Switzerland AG", countryCode: "CH", countryName: "Switzerland" },
  { bankCode: "DEUTNL2A", swiftCode: "DEUTNL2A", bankName: "Deutsche Bank AG, Amsterdam Branch", countryCode: "NL", countryName: "Netherlands" },
  { bankCode: "BSCHESMM", swiftCode: "BSCHESMM", bankName: "Banco Santander, S.A.", countryCode: "ES", countryName: "Spain" },
  { bankCode: "UNCRITMM", swiftCode: "UNCRITMM", bankName: "UniCredit S.p.A.", countryCode: "IT", countryName: "Italy" },
  { bankCode: "DNBANOKK", swiftCode: "DNBANOKK", bankName: "DNB Bank ASA", countryCode: "NO", countryName: "Norway" },
  { bankCode: "ESSESESS", swiftCode: "ESSESESS", bankName: "Skandinaviska Enskilda Banken AB", countryCode: "SE", countryName: "Sweden" },
  { bankCode: "DABADKKK", swiftCode: "DABADKKK", bankName: "Danske Bank A/S", countryCode: "DK", countryName: "Denmark" },
  { bankCode: "HSBCHKHH", swiftCode: "HSBCHKHH", bankName: "The Hongkong and Shanghai Banking Corporation Limited", countryCode: "HK", countryName: "Hong Kong" },
  { bankCode: "MBBEMYKL", swiftCode: "MBBEMYKL", bankName: "Malayan Banking Berhad", countryCode: "MY", countryName: "Malaysia" },
  { bankCode: "DEUTIDJA", swiftCode: "DEUTIDJA", bankName: "Deutsche Bank AG, Jakarta Branch", countryCode: "ID", countryName: "Indonesia" },
  { bankCode: "DEUTPHMM", swiftCode: "DEUTPHMM", bankName: "Deutsche Bank AG, Manila Branch", countryCode: "PH", countryName: "Philippines" },
  { bankCode: "DEUTVNVX", swiftCode: "DEUTVNVX", bankName: "Deutsche Bank AG, Ho Chi Minh City Branch", countryCode: "VN", countryName: "Vietnam" },
  { bankCode: "DEUTTWTP", swiftCode: "DEUTTWTP", bankName: "Deutsche Bank AG, Taipei Branch", countryCode: "TW", countryName: "Taiwan" },
  { bankCode: "DEUTBRSP", swiftCode: "DEUTBRSP", bankName: "Deutsche Bank S.A., Brazil", countryCode: "BR", countryName: "Brazil" },
  { bankCode: "ICBKMXMM", swiftCode: "ICBKMXMM", bankName: "Industrial and Commercial Bank of China (Mexico)", countryCode: "MX", countryName: "Mexico" },
  { bankCode: "SBZAZAJJ", swiftCode: "SBZAZAJJ", bankName: "The Standard Bank of South Africa Limited", countryCode: "ZA", countryName: "South Africa" },
  { bankCode: "DEUTTRIS", swiftCode: "DEUTTRIS", bankName: "Deutsche Bank A.S., Istanbul Branch", countryCode: "TR", countryName: "Türkiye" },
  { bankCode: "AIBKIE2D", swiftCode: "AIBKIE2D", bankName: "Allied Irish Banks, p.l.c.", countryCode: "IE", countryName: "Ireland" },
  { bankCode: "BPKOPLPW", swiftCode: "BPKOPLPW", bankName: "Powszechna Kasa Oszczednosci Bank Polski S.A.", countryCode: "PL", countryName: "Poland" },
  { bankCode: "DEUTBEBE", swiftCode: "DEUTBEBE", bankName: "Deutsche Bank AG, Brussels Branch", countryCode: "BE", countryName: "Belgium" },
  { bankCode: "DEUTATWW", swiftCode: "DEUTATWW", bankName: "Deutsche Bank AG, Vienna Branch", countryCode: "AT", countryName: "Austria" },
  { bankCode: "DEUTPTPL", swiftCode: "DEUTPTPL", bankName: "Deutsche Bank AG, Lisbon Branch", countryCode: "PT", countryName: "Portugal" },
  { bankCode: "ETHNGRAA", swiftCode: "ETHNGRAA", bankName: "National Bank of Greece S.A.", countryCode: "GR", countryName: "Greece" },
  { bankCode: "QNBAQAQA", swiftCode: "QNBAQAQA", bankName: "Qatar National Bank", countryCode: "QA", countryName: "Qatar" },
  { bankCode: "KFHOKWKW", swiftCode: "KFHOKWKW", bankName: "Kuwait Finance House", countryCode: "KW", countryName: "Kuwait" },
  { bankCode: "BBKUBHBM", swiftCode: "BBKUBHBM", bankName: "Bank of Bahrain and Kuwait B.S.C.", countryCode: "BH", countryName: "Bahrain" },
  { bankCode: "BCEELULL", swiftCode: "BCEELULL", bankName: "Banque et Caisse d'Epargne de l'Etat, Luxembourg", countryCode: "LU", countryName: "Luxembourg" },
  { bankCode: "CEKOCZPP", swiftCode: "CEKOCZPP", bankName: "Ceskoslovenska obchodni banka, a.s.", countryCode: "CZ", countryName: "Czechia" },
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

/** Mock directory used to resolve a beneficiary name from an "Other BiKTECH BANK" account number. */
// export const otherSmeBankDirectory = [
//   { number: "000 000 096", name: "Sarah Jenkins" },
//   { number: "111 022 998", name: "Rous Soboros" },
//   { number: "500 987 654", name: "Khalid" },
//   { number: "300 050 756", name: "Chamrouen" },
//   { number: "012 441 789", name: "Sokha Chan" },
//   { number: "4417", name: "Sokha Chan" },
// ];
