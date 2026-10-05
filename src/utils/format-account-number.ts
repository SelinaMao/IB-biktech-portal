/**
 * Groups an account number into 3-digit blocks, e.g. "000000000000" -> "000 000 000 000".
 * Strips any existing separators (spaces, dashes) first, so it normalizes
 * consistently regardless of source formatting.
 */
export const formatAccountNumber = (accountNumber: string | number | undefined | null): string => {
  const digits = String(accountNumber ?? "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/(.{3})/g, "$1 ").trim();
};
