import type {
  Attribute,
  AttributeValue,
  AttributeType,
} from "~/types/attribute";

// Import des helpers communs
import {
  generateSlug,
  isValidCode as validateCode,
  extractValidColors,
  groupBy,
  sortByNumber,
  getCountLabel,
} from "./helpers";

/* =========================================================================
 * 🏷️ TYPES D'ATTRIBUTS - Labels, Icônes, Couleurs
 * ========================================================================= */

/**
 * Retourne le label d'un type d'attribut
 */
export function getAttributeTypeLabel(type: AttributeType): string {
  const labels: Record<AttributeType, string> = {
    text: "Texte",
    select: "Sélection",
    color: "Couleur",
    size: "Taille",
    boolean: "Oui/Non",
  };
  return labels[type] || type;
}

/**
 * Retourne l'icône d'un type d'attribut
 */
export function getAttributeTypeIcon(type: AttributeType): string {
  const icons: Record<AttributeType, string> = {
    text: "i-lucide-text",
    select: "i-lucide-list",
    color: "i-lucide-palette",
    size: "i-lucide-ruler",
    boolean: "i-lucide-toggle-left",
  };
  return icons[type] || "i-lucide-tag";
}

/**
 * Retourne la couleur badge d'un type
 */
export function getAttributeTypeColor(type: AttributeType): string {
  const colors: Record<AttributeType, string> = {
    text: "neutral",
    select: "primary",
    color: "secondary",
    size: "success",
    boolean: "warning",
  };
  return colors[type] || "neutral";
}

/**
 * Formate le type pour l'affichage (alias de getAttributeTypeLabel)
 */
export function formatAttributeType(type: AttributeType): string {
  return getAttributeTypeLabel(type);
}

/* =========================================================================
 * ✅ RÈGLES MÉTIER - Validations spécifiques aux attributs
 * ========================================================================= */

/**
 * Vérifie si un type d'attribut supporte les couleurs
 */
export function supportsColors(type: AttributeType): boolean {
  return type === "color";
}

/**
 * Vérifie si un type d'attribut nécessite des valeurs
 */
export function requiresValues(type: AttributeType): boolean {
  return ["select", "color", "size"].includes(type);
}

/**
 * Vérifie si un attribut peut être supprimé
 */
export function canDelete(attribute: Attribute): boolean {
  if (attribute.values && attribute.values.length > 0) return false;

  // if ((attribute.products_count ?? 0) > 0) return false;

  return true;
}

/* =========================================================================
 * 🔧 GÉNÉRATION & VALIDATION DE CODES
 * ========================================================================= */

/**
 * Génère un code à partir d'un nom
 * Exemple: "Couleur Rouge" → "couleur_rouge"
 */
export function generateAttributeCode(name: string): string {
  return generateSlug(name);
}

/**
 * Valide un code d'attribut (alphanumeric + underscore, 2-100 caractères)
 */
export function isValidAttributeCode(code: string): boolean {
  return validateCode(code, 2, 100);
}

// Note: La fonction isValidCode() a été supprimée pour éviter les conflits
// Utiliser isValidAttributeCode() ou importer isValidCode depuis helpers.ts

/* =========================================================================
 * 📊 VALEURS D'ATTRIBUTS - Formatage & Manipulation
 * ========================================================================= */

/**
 * Formate une valeur d'attribut pour l'affichage
 */
export function formatAttributeValue(value: AttributeValue): string {
  return value.label || value.value;
}

/**
 * Trie les valeurs par sort_order
 */
export function sortValues(values: AttributeValue[]): AttributeValue[] {
  return sortByNumber(values, "sort_order", "asc");
}

/**
 * Extrait les codes couleur d'un ensemble de valeurs
 */
export function extractColors(values: AttributeValue[]): string[] {
  return extractValidColors(values);
}

/**
 * Crée un aperçu des valeurs (pour affichage dans tableau)
 * Exemple: ["Rouge", "Bleu", "Vert", "Jaune"] → "Rouge, Bleu, Vert, +1"
 */
export function createValuesPreview(
  values: AttributeValue[],
  maxDisplay: number = 3
): string {
  const sorted = sortValues(values);
  const display = sorted.slice(0, maxDisplay).map(formatAttributeValue);

  if (sorted.length > maxDisplay) {
    return `${display.join(", ")}, +${sorted.length - maxDisplay}`;
  }

  return display.join(", ");
}

/* =========================================================================
 * 🔢 COMPTEURS & MÉTADONNÉES
 * ========================================================================= */

/**
 * Compte le nombre de valeurs par attribut
 */
export function countValues(attribute: Attribute): number {
  return attribute.values?.length || attribute.values_count || 0;
}

/**
 * Vérifie si un attribut a des valeurs
 */
export function hasValues(attribute: Attribute): boolean {
  return countValues(attribute) > 0;
}

/**
 * Génère un label de comptage pour les valeurs
 * Exemple: 0 → "Aucune valeur", 1 → "1 valeur", 5 → "5 valeurs"
 */
export function getValuesCountLabel(count: number): string {
  return getCountLabel(count, "valeur");
}

/* =========================================================================
 * 🔍 RECHERCHE & FILTRAGE
 * ========================================================================= */

/**
 * Groupe les attributs par type
 */
export function groupByType(
  attributes: Attribute[]
): Record<string, Attribute[]> {
  return groupBy(attributes, "type");
}

/**
 * Filtre les attributs filtrables
 */
export function getFilterableAttributes(attributes: Attribute[]): Attribute[] {
  return attributes.filter((attr) => attr.is_filterable);
}

/**
 * Trouve un attribut par code
 */
export function findByCode(
  attributes: Attribute[],
  code: string
): Attribute | null {
  return attributes.find((attr) => attr.code === code) || null;
}

/**
 * Trouve une valeur d'attribut par value
 */
export function findValueByCode(
  values: AttributeValue[],
  valueCode: string
): AttributeValue | null {
  return values.find((val) => val.value === valueCode) || null;
}

/* =========================================================================
 * 📋 OPTIONS POUR SELECT/DROPDOWN
 * ========================================================================= */

/**
 * Génère des options pour un select d'attributs
 */
export function getAttributeSelectOptions(
  attributes: Attribute[]
): Array<{ value: string; label: string; type: AttributeType }> {
  return attributes.map((attr) => ({
    value: attr.id,
    label: attr.name,
    type: attr.type,
  }));
}

/**
 * Génère des options de valeurs pour un select
 */
export function getValueSelectOptions(
  values: AttributeValue[]
): Array<{ value: string; label: string; color?: string }> {
  return sortValues(values).map((val) => ({
    value: val.value,
    label: formatAttributeValue(val),
    color: val.color_code || undefined,
  }));
}
