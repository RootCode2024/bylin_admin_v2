import type {
  Brand,
  BrandFilters,
  BrandStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
  ValidationError,
} from "~/types/brand";

/**
 * Composable de gestion des marques
 *
 * Fournit toutes les fonctionnalités CRUD et de gestion des marques
 * avec état partagé, pagination, filtres et gestion d'erreurs
 */
export const useBrands = () => {
  const client = useSanctumClient();
  const toast = useToast();
  const { invalidateStatsCache } = useDashboard();

  // ============================================================================
  // ÉTAT PARTAGÉ
  // ============================================================================

  /**
   * Liste des marques chargées
   */
  const brands = useState<Brand[]>("brands", () => []);

  /**
   * État de chargement global
   */
  const loading = useState<boolean>("brands:loading", () => false);

  /**
   * État de chargement détaillé
   */
  const loadingState = useState<LoadingState>(
    "brands:loadingState",
    () => "idle"
  );

  /**
   * Configuration de la pagination
   */
  const pagination = useState("brands:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  }));

  /**
   * Filtres actifs
   */
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

  /**
   * Marque actuellement sélectionnée
   */
  const currentBrand = useState<Brand | null>("brands:current", () => null);

  /**
   * Statistiques des marques
   */
  const statistics = useState<BrandStatistics | null>(
    "brands:statistics",
    () => null
  );

  /**
   * Dernière erreur survenue
   */
  const lastError = useState<string | null>("brands:error", () => null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  /**
   * Indique si des données sont chargées
   */
  const hasData = computed(() => brands.value.length > 0);

  /**
   * Indique si des filtres sont actifs
   */
  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.search ||
        filters.value.is_active !== undefined ||
        filters.value.only_trashed ||
        filters.value.with_trashed
    );
  });

  /**
   * Nombre de pages totales
   */
  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.pageSize)
  );

  // ============================================================================
  // ACTIONS CRUD
  // ============================================================================

  /**
   * Récupère la liste des marques avec filtres et pagination
   */
  async function fetchBrands(): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";
    lastError.value = null;

    try {
      // Construction des paramètres de requête
      const params: Record<string, any> = {
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        search: filters.value.search || undefined,
        sort_by: filters.value.sort_by,
        sort_direction: filters.value.sort_direction,
      };

      // Ajout des filtres optionnels
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

  /**
   * Récupère une marque par son ID
   */
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

  /**
   * Crée une nouvelle marque
   */
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

        // Invalidation du cache et rechargement
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

  /**
   * Met à jour une marque existante
   */
  async function updateBrand(
    id: string,
    data: FormData | Record<string, any>
  ): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      // Gestion du _method pour Laravel avec FormData
      if (data instanceof FormData) {
        data.append("_method", "PUT");
      }

      const response = await client<ApiResponse<Brand>>(
        `/api/v1/admin/brands/${id}`,
        {
          method: data instanceof FormData ? "POST" : "PUT",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Marque mise à jour",
          description:
            response.message || "La marque a été mise à jour avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

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

  /**
   * Bascule le statut actif/inactif d'une marque
   */
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

  /**
   * Supprime (soft delete) une ou plusieurs marques
   */
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

  /**
   * Restaure une ou plusieurs marques supprimées
   */
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

  /**
   * Supprime définitivement une ou plusieurs marques
   */
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

  /**
   * Récupère les statistiques des marques
   */
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

  /**
   * Gère les erreurs de validation de l'API
   */
  function handleValidationErrors(error: any): void {
    const errors = error.response?._data?.errors;

    if (errors && typeof errors === "object") {
      // Extraction et formatage des erreurs
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

  /**
   * Change la page courante
   */
  function setPage(pageIndex: number): void {
    pagination.value.pageIndex = pageIndex;
    fetchBrands();
  }

  /**
   * Change le nombre d'éléments par page
   */
  function setPageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0;
    filters.value.per_page = size;
    fetchBrands();
  }

  /**
   * Définit le terme de recherche
   */
  function setSearch(search: string): void {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  /**
   * Définit le filtre de statut (depuis l'interface utilisateur)
   */
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

  /**
   * Définit le filtre de statut (depuis l'API)
   */
  function setStatusFilter(status: boolean | undefined): void {
    filters.value.is_active = status;
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  /**
   * Définit les filtres de suppression
   */
  function setTrashedFilter(withTrashed: boolean, onlyTrashed: boolean): void {
    filters.value.with_trashed = withTrashed;
    filters.value.only_trashed = onlyTrashed;
    pagination.value.pageIndex = 0;
    fetchBrands();
  }

  /**
   * Définit l'ordre de tri
   */
  function setSorting(
    sortBy: BrandFilters["sort_by"],
    direction: "asc" | "desc" = "asc"
  ): void {
    filters.value.sort_by = sortBy;
    filters.value.sort_direction = direction;
    fetchBrands();
  }

  /**
   * Réinitialise tous les filtres
   */
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

  /**
   * Réinitialise tout l'état
   */
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
    brands: readonly(brands),
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
