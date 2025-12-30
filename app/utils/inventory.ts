import {
  type InventoryItem,
  type StockMovement,
  type StockMovementType,
  type StockReason,
  type StockOperation,
  STOCK_MOVEMENT_REASONS,
  STOCK_MOVEMENT_TYPES,
  STOCK_STATUS_COLORS,
} from "~/types/inventory";

// ============================================================================
// VÉRIFICATIONS DE STOCK
// ============================================================================

/**
 * Vérifie si un produit a un stock faible
 */
export function isLowStock(item: InventoryItem): boolean {
  const threshold = item.low_stock_threshold ?? 10;
  return item.stock_quantity > 0 && item.stock_quantity <= threshold;
}

/**
 * Vérifie si un produit est en rupture de stock
 */
export function isOutOfStock(item: InventoryItem): boolean {
  return item.stock_quantity <= 0;
}

/**
 * Obtient le statut du stock (clé brute)
 */
export function getStockStatus(
  item: InventoryItem
): "in_stock" | "low_stock" | "out_of_stock" {
  if (isOutOfStock(item)) return "out_of_stock";
  if (isLowStock(item)) return "low_stock";
  return "in_stock";
}

// ============================================================================
// UI HELPERS - COULEURS ET LABELS
// ============================================================================

/**
 * Obtient la couleur du badge de stock (synchronisé avec types/inventory)
 */
export function getStockStatusColor(
  item: InventoryItem
): "success" | "warning" | "error" {
  const status = getStockStatus(item);
  return STOCK_STATUS_COLORS[status];
}

/**
 * Obtient le label du statut de stock
 */
export function getStockStatusLabel(item: InventoryItem): string {
  const status = getStockStatus(item);
  return {
    in_stock: "En stock",
    low_stock: "Stock faible",
    out_of_stock: "Rupture",
  }[status];
}

/**
 * Obtient la couleur d'un type de mouvement
 */
export function getMovementTypeColor(
  type: StockMovementType
): "success" | "error" | "info" {
  const colors = {
    in: "success",
    out: "error",
    adjustment: "info",
  } as const;
  return colors[type];
}

/**
 * Obtient l'icône d'un type de mouvement (Heroicons)
 */
export function getMovementTypeIcon(type: StockMovementType): string {
  return {
    in: "i-heroicons-arrow-down-circle",
    out: "i-heroicons-arrow-up-circle",
    adjustment: "i-heroicons-adjustments-horizontal",
  }[type];
}

// ============================================================================
// FORMATAGE
// ============================================================================

/**
 * Formate un type de mouvement (utilise les constantes partagées)
 */
export function formatMovementType(type: StockMovementType): string {
  return STOCK_MOVEMENT_TYPES[type] || type;
}

/**
 * Formate une raison de mouvement (utilise les constantes partagées)
 */
export function formatMovementReason(reason: StockReason): string {
  return STOCK_MOVEMENT_REASONS[reason] || reason;
}

/**
 * Formate une quantité avec son signe (+/-)
 */
export function formatQuantityWithSign(movement: StockMovement): string {
  // Pour les ajustements, si la qty est négative, c'est une baisse, sinon hausse
  // Le backend renvoie déjà le delta signé dans 'quantity'
  const sign = movement.quantity > 0 ? "+" : "";
  return `${sign}${movement.quantity}`;
}

/**
 * Formate le pourcentage de changement de stock
 */
export function formatStockChangePercentage(
  before: number,
  after: number
): string {
  if (before === 0) return after > 0 ? "+100%" : "0%";
  const change = ((after - before) / before) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}

// ============================================================================
// CALCULS
// ============================================================================

/**
 * Calcule la valeur du stock d'un produit
 */
export function calculateStockValue(item: InventoryItem): number {
  // Priorité au cost_price (prix d'achat), sinon price (prix de vente)
  const cost = item.cost_price ?? item.price ?? 0;
  return item.stock_quantity * cost;
}

/**
 * Calcule le nombre de jours avant rupture
 */
export function calculateDaysUntilOutOfStock(
  currentStock: number,
  averageDailySales: number
): number | null {
  if (averageDailySales <= 0 || currentStock <= 0) return null;
  return Math.floor(currentStock / averageDailySales);
}

export function calculateTotalStockValue(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + calculateStockValue(item), 0);
}

// ============================================================================
// COMPTEURS
// ============================================================================

export function getLowStockCount(items: InventoryItem[]): number {
  return items.filter(isLowStock).length;
}

export function getOutOfStockCount(items: InventoryItem[]): number {
  return items.filter(isOutOfStock).length;
}

// ============================================================================
// LABELS ET MESSAGES
// ============================================================================

export function getDaysUntilOutLabel(days: number | null): string {
  if (days === null) return "N/A";
  if (days === 0) return "Aujourd'hui";
  if (days === 1) return "Demain";
  return `${days} jours`;
}

// ============================================================================
// TRI ET FILTRAGE
// ============================================================================

/**
 * Trie une liste d'items d'inventaire
 */
export function sortInventoryItems(
  items: InventoryItem[],
  sortBy: "name" | "stock" | "price" | "updated_at",
  order: "asc" | "desc" = "asc"
): InventoryItem[] {
  const sorted = [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "name":
        comparison = a.name.localeCompare(b.name);
        break;
      case "stock":
        comparison = a.stock_quantity - b.stock_quantity;
        break;
      case "price":
        comparison = (a.price ?? 0) - (b.price ?? 0);
        break;
      case "updated_at":
        comparison =
          new Date(a.updated_at ?? 0).getTime() -
          new Date(b.updated_at ?? 0).getTime();
        break;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}

/**
 * Filtre les items par recherche textuelle (Gère objets Brand et Category[])
 */
export function filterInventoryBySearch(
  items: InventoryItem[],
  searchTerm: string
): InventoryItem[] {
  if (!searchTerm.trim()) return items;

  const term = searchTerm.toLowerCase();
  return items.filter((item) => {
    const matchesName = item.name.toLowerCase().includes(term);
    const matchesSku = item.sku.toLowerCase().includes(term);
    const matchesBrand = item.brand?.name.toLowerCase().includes(term);
    const matchesCategory = item.categories?.some((cat) =>
      cat.name.toLowerCase().includes(term)
    );

    return matchesName || matchesSku || matchesBrand || matchesCategory;
  });
}

/**
 * Filtre les items par statut de stock
 */
export function filterByStockStatus(
  items: InventoryItem[],
  status: "all" | "in_stock" | "low_stock" | "out_of_stock"
): InventoryItem[] {
  if (status === "all") return items;
  return items.filter((item) => getStockStatus(item) === status);
}

// ============================================================================
// GROUPEMENT
// ============================================================================

/**
 * Groupe les mouvements par date
 */
export function groupMovementsByDate(
  movements: StockMovement[]
): Record<string, StockMovement[]> {
  return movements.reduce((groups, movement) => {
    const date = new Date(movement.created_at).toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(movement);
    return groups;
  }, {} as Record<string, StockMovement[]>);
}

/**
 * Groupe les items par catégorie (Prend la première catégorie trouvée)
 */
export function groupByCategory(
  items: InventoryItem[]
): Record<string, InventoryItem[]> {
  return items.reduce((groups, item) => {
    const categoryName = item.categories?.[0]?.name || "Sans catégorie";
    if (!groups[categoryName]) {
      groups[categoryName] = [];
    }
    groups[categoryName].push(item);
    return groups;
  }, {} as Record<string, InventoryItem[]>);
}

/**
 * Groupe les items par marque
 */
export function groupByBrand(
  items: InventoryItem[]
): Record<string, InventoryItem[]> {
  return items.reduce((groups, item) => {
    const brandName = item.brand?.name || "Sans marque";
    if (!groups[brandName]) {
      groups[brandName] = [];
    }
    groups[brandName].push(item);
    return groups;
  }, {} as Record<string, InventoryItem[]>);
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valide un ajustement de stock (Mise à jour avec 'sub' et logique stricte)
 */
export function validateStockAdjustment(
  currentStock: number,
  quantity: number,
  operation: StockOperation
): { valid: boolean; message?: string } {
  let newStock = currentStock;

  switch (operation) {
    case "set":
      newStock = quantity;
      break;
    case "add":
      newStock = currentStock + quantity;
      break;
    case "sub": // Mise à jour: 'sub' au lieu de 'subtract'
      newStock = currentStock - quantity;
      break;
  }

  if (newStock < 0) {
    return {
      valid: false,
      message: `Stock insuffisant (Résultat: ${newStock})`,
    };
  }

  // Pour 'set', 0 est valide. Pour add/sub, il faut un mouvement > 0
  if (quantity <= 0 && operation !== "set") {
    return {
      valid: false,
      message: "La quantité du mouvement doit être supérieure à 0",
    };
  }

  // Pour 'set', la quantité ne peut pas être négative
  if (quantity < 0 && operation === "set") {
    return {
      valid: false,
      message: "Le stock défini ne peut pas être négatif",
    };
  }

  return { valid: true };
}

export function isValidSKU(sku: string): boolean {
  return sku.length >= 3 && !sku.includes(" ");
}

// ============================================================================
// GÉNÉRATION
// ============================================================================

export function generateSKU(prefix: string = "PRD"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// ============================================================================
// EXPORT / IMPORT
// ============================================================================

/**
 * Convertit les items en CSV (Gère les objets imbriqués)
 */
export function convertToCSV(items: InventoryItem[]): string {
  const headers = [
    "SKU",
    "Nom",
    "Marque",
    "Catégories", // Pluriel
    "Stock",
    "Prix Vente",
    "Coût Achat",
    "Valeur Stock",
  ];

  const rows = items.map((item) => {
    const categories = item.categories?.map((c) => c.name).join("; ") || "";
    const brand = item.brand?.name || "";
    const cost = item.cost_price ?? 0;
    const value = calculateStockValue(item);

    // Échapper les guillemets pour le CSV
    const safeName = `"${item.name.replace(/"/g, '""')}"`;

    return [
      item.sku,
      safeName,
      brand,
      `"${categories}"`,
      item.stock_quantity.toString(),
      (item.price ?? 0).toString(),
      cost.toString(),
      value.toString(),
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
}

export function downloadCSV(
  items: InventoryItem[],
  filename: string = "inventaire.csv"
): void {
  const csv = convertToCSV(items);
  // Ajout du BOM pour qu'Excel ouvre correctement l'UTF-8
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
