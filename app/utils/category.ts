import type { Category, CategoryLevel } from "~/types/category";

/**
 * Retourne le label d'un niveau de catégorie
 */
export function getLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    0: "Genre",
    1: "Type",
    2: "Catégorie",
    3: "Sous-catégorie",
  };
  return labels[level] || `Niveau ${level}`;
}

/**
 * Retourne la couleur badge d'un niveau
 */
export function getLevelColor(level: number): string {
  const colors: Record<number, string> = {
    0: "primary",
    1: "secondary",
    2: "success",
    3: "warning",
  };
  return colors[level] || "neutral";
}

/**
 * Construit le chemin complet d'une catégorie
 */
export function buildCategoryPath(
  categories: readonly Category[] | Category[],
  currentCategory: Category
): string {
  const path: string[] = [];
  let current = currentCategory;

  // Remonter la hiérarchie
  while (current) {
    path.unshift(current.name);
    if (current.parent_id) {
      const parent = categories.find((c) => c.id === current.parent_id);
      if (parent) {
        current = parent;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return path.join(" > ");
}

/**
 * Construit le fil d'Ariane d'une catégorie
 */
export function buildBreadcrumb(
  category: Category,
  allCategories: readonly Category[] | Category[]
): Array<{ id: string; name: string; slug: string; level: number }> {
  const breadcrumb: Array<{
    id: string;
    name: string;
    slug: string;
    level: number;
  }> = [];
  let current = category;

  // Remonter jusqu'à la racine
  while (current) {
    breadcrumb.unshift({
      id: current.id,
      name: current.name,
      slug: current.slug,
      level: current.level,
    });

    if (current.parent_id) {
      const parent = allCategories.find((c) => c.id === current.parent_id);
      if (parent) {
        current = parent;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  return breadcrumb;
}

/**
 * Vérifie si une catégorie peut avoir des enfants
 */
export function canHaveChildren(level: number): boolean {
  // Maximum 4 niveaux (0-3), donc niveau 3 ne peut pas avoir d'enfants
  return level < 3;
}

/**
 * Vérifie si une catégorie peut avoir des produits
 */
export function canHaveProducts(level: number): boolean {
  // Seules les catégories de niveau 2+ peuvent avoir des produits
  return level >= 2;
}

/**
 * Filtre les catégories par niveau
 */
export function filterByLevel(
  categories: readonly Category[] | Category[],
  level: CategoryLevel
): Category[] {
  return categories.filter((c) => c.level === level);
}

/**
 * Filtre les catégories racines
 */
export function getRootCategories(
  categories: readonly Category[] | Category[]
): Category[] {
  return categories.filter((c) => !c.parent_id);
}

/**
 * Filtre les enfants d'une catégorie
 */
export function getChildren(
  categories: readonly Category[] | Category[],
  parentId: string
): Category[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Construit un arbre hiérarchique récursif
 */
export function buildTree(
  categories: readonly Category[] | Category[],
  parentId: string | null = null
): Category[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((category) => ({
      ...category,
      children: buildTree(categories, category.id),
    }));
}

/**
 * Aplatit un arbre hiérarchique
 */
export function flattenTree(
  tree: readonly Category[] | Category[]
): Category[] {
  const result: Category[] = [];

  function traverse(nodes: readonly Category[] | Category[]) {
    for (const node of nodes) {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(tree);
  return result;
}

/**
 * Trouve une catégorie dans un arbre par ID
 */
export function findInTree(
  tree: readonly Category[] | Category[],
  id: string
): Category | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Génère des options de sélection pour un select parent
 */
export function getCategorySelectOptions(
  categories: readonly Category[] | Category[],
  excludeId?: string,
  maxLevel: number = 2
): Array<{ value: string; label: string; disabled?: boolean }> {
  const options: Array<{ value: string; label: string; disabled?: boolean }> =
    [];
  const roots = getRootCategories(categories);

  function traverse(cats: readonly Category[] | Category[], prefix = "") {
    for (const cat of cats) {
      if (cat.id === excludeId) continue;

      const isDisabled = cat.level >= maxLevel;
      options.push({
        value: cat.id,
        label: `${prefix}${cat.name}`,
        disabled: isDisabled,
      });

      const children = getChildren(categories, cat.id);
      if (children.length > 0) {
        traverse(children, prefix + "  ");
      }
    }
  }

  traverse(roots);
  return options;
}

/**
 * Compte le nombre de descendants d'une catégorie
 */
export function countDescendants(
  categories: readonly Category[] | Category[],
  parentId: string
): number {
  const children = getChildren(categories, parentId);
  let count = children.length;

  for (const child of children) {
    count += countDescendants(categories, child.id);
  }

  return count;
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
  );
}
