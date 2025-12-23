import type { Brand } from "~/types/brand";

/* =========================================================================
 * MARQUES - Utilitaires spécifiques
 * ========================================================================= */

/**
 * Formate les marques pour un composant select
 */
export function formatBrandsForSelect(brands: Brand[]) {
  return brands.map((brand) => ({
    label: brand.name,
    value: brand.id,
    disabled: !brand.is_active,
  }));
}

/**
 * Filtre les marques actives uniquement
 */
export function getActiveBrands(brands: Brand[]) {
  return brands.filter((b) => b.is_active);
}

/**
 * Trie les marques par nom (ordre alphabétique)
 */
export function sortBrandsByName(
  brands: Brand[],
  order: "asc" | "desc" = "asc"
) {
  return [...brands].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, "fr", {
      sensitivity: "base",
    });
    return order === "desc" ? -comparison : comparison;
  });
}

/**
 * Trouve une marque par slug
 */
export function findBrandBySlug(
  brands: Brand[],
  slug: string
): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}

/**
 * Trouve une marque par ID
 */
export function findBrandById(brands: Brand[], id: string): Brand | undefined {
  return brands.find((b) => b.id === id);
}

/**
 * Filtre les marques par recherche (nom ou description)
 */
export function filterBrandsBySearch(brands: Brand[], search: string) {
  if (!search.trim()) return brands;

  const searchLower = search.toLowerCase().trim();

  return brands.filter(
    (b) =>
      b.name.toLowerCase().includes(searchLower) ||
      b.description?.toLowerCase().includes(searchLower)
  );
}

/**
 * Vérifie si une marque a un site web
 */
export function hasBrandWebsite(brand: Brand): boolean {
  return !!(brand.website);
}

/**
 * Obtient l'URL complète du site web d'une marque
 * (utilise buildWebsiteUrl de helpers.ts)
 */
export function getBrandWebsiteUrl(brand: Brand): string | null {
  if (!hasBrandWebsite(brand)) return null;

  // buildWebsiteUrl est maintenant dans helpers.ts et auto-importé par Nuxt
  return buildWebsiteUrl(brand.website!);
}
