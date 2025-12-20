import type {
  Attribute,
  AttributeValue,
  AttributeFilters,
  AttributeStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
  ValueReorderData,
} from "~/types/attribute";

/**
 * Composable de gestion des attributs
 *
 * Fournit toutes les fonctionnalités CRUD et de gestion des attributs
 * avec état partagé, pagination, filtres et gestion d'erreurs
 */
export const useAttributes = () => {
  const client = useSanctumClient();
  const toast = useToast();
  const { invalidateStatsCache } = useDashboard();

  // ============================================================================
  // ÉTAT PARTAGÉ
  // ============================================================================

  const attributes = useState<Attribute[]>("attributes", () => []);
  const loading = useState<boolean>("attributes:loading", () => false);
  const loadingState = useState<LoadingState>("attributes:loadingState", () => "idle");

  const pagination = useState("attributes:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  }));

  const filters = useState<AttributeFilters>("attributes:filters", () => ({
    search: "",
    type: undefined,
    is_filterable: undefined,
    only_trashed: false,
    with_trashed: false,
    with_values: true,
    per_page: 15,
    page: 1,
    sort_by: "sort_order",
    sort_direction: "asc",
  }));

  const currentAttribute = useState<Attribute | null>("attributes:current", () => null);
  const statistics = useState<AttributeStatistics | null>("attributes:statistics", () => null);
  const lastError = useState<string | null>("attributes:error", () => null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const hasData = computed(() => attributes.value.length > 0);

  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.search ||
        filters.value.type ||
        filters.value.is_filterable !== undefined ||
        filters.value.only_trashed ||
        filters.value.with_trashed
    );
  });

  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.pageSize)
  );

  // ============================================================================
  // ACTIONS CRUD - ATTRIBUTS
  // ============================================================================

  async function fetchAttributes(): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";
    lastError.value = null;

    try {
      const params: Record<string, any> = {
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        search: filters.value.search || undefined,
        sort_by: filters.value.sort_by,
        sort_direction: filters.value.sort_direction,
        with_values: filters.value.with_values,
      };

      if (filters.value.type && filters.value.type !== "all") {
        params.type = filters.value.type;
      }
      if (filters.value.is_filterable !== undefined) {
        params.is_filterable = filters.value.is_filterable ? 1 : 0;
      }
      if (filters.value.with_trashed) {
        params.with_trashed = true;
      }
      if (filters.value.only_trashed) {
        params.only_trashed = true;
      }

      const response = await client<ApiResponse<LaravelPaginator<Attribute>>>(
        "/api/v1/admin/attributes",
        { method: "GET", params }
      );

      if (response.success) {
        attributes.value = response.data.data;
        pagination.value.total = response.data.total;
        pagination.value.totalPages = response.data.last_page;
        loadingState.value = "success";
      } else {
        throw new Error(response.message || "Erreur lors du chargement");
      }
    } catch (error: any) {
      loadingState.value = "error";
      lastError.value = error.message || "Erreur inconnue";
      attributes.value = [];
      pagination.value.total = 0;

      toast.add({
        title: "Erreur de chargement",
        description: error.response?._data?.message || "Impossible de charger les attributs",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchAttribute(id: string): Promise<Attribute | null> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Attribute>>(
        `/api/v1/admin/attributes/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        currentAttribute.value = response.data;
        return response.data;
      }

      return null;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.response?._data?.message || "Impossible de charger l'attribut",
        color: "error",
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createAttribute(data: FormData | Record<string, any>): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      const response = await client<ApiResponse<Attribute>>(
        "/api/v1/admin/attributes",
        { method: "POST", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Attribut créé",
          description: response.message || "L'attribut a été créé avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        invalidateStatsCache();
        await fetchAttributes();

        return true;
      }

      return false;
    } catch (error: any) {
      lastError.value = error.message;
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateAttribute(id: string, data: FormData | Record<string, any>): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      if (data instanceof FormData) {
        data.append("_method", "PUT");
      }

      const response = await client<ApiResponse<Attribute>>(
        `/api/v1/admin/attributes/${id}`,
        {
          method: data instanceof FormData ? "POST" : "PUT",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Attribut mis à jour",
          description: response.message || "L'attribut a été mis à jour avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchAttributes();
        return true;
      }

      return false;
    } catch (error: any) {
      lastError.value = error.message;
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteAttributes(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/attributes/${ids[0]}`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/attributes/bulk/destroy",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message = count === 1 ? "L'attribut a été supprimé" : `${count} attributs ont été supprimés`;

        toast.add({
          title: "Suppression réussie",
          description: message,
          color: "success",
          icon: "i-lucide-trash-2",
        });

        invalidateStatsCache();
        await fetchAttributes();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur de suppression",
        description: error.response?._data?.message || "Impossible de supprimer",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function restoreAttributes(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/attributes/${ids[0]}/restore`,
          { method: "POST" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/attributes/bulk/restore",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message = count === 1 ? "L'attribut a été restauré" : `${count} attributs ont été restaurés`;

        toast.add({
          title: "Restauration réussie",
          description: message,
          color: "success",
          icon: "i-lucide-refresh-cw",
        });

        await fetchAttributes();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur de restauration",
        description: error.response?._data?.message || "Impossible de restaurer",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistics(): Promise<AttributeStatistics | null> {
    try {
      const response = await client<ApiResponse<AttributeStatistics>>(
        "/api/v1/admin/attributes/statistics",
        { method: "GET" }
      );

      if (response.success) {
        statistics.value = response.data;
        return response.data;
      }

      return null;
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      return null;
    }
  }

  async function reorderAttributes(orders: Array<{ id: string; sort_order: number }>): Promise<boolean> {
    try {
      const response = await client<ApiResponse<null>>(
        "/api/v1/admin/attributes/reorder",
        { method: "POST", body: { orders } }
      );

      if (response.success) {
        toast.add({
          title: "Ordre mis à jour",
          description: "L'ordre des attributs a été mis à jour",
          color: "success",
        });

        await fetchAttributes();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.response?._data?.message || "Impossible de réorganiser",
        color: "error",
      });
      return false;
    }
  }

  // ============================================================================
  // GESTION DES ERREURS
  // ============================================================================

  function handleValidationErrors(error: any): void {
    const errors = error.response?._data?.errors;

    if (errors && typeof errors === "object") {
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => {
          const messageArray = Array.isArray(messages) ? messages : [messages];
          return messageArray.join("\n");
        })
        .join("\n");

      toast.add({
        title: "Erreur de validation",
        description: errorMessages,
        color: "error",
        icon: "i-lucide-alert-circle",
        duration: 6000,
      });
    } else {
      toast.add({
        title: "Erreur",
        description: error.response?._data?.message || "Une erreur est survenue",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function setPage(pageIndex: number): void {
    pagination.value.pageIndex = pageIndex;
    fetchAttributes();
  }

  function setPageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0;
    filters.value.per_page = size;
    fetchAttributes();
  }

  function setSearch(search: string): void {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchAttributes();
  }

  function setType(type: string): void {
    filters.value.type = type === "all" ? undefined : (type as any);
    pagination.value.pageIndex = 0;
    fetchAttributes();
  }

  function setFilterable(filterable: boolean | undefined): void {
    filters.value.is_filterable = filterable;
    pagination.value.pageIndex = 0;
    fetchAttributes();
  }

  function setTrashedFilter(withTrashed: boolean, onlyTrashed: boolean): void {
    filters.value.with_trashed = withTrashed;
    filters.value.only_trashed = onlyTrashed;
    pagination.value.pageIndex = 0;
    fetchAttributes();
  }

  function resetFilters(): void {
    filters.value = {
      search: "",
      type: undefined,
      is_filterable: undefined,
      only_trashed: false,
      with_trashed: false,
      with_values: true,
      per_page: 15,
      page: 1,
      sort_by: "sort_order",
      sort_direction: "asc",
    };
    pagination.value.pageIndex = 0;
    fetchAttributes();
  }

  function reset(): void {
    attributes.value = [];
    currentAttribute.value = null;
    statistics.value = null;
    lastError.value = null;
    loadingState.value = "idle";
    resetFilters();
  }

  // ============================================================================
  // RETOUR PUBLIC
  // ============================================================================

  return {
    // État (read-only)
    attributes: readonly(attributes),
    currentAttribute: readonly(currentAttribute),
    statistics: readonly(statistics),
    loading: readonly(loading),
    loadingState: readonly(loadingState),
    pagination: readonly(pagination),
    filters: readonly(filters),
    lastError: readonly(lastError),

    // Computed
    hasData,
    hasActiveFilters,
    totalPages,

    // Actions CRUD
    fetchAttributes,
    fetchAttribute,
    createAttribute,
    updateAttribute,
    deleteAttributes,
    restoreAttributes,
    fetchStatistics,
    reorderAttributes,

    // Helpers
    setPage,
    setPageSize,
    setSearch,
    setType,
    setFilterable,
    setTrashedFilter,
    resetFilters,
    reset,
  };
};
