import type {
  Collection,
  CollectionFilters,
  CollectionFormData,
  CollectionStatistics,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
} from "~/types/collection";
import type { ValidationErrors, ApiErrorResponse } from "~/types/validation";

export const useCollections = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // ============================================================================
  // ÉTAT
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

  async function fetchCollections(): Promise<void> {
    state.value.loadingState = "loading";
    state.value.error = null;

    try {
      const params: Record<string, string | number | boolean | undefined> = {
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

      interface ApiPaginatedResponse {
        success: boolean;
        message: string;
        data: Collection[];
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

      console.log("Fetched collections response:", response);

      if (response.success) {
        state.value.collections = response.data;

        state.value.pagination = {
          data: response.data,
          current_page: response.meta.current_page,
          last_page: response.meta.last_page,
          per_page: response.meta.per_page,
          total: response.meta.total,
          from: response.meta.from,
          to: response.meta.to,
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
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      state.value.collections = [];
      handleError(error, "Impossible de charger les collections");
    }
  }

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
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleError(error, "Impossible de charger la collection");
      return null;
    }
  }

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
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleValidationErrors(error);
      return null;
    }
  }

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
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleValidationErrors(error);
      return null;
    }
  }

  async function deleteCollection(id: string): Promise<boolean> {
    return deleteCollections([id]);
  }

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
    } catch (error: unknown) {
      state.value.loadingState = "error";
      state.value.error = getErrorMessage(error);
      handleError(error, "Erreur lors de la suppression");
      return false;
    }
  }

  async function toggleActive(id: string): Promise<boolean> {
    try {
      state.value.loadingState = "loading";

      const response = await client<ApiResponse<Collection>>(
        `/api/v1/admin/collections/${id}/toggle-active`,
        { method: "POST" }
      );

      if (response.success) {
        const index = state.value.collections.findIndex((c) => c.id === id);
        if (index !== -1) {
          state.value.collections = [
            ...state.value.collections.slice(0, index),
            response.data,
            ...state.value.collections.slice(index + 1),
          ];
        }

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
    } catch (error: unknown) {
      state.value.loadingState = "error";
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur",
        description: errorMessage || "Erreur lors du changement de statut",
        color: "error",
        icon: "i-lucide-alert-triangle",
      });

      return false;
    }
  }

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
    } catch (error: unknown) {
      handleError(error, "Erreur lors de la réorganisation");
      return false;
    }
  }

  async function fetchStatistics(): Promise<void> {
    try {
      const response = await client<ApiResponse<CollectionStatistics>>(
        "/api/v1/admin/collections/statistics",
        { method: "GET" }
      );

      if (response.success) {
        state.value.statistics = response.data;
      }
    } catch (_error: unknown) {
      console.error("Erreur stats collections", _error);
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
  // HELPERS - IMAGE MANAGEMENT
  // ============================================================================

  /**
   * Remove an image from a collection
   * @param id Collection ID
   * @param imageField 'cover_image' or 'banner_image'
   */
  async function removeImage(
    id: string,
    imageField: "cover_image" | "banner_image"
  ): Promise<boolean> {
    try {
      state.value.loadingState = "loading";

      const data: Record<string, unknown> = {};
      data[`${imageField}_to_delete`] = true;

      const result = await updateCollection(id, data);

      if (result) {
        toast.add({
          title: "Image supprimée",
          description: "L'image a été supprimée avec succès",
          color: "success",
          icon: "i-lucide-trash-2",
        });

        state.value.loadingState = "success";
        return true;
      }

      return false;
    } catch (error: unknown) {
      state.value.loadingState = "error";
      handleError(error, "Erreur lors de la suppression de l'image");
      return false;
    }
  }

  /**
   * Update a collection image
   * @param id Collection ID
   * @param imageField 'cover_image' or 'banner_image'
   * @param file New image file
   */
  async function updateImage(
    id: string,
    imageField: "cover_image" | "banner_image",
    file: File
  ): Promise<boolean> {
    try {
      state.value.loadingState = "loading";

      const data: Record<string, unknown> = {};
      data[imageField] = file;

      const result = await updateCollection(id, data);

      if (result) {
        toast.add({
          title: "Image mise à jour",
          description: "L'image a été mise à jour avec succès",
          color: "success",
          icon: "i-lucide-image",
        });

        state.value.loadingState = "success";
        return true;
      }

      return false;
    } catch (error: unknown) {
      state.value.loadingState = "error";
      handleError(error, "Erreur lors de la mise à jour de l'image");
      return false;
    }
  }

  // ============================================================================
  // HELPERS - GENERAL
  // ============================================================================

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

  /**
   * Enhanced objectToFormData with better handling for files and deletion flags
   */
  function objectToFormData(
    obj: object,
    form?: FormData,
    namespace?: string
  ): FormData {
    const fd = form || new FormData();

    for (const property in obj) {
      if (
        !Object.prototype.hasOwnProperty.call(obj, property) ||
        (obj as Record<string, unknown>)[property] === undefined
      ) {
        continue;
      }

      const formKey = namespace ? `${namespace}[${property}]` : property;
      const value = (obj as Record<string, unknown>)[property];

      // Handle deletion flags (e.g., cover_image_to_delete)
      if (property.endsWith("_to_delete") && value === true) {
        fd.append(formKey, "1");
        continue;
      }

      if (value instanceof Date) {
        fd.append(formKey, value.toISOString());
      } else if (value instanceof File || value instanceof Blob) {
        fd.append(formKey, value);
      } else if (Array.isArray(value)) {
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
      } else if (value !== null) {
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

    // Image Management
    removeImage,
    updateImage,

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
