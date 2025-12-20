import type {
  Promotion,
  PromotionFilters,
  PromotionStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
  CouponValidation,
} from "~/types/promotion";

/**
 * Composable de gestion des promotions
 *
 * Fournit toutes les fonctionnalités CRUD et de gestion des promotions
 * avec état partagé, pagination, filtres et gestion d'erreurs
 */
export const usePromotions = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // ============================================================================
  // ÉTAT PARTAGÉ
  // ============================================================================

  const promotions = useState<Promotion[]>("promotions", () => []);
  const loading = useState<boolean>("promotions:loading", () => false);
  const loadingState = useState<LoadingState>("promotions:loadingState", () => "idle");

  const pagination = useState("promotions:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  }));

  const filters = useState<PromotionFilters>("promotions:filters", () => ({
    search: "",
    type: undefined,
    status: 'all',
    only_trashed: false,
    with_trashed: false,
    per_page: 15,
    page: 1,
    sort_by: "created_at",
    sort_direction: "desc",
  }));

  const currentPromotion = useState<Promotion | null>("promotions:current", () => null);
  const statistics = useState<PromotionStatistics | null>("promotions:statistics", () => null);
  const lastError = useState<string | null>("promotions:error", () => null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const hasData = computed(() => promotions.value.length > 0);

  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.search ||
        filters.value.type ||
        filters.value.status !== 'all' ||
        filters.value.only_trashed ||
        filters.value.with_trashed
    );
  });

  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.pageSize)
  );

  const activePromotions = computed(() =>
    promotions.value.filter(p => p.is_active && !p.deleted_at)
  );

  // ============================================================================
  // ACTIONS CRUD
  // ============================================================================

  async function fetchPromotions(): Promise<void> {
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

      if (filters.value.type && filters.value.type !== "all") {
        params.type = filters.value.type;
      }
      if (filters.value.status && filters.value.status !== "all") {
        params.status = filters.value.status;
      }
      if (filters.value.with_trashed) {
        params.with_trashed = true;
      }
      if (filters.value.only_trashed) {
        params.only_trashed = true;
      }

      const response = await client<ApiResponse<LaravelPaginator<Promotion>>>(
        "/api/v1/admin/promotions",
        { method: "GET", params }
      );

      if (response.success) {
        promotions.value = response.data.data;
        pagination.value.total = response.data.total;
        pagination.value.totalPages = response.data.last_page;
        loadingState.value = "success";
      } else {
        throw new Error(response.message || "Erreur lors du chargement");
      }
    } catch (error: any) {
      loadingState.value = "error";
      lastError.value = error.message || "Erreur inconnue";
      promotions.value = [];
      pagination.value.total = 0;

      toast.add({
        title: "Erreur de chargement",
        description: error.response?._data?.message || "Impossible de charger les promotions",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchPromotion(id: string): Promise<Promotion | null> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Promotion>>(
        `/api/v1/admin/promotions/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        currentPromotion.value = response.data;
        return response.data;
      }

      return null;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.response?._data?.message || "Impossible de charger la promotion",
        color: "error",
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createPromotion(data: FormData | Record<string, any>): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      const response = await client<ApiResponse<Promotion>>(
        "/api/v1/admin/promotions",
        { method: "POST", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Promotion créée",
          description: response.message || "La promotion a été créée avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchPromotions();
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

  async function updatePromotion(id: string, data: FormData | Record<string, any>): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      if (data instanceof FormData) {
        data.append("_method", "PUT");
      }

      const response = await client<ApiResponse<Promotion>>(
        `/api/v1/admin/promotions/${id}`,
        {
          method: data instanceof FormData ? "POST" : "PUT",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Promotion mise à jour",
          description: response.message || "La promotion a été mise à jour avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchPromotions();
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

  async function deletePromotions(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/promotions/${ids[0]}`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/promotions/bulk/destroy",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message = count === 1 ? "La promotion a été supprimée" : `${count} promotions ont été supprimées`;

        toast.add({
          title: "Suppression réussie",
          description: message,
          color: "success",
          icon: "i-lucide-trash-2",
        });

        await fetchPromotions();
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

  async function restorePromotions(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/promotions/${ids[0]}/restore`,
          { method: "POST" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/promotions/bulk/restore",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message = count === 1 ? "La promotion a été restaurée" : `${count} promotions ont été restaurées`;

        toast.add({
          title: "Restauration réussie",
          description: message,
          color: "success",
          icon: "i-lucide-refresh-cw",
        });

        await fetchPromotions();
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

  async function toggleActive(id: string, isActive: boolean): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Promotion>>(
        `/api/v1/admin/promotions/${id}`,
        {
          method: "PUT",
          body: { is_active: isActive },
        }
      );

      if (response.success) {
        toast.add({
          title: isActive ? "Promotion activée" : "Promotion désactivée",
          description: response.message || "Le statut a été mis à jour",
          color: "success",
        });

        await fetchPromotions();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.response?._data?.message || "Impossible de modifier le statut",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function validateCoupon(code: string, cartAmount?: number): Promise<CouponValidation> {
    try {
      const response = await client<ApiResponse<CouponValidation>>(
        "/api/v1/promotions/validate",
        {
          method: "POST",
          body: { code, cart_amount: cartAmount },
        }
      );

      if (response.success) {
        return response.data;
      }

      return {
        valid: false,
        error: response.message || "Code invalide",
      };
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?._data?.message || "Erreur de validation",
      };
    }
  }

  async function fetchStatistics(): Promise<PromotionStatistics | null> {
    try {
      const response = await client<ApiResponse<PromotionStatistics>>(
        "/api/v1/admin/promotions/statistics",
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
    fetchPromotions();
  }

  function setPageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0;
    filters.value.per_page = size;
    fetchPromotions();
  }

  function setSearch(search: string): void {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchPromotions();
  }

  function setType(type: string): void {
    filters.value.type = type === "all" ? undefined : (type as any);
    pagination.value.pageIndex = 0;
    fetchPromotions();
  }

  function setStatus(status: string): void {
    filters.value.status = status as any;
    pagination.value.pageIndex = 0;
    fetchPromotions();
  }

  function setTrashedFilter(withTrashed: boolean, onlyTrashed: boolean): void {
    filters.value.with_trashed = withTrashed;
    filters.value.only_trashed = onlyTrashed;
    pagination.value.pageIndex = 0;
    fetchPromotions();
  }

  function resetFilters(): void {
    filters.value = {
      search: "",
      type: undefined,
      status: 'all',
      only_trashed: false,
      with_trashed: false,
      per_page: 15,
      page: 1,
      sort_by: "created_at",
      sort_direction: "desc",
    };
    pagination.value.pageIndex = 0;
    fetchPromotions();
  }

  function reset(): void {
    promotions.value = [];
    currentPromotion.value = null;
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
    promotions: readonly(promotions),
    currentPromotion: readonly(currentPromotion),
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
    activePromotions,

    // Actions CRUD
    fetchPromotions,
    fetchPromotion,
    createPromotion,
    updatePromotion,
    deletePromotions,
    restorePromotions,
    toggleActive,
    validateCoupon,
    fetchStatistics,

    // Helpers
    setPage,
    setPageSize,
    setSearch,
    setType,
    setStatus,
    setTrashedFilter,
    resetFilters,
    reset,
  };
};
