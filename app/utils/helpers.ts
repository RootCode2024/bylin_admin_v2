/* =========================================================================
 * Helpers communs
 * Fonctions utilitaires utilisées dans toute l'application
 * ========================================================================= */

/* -------------------------------------------------------
 * Random et génération
 * ----------------------------------------------------- */

/**
 * Retourne un entier aléatoire entre min et max inclus.
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sélectionne un élément aléatoire dans un tableau.
 */
export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * Génère un code alphanumérique aléatoire.
 * @param prefix - Préfixe optionnel, sera mis en majuscules
 * @param length - Longueur totale du code (par défaut 8)
 */
export function generateRandomCode(
  prefix: string = "",
  length: number = 8
): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = prefix.toUpperCase();

  const remaining = length - code.length;
  for (let i = 0; i < remaining; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return code;
}

/**
 * Génère un slug à partir d'une chaîne de caractères.
 * Exemple : "Ceci est Un Test" → "ceci_est_un_test"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* -------------------------------------------------------
 * Couleurs
 * ----------------------------------------------------- */

/**
 * Vérifie si une chaîne représente une couleur hexadécimale valide.
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Normalise une couleur hexadécimale : ajoute "#" si nécessaire et met en majuscules.
 */
export function normalizeHexColor(color: string): string {
  const cleaned = color.trim().toUpperCase();
  return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

/**
 * Génère une couleur hexadécimale aléatoire.
 */
export function randomColor(): string {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
      .toUpperCase()
  );
}

/**
 * Extrait tous les codes couleur valides d'un tableau d'objets.
 */
export function extractValidColors<T extends { color_code?: string | null }>(
  items: T[]
): string[] {
  return items
    .map((item) => item.color_code)
    .filter((color): color is string => !!color && isValidHexColor(color));
}

/* -------------------------------------------------------
 * Validation et format
 * ----------------------------------------------------- */

/**
 * Vérifie si un code est alphanumérique et respecte les limites de longueur.
 */
export function isValidCode(
  code: string,
  minLength: number = 2,
  maxLength: number = 100
): boolean {
  return (
    /^[a-z0-9_]+$/.test(code) &&
    code.length >= minLength &&
    code.length <= maxLength
  );
}

/**
 * Normalise un code : supprime les espaces et met en majuscules.
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Formate une taille de fichier en unité lisible.
 * Exemple : 1536000 → "1.46 Mo"
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Octets";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${
    sizes[i]
  }`;
}

/* -------------------------------------------------------
 * Prix (FCFA/XOF)
 * ----------------------------------------------------- */

/**
 * Formate un montant en Franc CFA.
 */
export function formatPriceXOF(
  amount: number | string,
  options?: { withSymbol?: boolean; locale?: string }
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
 * Calcule et formate un prix avec une remise.
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
 * Dates et temps
 * ----------------------------------------------------- */

/**
 * Formate une date en français.
 * Exemple : "2025-01-05" → "5 janvier 2025"
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
 * Formate une date et l'heure en français.
 */
export function formatDateTimeFR(date: Date | string | number): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(parsed);
}

/**
 * Formate une date pour un champ de formulaire (YYYY-MM-DD).
 */
export function formatDateInput(date: Date | string | number): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().split("T")[0] ?? "";
}

/**
 * Calcule le nombre de jours restants jusqu'à une date donnée.
 */
export function getDaysRemaining(dateString: string | null): number | null {
  if (!dateString) return null;

  const now = new Date();
  const target = new Date(dateString);
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
}

/* -------------------------------------------------------
 * Compteurs et labels
 * ----------------------------------------------------- */

/**
 * Retourne un label en fonction du nombre d'éléments avec gestion du pluriel.
 */
export function getCountLabel(
  count: number,
  singular: string,
  plural?: string
): string {
  if (count === 0) return `Aucun ${singular}`;
  if (count === 1) return `1 ${singular}`;
  return `${count} ${plural || singular + "s"}`;
}

/* -------------------------------------------------------
 * Recherche et filtrage
 * ----------------------------------------------------- */

/**
 * Normalise une chaîne pour la recherche (minuscules et sans accents).
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Vérifie si une chaîne contient un terme de recherche.
 */
export function matchesSearch(text: string, search: string): boolean {
  if (!search.trim()) return true;
  return normalizeForSearch(text).includes(normalizeForSearch(search));
}

/* -------------------------------------------------------
 * Tableaux et collections
 * ----------------------------------------------------- */

/**
 * Trie un tableau par une clé numérique.
 */
export function sortByNumber<T>(
  items: T[],
  key: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const valA = Number(a[key]) || 0;
    const valB = Number(b[key]) || 0;
    return order === "asc" ? valA - valB : valB - valA;
  });
}

/**
 * Trie un tableau par une clé string (ordre alphabétique).
 */
export function sortByString<T>(
  items: T[],
  key: keyof T,
  order: "asc" | "desc" = "asc"
): T[] {
  return [...items].sort((a, b) => {
    const valA = String(a[key] || "");
    const valB = String(b[key] || "");
    const comparison = valA.localeCompare(valB, "fr", { sensitivity: "base" });
    return order === "asc" ? comparison : -comparison;
  });
}

/**
 * Trie un tableau par date.
 */
export function sortByDate<T>(
  items: T[],
  key: keyof T,
  order: "asc" | "desc" = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(String(a[key])).getTime();
    const dateB = new Date(String(b[key])).getTime();
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Groupe un tableau d'objets par une clé.
 */
export function groupBy<T>(items: T[], key: keyof T): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const groupKey = String(item[key]);
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/* -------------------------------------------------------
 * URL et Web
 * ----------------------------------------------------- */

/**
 * Construit une URL complète avec protocole.
 */
export function buildWebsiteUrl(
  domain: string,
  extension: string = ""
): string {
  const cleanDomain = domain.replace(/^https?:\/\//, "");
  return `https://${cleanDomain}${extension}`;
}

/**
 * Extrait le domaine principal d'une URL.
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith("http") ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/* -------------------------------------------------------
 * Options pour Select/Dropdown
 * ----------------------------------------------------- */

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
}

/**
 * Transforme un tableau d'objets en options pour un composant select.
 */
export function toSelectOptions<T extends Record<string, unknown>>(
  items: T[],
  valueKey: keyof T,
  labelKey: keyof T,
  disabledKey?: keyof T
): SelectOption[] {
  return items.map((item) => ({
    value: String(item[valueKey]),
    label: String(item[labelKey]),
    disabled: disabledKey ? Boolean(item[disabledKey]) : false,
  }));
}

/* -------------------------------------------------------
 * Images
 * ----------------------------------------------------- */

export interface ImageUploadConfig {
  maxFileSize: number;
  minDimensions: { width: number; height: number };
  maxDimensions: { width: number; height: number };
  acceptedTypes: string[];
}

export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  minDimensions: { width: 200, height: 200 },
  maxDimensions: { width: 2048, height: 2048 },
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

/**
 * Valide un fichier image selon une configuration donnée.
 */
export function validateImageFile(
  file: File,
  config: ImageUploadConfig = DEFAULT_IMAGE_CONFIG
): { valid: boolean; error?: string } {
  if (!config.acceptedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Type de fichier non supporté. Types acceptés: ${config.acceptedTypes.join(
        ", "
      )}`,
    };
  }

  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `Fichier trop volumineux. Taille maximale: ${formatFileSize(
        config.maxFileSize
      )}`,
    };
  }

  return { valid: true };
}
