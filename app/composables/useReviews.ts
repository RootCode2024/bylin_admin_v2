import type {
  Review,
  ReviewFilters,
  ReviewStatistics,
  ReviewStatus,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
} from "~/types/review";
import type { ValidationErrors, ApiErrorResponse } from "~/types/validation";

export const useReviews = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // ============================================================================
  // ÉTAT PARTAGÉ
  // ============================================================================

  const reviews = useState<Review[]>("reviews", () => []);
  const loading = useState<boolean>("reviews:loading", () => false);
  const loadingState = useState<LoadingState>(
    "reviews:loadingState",
    () => "idle"
  );

  const pagination = useState<LaravelPaginator<Review> | null>(
    "reviews:pagination",
    () => null
  );

  const filters = useState<ReviewFilters>("reviews:filters", () => ({
    search: "",
    status: "all",
    rating: undefined,
    verified_only: false,
    product_id: undefined,
    customer_id: undefined,
    only_trashed: false,
    with_trashed: false,
    per_page: 15,
    page: 1,
    sort_by: "created_at",
    sort_direction: "desc",
  }));

  const currentReview = useState<Review | null>("reviews:current", () => null);
  const statistics = useState<ReviewStatistics | null>(
    "reviews:statistics",
    () => null
  );
  const lastError = useState<string | null>("reviews:error", () => null);

  // ============================================================================
  // UTILITAIRES D'ERREUR
  // ============================================================================

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
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

  // ============================================================================
  // COMPUTED
  // ============================================================================

const hasData = computed(() => reviews.value.length > 0);

const hasActiveFilters = computed(() => {
  return Boolean(
    filters.value.search ||
      filters.value.status !== "all" ||
      filters.value.rating ||
      filters.value.verified_only ||
      filters.value.product_id ||
      filters.value.customer_id ||
      filters.value.only_trashed ||
      filters.value.with_trashed
  );
});

const totalPages = computed(() => pagination.value?.last_page || 1); // ✅ Utiliser last_page

const pendingReviews = computed(() =>
  reviews.value.filter((r) => r.status === "pending" && !r.deleted_at)
);

const approvedReviews = computed(() =>
  reviews.value.filter((r) => r.status === "approved" && !r.deleted_at)
);

  // ============================================================================
  // ACTIONS CRUD
  // ============================================================================

  async function fetchReviews(): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";
    lastError.value = null;

    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page: filters.value.page || 1, // ✅ Utiliser filters.page
        per_page: filters.value.per_page || 15,
        search: filters.value.search || undefined,
        sort_by: filters.value.sort_by,
        sort_direction: filters.value.sort_direction,
      };

      if (filters.value.status && filters.value.status !== "all") {
        params.status = filters.value.status;
      }
      if (filters.value.rating) {
        params.rating = filters.value.rating;
      }
      if (filters.value.verified_only) {
        params.verified_only = true;
      }
      if (filters.value.product_id) {
        params.product_id = filters.value.product_id;
      }
      if (filters.value.customer_id) {
        params.customer_id = filters.value.customer_id;
      }
      if (filters.value.with_trashed) {
        params.with_trashed = true;
      }
      if (filters.value.only_trashed) {
        params.only_trashed = true;
      }

      const response = await client<ApiResponse<LaravelPaginator<Review>>>(
        "/api/v1/admin/reviews",
        { method: "GET", params }
      );

      if (response.success) {
        reviews.value = response.data.data;
        pagination.value = response.data;
        loadingState.value = "success";
      } else {
        throw new Error(response.message || "Erreur lors du chargement");
      }
    } catch (error: unknown) {
      loadingState.value = "error";
      lastError.value = getErrorMessage(error);
      reviews.value = [];
      // ✅ Ne pas modifier pagination.value si null
      if (pagination.value) {
        pagination.value = { ...pagination.value, total: 0 };
      }

      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur de chargement",
        description: errorMessage || "Impossible de charger les avis",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchReview(id: string): Promise<Review | null> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Review>>(
        `/api/v1/admin/reviews/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        currentReview.value = response.data;
        return response.data;
      }

      return null;
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur",
        description: errorMessage || "Impossible de charger l'avis",
        color: "error",
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function approveReview(id: string): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      const response = await client<ApiResponse<Review>>(
        `/api/v1/admin/reviews/${id}/approve`,
        { method: "POST" }
      );

      if (response.success) {
        toast.add({
          title: "Avis approuvé",
          description: response.message || "L'avis a été approuvé avec succès",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchReviews();
        return true;
      }

      return false;
    } catch (error: unknown) {
      lastError.value = getErrorMessage(error);
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function rejectReview(id: string, reason?: string): Promise<boolean> {
    loading.value = true;
    lastError.value = null;

    try {
      const response = await client<ApiResponse<Review>>(
        `/api/v1/admin/reviews/${id}/reject`,
        {
          method: "POST",
          body: reason ? { reason } : undefined,
        }
      );

      if (response.success) {
        toast.add({
          title: "Avis rejeté",
          description: response.message || "L'avis a été rejeté",
          color: "success",
          icon: "i-lucide-x-circle",
        });

        await fetchReviews();
        return true;
      }

      return false;
    } catch (error: unknown) {
      lastError.value = getErrorMessage(error);
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteReviews(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/reviews/${ids[0]}`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/reviews/bulk/destroy",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message =
          count === 1
            ? "L'avis a été supprimé"
            : `${count} avis ont été supprimés`;

        toast.add({
          title: "Suppression réussie",
          description: message,
          color: "success",
          icon: "i-lucide-trash-2",
        });

        await fetchReviews();
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur de suppression",
        description: errorMessage || "Impossible de supprimer",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function restoreReviews(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/reviews/${ids[0]}/restore`,
          { method: "POST" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/reviews/bulk/restore",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        const count = ids.length;
        const message =
          count === 1
            ? "L'avis a été restauré"
            : `${count} avis ont été restaurés`;

        toast.add({
          title: "Restauration réussie",
          description: message,
          color: "success",
          icon: "i-lucide-refresh-cw",
        });

        await fetchReviews();
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur de restauration",
        description: errorMessage || "Impossible de restaurer",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function bulkApprove(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      const response = await client<ApiResponse<null>>(
        "/api/v1/admin/reviews/bulk/approve",
        { method: "POST", body: { ids } }
      );

      if (response.success) {
        toast.add({
          title: "Approbation réussie",
          description: `${ids.length} avis approuvé(s)`,
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchReviews();
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur d'approbation",
        description: errorMessage || "Impossible d'approuver",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function bulkReject(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;

    loading.value = true;

    try {
      const response = await client<ApiResponse<null>>(
        "/api/v1/admin/reviews/bulk/reject",
        { method: "POST", body: { ids } }
      );

      if (response.success) {
        toast.add({
          title: "Rejet réussi",
          description: `${ids.length} avis rejeté(s)`,
          color: "success",
          icon: "i-lucide-x-circle",
        });

        await fetchReviews();
        return true;
      }

      return false;
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur de rejet",
        description: errorMessage || "Impossible de rejeter",
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchStatistics(): Promise<ReviewStatistics | null> {
    try {
      const response = await client<ApiResponse<ReviewStatistics>>(
        "/api/v1/admin/reviews/statistics",
        { method: "GET" }
      );

      if (response.success) {
        statistics.value = response.data;
        return response.data;
      }

      return null;
    } catch (_error: unknown) {
      console.error("Erreur lors du chargement des statistiques:", _error);
      return null;
    }
  }

  // ============================================================================
  // GESTION DES ERREURS
  // ============================================================================

  function handleValidationErrors(error: unknown): void {
    const errors = getValidationErrors(error);

    if (errors && typeof errors === "object") {
      const errorMessages = Object.entries(errors)
        .map(([_field, messages]) => {
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
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur",
        description: errorMessage || "Une erreur est survenue",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function setPage(page: number): void {
    filters.value.page = page; // ✅ Utiliser filters.page
    fetchReviews();
  }

  function setPageSize(size: number): void {
    filters.value.per_page = size;
    filters.value.page = 1; // ✅ Reset à page 1
    fetchReviews();
  }

  function setSearch(search: string): void {
    filters.value.search = search;
    filters.value.page = 1; // ✅ Reset à page 1
    fetchReviews();
  }

  function setStatus(status: ReviewStatus | "all"): void {
    filters.value.status = status;
    filters.value.page = 1; // ✅ Reset à page 1
    fetchReviews();
  }

  function setRating(rating: number | undefined): void {
    filters.value.rating = rating;
    filters.value.page = 1; // ✅ Reset à page 1
    fetchReviews();
  }

  function setVerifiedFilter(verified: boolean): void {
    filters.value.verified_only = verified;
    filters.value.page = 1; // ✅ Reset à page 1
    fetchReviews();
  }

  function setTrashedFilter(withTrashed: boolean, onlyTrashed: boolean): void {
    filters.value.with_trashed = withTrashed;
    filters.value.only_trashed = onlyTrashed;
    filters.value.page = 1; // ✅ Reset à page 1
    fetchReviews();
  }

  function resetFilters(): void {
    filters.value = {
      search: "",
      status: "all",
      rating: undefined,
      verified_only: false,
      product_id: undefined,
      customer_id: undefined,
      only_trashed: false,
      with_trashed: false,
      per_page: 15,
      page: 1,
      sort_by: "created_at",
      sort_direction: "desc",
    };
    fetchReviews();
  }

  function reset(): void {
    reviews.value = [];
    currentReview.value = null;
    statistics.value = null;
    lastError.value = null;
    loadingState.value = "idle";
    pagination.value = null;
    resetFilters();
  }

  // ============================================================================
  // RETOUR PUBLIC
  // ============================================================================

  return {
    // État (read-only)
    reviews: reviews,
    currentReview: readonly(currentReview),
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
    pendingReviews,
    approvedReviews,

    // Actions CRUD
    fetchReviews,
    fetchReview,
    approveReview,
    rejectReview,
    deleteReviews,
    restoreReviews,
    bulkApprove,
    bulkReject,
    fetchStatistics,

    // Helpers
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setRating,
    setVerifiedFilter,
    setTrashedFilter,
    resetFilters,
    reset,
  };
};
