export interface RelativeTimeOptions {
  /**
   * Date de référence (utile pour tests & SSR)
   */
  baseDate?: Date;

  /**
   * Format court : "2 j", "3 h"
   */
  short?: boolean;

  /**
   * Désactive "maintenant"
   */
  strict?: boolean;

  /**
   * Unité maximale autorisée
   * Exemple : 'day' → jamais "mois" ou "années"
   */
  maxUnit?: Intl.RelativeTimeFormatUnit;
}

export function formatRelativeTimeFR(
  date: Date | string | number,
  options: RelativeTimeOptions = {}
): string {
  const target = new Date(date);
  if (Number.isNaN(target.getTime())) return "—";

  const base = options.baseDate ?? new Date();
  const diffSeconds = Math.floor((target.getTime() - base.getTime()) / 1000);

  // Cas "maintenant"
  if (!options.strict && Math.abs(diffSeconds) < 5) {
    return "maintenant";
  }

  const rtf = new Intl.RelativeTimeFormat("fr", {
    numeric: "auto",
    style: options.short ? "narrow" : "long",
  });

  const units: ReadonlyArray<{
    unit: Intl.RelativeTimeFormatUnit;
    seconds: number;
  }> = [
    { unit: "year", seconds: 31_536_000 },
    { unit: "month", seconds: 2_592_000 },
    { unit: "day", seconds: 86_400 },
    { unit: "hour", seconds: 3_600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  // 🔒 Sécurisation maxUnit (évite undefined + -1)
  const limitedUnits = options.maxUnit
    ? (() => {
        const index = units.findIndex((u) => u.unit === options.maxUnit);
        return index === -1 ? units : units.slice(0, index + 1);
      })()
    : units;

  for (const { unit, seconds } of limitedUnits) {
    if (Math.abs(diffSeconds) >= seconds) {
      const value =
        diffSeconds > 0
          ? Math.ceil(diffSeconds / seconds)
          : Math.floor(diffSeconds / seconds);

      return rtf.format(value, unit);
    }
  }

  return options.strict ? rtf.format(0, "second") : "maintenant";
}
