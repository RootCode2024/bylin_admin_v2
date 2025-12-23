/* =========================================================================
 * 💵 FORMAT - Fonctions de formatage téléphone spécialisées
 * Note: Les autres fonctions de formatage sont dans helpers.ts
 * ========================================================================= */

/* =========================================================================
 * 📱 FORMATAGE TÉLÉPHONE
 * ========================================================================= */

import parsePhoneNumberFromString, {
  parsePhoneNumberWithError,
  type CountryCode,
} from "libphonenumber-js";

/**
 * Formate un numéro de téléphone
 * @param phone - Numéro brut ou formaté
 * @param country - Code pays (défaut: BJ)
 * @param format - Format de sortie (défaut: INTERNATIONAL)
 */
export function formatPhone(
  phone?: string,
  country: string = "BJ",
  format: "INTERNATIONAL" | "NATIONAL" = "INTERNATIONAL"
): string {
  if (!phone) return "—";

  try {
    const phoneNumber = parsePhoneNumberFromString(
      phone,
      country as CountryCode
    );

    if (!phoneNumber?.isValid()) return phone;

    return format === "NATIONAL"
      ? phoneNumber.formatNational()
      : phoneNumber.formatInternational();
  } catch {
    return phone;
  }
}

/**
 * Formate un numéro au format E.164 (+229...)
 */
export function formatPhoneNumber(countryCode: string, number: string): string {
  try {
    const phoneNumber = parsePhoneNumberWithError(
      number,
      countryCode as CountryCode
    );
    return phoneNumber?.format("E.164") || number;
  } catch {
    return number;
  }
}

/**
 * Parse un numéro stocké pour extraire le code pays et le numéro
 */
export function parseStoredPhone(
  phone: string | null | undefined
): { countryCode: string; number: string } | null {
  if (!phone) return null;

  try {
    const phoneNumber = parsePhoneNumberWithError(phone);
    if (phoneNumber) {
      return {
        countryCode: phoneNumber.country || "BJ",
        number: phoneNumber.nationalNumber,
      };
    }
  } catch {
    // Si le parsing échoue, on retourne null
  }

  return null;
}
