import type {
  Category,
  CategoryFilters,
  CategoryStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
  BreadcrumbItem,
} from "~/types/category";

/**
 * Composable de gestion des catégories
 *
 * Fournit toutes les fonctionnalités CRUD et de gestion des catégories
 * avec état partagé, pagination, filtres et gestion d'erreurs
 */
export const useCategories = () => {
  const client = useSanctumClient();
  const toast = useToast();
  const { invalidateStatsCache } = useDashboard();

  // ============================================================================
  // ÉTAT PARTAGÉ
  // ============================================================================

  /**
   * Liste des catégories chargées
   */
  const categories = useState<Category[]>("categories", () => []);

  /**
   * Arbre hiérarchique des catégories
   */
  const categoryTree = useState<Category[]>("categories:tree", () => []);

  /**
   * État de chargement global
   */
  const loading = useState<boolean>("categories:loading", () => false);

  /**
   * État de chargement détaillé
   */
  const loadingState = useState<LoadingState>(
    "categories:loadingState",
    () => "idle"
  );

  /**
   * Configuration de la pagination
   */
  const pagination = useState("categories:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  }));

  /**
   * Filtres actifs
   */
  const filters = useState<CategoryFilters>("categories:filters", () => ({
    search: "",
    parent_id: undefined,
    level: undefined,
    is_active: undefined,
    is_visible_in_menu: undefined,
    is_featured: undefined,
    only_root: false,
    only_trashed: false,
    with_trashed: false,
    per_page: 15,
    page: 1,
    sort_by: "sort_order",
    sort_direction: "asc",
  }));

  /**
   * Catégorie actuellement sélectionnée
   */
  const currentCategory = useState<Category | null>(
    "categories:current",
    () => null
  );

  /**
   * Statistiques des catégories
   */
  const statistics = useState<CategoryStatistics | null>(
    "categories:statistics",
    () => null
  );

  /**
   * Dernière erreur survenue
   */
  const lastError = useState<string | null>("categories:error", () => null);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  /**
   * Indique si des données sont chargées
   */
  const hasData = computed(() => categories.value.length > 0);

  /**
   * Indique si des filtres sont actifs
   */
  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.search ||
        filters.value.parent_id ||
        filters.value.level !== undefined ||
        filters.value.is_active !== undefined ||
        filters.value.only_root ||
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

  /**
   * Catégories racines (niveau 0)
   */
  const rootCategories = computed(() =>
    categories.value.filter((c) => c.level === 0 && !c.parent_id)
  );

  // ============================================================================
  // ACTIONS CRUD
  // ============================================================================

  /**
   * Récupère la liste des catégories avec filtres et pagination
   */
  async function fetchCategories(): Promise<void> {
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

      // Filtres optionnels
      if (filters.value.parent_id) {
        params.parent_id = filters.value.parent_id;
      }
      if (filters.value.level !== undefined && filters.value.level !== null) {
        params.level = filters.value.level;
      }
      if (
        filters.value.is_active !== undefined &&
        filters.value.is_active !== null
      ) {
        params.is_active = filters.value.is_active ? 1 : 0;
      }
      if (filters.value.is_visible_in_menu !== undefined) {
        params.is_visible_in_menu = filters.value.is_visible_in_menu ? 1 : 0;
      }
      if (filters.value.is_featured !== undefined) {
        params.is_featured = filters.value.is_featured ? 1 : 0;
      }
      if (filters.value.only_root) {
        params.only_root = true;
      }
      if (filters.value.with_trashed) {
        params.with_trashed = true;
      }
      if (filters.value.only_trashed) {
        params.only_trashed = true;
      }

      const response = await client<ApiResponse<LaravelPaginator<Category>>>(
        "/api/v1/admin/categories",
        {
          method: "GET",
          params,
        }
      );

      if (response.success) {
        categories.value = response.data.data;
        pagination.value.total = response.data.total;
        pagination.value.totalPages = response.data.last_page;
        loadingState.value = "success";
      } else {
        throw new Error(response.message || "Erreur lors du chargement");
      }
    } catch (error: any) {
      loadingState.value = "error";
      lastError.value = error.message || "Erreur inconnue";
      categories.value = [];
      pagination.value.total = 0;

      toast.add({
        title: "Erreur de chargement",
        description:
          error.response?._data?.message ||
          "Impossible de charger les catégories",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Récupère l'arbre hiérarchique complet
   */
  async function fetchCategoryTree(): Promise<void> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Category[]>>(
        "/api/v1/admin/categories/tree",
        { method: "GET" }
      );

      if (response.success) {
        categoryTree.value = response.data;
      }
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description:
          error.response?._data?.message ||
          "Impossible de charger l'arbre des catégories",
        color: "error",
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Récupère une catégorie par son ID
   */
  async function fetchCategory(id: string): Promise<Category | null> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Category>>(
        `/api/v1/admin/categories/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        currentCategory.value = response.data;
        return response.data;
      }

      return null;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description:
          error.response?._data?.message ||
          "Impossible de charger la catégorie",
        color: "error",
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crée une nouvelle catégorie
   */
  async function createCategory(
    data: FormData | Record<string, any>
  ): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      const response = await client<ApiResponse<Category>>(
        "/api/v1/admin/categories",
        {
          method: "POST",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Catégorie créée",
          description:
            response.message || "La catégorie a été créée avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        invalidateStatsCache();
        await fetchCategories();

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
   * Met à jour une catégorie existante
   */
  async function updateCategory(
    id: string,
    data: FormData | Record<string, any>
  ): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      if (data instanceof FormData) {
        data.append("_method", "PUT");
      }

      const response = await client<ApiResponse<Category>>(
        `/api/v1/admin/categories/${id}`,
        {
          method: data instanceof FormData ? "POST" : "PUT",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Catégorie mise à jour",
          description:
            response.message || "La catégorie a été mise à jour avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchCategories();
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
   * Supprime (soft delete) une ou plusieurs catégories
   */
  async function deleteCategories(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/categories/${ids[0]}`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/categories/bulk/destroy",
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
            ? "La catégorie a été supprimée"
            : `${count} catégories ont été supprimées`;

        toast.add({
          title: "Suppression réussie",
          description: message,
          color: "success",
          icon: "i-lucide-trash-2",
        });

        invalidateStatsCache();
        await fetchCategories();
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
   * Restaure une ou plusieurs catégories
   */
  async function restoreCategories(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/categories/${ids[0]}/restore`,
          { method: "POST" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/categories/bulk/restore",
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
            ? "La catégorie a été restaurée"
            : `${count} catégories ont été restaurées`;

        toast.add({
          title: "Restauration réussie",
          description: message,
          color: "success",
          icon: "i-lucide-refresh-cw",
        });

        await fetchCategories();
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
   * Supprime définitivement une ou plusieurs catégories
   */
  async function forceDeleteCategories(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/categories/${ids[0]}/force`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/categories/bulk/force-delete",
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
            ? "La catégorie a été supprimée définitivement"
            : `${count} catégories ont été supprimées définitivement`;

        toast.add({
          title: "Suppression définitive",
          description: message,
          color: "warning",
          icon: "i-lucide-alert-triangle",
        });

        invalidateStatsCache();
        await fetchCategories();
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
   * Déplace une catégorie vers un nouveau parent
   */
  async function moveCategory(
    id: string,
    newParentId: string | null
  ): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Category>>(
        `/api/v1/admin/categories/${id}/move`,
        {
          method: "PATCH",
          body: { parent_id: newParentId },
        }
      );

      if (response.success) {
        toast.add({
          title: "Catégorie déplacée",
          description: "La catégorie a été déplacée avec succès",
          color: "success",
          icon: "i-lucide-move",
        });

        await fetchCategories();
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description:
          error.response?._data?.message ||
          "Impossible de déplacer la catégorie",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Récupère les statistiques
   */
  async function fetchStatistics(): Promise<CategoryStatistics | null> {
    try {
      const response = await client<ApiResponse<CategoryStatistics>>(
        "/api/v1/admin/categories/statistics",
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

  /**
   * Récupère le fil d'Ariane d'une catégorie
   */
  async function fetchBreadcrumb(id: string): Promise<BreadcrumbItem[]> {
    try {
      const response = await client<ApiResponse<BreadcrumbItem[]>>(
        `/api/v1/admin/categories/${id}/breadcrumb`,
        { method: "GET" }
      );

      if (response.success) {
        return response.data;
      }

      return [];
    } catch (error) {
      return [];
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
    fetchCategories();
  }

  function setPageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0;
    filters.value.per_page = size;
    fetchCategories();
  }

  function setSearch(search: string): void {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchCategories();
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
    fetchCategories();
  }

  function setLevel(level: "all" | "0" | "1" | "2" | "3"): void {
    if (level === "all") {
      filters.value.level = undefined;
    } else {
      filters.value.level = parseInt(level);
    }
    pagination.value.pageIndex = 0;
    fetchCategories();
  }

  function setParentFilter(parentId: string | "null" | undefined): void {
    filters.value.parent_id = parentId;
    pagination.value.pageIndex = 0;
    fetchCategories();
  }

  function setTrashedFilter(withTrashed: boolean, onlyTrashed: boolean): void {
    filters.value.with_trashed = withTrashed;
    filters.value.only_trashed = onlyTrashed;
    pagination.value.pageIndex = 0;
    fetchCategories();
  }

  function resetFilters(): void {
    filters.value = {
      search: "",
      parent_id: undefined,
      level: undefined,
      is_active: undefined,
      is_visible_in_menu: undefined,
      is_featured: undefined,
      only_root: false,
      only_trashed: false,
      with_trashed: false,
      per_page: 15,
      page: 1,
      sort_by: "sort_order",
      sort_direction: "asc",
    };
    pagination.value.pageIndex = 0;
    fetchCategories();
  }

  function reset(): void {
    categories.value = [];
    categoryTree.value = [];
    currentCategory.value = null;
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
    categories: readonly(categories),
    categoryTree: readonly(categoryTree),
    currentCategory: readonly(currentCategory),
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
    rootCategories,

    // Actions CRUD
    fetchCategories,
    fetchCategoryTree,
    fetchCategory,
    createCategory,
    updateCategory,
    deleteCategories,

    // Actions avancées
    restoreCategories,
    forceDeleteCategories,
    moveCategory,
    fetchStatistics,
    fetchBreadcrumb,

    // Helpers
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setLevel,
    setParentFilter,
    setTrashedFilter,
    resetFilters,
    reset,
  };
};
