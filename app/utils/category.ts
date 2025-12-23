import type { Category, CategoryLevel } from "~/types/category";

/* =========================================================================
 * 🏷️ NIVEAUX DE CATÉGORIES - Labels & Couleurs
 * ========================================================================= */

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

/* =========================================================================
 * ✅ RÈGLES MÉTIER - Validations spécifiques aux catégories
 * ========================================================================= */

/**
 * Vérifie si une catégorie peut avoir des enfants
 * @note Maximum 4 niveaux (0-3), donc niveau 3 ne peut pas avoir d'enfants
 */
export function canHaveChildren(level: number): boolean {
  return level < 3;
}

/**
 * Vérifie si une catégorie peut avoir des produits
 * @note Seules les catégories de niveau 2+ peuvent avoir des produits
 */
export function canHaveProducts(level: number): boolean {
  return level >= 2;
}

/* =========================================================================
 * 🗂️ HIÉRARCHIE & NAVIGATION - Chemins & Fil d'Ariane
 * ========================================================================= */

/**
 * Construit le chemin complet d'une catégorie
 * Exemple: "Homme > Vêtements > T-shirts"
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

/* =========================================================================
 * 🔍 FILTRAGE & RECHERCHE - Par niveau, parent, etc.
 * ========================================================================= */

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
 * Filtre les catégories racines (sans parent)
 */
export function getRootCategories(
  categories: readonly Category[] | Category[]
): Category[] {
  return categories.filter((c) => !c.parent_id);
}

/**
 * Récupère les enfants directs d'une catégorie
 */
export function getChildren(
  categories: readonly Category[] | Category[],
  parentId: string
): Category[] {
  return categories
    .filter((c) => c.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/* =========================================================================
 * 🌳 ARBRE HIÉRARCHIQUE - Construction & Manipulation
 * ========================================================================= */

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
 * Aplatit un arbre hiérarchique en liste
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

/* =========================================================================
 * 📊 COMPTEURS & STATISTIQUES
 * ========================================================================= */

/**
 * Compte le nombre de descendants d'une catégorie (récursif)
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

/* =========================================================================
 * 📋 OPTIONS POUR SELECT/DROPDOWN
 * ========================================================================= */

/**
 * Génère des options de sélection pour un select parent
 * @param categories - Liste des catégories
 * @param excludeId - ID à exclure (éviter les références circulaires)
 * @param maxLevel - Niveau maximum sélectionnable
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
