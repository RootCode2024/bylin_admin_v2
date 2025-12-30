import type {
  InventoryItem,
  LowStockItem,
  StockMovement,
  AdjustStockPayload, // Nouveau type strict
  InventoryStatistics,
  InventoryMovementFilters,
  InventoryListFilters,
  InventoryExportOptions,
  InventoryExportResult,
  StockMovementType,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
} from "~/types/inventory";

import type { ValidationErrors, ApiErrorResponse } from "~/types/validation";

// Types stricts pour les filtres UI
type FilterStatus = "all" | "active" | "inactive" | "archived";
type FilterStockStatus = "all" | "in_stock" | "low_stock" | "out_of_stock";

export const useInventories = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // ============================================================================
  // ÉTAT PARTAGÉ (State)
  // ============================================================================

  const inventoryItems = useState<InventoryItem[]>("inventory:items", () => []);
  const lowStockItems = useState<LowStockItem[]>(
    "inventory:lowStock",
    () => []
  );
  const outOfStockItems = useState<InventoryItem[]>(
    "inventory:outOfStock",
    () => []
  );
  const movements = useState<StockMovement[]>("inventory:movements", () => []);
  const statistics = useState<InventoryStatistics | null>(
    "inventory:statistics",
    () => null
  );

  const loading = useState<boolean>("inventory:loading", () => false);
  const loadingState = useState<LoadingState>(
    "inventory:loadingState",
    () => "idle"
  );
  const lastError = useState<string | null>("inventory:error", () => null);

  const pagination = useState("inventory:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  }));

  const filters = useState<InventoryListFilters>("inventory:filters", () => ({
    status: undefined,
    brand_id: undefined,
    category_id: undefined,
    in_stock_only: false,
    low_stock_only: false,
    out_of_stock_only: false,
    search: "",
    per_page: 15,
    page: 1,
  }));

  const movementFilters = useState<InventoryMovementFilters>(
    "inventory:movementFilters",
    () => ({
      product_id: undefined,
      variation_id: undefined,
      type: undefined,
      reason: undefined,
      date_from: undefined,
      date_to: undefined,
      user_id: undefined,
      per_page: 15,
      page: 1,
    })
  );

  const currentItem = useState<InventoryItem | null>(
    "inventory:current",
    () => null
  );

  // ============================================================================
  // UTILITAIRES INTERNES
  // ============================================================================

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Une erreur inconnue est survenue";
  }

  function getApiErrorMessage(error: unknown): string {
    const apiError = error as ApiErrorResponse;
    return apiError.response?._data?.message || getErrorMessage(error);
  }

  function getValidationErrors(error: unknown): ValidationErrors | null {
    const apiError = error as ApiErrorResponse;
    return apiError.response?._data?.errors || null;
  }

  /**
   * Nettoie les paramètres pour ne pas envoyer de clés "undefined" ou "null" à l'API
   */
  function cleanParams(
    params: Record<string, any>
  ): Record<string, string | number | boolean> {
    return Object.fromEntries(
      Object.entries(params).filter(
        ([_, v]) => v !== undefined && v !== null && v !== ""
      )
    ) as Record<string, string | number | boolean>;
  }

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const hasData = computed(() => inventoryItems.value.length > 0);

  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.search ||
        filters.value.status ||
        filters.value.brand_id ||
        filters.value.category_id ||
        filters.value.in_stock_only ||
        filters.value.low_stock_only ||
        filters.value.out_of_stock_only
    );
  });

  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.pageSize)
  );

  const hasLowStock = computed(() => lowStockItems.value.length > 0);
  const hasOutOfStock = computed(() => outOfStockItems.value.length > 0);
  const totalStockValue = computed(
    () => statistics.value?.total_stock_value ?? 0
  );
  const lowStockCount = computed(() => statistics.value?.low_stock_count ?? 0);
  const outOfStockCount = computed(
    () => statistics.value?.out_of_stock_count ?? 0
  );

  // ============================================================================
  // ACTIONS - INVENTORY ITEMS
  // ============================================================================

  async function fetchInventoryItems(
    customFilters?: InventoryListFilters
  ): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";
    lastError.value = null;

    try {
      // Construction des paramètres pour ProductController (Standard)
      const queryParams = cleanParams({
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        search: filters.value.search,
        status: filters.value.status,
        brand_id: filters.value.brand_id,
        category_id: filters.value.category_id,
        in_stock_only: filters.value.in_stock_only ? 1 : undefined,
        low_stock_only: filters.value.low_stock_only ? 1 : undefined,
        out_of_stock_only: filters.value.out_of_stock_only ? 1 : undefined,
        with_stock: 1,
        ...customFilters,
      });

      const response = await client<
        ApiResponse<LaravelPaginator<InventoryItem>>
      >("/api/v1/admin/inventory", { method: "GET", params: queryParams });

      if (response.success) {
        inventoryItems.value = response.data.data;
        pagination.value.total = response.data.total;
        pagination.value.totalPages = response.data.last_page;
        loadingState.value = "success";
      } else {
        throw new Error(response.message || "Erreur lors du chargement");
      }
    } catch (error: unknown) {
      handleError(error, "Impossible de charger l'inventaire");
      inventoryItems.value = [];
      pagination.value.total = 0;
    } finally {
      loading.value = false;
    }
  }

  async function fetchLowStockItems(threshold?: number): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";

    try {
      const params = cleanParams({
        threshold,
        per_page: pagination.value.pageSize,
        page: pagination.value.pageIndex + 1,
      });

      const response = await client<
        ApiResponse<LaravelPaginator<LowStockItem>>
      >("/api/v1/admin/inventory/low-stock", { method: "GET", params });

      if (response.success) {
        lowStockItems.value = response.data.data;
        loadingState.value = "success";
      }
    } catch (error: unknown) {
      handleError(error, "Impossible de charger les stocks faibles");
      lowStockItems.value = [];
    } finally {
      loading.value = false;
    }
  }

  async function fetchOutOfStockItems(): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";

    try {
      const params = cleanParams({
        per_page: pagination.value.pageSize,
        page: pagination.value.pageIndex + 1,
      });

      const response = await client<
        ApiResponse<LaravelPaginator<InventoryItem>>
      >("/api/v1/admin/inventory/out-of-stock", { method: "GET", params });

      if (response.success) {
        outOfStockItems.value = response.data.data;
        loadingState.value = "success";
      }
    } catch (error: unknown) {
      handleError(error, "Impossible de charger les ruptures de stock");
      outOfStockItems.value = [];
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // ACTIONS - MOVEMENTS
  // ============================================================================

  async function fetchMovements(
    customFilters?: InventoryMovementFilters
  ): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";

    try {
      const params = cleanParams({
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        product_id: movementFilters.value.product_id,
        variation_id: movementFilters.value.variation_id,
        type: movementFilters.value.type,
        reason: movementFilters.value.reason,
        date_from: movementFilters.value.date_from,
        date_to: movementFilters.value.date_to,
        user_id: movementFilters.value.user_id,
        ...customFilters,
      });

      const response = await client<
        ApiResponse<LaravelPaginator<StockMovement>>
      >("/api/v1/admin/inventory/movements", { method: "GET", params });

      if (response.success) {
        movements.value = response.data.data;
        pagination.value.total = response.data.total;
        pagination.value.totalPages = response.data.last_page;
        loadingState.value = "success";
      }
    } catch (error: unknown) {
      handleError(error, "Impossible de charger l'historique des mouvements");
      movements.value = [];
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // ACTIONS - STATISTICS
  // ============================================================================

  async function fetchStatistics(): Promise<InventoryStatistics | null> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<InventoryStatistics>>(
        "/api/v1/admin/inventory/statistics",
        { method: "GET" }
      );

      if (response.success) {
        statistics.value = response.data;
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      // On ne bloque pas l'UI pour les stats, erreur silencieuse ou log
      console.error("Erreur stats:", error);
      return null;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // ACTIONS - STOCK ADJUSTMENTS (Core Logic)
  // ============================================================================

  /**
   * Ajuster le stock (Compatible Produit Simple & Variations)
   * Utilise le nouveau type strict AdjustStockPayload
   */
  async function adjustStock(payload: AdjustStockPayload): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      console.log("Payload ajustement stock:", payload);

      const response = await client<ApiResponse<StockMovement[]>>(
        "/api/v1/admin/inventory/adjust",
        {
          method: "POST",
          body: payload,
        }
      );

      if (response.success) {
        toast.add({
          title: "Succès",
          description: "Le stock a été mis à jour avec succès",
          color: "success",
          icon: "i-heroicons-check-circle",
        });

        // Rafraîchir les données locales
        await Promise.all([fetchStatistics(), fetchInventoryItems()]);

        return true;
      }

      return false;
    } catch (error: unknown) {
      const validationErrors = getValidationErrors(error);

      if (validationErrors) {
        // Erreur de validation formelle (422)
        handleValidationErrors(error);
      } else {
        // Erreur métier (DomainException) ou serveur
        const message = getApiErrorMessage(error);
        toast.add({
          title: "Impossible d'ajuster le stock",
          description: message,
          color: "error",
          icon: "i-heroicons-x-circle",
          duration: 6000,
        });
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // ACTIONS - EXPORT
  // ============================================================================

  async function exportInventory(
    options?: InventoryExportOptions
  ): Promise<InventoryExportResult | null> {
    loading.value = true;

    try {
      const body = {
        format: options?.format ?? "csv",
        ...cleanParams(options?.filters || {}),
      };

      const response = await client<ApiResponse<InventoryExportResult>>(
        "/api/v1/admin/inventory/export",
        { method: "POST", body }
      );

      if (response.success) {
        toast.add({
          title: "Export généré",
          description: "Le téléchargement va commencer...",
          color: "success",
          icon: "i-heroicons-arrow-down-tray",
        });
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      handleError(error, "Erreur lors de la génération de l'export");
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function downloadExport(
    options?: InventoryExportOptions
  ): Promise<void> {
    const result = await exportInventory(options);
    if (result?.file_url) {
      window.open(result.file_url, "_blank");
    }
  }

  // ============================================================================
  // GESTION DES ERREURS GÉNÉRIQUE
  // ============================================================================

  function handleError(error: unknown, defaultMessage: string): void {
    loadingState.value = "error";
    lastError.value = getErrorMessage(error);
    const apiMessage = getApiErrorMessage(error);

    toast.add({
      title: "Erreur",
      description: apiMessage || defaultMessage,
      color: "error",
      icon: "i-heroicons-exclamation-circle",
    });
  }

  function handleValidationErrors(error: unknown): void {
    const errors = getValidationErrors(error);
    if (!errors) return;

    // Concaténer les erreurs pour l'affichage Toast
    const message = Object.values(errors).flat().join("\n");

    toast.add({
      title: "Données invalides",
      description: message,
      color: "error",
      icon: "i-heroicons-exclamation-triangle",
      duration: 8000,
    });
  }

  // ============================================================================
  // HELPERS - FILTERS & PAGINATION
  // ============================================================================

  function setPage(pageIndex: number): void {
    pagination.value.pageIndex = pageIndex;
    fetchInventoryItems();
  }

  function setPageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0;
    filters.value.per_page = size;
    fetchInventoryItems();
  }

  function setSearch(search: string): void {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchInventoryItems();
  }

  function setStatus(status: FilterStatus): void {
    filters.value.status = status === "all" ? undefined : status;
    pagination.value.pageIndex = 0;
    fetchInventoryItems();
  }

function setStockStatus(stockStatus: FilterStockStatus): void {
  // Réinitialisation complète de TOUS les filtres de stock
  filters.value.in_stock_only = false;
  filters.value.low_stock_only = false;
  filters.value.out_of_stock_only = false;

  // Application du nouveau filtre
  switch (stockStatus) {
    case "in_stock":
      filters.value.in_stock_only = true;
      break;
    case "low_stock":
      filters.value.low_stock_only = true;
      break;
    case "out_of_stock":
      filters.value.out_of_stock_only = true;
      break;
    case "all":
    default:
      // Tous les filtres restent à false
      break;
  }

  // Toujours réinitialiser la pagination
  pagination.value.pageIndex = 0;

  // Déclencher le fetch
  fetchInventoryItems();
}

  function setBrandFilter(brandId: string | undefined): void {
    filters.value.brand_id = brandId;
    pagination.value.pageIndex = 0;
    fetchInventoryItems();
  }

  function setCategoryFilter(categoryId: string | undefined): void {
    filters.value.category_id = categoryId;
    pagination.value.pageIndex = 0;
    fetchInventoryItems();
  }

  function setMovementType(type: StockMovementType | undefined): void {
    movementFilters.value.type = type;
    pagination.value.pageIndex = 0;
    fetchMovements();
  }

  function setMovementDateRange(
    dateFrom: string | undefined,
    dateTo: string | undefined
  ): void {
    movementFilters.value.date_from = dateFrom;
    movementFilters.value.date_to = dateTo;
    pagination.value.pageIndex = 0;
    fetchMovements();
  }

  function resetFilters(): void {
    filters.value = {
      status: undefined,
      brand_id: undefined,
      category_id: undefined,
      low_stock_only: false,
      out_of_stock_only: false,
      in_stock_only: false,
      search: "",
      per_page: pagination.value.pageSize,
      page: 1,
    };
    pagination.value.pageIndex = 0;
    fetchInventoryItems();
  }

  function resetMovementFilters(): void {
    movementFilters.value = {
      product_id: undefined,
      variation_id: undefined,
      type: undefined,
      reason: undefined,
      date_from: undefined,
      date_to: undefined,
      user_id: undefined,
      per_page: pagination.value.pageSize,
      page: 1,
    };
    pagination.value.pageIndex = 0;
    fetchMovements();
  }

  function reset(): void {
    inventoryItems.value = [];
    lowStockItems.value = [];
    outOfStockItems.value = [];
    movements.value = [];
    currentItem.value = null;
    statistics.value = null;
    lastError.value = null;
    loadingState.value = "idle";
    resetFilters();
    resetMovementFilters();
  }

  // ============================================================================
  // RETOUR PUBLIC
  // ============================================================================

  return {
    // État (read-only)
    inventoryItems: inventoryItems,
    lowStockItems: readonly(lowStockItems),
    outOfStockItems: readonly(outOfStockItems),
    movements: movements,
    statistics: readonly(statistics),
    currentItem: readonly(currentItem),
    loading: readonly(loading),
    loadingState: readonly(loadingState),
    pagination: readonly(pagination),
    filters: readonly(filters),
    movementFilters: readonly(movementFilters),
    lastError: readonly(lastError),

    // Computed
    hasData,
    hasActiveFilters,
    totalPages,
    hasLowStock,
    hasOutOfStock,
    totalStockValue,
    lowStockCount,
    outOfStockCount,

    // Actions - Inventory Items
    fetchInventoryItems,
    fetchLowStockItems,
    fetchOutOfStockItems,

    // Actions - Movements
    fetchMovements,

    // Actions - Statistics
    fetchStatistics,

    // Actions - Stock Adjustments
    adjustStock,
    // Note: bulkAdjustStock a été retiré pour correspondre à l'API backend
    // Si besoin, itérez sur adjustStock dans le composant UI.

    // Actions - Export
    exportInventory,
    downloadExport,

    // Helpers UI
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setStockStatus,
    setBrandFilter,
    setCategoryFilter,
    setMovementType,
    setMovementDateRange,
    resetFilters,
    resetMovementFilters,
    reset,
  };
};
