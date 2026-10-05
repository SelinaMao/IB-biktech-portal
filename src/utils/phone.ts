const CAMBODIA_COUNTRY_CODE = "855";
// Shortest valid Cambodian local number (without leading 0), e.g. "12345678".
const MIN_LOCAL_LENGTH = 8;

/**
 * The country code as a person reads it — the fixed affix a phone field wears
 * (`<BaseInput prefix={PHONE_DIAL_CODE} />`). Display only: core wants the
 * code without the "+", which is what `toIntlPhone` produces.
 */
export const PHONE_DIAL_CODE = `+${CAMBODIA_COUNTRY_CODE}`;

/**
 * The local part of a number, for a field that already shows `PHONE_DIAL_CODE`
 * beside it: "85512123245", "+855 012 123 245" and "012123245" all become
 * "12123245", so the affix never doubles up.
 *
 * A local number can itself start with 855 (085 512 345 is "85512345"), so the
 * code only comes off when a full local number is left behind it.
 */
export function nationalPhone(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  const hasCountryCode =
    digits.startsWith(CAMBODIA_COUNTRY_CODE) &&
    digits.length - CAMBODIA_COUNTRY_CODE.length >= MIN_LOCAL_LENGTH;

  const local = hasCountryCode ? digits.slice(CAMBODIA_COUNTRY_CODE.length) : digits;
  // A leading 0 is the domestic trunk prefix; it is never dialled after +855.
  return local.replace(/^0/, "");
}

/**
 * Normalizes a locally-entered mobile number (e.g. "012123245") into the
 * format core expects: country code + local number, no leading zero, no
 * "+" (e.g. "85512123245").
 *
 * Also tolerates a user typing/pasting the country code themselves (e.g.
 * "85512123245") — without this, re-prepending "855" would double it up
 * into "85585512123245".
 */
export function toIntlPhone(value: string): string {
  const local = nationalPhone(value);
  return local ? `${CAMBODIA_COUNTRY_CODE}${local}` : "";
}

// Local number (with leading 0) grouped as "0X XXX XXXX", e.g. "012 345 678" -> "01 234 5678".
const MAX_DISPLAY_DIGITS = CAMBODIA_COUNTRY_CODE.length + MIN_LOCAL_LENGTH;

/** Formats digits as the user types into "0X XXX XXXX" groups for display. */
export function formatLocalPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, MAX_DISPLAY_DIGITS);
  const groups = [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 9), digits.slice(9)];
  return groups.filter(Boolean).join(" ");
}
