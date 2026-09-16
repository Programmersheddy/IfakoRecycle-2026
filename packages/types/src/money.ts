/**
 * @eas/types — money (Naira/NGN) formatting & kobo ⇄ naira conversion.
 *
 * Naira (NGN) is the app's SOLE currency (PRD §1: "one currency"). House rules
 * enforced app-wide:
 *
 *   1. Money is STORED and TRANSMITTED as integer kobo (`Kobo` = NGN × 100).
 *   2. Money is DISPLAYED only via this module — never hardcode "₦" and never
 *      call toLocaleString() directly on a monetary value.
 *   3. 1 NGN = 100 kobo, so amounts survive JSON/DB as lossless integers.
 *
 * All formatting runs through Intl.NumberFormat with locale "en-NG" and
 * currency "NGN", so every screen, alert and log renders identically.
 */

/** ISO-4217 currency code — Naira is the app's sole currency (PRD §1). */
export const CURRENCY = "NGN" as const;

/** Display symbol for {@link CURRENCY} (en-NG renders it exactly this way). */
export const CURRENCY_SYMBOL = "₦" as const;

/** BCP-47 locale used for every Naira render (Nigerian English). */
export const CURRENCY_LOCALE = "en-NG" as const;

/** 38640 kobo → "₦386.40" — currency style, always 2 fraction digits. */
const nairaCurrencyFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/** 38640 kobo → "386.40" — bare decimal number, always 2 fraction digits. */
const nairaNumberFormatter = new Intl.NumberFormat(CURRENCY_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

/**
 * Format a kobo amount as a Naira currency string.
 * `formatNaira(38640)` → `"₦386.40"`.
 *
 * @param kobo - Amount in kobo (1 NGN = 100 kobo); non-finite input → "₦0.00".
 */
export function formatNaira(kobo: number): string {
  return nairaCurrencyFormatter.format(koboToNaira(kobo));
}

/**
 * Format a kobo amount as a bare Naira number (no symbol).
 * `formatNairaNumber(38640)` → `"386.40"` — for inputs whose UI already
 * renders {@link CURRENCY_SYMBOL} beside them.
 */
export function formatNairaNumber(kobo: number): string {
  return nairaNumberFormatter.format(koboToNaira(kobo));
}

/**
 * Parse user-entered naira text ("₦1,250.50", "1250.5", "1,000") into a kobo
 * integer. Lenient: strips {@link CURRENCY_SYMBOL}, spaces, commas and any
 * other non-numeric characters before parsing.
 *
 * @returns Kobo integer (e.g. `125050`), or `0` for empty/negative/unparseable
 * input — a safe value for `>=` minimum checks.
 */
export function parseNairaToKobo(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, "");
  const naira = Number.parseFloat(cleaned);
  if (!Number.isFinite(naira) || naira < 0) return 0;
  const kobo = Math.round(naira * 100);
  return Number.isSafeInteger(kobo) ? kobo : 0;
}

/**
 * Convert a kobo integer to its naira float.
 * `koboToNaira(38640)` → `386.4` — a derived display value; never store it.
 */
export function koboToNaira(kobo: number): number {
  return Number.isFinite(kobo) ? kobo / 100 : 0;
}

/**
 * Convert a naira amount (float or user input) to a kobo integer.
 * `nairaToKobo(386.4)` → `38640`; `nairaToKobo(1250.505)` → `125051` (rounded).
 */
export function nairaToKobo(naira: number): number {
  const kobo = Number.isFinite(naira) ? Math.round(naira * 100) : 0;
  return Number.isSafeInteger(kobo) ? kobo : 0;
}
