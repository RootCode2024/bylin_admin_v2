/**
 * Types pour le module Catalogue - Collections
 * Compatible avec Spatie Media Library
 */

import type { Product } from "./product";

// ==========================================
// MEDIA LIBRARY TYPES
// ==========================================

export interface Media {
  id: number;
  model_type: string;
  model_id: string;
  uuid: string;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  conversions_disk: string;
  size: number;
  manipulations: Record<string, unknown>;
  custom_properties: Record<string, unknown>;
  generated_conversions: Record<string, boolean>;
  responsive_images: Record<string, unknown>;
  order_column: number;
  created_at: string;
  updated_at: string;
  original_url: string;
  preview_url: string;
}

// ==========================================
// TYPES DE BASE
// ==========================================

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;

  // Season & Theme
  season?: string | null;
  theme?: string | null;

  // Dates
  release_date?: string | null;
  end_date?: string | null;

  // Display
  is_featured: boolean;
  sort_order: number;

  // Images - ✅ Accesseurs générés par le modèle
  cover_image_url?: string | null;
  banner_image_url?: string | null;

  // Optionnel : thumbnails si conversions configurées
  cover_image_thumbnail?: string | null;
  banner_image_thumbnail?: string | null;

  // Meta
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string[] | null;

  // Stats
  products_count: number;
  total_stock: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations (Eager Loading)
  products?: Product[];
  media?: Media[]; // Spatie Media Library
}

// ==========================================
// IMAGE MANAGEMENT
// ==========================================

export interface ImageUploadOptions {
  maxSize?: number; // en bytes, défaut: 2MB
  acceptedTypes?: string[]; // défaut: ['image/jpeg', 'image/png', 'image/webp']
  quality?: number; // 0-1, pour la compression
}

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  file?: File;
}

export const DEFAULT_IMAGE_OPTIONS: ImageUploadOptions = {
  maxSize: 2 * 1024 * 1024, // 2MB
  acceptedTypes: ["image/jpeg", "image/png", "image/webp", "image/jpg"],
  quality: 0.9,
};

// ==========================================
// API & PAGINATION
// ==========================================

export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  first_page_url: string;
  from: number | null;
  last_page: number;
  last_page_url: string;
  links: PaginationLink[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number | null;
  total: number;
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

// ==========================================
// FILTRES & STATISTIQUES
// ==========================================

export interface CollectionFilters {
  search?: string;
  is_active?: boolean | "all";
  page?: number;
  per_page?: number;
  sort_by?: "created_at" | "name" | "products_count";
  sort_order?: "asc" | "desc";
  with_trashed?: boolean;
}

export interface CollectionStatistics {
  total_collections: number;
  active_collections: number;
  inactive_collections: number;
  total_products: number;
}

// ==========================================
// FORMULAIRES
// ==========================================

export interface CollectionFormData {
  name: string;
  slug?: string;
  description?: string;
  is_active: boolean;

  // SEO
  meta_title?: string;
  meta_description?: string;

  // Image
  cover_image?: File;
  banner_image?: File;

  // Image deletion flags
  cover_image_to_delete?: boolean;
  banner_image_to_delete?: boolean;

  // Relations
  product_ids?: string[]; // IDs des produits à associer
}

// ==========================================
// ÉTAT
// ==========================================

export type LoadingState = "idle" | "loading" | "success" | "error";

export interface CollectionState {
  collections: Collection[];
  currentCollection: Collection | null;
  statistics: CollectionStatistics | null;
  loadingState: LoadingState;
  error: string | null;
  pagination: LaravelPaginator<Collection> | null;
  filters: CollectionFilters;
}

// ==========================================
// IMAGE HELPERS
// ==========================================

/**
 * Validate an image file
 */
export function validateImage(
  file: File,
  options: ImageUploadOptions = DEFAULT_IMAGE_OPTIONS
): ImageValidationResult {
  // Check file type
  const fileType = file.type;
  if (options.acceptedTypes && !options.acceptedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `Type de fichier non supporté. Formats acceptés: ${options.acceptedTypes.join(
        ", "
      )}`,
    };
  }

  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `Fichier trop volumineux (${fileSizeMB}MB). Taille maximale: ${maxSizeMB}MB`,
    };
  }

  return { valid: true, file };
}

/**
 * Check if a collection has a cover image
 */
export function hasCollectionCoverImage(collection: Collection): boolean {
  return !!collection.cover_image_url;
}

/**
 * Check if a collection has a banner image
 */
export function hasCollectionBannerImage(collection: Collection): boolean {
  return !!collection.banner_image_url;
}

/**
 * Get the display URL for a collection's cover image
 * Prefer thumbnail if available for performance
 */
export function getCollectionCoverUrl(
  collection: Collection,
  useThumbnail: boolean = false
): string | null {
  if (useThumbnail && collection.cover_image_thumbnail) {
    return collection.cover_image_thumbnail;
  }
  return collection.cover_image_url || null;
}

/**
 * Get the display URL for a collection's banner image
 * Prefer thumbnail if available for performance
 */
export function getCollectionBannerUrl(
  collection: Collection,
  useThumbnail: boolean = false
): string | null {
  if (useThumbnail && collection.banner_image_thumbnail) {
    return collection.banner_image_thumbnail;
  }
  return collection.banner_image_url || null;
}

/**
 * Create a preview URL from a File object
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Revoke a preview URL (cleanup)
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}

/**
 * Get media by collection name
 */
export function getMediaByCollection(
  collection: Collection,
  collectionName: "cover" | "banner" | "gallery"
): Media | null {
  if (!collection.media) return null;

  return (
    collection.media.find((m) => m.collection_name === collectionName) || null
  );
}

/**
 * Get all gallery images
 */
export function getGalleryImages(collection: Collection): Media[] {
  if (!collection.media) return [];

  return collection.media.filter((m) => m.collection_name === "gallery");
}

// ==========================================
// GENERAL HELPERS
// ==========================================

/**
 * Helper pour obtenir la couleur d'une collection active/inactive
 */
export function getCollectionStatusColor(isActive: boolean): string {
  return isActive ? "success" : "neutral";
}

/**
 * Helper pour obtenir le label d'une collection active/inactive
 */
export function getCollectionStatusLabel(isActive: boolean): string {
  return isActive ? "Active" : "Inactive";
}

/**
 * Helper pour formater les collections pour un select
 */
export function formatCollectionForSelect(collections: Collection[]) {
  return collections.map((collection) => ({
    label: collection.name,
    value: collection.id,
    disabled: !collection.is_active,
  }));
}

/**
 * Helper pour valider les données de formulaire
 */
export function validateCollectionForm(data: CollectionFormData): string[] {
  const errors: string[] = [];

  if (!data.name?.trim()) {
    errors.push("Le nom de la collection est requis");
  }

  if (data.name && data.name.length > 255) {
    errors.push("Le nom ne peut pas dépasser 255 caractères");
  }

  // Validate images if present
  if (data.cover_image instanceof File) {
    const validation = validateImage(data.cover_image);
    if (!validation.valid && validation.error) {
      errors.push(`Image de couverture: ${validation.error}`);
    }
  }

  if (data.banner_image instanceof File) {
    const validation = validateImage(data.banner_image);
    if (!validation.valid && validation.error) {
      errors.push(`Bannière: ${validation.error}`);
    }
  }

  return errors;
}

/**
 * Trie les collections par date de création (plus récentes en premier)
 */
export function sortCollectionsByDate(
  collections: Collection[],
  order: "asc" | "desc" = "desc"
) {
  return [...collections].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();

    return order === "desc" ? dateB - dateA : dateA - dateB;
  });
}

/**
 * Trie les collections par nom (ordre alphabétique)
 */
export function sortCollectionsByName(
  collections: Collection[],
  order: "asc" | "desc" = "asc"
) {
  return [...collections].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, "fr", {
      sensitivity: "base",
    });
    return order === "desc" ? -comparison : comparison;
  });
}

/**
 * Trie les collections par nombre de produits
 */
export function sortCollectionsByProductsCount(
  collections: Collection[],
  order: "asc" | "desc" = "desc"
) {
  return [...collections].sort((a, b) => {
    const countA = a.products_count || 0;
    const countB = b.products_count || 0;

    return order === "desc" ? countB - countA : countA - countB;
  });
}

/**
 * Trie les collections selon un critère donné
 */
export function sortCollections(
  collections: Collection[],
  sortBy: "created_at" | "name" | "products_count" = "created_at",
  order: "asc" | "desc" = "desc"
) {
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
