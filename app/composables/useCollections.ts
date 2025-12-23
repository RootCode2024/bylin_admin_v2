import type {
  Collection,
  CollectionFilters,
  CollectionFormData,
  CollectionStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
} from "~/types/collection";

export const useCollections = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // ============================================================================
  // ÉTAT UNIFIÉ (useState pour SSR)
  // ============================================================================

  const state = useState<{
    collections: Collection[];
    currentCollection: Collection | null;
    statistics: CollectionStatistics | null;
    loadingState: LoadingState;
    error: string | null;
    pagination: LaravelPaginator<Collection> | null;
    filters: CollectionFilters;
  }>("collections:state", () => ({
    collections: [],
    currentCollection: null,
    statistics: null,
    loadingState: "idle",
    error: null,
    pagination: null,
    filters: {
      search: "",
      is_active: "all",
      per_page: 15,
      page: 1,
      sort_by: "created_at",
      sort_order: "asc",
      with_trashed: false,
    },
  }));

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const isLoading = computed(() => state.value.loadingState === "loading");
  const collections = computed(() => state.value.collections);
  const hasData = computed(() => state.value.collections.length > 0);
  const hasError = computed(() => state.value.loadingState === "error");
  const totalPages = computed(() => state.value.pagination?.last_page || 1);

  const hasActiveFilters = computed(() => {
    const f = state.value.filters;
    return Boolean(
      f.search ||
        (f.is_active !== "all" && f.is_active !== undefined) ||
        f.with_trashed
    );
  });

  // ============================================================================
  // ACTIONS CRUD
  // ============================================================================

  /**
   * Récupère la liste des collections
   */
  async function fetchCollections(): Promise<void> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const params: Record<string, any> = {
        page: state.value.filters.page,
        per_page: state.value.filters.per_page,
        search: state.value.filters.search || undefined,
        paginate: true,
        with_counts: true,
        order_by: state.value.filters.sort_by,
        order_dir: state.value.filters.sort_order,
      };

      if (state.value.filters.is_active !== "all") {
        params.is_active = state.value.filters.is_active ? 1 : 0;
      }

      if (state.value.filters.with_trashed) {
        params.with_trashed = 1;
      }

      // ✅ CORRECTION: Type de réponse adapté à ApiController
      interface ApiPaginatedResponse {
        success: boolean;
        message: string;
        data: Collection[]; // Les items directement dans data
        meta: {
          current_page: number;
          last_page: number;
          per_page: number;
          total: number;
          from: number | null;
          to: number | null;
        };
      }

      const response = await client<ApiPaginatedResponse>(
        "/api/v1/admin/collections",
        { method: "GET", params }
      );

      if (response.success) {
        // ✅ Les données sont directement dans response.data
        state.value.collections = response.data;

        // ✅ Créer un objet pagination compatible avec le reste du code
        state.value.pagination = {
          data: response.data,
          current_page: response.meta.current_page,
          last_page: response.meta.last_page,
          per_page: response.meta.per_page,
          total: response.meta.total,
          from: response.meta.from,
          to: response.meta.to,
          // Valeurs par défaut pour les autres champs requis
          first_page_url: "",
          last_page_url: "",
          next_page_url: null,
          prev_page_url: null,
          path: "",
          links: [],
        };

        state.value.loadingState = "success";
      } else {
        throw new Error(response.message || "Erreur de chargement");
      }
    } catch (error: any) {
      state.value.loadingState = "error";
      state.value.error = error.message;
      state.value.collections = [];
      handleError(error, "Impossible de charger les collections");
    }
  }

  /**
   * Récupère une collection par ID
   */
  async function fetchCollection(id: string): Promise<Collection | null> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const response = await client<ApiResponse<Collection>>(
        `/api/v1/admin/collections/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        state.value.currentCollection = response.data;
        state.value.loadingState = "success";
        return response.data;
      }
      return null;
    } catch (error: any) {
      state.value.loadingState = "error";
      state.value.error = error.message;
      handleError(error, "Impossible de charger la collection");
      return null;
    }
  }

  /**
   * Crée une collection
   */
  async function createCollection(
    data: CollectionFormData
  ): Promise<Collection | null> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const formData = objectToFormData(data);

      const response = await client<ApiResponse<Collection>>(
        "/api/v1/admin/collections",
        { method: "POST", body: formData }
      );

      if (response.success) {
        toast.add({
          title: "Succès",
          description: "Collection créée avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        state.value.loadingState = "success";
        await fetchCollections();
        return response.data;
      }
      return null;
    } catch (error: any) {
      state.value.loadingState = "error";
      state.value.error = error.message;
      handleValidationErrors(error);
      return null;
    }
  }

  /**
   * Met à jour une collection
   */
  async function updateCollection(
    id: string,
    data: Partial<CollectionFormData>
  ): Promise<Collection | null> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const formData = objectToFormData(data);
      formData.append("_method", "PUT");

      const response = await client<ApiResponse<Collection>>(
        `/api/v1/admin/collections/${id}`,
        { method: "POST", body: formData }
      );

      if (response.success) {
        toast.add({
          title: "Succès",
          description: "Collection mise à jour",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        state.value.currentCollection = response.data;
        state.value.loadingState = "success";

        const index = state.value.collections.findIndex((c) => c.id === id);
        if (index !== -1) {
          state.value.collections[index] = response.data;
        }

        return response.data;
      }
      return null;
    } catch (error: any) {
      state.value.loadingState = "error";
      state.value.error = error.message;
      handleValidationErrors(error);
      return null;
    }
  }

  /**
   * Supprime une collection
   */
  async function deleteCollection(id: string): Promise<boolean> {
    return deleteCollections([id]);
  }

  /**
   * Supprime plusieurs collections
   */
  async function deleteCollections(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const isBulk = ids.length > 1;
      const url = isBulk
        ? "/api/v1/admin/collections/bulk/destroy"
        : `/api/v1/admin/collections/${ids[0]}`;

      const method = isBulk ? "POST" : "DELETE";
      const body = isBulk ? { ids } : undefined;

      const response = await client<ApiResponse<null>>(url, { method, body });

      if (response.success) {
        toast.add({
          title: "Suppression réussie",
          description: `${ids.length} collection(s) supprimée(s)`,
          color: "success",
          icon: "i-lucide-trash-2",
        });

        state.value.loadingState = "success";
        await fetchCollections();
        return true;
      }
      return false;
    } catch (error: any) {
      state.value.loadingState = "error";
      state.value.error = error.message;
      handleError(error, "Erreur lors de la suppression");
      return false;
    }
  }

  /**
   * Bascule le statut actif d'une collection
   */
async function toggleActive(id: string): Promise<boolean> {
  try {
    console.log("[toggleActive] Start", { id });
    state.value.loadingState = "loading";

    const response = await client<ApiResponse<Collection>>(
      `/api/v1/admin/collections/${id}/toggle-active`,
      { method: "POST" }
    );

    console.log("[toggleActive] Response", response);

    if (response.success) {
      // Mise à jour dans la liste
      const index = state.value.collections.findIndex((c) => c.id === id);
      if (index !== -1) {
        state.value.collections = [
          ...state.value.collections.slice(0, index),
          response.data,
          ...state.value.collections.slice(index + 1),
        ];
      }

      // Mise à jour de currentCollection
      if (state.value.currentCollection?.id === id) {
        state.value.currentCollection = { ...response.data };
      }

      state.value.loadingState = "success";

      toast.add({
        title: "Succès",
        description: response.message,
        color: "success",
        icon: "i-lucide-check-circle",
      });

      return true;
    }

    state.value.loadingState = "error";

    toast.add({
      title: "Erreur",
      description: response.message || "Échec du changement de statut",
      color: "error",
    });

    return false;
  } catch (error: any) {
    console.error("[toggleActive] Error", error);
    state.value.loadingState = "error";

    // ✅ Meilleur message d'erreur
    const errorMessage =
      error.response?._data?.message ||
      error.data?.message ||
      error.message ||
      "Erreur lors du changement de statut";

    toast.add({
      title: "Erreur",
      description: errorMessage,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });

    return false;
  }
}

  /**
   * Réorganise les collections
   */
  async function reorderCollections(orderedIds: string[]): Promise<boolean> {
    try {
      const response = await client<ApiResponse<null>>(
        "/api/v1/admin/collections/reorder",
        {
          method: "POST",
          body: { ordered_ids: orderedIds },
        }
      );

      if (response.success) {
        toast.add({
          title: "Ordre mis à jour",
          color: "success",
          icon: "i-lucide-check",
        });

        await fetchCollections();
        return true;
      }
      return false;
    } catch (error: any) {
      handleError(error, "Erreur lors de la réorganisation");
      return false;
    }
  }

  /**
   * Récupère les statistiques
   */
  async function fetchStatistics(): Promise<void> {
    try {
      const response = await client<ApiResponse<CollectionStatistics>>(
        "/api/v1/admin/collections/statistics",
        { method: "GET" }
      );

      if (response.success) {
        state.value.statistics = response.data;
      }
    } catch (error) {
      console.error("Erreur stats collections", error);
    }
  }

  // ============================================================================
  // GESTION DES FILTRES
  // ============================================================================

  function setPage(page: number) {
    state.value.filters.page = page;
    fetchCollections();
  }

  function setSearch(search: string) {
    state.value.filters.search = search;
    state.value.filters.page = 1;
    fetchCollections();
  }

  function setStatusFilter(status: boolean | "all") {
    state.value.filters.is_active = status;
    state.value.filters.page = 1;
    fetchCollections();
  }

  function resetFilters() {
    state.value.filters = {
      search: "",
      is_active: "all",
      per_page: 15,
      page: 1,
      sort_by: "created_at",
      sort_order: "asc",
      with_trashed: false,
    };
    fetchCollections();
  }

  function reset() {
    state.value = {
      collections: [],
      currentCollection: null,
      statistics: null,
      loadingState: "idle",
      error: null,
      pagination: null,
      filters: {
        search: "",
        is_active: "all",
        per_page: 15,
        page: 1,
        sort_by: "created_at",
        sort_order: "asc",
        with_trashed: false,
      },
    };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function handleValidationErrors(error: any): void {
    const errors = error.response?._data?.errors;

    if (errors && typeof errors === "object") {
      const errorMessages = Object.entries(errors)
        .map(([_, messages]) =>
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

  function handleError(error: any, defaultMessage: string): void {
    toast.add({
      title: "Erreur",
      description: error.response?._data?.message || defaultMessage,
      color: "error",
      icon: "i-lucide-alert-triangle",
    });
  }

  function objectToFormData(
    obj: any,
    form?: FormData,
    namespace?: string
  ): FormData {
    const fd = form || new FormData();

    for (const property in obj) {
      if (
        !Object.prototype.hasOwnProperty.call(obj, property) ||
        obj[property] === undefined
      ) {
        continue;
      }

      const formKey = namespace ? `${namespace}[${property}]` : property;

      if (obj[property] instanceof Date) {
        fd.append(formKey, obj[property].toISOString());
      } else if (
        obj[property] instanceof File ||
        obj[property] instanceof Blob
      ) {
        fd.append(formKey, obj[property]);
      } else if (Array.isArray(obj[property])) {
        obj[property].forEach((item: any, index: number) => {
          if (item instanceof File) {
            fd.append(`${formKey}[]`, item);
          } else if (typeof item === "object") {
            objectToFormData(item, fd, `${formKey}[${index}]`);
          } else {
            fd.append(`${formKey}[]`, item);
          }
        });
      } else if (typeof obj[property] === "object" && obj[property] !== null) {
        objectToFormData(obj[property], fd, formKey);
      } else if (typeof obj[property] === "boolean") {
        fd.append(formKey, obj[property] ? "1" : "0");
      } else {
        fd.append(formKey, String(obj[property]));
      }
    }
    return fd;
  }

  // ============================================================================
  // RETOUR
  // ============================================================================
  return {
    state,
    collections,

    // Computed
    isLoading,
    hasData,
    hasError,
    hasActiveFilters,
    totalPages,

    // Actions CRUD
    fetchCollections,
    fetchCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    deleteCollections,
    toggleActive,
    reorderCollections,

    // Statistiques
    fetchStatistics,

    // Filtres
    setPage,
    setSearch,
    setStatusFilter,
    resetFilters,
    reset,
  };
};
