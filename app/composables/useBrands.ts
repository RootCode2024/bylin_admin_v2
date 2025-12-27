import type {
  Brand,
  BrandFilters,
  BrandStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState
} from "~/types/brand";

export const useBrands = () => {
  const client = useSanctumClient();
  const toast = useToast();
  const { invalidateStatsCache } = useDashboard();


  const brands = useState<Brand[]>("brands", () => []);
  const loading = useState<boolean>("brands:loading", () => false);
  const loadingState = useState<LoadingState>(
    "brands:loadingState",
    () => "idle"
  );


  const pagination = useState("brands:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  }));

  const filters = useState<BrandFilters>("brands:filters", () => ({
    search: "",
    is_active: undefined,
    only_trashed: false,
    with_trashed: false,
    per_page: 15,
    page: 1,
    sort_by: "sort_order",
    sort_direction: "asc",
  }));

  const currentBrand = useState<Brand | null>("brands:current", () => null);

  const statistics = useState<BrandStatistics | null>(
    "brands:statistics",
    () => null
  );

  const lastError = useState<string | null>("brands:error", () => null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const hasData = computed(() => brands.value.length > 0);

  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.search ||
        filters.value.is_active !== undefined ||
        filters.value.only_trashed ||
        filters.value.with_trashed
    );
  });

  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.pageSize)
  );

  // ============================================================================
  // ACTIONS CRUD
  // ============================================================================

  async function fetchBrands(): Promise<void> {
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
      };

      if (filters.value.is_active !== undefined) {
        params.is_active = filters.value.is_active ? 1 : 0;
      }
      if (filters.value.with_trashed) {
        params.with_trashed = true;
      }
      if (filters.value.only_trashed) {
        params.only_trashed = true;
      }

      const response = await client<ApiResponse<LaravelPaginator<Brand>>>(
        "/api/v1/admin/brands",
        {
          method: "GET",
          params,
        }
      );

      if (response.success) {
        brands.value = response.data.data;
        pagination.value.total = response.data.total;
        pagination.value.totalPages = response.data.last_page;
        loadingState.value = "success";
      } else {
        throw new Error(response.message || "Erreur lors du chargement");
      }
    } catch (error: any) {
      loadingState.value = "error";
      lastError.value = error.message || "Erreur inconnue";
      brands.value = [];
      pagination.value.total = 0;

      toast.add({
        title: "Erreur de chargement",
        description:
          error.response?._data?.message || "Impossible de charger les marques",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchBrand(id: string): Promise<Brand | null> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Brand>>(
        `/api/v1/admin/brands/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        currentBrand.value = response.data;
        return response.data;
      }

      return null;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description:
          error.response?._data?.message || "Impossible de charger la marque",
        color: "error",
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createBrand(
    data: FormData | Record<string, any>
  ): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      const response = await client<ApiResponse<Brand>>(
        "/api/v1/admin/brands",
        {
          method: "POST",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Marque créée",
          description: response.message || "La marque a été créée avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        invalidateStatsCache();
        await fetchBrands();

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

  async function updateBrand(id: string, data: FormData): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      const response = await client<ApiResponse<Brand>>(
        `/api/v1/admin/brands/${id}`,
        {
          method: "POST",
          body: data,
        }
      );

      if (response.success && response.data) {
        loading.value = false;

        const index = brands.value.findIndex((b) => b.id === id);
        if (index !== -1) {
          brands.value[index] = response.data;
        }
        return true;
      }

      return false;
    } catch (err: any) {
      loading.value = false;
      handleValidationErrors(err);
      console.error("Update brand error:", err);
      return false;
    }
  }

  async function toggleStatus(id: string): Promise<boolean> {
    const brand = brands.value.find((b) => b.id === id);
    if (!brand) {
      toast.add({
        title: "Erreur",
        description: "Marque introuvable",
        color: "error",
      });
      return false;
    }

    loading.value = true;

    try {
      const response = await client<ApiResponse<Brand>>(
        `/api/v1/admin/brands/${id}`,
        {
          method: "PUT",
          body: { is_active: !brand.is_active },
        }
      );

      if (response.success) {
        const newStatus = response.data.is_active ? "activée" : "désactivée";

        toast.add({
          title: "Statut modifié",
          description: `La marque a été ${newStatus}`,
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchBrands();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description:
          error.response?._data?.message || "Impossible de modifier le statut",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteBrands(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/brands/${ids[0]}`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/brands/bulk/destroy",
          {
            method: "POST",
            body: { ids },
          }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message =
          count === 1
            ? "La marque a été supprimée"
            : `${count} marques ont été supprimées`;

        toast.add({
          title: "Suppression réussie",
          description: message,
          color: "success",
          icon: "i-lucide-trash-2",
        });

        invalidateStatsCache();
        await fetchBrands();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur de suppression",
        description:
          error.response?._data?.message || "Impossible de supprimer",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function restoreBrands(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/brands/${ids[0]}/restore`,
          { method: "POST" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/brands/bulk/restore",
          {
            method: "POST",
            body: { ids },
          }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message =
          count === 1
            ? "La marque a été restaurée"
            : `${count} marques ont été restaurées`;

        toast.add({
          title: "Restauration réussie",
          description: message,
          color: "success",
          icon: "i-lucide-refresh-cw",
        });

        await fetchBrands();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur de restauration",
        description:
          error.response?._data?.message || "Impossible de restaurer",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function forceDeleteBrands(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/brands/${ids[0]}/force`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/brands/bulk/force-delete",
          {
            method: "POST",
            body: { ids },
          }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message =
          count === 1
            ? "La marque a été supprimée définitivement"
            : `${count} marques ont été supprimées définitivement`;

        toast.add({
          title: "Suppression définitive",
          description: message,
          color: "warning",
          icon: "i-lucide-alert-triangle",
        });

        invalidateStatsCache();
        await fetchBrands();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description:
          error.response?._data?.message ||
          "Impossible de supprimer définitivement",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistics(): Promise<BrandStatistics | null> {
    try {
      const response = await client<ApiResponse<BrandStatistics>>(
        "/api/v1/admin/brands/statistics",
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
        description:
          error.response?._data?.message || "Une erreur est survenue",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    }
  }

  // ============================================================================
  // HELPERS DE PAGINATION ET FILTRES
  // ============================================================================

  function setPage(pageIndex: number): void {
    pagination.value.pageIndex = pageIndex;
    fetchBrands();
  }

  function setPageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0;
    filters.value.per_page = size;
    fetchBrands();
  }

  function setSearch(search: string): void {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  function setStatus(status: "all" | "active" | "inactive"): void {
    if (status === "all") {
      filters.value.is_active = undefined;
    } else if (status === "active") {
      filters.value.is_active = true;
    } else {
      filters.value.is_active = false;
    }
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  function setStatusFilter(status: boolean | undefined): void {
    filters.value.is_active = status;
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  function setTrashedFilter(withTrashed: boolean, onlyTrashed: boolean): void {
    filters.value.with_trashed = withTrashed;
    filters.value.only_trashed = onlyTrashed;
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  function setSorting(
    sortBy: BrandFilters["sort_by"],
    direction: "asc" | "desc" = "asc"
  ): void {
    filters.value.sort_by = sortBy;
    filters.value.sort_direction = direction;
    fetchBrands();
  }

  function resetFilters(): void {
    filters.value = {
      search: "",
      is_active: undefined,
      only_trashed: false,
      with_trashed: false,
      per_page: 15,
      page: 1,
      sort_by: "sort_order",
      sort_direction: "asc",
    };
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  function reset(): void {
    brands.value = [];
    currentBrand.value = null;
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
    brands: brands,
    currentBrand: readonly(currentBrand),
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
    fetchBrands,
    fetchBrand,
    createBrand,
    updateBrand,
    deleteBrands,
    toggleStatus,

    // Actions avancées
    restoreBrands,
    forceDeleteBrands,
    fetchStatistics,

    // Helpers
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setStatusFilter,
    setTrashedFilter,
    setSorting,
    resetFilters,
    reset,
  };
};
