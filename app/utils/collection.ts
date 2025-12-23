import type { Collection } from "~/types/collection";

// Import des helpers communs
import {
  sortByDate,
  sortByString,
  sortByNumber,
  matchesSearch,
} from "./helpers";

/* =========================================================================
 * 🔍 FILTRAGE & RECHERCHE
 * ========================================================================= */

/**
 * Filtre les collections actives uniquement
 */
export function getActiveCollections(collections: Collection[]): Collection[] {
  return collections.filter((c) => c.is_active);
}

/**
 * Filtre les collections par recherche (nom ou description)
 */
export function filterCollectionsBySearch(
  collections: Collection[],
  search: string
): Collection[] {
  if (!search.trim()) return collections;

  return collections.filter(
    (c) =>
      matchesSearch(c.name, search) ||
      matchesSearch(c.description || "", search)
  );
}

/**
 * Groupe les collections par statut actif/inactif
 */
export function groupCollectionsByStatus(collections: Collection[]) {
  return {
    active: collections.filter((c) => c.is_active),
    inactive: collections.filter((c) => !c.is_active),
  };
}

/* =========================================================================
 * 📊 TRI - Par date, nom, nombre de produits
 * ========================================================================= */

/**
 * Trie les collections par date de création
 */
export function sortCollectionsByDate(
  collections: Collection[],
  order: "asc" | "desc" = "desc"
): Collection[] {
  return sortByDate(collections, "created_at", order);
}

/**
 * Trie les collections par nom (ordre alphabétique)
 */
export function sortCollectionsByName(
  collections: Collection[],
  order: "asc" | "desc" = "asc"
): Collection[] {
  return sortByString(collections, "name", order);
}

/**
 * Trie les collections par nombre de produits
 */
export function sortCollectionsByProductsCount(
  collections: Collection[],
  order: "asc" | "desc" = "desc"
): Collection[] {
  return sortByNumber(collections, "products_count", order);
}

/**
 * Trie les collections selon un critère donné (helper principal)
 */
export function sortCollections(
  collections: Collection[],
  sortBy: "created_at" | "name" | "products_count" = "created_at",
  order: "asc" | "desc" = "desc"
): Collection[] {
  switch (sortBy) {
    case "name":
      return sortCollectionsByName(collections, order);
    case "products_count":
      return sortCollectionsByProductsCount(collections, order);
    case "created_at":
    default:
      return sortCollectionsByDate(collections, order);
  }
}

/* =========================================================================
 * 🔎 RECHERCHE SPÉCIFIQUE - Par slug, ID
 * ========================================================================= */

/**
 * Trouve une collection par slug
 */
export function findCollectionBySlug(
  collections: Collection[],
  slug: string
): Collection | undefined {
  return collections.find((c) => c.slug === slug);
}

/**
 * Trouve une collection par ID
 */
export function findCollectionById(
  collections: Collection[],
  id: string
): Collection | undefined {
  return collections.find((c) => c.id === id);
}

/* =========================================================================
 * 📈 STATISTIQUES & COMPTEURS
 * ========================================================================= */

/**
 * Compte le nombre total de produits dans plusieurs collections
 */
export function getTotalProductsCount(collections: Collection[]): number {
  return collections.reduce((sum, c) => sum + (c.products_count || 0), 0);
}

/**
 * Vérifie si une collection est vide (aucun produit)
 */
export function isCollectionEmpty(collection: Collection): boolean {
  return (collection.products_count || 0) === 0;
}

/* =========================================================================
 * ⭐ COLLECTIONS REMARQUABLES - Récentes, populaires
 * ========================================================================= */

/**
 * Obtient les collections les plus récentes
 */
export function getRecentCollections(
  collections: Collection[],
  limit: number = 5
): Collection[] {
  return sortCollectionsByDate(collections, "desc").slice(0, limit);
}

/**
 * Obtient les collections les plus populaires (par nombre de produits)
 */
export function getPopularCollections(
  collections: Collection[],
  limit: number = 5
): Collection[] {
  return sortCollectionsByProductsCount(collections, "desc").slice(0, limit);
}

/* =========================================================================
 * 📋 OPTIONS POUR SELECT/DROPDOWN
 * ========================================================================= */

/**
 * Formate les collections pour un composant select
 */
export function formatCollectionsForSelect(collections: Collection[]) {
  return collections.map((collection) => ({
    label: collection.name,
    value: collection.id,
    disabled: !collection.is_active,
    icon: collection.is_active ? "i-lucide-check-circle" : "i-lucide-circle",
  }));
}
