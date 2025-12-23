/* =========================================================================
 * 🔧 HELPERS COMMUNS
 * Fonctions utilitaires partagées à travers toute l'application
 * ========================================================================= */

/* -------------------------------------------------------
 * 🎲 RANDOM & GÉNÉRATION
 * ----------------------------------------------------- */

/**
 * Génère un entier aléatoire entre min et max (inclus)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Sélectionne un élément aléatoire dans un tableau
 */
export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * Génère un code alphanumérique aléatoire
 * @param prefix - Préfixe optionnel (sera en majuscule)
 * @param length - Longueur totale du code
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
 * Génère un slug à partir d'un texte
 * Exemple: "Ceci est Un Test" → "ceci_est_un_test"
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
 * 🎨 COULEURS
 * ----------------------------------------------------- */

/**
 * Vérifie si une chaîne est une couleur hexadécimale valide
 * Exemple: "#FF5733" → true, "FF5733" → false
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Normalise une couleur hexadécimale (ajoute # si manquant, uppercase)
 */
export function normalizeHexColor(color: string): string {
  const cleaned = color.trim().toUpperCase();
  return cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
}

/**
 * Génère une couleur hexadécimale aléatoire
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
 * Extrait les codes couleur hexadécimaux valides d'un tableau d'objets
 */
export function extractValidColors<T extends { color_code?: string | null }>(
  items: T[]
): string[] {
  return items
    .map((item) => item.color_code)
    .filter((color): color is string => !!color && isValidHexColor(color));
}

/* -------------------------------------------------------
 * 📏 VALIDATION & FORMAT
 * ----------------------------------------------------- */

/**
 * Vérifie si un code est valide (alphanumeric + underscore)
 * @param minLength - Longueur minimale (défaut: 2)
 * @param maxLength - Longueur maximale (défaut: 100)
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
 * Normalise un code (uppercase, trim, supprime espaces)
 */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/**
 * Formate une taille de fichier en unité lisible
 * Exemple: 1536000 → "1.46 Mo"
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
 * 💰 PRIX (FCFA/XOF)
 * ----------------------------------------------------- */

/**
 * Formate un montant en Franc CFA
 * Exemple: 15000 → "15 000 FCFA"
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
 * Calcule et formate un prix avec réduction
 * Exemple: (20000, 25) → "15 000 FCFA"
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
 * 📅 DATES & TEMPS
 * ----------------------------------------------------- */

/**
 * Formate une date en français
 * Exemple: "2025-01-05" → "5 janvier 2025"
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
 * Formate une date avec heure en français
 * Exemple: "2025-01-05T14:30" → "5 janvier 2025 à 14:30"
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
 * Formate une date courte pour les formulaires
 * Exemple: Date → "2025-01-05"
 */
export function formatDateInput(date: Date | string | number): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toISOString().split("T")[0] || "";
}

/**
 * Calcule les jours restants jusqu'à une date
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
 * 📊 COMPTEURS & LABELS
 * ----------------------------------------------------- */

/**
 * Génère un label de comptage avec pluralisation
 * @param count - Nombre d'éléments
 * @param singular - Label au singulier
 * @param plural - Label au pluriel (optionnel, ajoute "s" par défaut)
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
 * 🔍 RECHERCHE & FILTRAGE
 * ----------------------------------------------------- */

/**
 * Normalise une chaîne pour la recherche (lowercase, sans accents)
 */
export function normalizeForSearch(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Vérifie si une chaîne contient un terme de recherche
 */
export function matchesSearch(text: string, search: string): boolean {
  if (!search.trim()) return true;
  return normalizeForSearch(text).includes(normalizeForSearch(search));
}

/* -------------------------------------------------------
 * 📋 TABLEAUX & COLLECTIONS
 * ----------------------------------------------------- */

/**
 * Trie un tableau par une clé numérique
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
 * Trie un tableau par une clé string (ordre alphabétique)
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
 * Trie un tableau par date
 */
export function sortByDate<T>(
  items: T[],
  key: keyof T,
  order: "asc" | "desc" = "desc"
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a[key] as any).getTime();
    const dateB = new Date(b[key] as any).getTime();
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Groupe un tableau d'objets par une clé
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
 * 🔗 URL & WEB
 * ----------------------------------------------------- */

/**
 * Construit une URL complète avec protocole
 */
export function buildWebsiteUrl(
  domain: string,
  extension: string = ""
): string {
  const cleanDomain = domain.replace(/^https?:\/\//, "");
  return `https://${cleanDomain}${extension}`;
}

/**
 * Extrait le domaine d'une URL
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
 * 🎯 OPTIONS POUR SELECT/DROPDOWN
 * ----------------------------------------------------- */

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  color?: string;
}

/**
 * Transforme un tableau d'objets en options pour select
 */
export function toSelectOptions<T extends Record<string, any>>(
  items: T[],
  valueKey: keyof T,
  labelKey: keyof T,
  disabledKey?: keyof T
): SelectOption[] {
  return items.map((item) => ({
    value: String(item[valueKey]),
    label: String(item[labelKey]),
    disabled: disabledKey ? !item[disabledKey] : false,
  }));
}

/* -------------------------------------------------------
 * 🖼️ IMAGES
 * ----------------------------------------------------- */

export interface ImageUploadConfig {
  maxFileSize: number; // en octets
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
 * Valide un fichier image selon une configuration
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
