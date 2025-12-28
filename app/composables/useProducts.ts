import type {
  Product,
  ProductFilters,
  ProductStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
  ProductFormData,
  ProductStatus,
} from "~/types/product";
import type { ValidationErrors, ApiErrorResponse } from "~/types/validation";

export const useProduct = () => {
  const client = useSanctumClient();
  const toast = useToast();

  const state = useState<{
    products: Product[];
    currentProduct: Product | null;
    statistics: ProductStatistics | null;
    loadingState: LoadingState;
    error: string | null;
    pagination: LaravelPaginator<Product> | null;
    filters: ProductFilters;
  }>("products:state", () => ({
    products: [],
    currentProduct: null,
    statistics: null,
    loadingState: "idle",
    error: null,
    pagination: null,
    filters: {
      search: "",
      status: undefined,
      brand_id: undefined,
      category_id: undefined,
      collection_id: undefined,
      in_stock: undefined,
      is_preorder: undefined,
      is_featured: undefined,
      min_price: undefined,
      max_price: undefined,
      with_trashed: false,
      per_page: 15,
      page: 1,
      sort_by: "created_at",
      sort_order: "desc",
    },
  }));

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const products = computed(() => state.value.products);
  const hasData = computed(() => state.value.products.length > 0);
  const hasError = computed(() => state.value.loadingState === "error");
  const isLoading = computed(() => state.value.loadingState === "loading");

  const totalPages = computed(() => state.value.pagination?.last_page || 1);

  const hasActiveFilters = computed(() => {
    const f = state.value.filters;
    return Boolean(
      f.search ||
        f.status ||
        f.brand_id ||
        f.category_id ||
        f.collection_id ||
        f.in_stock !== undefined ||
        f.is_preorder !== undefined ||
        f.is_featured !== undefined ||
        f.with_trashed
    );
  });

  // ============================================================================
  // UTILITAIRES D'ERREUR
  // ============================================================================

  /**
   * Obtient le message d'erreur d'une exception
   */
  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return "Une erreur inconnue est survenue";
  }

  /**
   * Obtient le message d'erreur de l'API
   */
  function getApiErrorMessage(error: unknown): string {
    const apiError = error as ApiErrorResponse;
    return apiError.response?._data?.message || getErrorMessage(error);
  }

  /**
   * Obtient les erreurs de validation de l'API
   */
  function getValidationErrors(error: unknown): ValidationErrors | null {
    const apiError = error as ApiErrorResponse;
    return apiError.response?._data?.errors || null;
  }

  // ============================================================================
  // ACTIONS CRUD
  // ============================================================================

  async function fetchProducts(): Promise<void> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page: state.value.filters.page,
        per_page: state.value.filters.per_page,
        search: state.value.filters.search || undefined,
        sort_by: state.value.filters.sort_by,
        sort_order: state.value.filters.sort_order,
      };

      if (state.value.filters.with_trashed) params.with_trashed = 1;
      if (state.value.filters.status)
        params.status = state.value.filters.status;
      if (state.value.filters.brand_id)
        params.brand_id = state.value.filters.brand_id;
      if (state.value.filters.category_id)
        params.category_id = state.value.filters.category_id;
      if (state.value.filters.collection_id)
        params.collection_id = state.value.filters.collection_id;
      if (state.value.filters.in_stock !== undefined)
        params.in_stock = state.value.filters.in_stock ? 1 : 0;
      if (state.value.filters.is_preorder !== undefined)
        params.is_preorder = state.value.filters.is_preorder ? 1 : 0;
      if (state.value.filters.is_featured !== undefined)
        params.is_featured = state.value.filters.is_featured ? 1 : 0;

      const response = await client<ApiResponse<LaravelPaginator<Product>>>(
        "/api/v1/admin/products",
        { method: "GET", params }
      );

      if (response.success) {
        state.value.products = response.data.data;
        state.value.pagination = response.data;
        state.value.loadingState = "success";
      } else {
        throw new Error(response.message || "Erreur de chargement");
      }
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      state.value.products = [];
      handleError(error, "Impossible de charger les produits");
    }
  }

  async function fetchProduct(id: string): Promise<Product | null> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const response = await client<ApiResponse<Product>>(
        `/api/v1/admin/products/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        state.value.currentProduct = response.data;
        state.value.loadingState = "success";
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleError(error, "Impossible de charger le produit");
      return null;
    }
  }

  async function createProduct(data: ProductFormData): Promise<Product | null> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const formData = objectToFormData(data);

      const response = await client<ApiResponse<Product>>(
        "/api/v1/admin/products",
        { method: "POST", body: formData }
      );

      if (response.success) {
        state.value.loadingState = "success";
        await fetchProducts();
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleValidationErrors(error);
      throw error;
    }
  }

  async function updateProduct(
    id: string,
    data: Partial<ProductFormData>
  ): Promise<Product | null> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const formData = objectToFormData(data);
      formData.append("_method", "PUT");

      const response = await client<ApiResponse<Product>>(
        `/api/v1/admin/products/${id}`,
        { method: "POST", body: formData }
      );

      if (response.success) {
        state.value.currentProduct = response.data;
        state.value.loadingState = "success";

        const index = state.value.products.findIndex((p) => p.id === id);
        if (index !== -1) {
          state.value.products[index] = response.data;
        }

        return response.data;
      }
      return null;
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleValidationErrors(error);
      return null;
    }
  }

  async function deleteProduct(id: string): Promise<boolean> {
    return deleteProducts([id]);
  }

  async function deleteProducts(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const isBulk = ids.length > 1;
      const url = isBulk
        ? "/api/v1/admin/products/bulk/destroy"
        : `/api/v1/admin/products/${ids[0]}`;

      const method = isBulk ? "POST" : "DELETE";
      const body = isBulk ? { ids } : undefined;

      const response = await client<ApiResponse<null>>(url, { method, body });

      if (response.success) {
        state.value.loadingState = "success";
        await fetchProducts();
        return true;
      }
      return false;
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleError(error, "Erreur lors de la suppression");
      return false;
    }
  }

  async function duplicateProduct(id: string): Promise<Product | null> {
    state.value.loadingState = "loading";

    try {
      const response = await client<ApiResponse<Product>>(
        `/api/v1/admin/products/${id}/duplicate`,
        { method: "POST" }
      );

      if (response.success) {
        state.value.loadingState = "success";
        await fetchProducts();
        return response.data;
      }
      return null;
    } catch (error: unknown) {
      state.value.loadingState = "error";
      handleError(error, "Erreur lors de la duplication");
      return null;
    }
  }

  // ============================================================================
  // ACTIONS SPÉCIFIQUES
  // ============================================================================

  async function updateStock(
    id: string,
    quantity: number,
    operation: "set" | "add" | "sub" = "set"
  ): Promise<boolean> {
    try {
      const response = await client<ApiResponse<Product>>(
        `/api/v1/admin/products/${id}/stock`,
        {
          method: "POST",
          body: { quantity, operation },
        }
      );

      if (response.success) {
        if (state.value.currentProduct?.id === id) {
          state.value.currentProduct.stock_quantity =
            response.data.stock_quantity;
        }

        const item = state.value.products.find((p) => p.id === id);
        if (item) {
          item.stock_quantity = response.data.stock_quantity;
        }
        return true;
      }
      return false;
    } catch (error: unknown) {
      handleError(error, "Erreur mise à jour stock");
      return false;
    }
  }

  // Type pour les options de précommande
  interface PreorderOptions {
    available_date?: string;
    limit?: number;
    message?: string;
  }

  async function togglePreorder(
    id: string,
    enable: boolean,
    options?: PreorderOptions
  ): Promise<boolean> {
    try {
      const endpoint = enable ? "enable-preorder" : "disable-preorder";
      const response = await client<ApiResponse<Product>>(
        `/api/v1/admin/products/${id}/${endpoint}`,
        { method: "POST", body: options }
      );

      if (response.success) {
        if (state.value.currentProduct?.id === id) {
          state.value.currentProduct = response.data;
        }

        return true;
      }
      return false;
    } catch (error: unknown) {
      handleError(error, "Erreur gestion précommande");
      return false;
    }
  }

  async function fetchStatistics(): Promise<void> {
    try {
      const response = await client<ApiResponse<ProductStatistics>>(
        "/api/v1/admin/products/statistics",
        { method: "GET" }
      );

      if (response.success) {
        state.value.statistics = response.data;
      }
    } catch (_error: unknown) {
      console.error("Erreur stats produits", _error);
    }
  }

  // ============================================================================
  // GESTION DES FILTRES ET HELPERS
  // ============================================================================

  function setPage(page: number) {
    state.value.filters.page = page;
    fetchProducts();
  }

  function setSearch(search: string) {
    state.value.filters.search = search;
    state.value.filters.page = 1;
    fetchProducts();
  }

  function setStatusFilter(status: ProductStatus | "all") {
    state.value.filters.status = status === "all" ? undefined : status;
    state.value.filters.page = 1;
    fetchProducts();
  }

  function setStockFilter(val: "all" | "in_stock" | "out_of_stock") {
    state.value.filters.in_stock =
      val === "all" ? undefined : val === "in_stock";
    state.value.filters.page = 1;
    fetchProducts();
  }

  function setCollectionFilter(collectionId: string | null) {
    state.value.filters.collection_id = collectionId || undefined;
    state.value.filters.page = 1;
    fetchProducts();
  }

  function resetFilters() {
    state.value.filters = {
      search: "",
      status: undefined,
      brand_id: undefined,
      category_id: undefined,
      collection_id: undefined,
      in_stock: undefined,
      is_preorder: undefined,
      is_featured: undefined,
      min_price: undefined,
      max_price: undefined,
      with_trashed: false,
      per_page: 15,
      page: 1,
      sort_by: "created_at",
      sort_order: "desc",
    };
    fetchProducts();
  }

  function reset() {
    state.value = {
      products: [],
      currentProduct: null,
      statistics: null,
      loadingState: "idle",
      error: null,
      pagination: null,
      filters: {
        search: "",
        status: undefined,
        brand_id: undefined,
        category_id: undefined,
        collection_id: undefined,
        in_stock: undefined,
        is_preorder: undefined,
        is_featured: undefined,
        min_price: undefined,
        max_price: undefined,
        with_trashed: false,
        per_page: 15,
        page: 1,
        sort_by: "created_at",
        sort_order: "desc",
      },
    };
  }

  function handleValidationErrors(error: unknown): void {
    const errors = getValidationErrors(error);

    if (errors && typeof errors === "object") {
      const errorMessages = Object.entries(errors)
        .map(([_field, messages]) =>
          Array.isArray(messages) ? messages[0] : messages
        )
        .join("\n");

      toast.add({
        title: "Erreur de validation",
        description: errorMessages,
        color: "error",
        icon: "i-lucide-alert-circle",
        duration: 5000,
      });
    } else {
      handleError(error, "Une erreur est survenue");
    }
  }

  function handleError(error: unknown, defaultMessage: string): void {
    const errorMessage = getApiErrorMessage(error);

    toast.add({
      title: "Erreur",
      description: errorMessage || defaultMessage,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  }

  function objectToFormData(
    obj: object,
    form?: FormData,
    namespace?: string
  ): FormData {
    const fd = form || new FormData();

    for (const property in obj) {
      if (
        !Object.prototype.hasOwnProperty.call(obj, property) ||
        (obj as Record<string, unknown>)[property] === undefined ||
        (obj as Record<string, unknown>)[property] === null
      ) {
        continue;
      }

      const formKey = namespace ? `${namespace}[${property}]` : property;
      const value = (obj as Record<string, unknown>)[property];

      if (value instanceof Date) {
        fd.append(formKey, value.toISOString());
      } else if (value instanceof File || value instanceof Blob) {
        fd.append(formKey, value);
      } else if (Array.isArray(value)) {
        if (value.length === 0) {
          continue;
        }

        value.forEach((item: unknown, index: number) => {
          if (item instanceof File) {
            fd.append(`${formKey}[]`, item);
          } else if (typeof item === "object" && item !== null) {
            objectToFormData(item, fd, `${formKey}[${index}]`);
          } else if (item !== undefined && item !== null) {
            fd.append(`${formKey}[]`, String(item));
          }
        });
      } else if (typeof value === "object" && value !== null) {
        objectToFormData(value, fd, formKey);
      } else if (typeof value === "boolean") {
        fd.append(formKey, value ? "1" : "0");
      } else {
        fd.append(formKey, String(value));
      }
    }
    return fd;
  }

  // ============================================================================
  // RETOUR
  // ============================================================================
  return {
    state,
    products,

    // Computed
    isLoading,
    hasData,
    hasError,
    hasActiveFilters,
    totalPages,

    // Actions CRUD
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteProducts,
    duplicateProduct,

    // Actions spécifiques
    updateStock,
    togglePreorder,
    fetchStatistics,

    // Filtres
    setPage,
    setSearch,
    setStatusFilter,
    setStockFilter,
    setCollectionFilter,
    resetFilters,
    reset,
  };
};
