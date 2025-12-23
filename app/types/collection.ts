/**
 * Types pour le module Catalogue - Collections
 */

import type { Product } from './product'

// ==========================================
// TYPES DE BASE
// ==========================================

export interface Collection {
  id: string
  name: string
  slug: string
  description?: string | null
  is_active: boolean

  // Meta
  meta_title?: string | null
  meta_description?: string | null

  // Stats
  products_count: number

  // Timestamps
  created_at: string
  updated_at: string
  deleted_at?: string | null

  // Relations (Eager Loading)
  products?: Product[]
  image_url?: string // Helper pour l'image principale
}

// ==========================================
// API & PAGINATION
// ==========================================

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

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

// ==========================================
// FILTRES & STATISTIQUES
// ==========================================

export interface CollectionFilters {
  search?: string
  is_active?: boolean | 'all'
  page?: number
  per_page?: number
  sort_by?: 'created_at' | 'name' | 'products_count'
  sort_order?: 'asc' | 'desc'
  with_trashed?: boolean
}

export interface CollectionStatistics {
  total_collections: number
  active_collections: number
  inactive_collections: number
  total_products: number
}

// ==========================================
// FORMULAIRES
// ==========================================

export interface CollectionFormData {
  name: string
  slug?: string
  description?: string
  is_active: boolean

  // SEO
  meta_title?: string
  meta_description?: string

  // Media
  image?: File | string
  image_to_delete?: boolean

  // Relations
  product_ids?: string[] // IDs des produits à associer
}

// ==========================================
// ÉTAT
// ==========================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface CollectionState {
  collections: Collection[]
  currentCollection: Collection | null
  statistics: CollectionStatistics | null
  loadingState: LoadingState
  error: string | null
  pagination: LaravelPaginator<Collection> | null
  filters: CollectionFilters
}

// ==========================================
// HELPERS
// ==========================================

/**
 * Helper pour obtenir la couleur d'une collection active/inactive
 */
export function getCollectionStatusColor(isActive: boolean): string {
  return isActive ? 'success' : 'neutral'
}

/**
 * Helper pour obtenir le label d'une collection active/inactive
 */
export function getCollectionStatusLabel(isActive: boolean): string {
  return isActive ? 'Active' : 'Inactive'
}

/**
 * Helper pour formater les collections pour un select
 */
export function formatCollectionForSelect(collections: Collection[]) {
  return collections.map(collection => ({
    label: collection.name,
    value: collection.id,
    disabled: !collection.is_active
  }))
}

/**
 * Helper pour valider les données de formulaire
 */
export function validateCollectionForm(data: CollectionFormData): string[] {
  const errors: string[] = []

  if (!data.name?.trim()) {
    errors.push('Le nom de la collection est requis')
  }

  if (data.name && data.name.length > 255) {
    errors.push('Le nom ne peut pas dépasser 255 caractères')
  }

  return errors
}


/**
 * Trie les collections par date de création (plus récentes en premier)
 */
export function sortCollectionsByDate(collections: Collection[], order: 'asc' | 'desc' = 'desc') {
  return [...collections].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()

    return order === 'desc' ? dateB - dateA : dateA - dateB
  })
}

/**
 * Trie les collections par nom (ordre alphabétique)
 */
export function sortCollectionsByName(collections: Collection[], order: 'asc' | 'desc' = 'asc') {
  return [...collections].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    return order === 'desc' ? -comparison : comparison
  })
}

/**
 * Trie les collections par nombre de produits
 */
export function sortCollectionsByProductsCount(collections: Collection[], order: 'asc' | 'desc' = 'desc') {
  return [...collections].sort((a, b) => {
    const countA = a.products_count || 0
    const countB = b.products_count || 0

    return order === 'desc' ? countB - countA : countA - countB
  })
}

/**
 * Trie les collections selon un critère donné
 */
export function sortCollections(
  collections: Collection[],
  sortBy: 'created_at' | 'name' | 'products_count' = 'created_at',
  order: 'asc' | 'desc' = 'desc'
) {
  switch (sortBy) {
    case 'name':
      return sortCollectionsByName(collections, order)
    case 'products_count':
      return sortCollectionsByProductsCount(collections, order)
    case 'created_at':
    default:
      return sortCollectionsByDate(collections, order)
  }
}
