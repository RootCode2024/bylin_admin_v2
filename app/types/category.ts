/**
 * Types pour le module Catalogue - Catégories
 *
 * Ce fichier contient toutes les interfaces et types TypeScript
 * utilisés pour la gestion des catégories dans l'application.
 */

/**
 * Interface représentant une catégorie
 */
export interface Category {
  id: string;
  parent_id?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  image_url?: string | null;
  icon?: string | null;
  color?: string | null;
  level: number;
  path?: string | null;
  is_active: boolean;
  is_visible_in_menu: boolean;
  is_featured: boolean;
  sort_order: number;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_data?: Record<string, unknown> | null;
  products_count: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;

  // Relations optionnelles (chargées via eager loading)
  parent?: Category | null;
  children?: readonly Category[] | Category[];
  children_count?: number;
}

/**
 * Interface pour la pagination Laravel
 */
export interface LaravelPaginator<T> {
  data: T[]
  current_page: number
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: PaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

/**
 * Interface représentant un lien de pagination
 */
export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

/**
 * Interface générique pour les réponses API
 */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

/**
 * Interface pour les statistiques des catégories
 */
export interface CategoryStatistics {
  total: number
  active: number
  inactive: number
  root: number
  with_products: number
  trashed: number
  by_level: Record<number, number>
}

/**
 * Interface pour les données de formulaire
 */
export interface CategoryFormData {
  parent_id?: string | null
  name: string
  slug?: string
  description?: string
  image?: File | null
  icon?: string
  color?: string
  is_active: boolean
  is_visible_in_menu: boolean
  is_featured: boolean
  sort_order?: number
  meta_title?: string
  meta_description?: string
  meta_data?: Record<string, unknown>
}

/**
 * Paramètres de filtrage et recherche
 */
export interface CategoryFilters {
  search?: string
  parent_id?: string | 'null'
  level?: number
  is_active?: boolean | string
  is_visible_in_menu?: boolean
  is_featured?: boolean
  only_root?: boolean
  only_trashed?: boolean
  with_trashed?: boolean
  per_page?: number
  page?: number
  sort_by?: 'name' | 'sort_order' | 'level' | 'created_at' | 'updated_at'
  sort_direction?: 'asc' | 'desc'
}

/**
 * Type pour les opérations en masse
 */
export interface CategoryBulkOperation {
  ids: string[]
}

/**
 * Type union pour les statuts de chargement
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

/**
 * Interface pour la gestion d'état du composable
 */
export interface CategoryState {
  categories: Category[]
  currentCategory: Category | null
  statistics: CategoryStatistics | null
  loading: LoadingState
  error: string | null
  filters: CategoryFilters
  pagination: LaravelPaginator<Category> | null
}

/**
 * Options de configuration pour le téléchargement d'images
 */
export interface ImageUploadConfig {
  maxFileSize: number
  minDimensions: { width: number; height: number }
  maxDimensions: { width: number; height: number }
  acceptedTypes: string[]
}

/**
 * Type pour les niveaux de catégories
 */
export type CategoryLevel = 0 | 1 | 2 | 3

/**
 * Labels des niveaux de catégories
 */
export const CATEGORY_LEVEL_LABELS: Record<CategoryLevel, string> = {
  0: 'Genre',
  1: 'Type',
  2: 'Catégorie',
  3: 'Sous-catégorie'
}

/**
 * Icônes disponibles pour les catégories
 */
export const CATEGORY_ICONS = [
  'mars',
  'venus',
  'baby',
  'users',
  'shirt',
  'tag',
  'shopping-bag',
  'sparkles',
  'trending-up',
  'star',
  'gift',
  'heart'
] as const

export type CategoryIcon = typeof CATEGORY_ICONS[number]

/**
 * Filtres pour l'interface utilisateur
 */
export interface CategoryUIFilters {
  search: string
  status: 'all' | 'active' | 'inactive'
  level: 'all' | '0' | '1' | '2' | '3'
  onlyRoot: boolean
  onlyTrashed: boolean
}

/**
 * Type pour les événements émis
 */
export interface CategoryEvents {
  created: []
  updated: [category: Category]
  deleted: [id: string]
  restored: [category: Category]
  moved: [category: Category]
}

/**
 * Interface pour le fil d'Ariane
 */
export interface BreadcrumbItem {
  id: string
  name: string
  slug: string
  level: number
}

/**
 * Interface pour l'arbre hiérarchique
 */
export interface CategoryTree extends Category {
  children: CategoryTree[]
}
