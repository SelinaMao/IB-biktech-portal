export const formatCCY = (
  amount: number | string,
  ccy: string = 'USD',
): string => {
  if (ccy === 'KHR') {
    // Intl has no narrow symbol for KHR in en-US, so it would fall back to
    // the "KHR" ISO code — use the Riel sign directly instead.
    const formatted = Number(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `៛ ${formatted}`;
  }

  return Number(amount).toLocaleString('en-US', {
    style: 'currency',
    currency: ccy,
  });
};
