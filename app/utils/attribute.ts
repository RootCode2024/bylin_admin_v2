import type {
  Attribute,
  AttributeValue,
  AttributeType,
} from "~/types/attribute";

/**
 * Retourne le label d'un type d'attribut
 */
export function getTypeLabel(type: AttributeType): string {
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
export function getTypeIcon(type: AttributeType): string {
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
export function getTypeColor(type: AttributeType): string {
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
 * Génère un code à partir d'un nom
 */
export function generateCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/**
 * Vérifie si une couleur est valide (format hex)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color);
}

/**
 * Génère une couleur aléatoire
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
 * Formate une valeur d'attribut pour l'affichage
 */
export function formatAttributeValue(value: AttributeValue): string {
  return value.label || value.value;
}

/**
 * Trie les valeurs par sort_order
 */
export function sortValues(values: AttributeValue[]): AttributeValue[] {
  return [...values].sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Groupe les attributs par type
 */
export function groupByType(attributes: Attribute[]): Record<string, Attribute[]> {
  return attributes.reduce(
    (acc, attr) => {
      const type = attr.type;
      const existing = acc[type];

      if (existing) {
        existing.push(attr);
      } else {
        acc[type] = [attr];
      }

      return acc;
    },
    {} as Record<string, Attribute[]>
  );
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
export function findByCode(attributes: Attribute[], code: string): Attribute | null {
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

/**
 * Génère des options pour un select
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

/**
 * Valide un code d'attribut
 */
export function isValidCode(code: string): boolean {
  return /^[a-z0-9_]+$/.test(code) && code.length >= 2 && code.length <= 100;
}

/**
 * Extrait les codes couleur d'un ensemble de valeurs
 */
export function extractColors(values: AttributeValue[]): string[] {
  return values
    .map((val) => val.color_code)
    .filter((color): color is string => !!color && isValidHexColor(color));
}

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
 * Formate le type pour l'affichage
 */
export function formatType(type: AttributeType): string {
  return getTypeLabel(type);
}

/**
 * Crée un aperçu des valeurs (pour affichage dans tableau)
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

/**
 * Vérifie si un attribut peut être supprimé
 */
export function canDelete(attribute: Attribute): boolean {
  // Logique métier : un attribut ne peut être supprimé s'il est utilisé par des produits
  // Cette info devrait venir de l'API, mais on peut ajouter une validation côté client
  return true; // À adapter selon la logique métier
}

/**
 * Génère un label de comptage pour les valeurs
 */
export function getValuesCountLabel(count: number): string {
  if (count === 0) return "Aucune valeur";
  if (count === 1) return "1 valeur";
  return `${count} valeurs`;
}
