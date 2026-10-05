export const bankNumberFormat = (number: string) => {
  if (!number) return number;
  const numberStr = number.toString();
  return numberStr.replace(/(.{3})/g, "$1 ").replace(/\s$/, "");
};

export const bankNumberFormatFour = (number: string) => {
  if (!number) return number;
  const numberStr = number.toString();
  return numberStr.replace(/(.{3})/g, "$1 ").replace(/\s$/, "");
};
