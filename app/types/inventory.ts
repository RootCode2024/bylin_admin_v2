import type { Brand } from "./brand";
import type { Category } from "./category";
import type { Product, ProductVariation } from "./product";
import type { User } from "~/stores/auth";

// --- GLOBAL & PAGINATION ---

export interface LaravelPaginator<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
  links?: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

// --- ENUMS & TYPES DE BASE ---
export type StockOperation = "set" | "add" | "sub";

export type StockReason =
  | 'adjustment'
  | 'sale'
  | 'return'
  | 'damaged'
  | 'restock'
  | 'lost';

export type StockMovementType = "in" | "out" | "adjustment";

// --- PAYLOADS D'AJUSTEMENT ---

/**
 * Structure de base commune
 */
interface BaseAdjustmentPayload {
  product_id: string;
  reason: StockReason;
  notes?: string | null;
}

/**
 * Cas 1 : Produit Simple
 * On exige quantity et operation, on interdit variations.
 */
export interface SimpleStockAdjustment extends BaseAdjustmentPayload {
  quantity: number;
  operation: StockOperation;
  variations?: never; // Interdit d'avoir des variations ici
}

/**
 * Cas 2 : Produit Variable
 * On exige variations, on interdit quantity/operation globaux.
 */
export interface VariableStockAdjustment extends BaseAdjustmentPayload {
  quantity?: never; // Interdit d'avoir une quantité globale
  operation?: never; // Interdit d'avoir une opération globale
  variations: Array<{
    id: string; // Variation ID (UUID)
    quantity: number;
    operation: StockOperation;
  }>;
}

// Type Union : TypeScript saura lequel utiliser selon les propriétés présentes
export type AdjustStockPayload = SimpleStockAdjustment | VariableStockAdjustment;

// --- MODÈLES DE DONNÉES ---

export interface StockMovement {
  id: string;
  product_id: string;
  variation_id: string | null;
  type: StockMovementType;
  reason: StockReason;
  quantity: number; // Le delta (peut être négatif ou positif)
  quantity_before: number;
  quantity_after: number;
  reference_id?: string | null;
  reference_type?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;

  // Relations
  product?: Product;
  variation?: ProductVariation;
  creator?: User;
}

export interface InventoryItem {
  id: string;
  type: "product" | "variation";
  product_id: string; // Toujours présent (soit ID propre, soit ID parent)
  variation_id?: string | null;
  name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold?: number | null;
  image_url?: string | null;
  brand?: Brand | null;
  categories?: Category[];
  variations_count?: number; // Utile pour savoir quel formulaire d'ajustement afficher
  status: string; // "active", "draft", "out_of_stock", etc.
  price?: number;
  cost_price?: number; // Backend utilise cost_price
  updated_at: string;

  // Computed Frontend helpers
  stock_status?: "in_stock" | "low_stock" | "out_of_stock";
}

// Low Stock Item specific
export interface LowStockItem extends InventoryItem {
  shortage?: number; // Différence entre seuil et stock actuel
}

// --- BULK OPERATIONS ---

// Structure utilisée pour l'endpoint bulk
export interface BulkStockAdjustmentPayload {
  adjustments: AdjustStockPayload[];
}

export interface BulkAdjustmentResult {
  success_count: number;
  error_count: number;
  errors?: Array<{
    item: string; // ID
    message: string;
  }>;
}

// --- STATISTICS ---

export interface InventoryStatistics {
  total_products: number;
  total_variations: number;
  total_stock_value: number;
  low_stock_count: number;
  out_of_stock_count: number;
  total_items_in_stock: number;

  movements_today: number;
  movements_this_week: number;
  movements_this_month: number;

  stock_in_today: number;
  stock_out_today: number;
  stock_in_this_week: number;
  stock_out_this_week: number;
}

// --- FILTERS ---

export interface InventoryMovementFilters {
  product_id?: string;
  variation_id?: string;
  type?: StockMovementType;
  reason?: StockReason;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  per_page?: number;
  page?: number;
}

export interface InventoryListFilters {
  status?: string;
  brand_id?: string;
  category_id?: string;
  in_stock_only?: boolean;
  low_stock_only?: boolean;
  out_of_stock_only?: boolean; // Pour match le endpoint getOutOfStockItems
  search?: string;
  per_page?: number;
  page?: number;
}

export interface InventoryExportOptions {
  format?: "csv" | "xlsx";
  filters?: InventoryListFilters;
}

export interface InventoryExportResult {
  file_url: string;
  expires_at: string;
}

// --- CONSTANTS & HELPERS ---

export const STOCK_OPERATIONS: Record<StockOperation, string> = {
  set: "Définir",
  add: "Ajouter (+)",
  sub: "Retirer (-)",
};

export const STOCK_MOVEMENT_TYPES: Record<StockMovementType, string> = {
  in: "Entrée",
  out: "Sortie",
  adjustment: "Ajustement",
};

export const STOCK_MOVEMENT_REASONS: Record<StockReason, string> = {
  sale: "Vente Client",
  return: "Retour Client",
  restock: "Réassort",
  adjustment: "Ajustement Manuel",
  damaged: "Endommagé / Cassé",
  lost: "Perdu / Vol",
};

export const STOCK_STATUS_COLORS = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "error",
} as const;

// Helper pour vérifier si c'est un payload variable (Type Guard)
export function isVariableAdjustment(
  payload: AdjustStockPayload
): payload is VariableStockAdjustment {
  return (payload as VariableStockAdjustment).variations !== undefined;
}
