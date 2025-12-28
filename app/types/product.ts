/**
 * Types pour le module Catalogue - Produits
 *
 * Ce fichier contient toutes les interfaces et types TypeScript
 * utilisés pour la gestion des produits, variations et stocks.
 */

import type { Brand } from "./brand"; // On suppose que le fichier brand.ts est dans le même dossier
import type { Category } from "./category"; // On suppose l'existence de category.ts

// ==========================================
// ENUMS & TYPES DE BASE
// ==========================================

export type ProductStatus =
  | "draft"
  | "active"
  | "inactive"
  | "out_of_stock"
  | "preorder"
  | "discontinued";

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: "cm" | "in";
}

export interface Media {
  id: number;
  model_type: string;
  model_id: string;
  collection_name: string;
  name: string;
  file_name: string;
  mime_type: string;
  disk: string;
  size: number;
  original_url: string;
  preview_url: string;
  custom_properties: Record<string, unknown>;
  order_column: number;
  created_at: string;
  updated_at: string;
}

// ==========================================
// ENTITÉS PRINCIPALES
// ==========================================


/**
 * Types pour les variations de produits - Aligné avec la migration
 */

export type StockStatus = 'in_stock' | 'out_of_stock' | 'on_backorder';

/**
 * Interface représentant une variation de produit
 */
export interface ProductVariation {
  id: string;
  product_id: string;
  sku: string;
  variation_name: string;

  // Prix - ✅ Aligné avec la migration
  price: number;
  compare_price?: number | null;
  cost_price?: number | null;

  // Stock - ✅ Aligné avec la migration
  stock_quantity: number;
  stock_status: StockStatus;

  // Autres
  barcode?: string | null;
  is_active: boolean;
  attributes: Record<string, string>; // ex: { color: 'Rouge', size: 'L' }

  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Interface représentant un produit complet
 */
export interface Product {
  id: string;
  brand_id: string;

  // Info de base
  name: string;
  slug: string;
  sku: string;
  short_description?: string | null;
  description?: string | null | undefined;

  // Prix
  price: number;
  compare_price?: number | null;
  cost_price?: number | null;

  // Statut & Flags
  status: ProductStatus;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  is_variable: boolean;

  // Inventaire
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  barcode?: string | null;

  // Physique
  weight?: number | null;
  dimensions?: ProductDimensions | null;

  // Précommande (Features ajoutées)
  is_preorder_enabled: boolean;
  preorder_auto_enabled: boolean;
  preorder_available_date?: string | null; // ISO Date
  preorder_limit?: number | null;
  preorder_count: number;
  preorder_message?: string | null;
  preorder_terms?: string | null;
  preorder_enabled_at?: string | null;

  // Authenticité (Bylin)
  requires_authenticity: boolean;
  authenticity_codes_count: number;

  // SEO & Meta
  meta_title?: string | null;
  meta_description?: string | null;
  meta_data?: Record<string, unknown> | null;

  // Stats
  views_count: number;
  rating_average: number;
  rating_count: number;

  // Timestamps
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations (Eager Loading)
  brand?: Brand | null;
  categories?: Category[];
  collection_id?: string;
  variations?: ProductVariation[];
  media?: Media[]; // Spatie Media Library
  thumbnail_url?: string; // Helper souvent ajouté par l'API Resource
}

// ==========================================
// API & PAGINATION (Reuse pattern)
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
// STATISTIQUES & FILTRES
// ==========================================

/**
 * Interface pour les statistiques des produits
 */
export interface ProductStatistics {
  total_products: number;
  active_products: number;
  out_of_stock: number;
  low_stock: number;
  preorder_products: number;
  featured_products: number;
  total_value: number;
}

/**
 * Paramètres de filtrage pour l'API
 */
export interface ProductFilters {
  search?: string;
  status?: ProductStatus | "all";
  brand_id?: string;
  category_id?: string;
  collection_id?: string;
  is_featured?: boolean;
  in_stock?: boolean;
  is_preorder?: boolean;
  min_price?: number;
  max_price?: number;
  per_page?: number;
  page?: number;
  sort_by?: "created_at" | "price" | "name" | "stock_quantity" | "views_count";
  sort_order?: "asc" | "desc";
  with_trashed?: boolean;
}

// ==========================================
// FORMULAIRES & ETAT
// ==========================================

/**
 * Interface pour la création/modification d'une variation dans le formulaire
 */
export interface VariationFormData {
  id?: string; // Présent si update
  sku?: string; // Optionnel car autogénéré
  variation_name: string;

  // Prix
  price: number;
  compare_price?: number;
  cost_price?: number;

  // Stock
  stock_quantity: number;
  stock_status?: StockStatus; // Optionnel, sera déterminé automatiquement si non fourni

  // Autres
  barcode?: string;
  is_active: boolean;
  attributes: Record<string, string>;

  _destroy?: boolean; // Flag pour suppression
}

/**
 * Interface pour les données de formulaire produit
 */
export interface ProductFormData {
  // Info
  brand_id: string;
  categories: string[]; // IDs
  name: string;
  slug?: string;
  sku?: string;
  description?: string;
  short_description?: string;

  // Prix
  price: number;
  compare_price?: number;
  cost_price?: number;

  // Config
  status: ProductStatus;
  is_featured: boolean;
  is_new: boolean;
  is_on_sale: boolean;
  track_inventory: boolean;
  stock_quantity: number;
  low_stock_threshold: number;
  barcode?: string;

  // Authenticity
  requires_authenticity: boolean;
  authenticity_codes_count?: number;

  // Preorder
  is_preorder_enabled: boolean;
  preorder_available_date?: string;
  preorder_limit?: number;
  preorder_message?: string;
  preorder_terms?: string;

  meta_title?: string | null;
  meta_description?: string | null;

  // Variations
  is_variable: boolean;
  variations: VariationFormData[];

  // Media
  images?: File[];
  images_to_delete?: number[]; // IDs des médias à supprimer
}

/**
 * Helper pour créer une variation vide
 */
export function createEmptyVariation(productPrice: number = 0): VariationFormData {
  return {
    variation_name: '',
    price: productPrice,
    compare_price: undefined,
    cost_price: undefined,
    stock_quantity: 0,
    stock_status: 'out_of_stock',
    barcode: undefined,
    is_active: true,
    attributes: {},
  };
}

/**
 * Helper pour déterminer le stock_status
 */
export function determineStockStatus(quantity: number): StockStatus {
  return quantity > 0 ? 'in_stock' : 'out_of_stock';
}

/**
 * Helper pour vérifier si une variation est en stock
 */
export function isVariationInStock(variation: ProductVariation): boolean {
  return variation.is_active
    && variation.stock_quantity > 0
    && variation.stock_status === 'in_stock';
}

/**
 * Type union pour les statuts de chargement
 */
export type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Interface pour la gestion d'état du composable useProducts
 */
export interface ProductState {
  products: Product[];
  currentProduct: Product | null;
  statistics: ProductStatistics | null;
  loading: LoadingState;
  error: string | null;
  filters: ProductFilters;
  pagination: LaravelPaginator<Product> | null;
}

// ==========================================
// CONFIGURATION & HELPERS
// ==========================================

export interface ImageUploadConfig {
  maxFileSize: number;
  maxFiles: number;
  acceptedTypes: string[];
}

export const PRODUCT_IMAGE_CONFIG: ImageUploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  maxFiles: 10,
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

export function isApiError(response: unknown): response is ApiResponse<null> {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    response.success === false
  );
}

/**
 * Helper pour calculer le pourcentage de réduction
 */
export function calculateDiscount(
  price: number,
  comparePrice: number | null | undefined
): number {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

/**
 * Helper pour obtenir le label d'un statut
 */
export function getProductStatusLabel(status: ProductStatus): string {
  const labels: Record<ProductStatus, string> = {
    draft: "Brouillon",
    active: "Actif",
    inactive: "Inactif",
    out_of_stock: "Rupture",
    preorder: "Précommande",
    discontinued: "Arrêté",
  };
  return labels[status] || status;
}

/**
 * Helper pour obtenir la couleur (classe CSS/Tailwind) d'un statut
 */
export function getProductStatusColor(status: ProductStatus): string {
  const colors: Record<ProductStatus, string> = {
    draft: "bg-gray-100 text-gray-800",
    active: "bg-green-100 text-green-800",
    inactive: "bg-red-100 text-red-800",
    out_of_stock: "bg-orange-100 text-orange-800",
    preorder: "bg-blue-100 text-blue-800",
    discontinued: "bg-gray-800 text-white",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
