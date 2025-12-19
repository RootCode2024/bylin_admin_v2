/* -------------------------------------------------------
 * 💰 PRIX
 * ----------------------------------------------------- */

/**
 * Formate un prix en Franc CFA (XOF)
 * 15000 → "15 000 FCFA"
 */
export function formatPriceXOF(
  amount: number | string,
  options?: {
    withSymbol?: boolean;
    locale?: string;
  }
): string {
  const value = Number(amount);
  if (Number.isNaN(value)) return "—";

  const { withSymbol = true, locale = "fr-FR" } = options ?? {};

  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(value);

  return withSymbol ? `${formatted} FCFA` : formatted;
}

/**
 * Prix avec réduction
 * 20000, 25 → "15 000 FCFA"
 */
export function formatPriceWithDiscount(
  price: number,
  discountPercent: number
): string {
  if (discountPercent <= 0) return formatPriceXOF(price);

  const discounted = price - price * (discountPercent / 100);
  return formatPriceXOF(Math.round(discounted));
}

/* -------------------------------------------------------
 * 📅 DATES
 * ----------------------------------------------------- */

/**
 * Date en français
 * "2025-01-05" → "5 janvier 2025"
 */
export function formatDateFR(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...options,
  }).format(parsed);
}

/**
 * Date + heure FR
 * "2025-01-05T14:30" → "5 janvier 2025 à 14:30"
 */
export function formatDateTimeFR(date: Date | string | number): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(parsed);
}
