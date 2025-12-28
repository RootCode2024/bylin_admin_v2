import type { Customer, LaravelPaginator, ApiResponse } from "~/types/customer";
import type { ValidationErrors, ApiErrorResponse } from "~/types/validation";

/**
 * Composable de gestion des clients - Version complète
 */
export const useCustomers = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // État partagé
  const customers = useState<Customer[]>("customers", () => []);
  const loading = useState<boolean>("customers:loading", () => false);
  const pagination = useState("customers:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
  }));
  const filters = useState("customers:filters", () => ({
    search: "",
    status: "all",
    withTrashed: false,
    onlyTrashed: false,
  }));
  const { invalidateStatsCache } = useDashboard();

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

  /**
   * Récupère la liste des clients
   */
  async function fetchCustomers() {
    loading.value = true;

    try {
      const params: Record<string, string | number | boolean | undefined> = {
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        search: filters.value.search || undefined,
        status:
          filters.value.status !== "all" ? filters.value.status : undefined,
      };

      if (filters.value.withTrashed) params.with_trashed = true;
      if (filters.value.onlyTrashed) params.only_trashed = true;

      const response = await client<ApiResponse<LaravelPaginator<Customer>>>(
        "/api/v1/admin/customers",
        { method: "GET", params }
      );

      if (response.success) {
        customers.value = response.data.data;
        pagination.value.total = response.data.total;
      }
    } catch (_error: unknown) {

      const message = getErrorMessage(_error)

      toast.add({
        title: 'Erreur',
        description: message || 'Erreur lors du chargement de la liste des clients',
        color: 'error',
        duration: 6000
      })

      customers.value = [];
      pagination.value.total = 0;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Récupère un client par son ID
   */
  async function fetchCustomer(id: string): Promise<Customer | null> {
    try {
      const response = await client<ApiResponse<Customer>>(
        `/api/v1/admin/customers/${id}`
      );
      return response.success ? response.data : null;
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error);

      toast.add({
        title: "Erreur",
        description: errorMessage || "Impossible de charger le client",
        color: "error",
      });
      return null;
    }
  }

  /**
   * Crée un nouveau client
   */
  async function createCustomer(data: Partial<Customer>): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Customer>>(
        "/api/v1/admin/customers",
        { method: "POST", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Client créé",
          description: response.message,
          color: "success",
          icon: "i-lucide-check-circle",
        });
        invalidateStatsCache(); // ✅ Invalide le cache
        await fetchCustomers();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const errors = getValidationErrors(error);
      if (errors) {
        const errorMessages = Object.values(errors).flat().join("\n");
        toast.add({
          title: "Erreur de validation",
          description: errorMessages,
          color: "error",
          duration: 5000,
        });
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Met à jour un client
   */
  async function updateCustomer(
    id: string,
    data: Partial<Customer>
  ): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Customer>>(
        `/api/v1/admin/customers/${id}`,
        { method: "PUT", body: data }
      );

      if (response.success) {
        await fetchCustomers();
        return true;
      }
      return false;
    } catch (error: unknown) {
      const errors = getValidationErrors(error);
      if (errors) {
        const errorMessages = Object.values(errors).flat().join("\n");
        toast.add({
          title: "Erreur de validation",
          description: errorMessages,
          color: "error",
        });
      }
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Change le statut d'un client
   */
  async function updateStatus(
    id: string,
    action: "activate" | "deactivate" | "suspend"
  ): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Customer>>(
        `/api/v1/admin/customers/${id}/${action}`,
        { method: "PATCH" }
      );

      if (response.success) {
        await fetchCustomers();
        return true;
      }
      return false;
    } catch (_error: unknown) {
      const message = getErrorMessage(_error);

        toast.add({
          title: "Erreur",
          description:
            message || "Erreur lors de la mis à jour du status",
          color: "error",
          duration: 6000,
        });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Supprime (soft delete) un ou plusieurs clients
   */
  async function deleteCustomers(ids: string[]): Promise<boolean> {
    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/customers/${ids[0]}`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/customers/bulk/destroy",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        invalidateStatsCache();
        await fetchCustomers();
        return true;
      }
      return false;
    } catch (_error: unknown) {
      const message = getErrorMessage(_error);

      toast.add({
        title: "Erreur",
        description: message || "Erreur lors de la suppression",
        color: "error",
        duration: 6000,
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Restaure un ou plusieurs clients supprimés
   */
  async function restoreCustomers(ids: string[]): Promise<boolean> {
    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/customers/${ids[0]}/restore`,
          { method: "POST" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/customers/bulk/restore",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        toast.add({
          title: "Restauration réussie",
          description: response.message,
          color: "success",
        });
        invalidateStatsCache();
        await fetchCustomers();
        return true;
      }
      return false;
    } catch (_error: unknown) {
      const message = getErrorMessage(_error);

      toast.add({
        title: "Erreur",
        description:
          message || "Erreur lors de la restauration",
        color: "error",
        duration: 6000,
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Suppression définitive
   */
  async function forceDeleteCustomers(ids: string[]): Promise<boolean> {
    loading.value = true;

    try {
      let response: ApiResponse<null>;

      if (ids.length === 1) {
        response = await client<ApiResponse<null>>(
          `/api/v1/admin/customers/${ids[0]}/force`,
          { method: "DELETE" }
        );
      } else {
        response = await client<ApiResponse<null>>(
          "/api/v1/admin/customers/bulk/force-delete",
          { method: "POST", body: { ids } }
        );
      }

      if (response.success) {
        toast.add({
          title: "Suppression définitive",
          description: response.message,
          color: "success",
        });
        invalidateStatsCache();
        await fetchCustomers();
        return true;
      }
      return false;
    } catch (_error: unknown) {
      const message = getErrorMessage(_error);

      toast.add({
        title: "Erreur",
        description:
          message || "Erreur lors de la suppression definitive",
        color: "error",
        duration: 6000,
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // Type pour les données d'export
  interface ExportData {
    format: "xlsx" | "csv" | "pdf";
    status?: string;
    ids?: string[];
    search?: string;
  }

  /**
   * Export des clients (Excel / CSV / PDF)
   */
  async function exportCustomers(
    format: "xlsx" | "csv" | "pdf",
    selectedIds?: string[]
  ) {
    loading.value = true;

    try {
      const body: ExportData = {
        format,
        status:
          filters.value.status !== "all" ? filters.value.status : undefined,
      };

      if (selectedIds?.length) {
        body.ids = selectedIds;
      }

      if (filters.value.search) {
        body.search = filters.value.search;
      }

      // Récupération du fichier (BLOB)
      const response = await client.raw("/api/v1/admin/customers/export", {
        method: "POST",
        body,
        responseType: "blob",
      });

      const blob = response._data as Blob;

      // ⬇️ Téléchargement du fichier
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `customers_${
        new Date().toISOString().split("T")[0]
      }.${format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.add({
        title: "Export réussi",
        description: `Fichier ${format.toUpperCase()} téléchargé`,
        color: "success",
        icon: "i-lucide-download",
      });
    } catch (_error: unknown) {
      console.error(_error);

      toast.add({
        title: "Erreur d'export",
        description: "Impossible de générer le fichier",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loading.value = false;
    }
  }

  /**
   * Récupère les statistiques
   */
  async function fetchStatistics() {
    try {
      const response = await client<
        ApiResponse<{
          total: number;
          active: number;
          inactive: number;
          suspended: number;
          trashed: number;
          verified: number;
          with_oauth: number;
        }>
      >("/api/v1/admin/customers/statistics");

      return response.success ? response.data : null;
    } catch (_error: unknown) {
      const message = getErrorMessage(_error);

      toast.add({
        title: "Erreur",
        description:
          message || "Erreur lors du chargement des stats",
        color: "error",
        duration: 6000,
      });
      return null;
    }
  }

  // Helpers de pagination et filtres
  function setPage(pageIndex: number) {
    pagination.value.pageIndex = pageIndex;
    fetchCustomers();
  }

  function setSearch(search: string) {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchCustomers();
  }

  function setStatus(status: string) {
    filters.value.status = status;
    pagination.value.pageIndex = 0;
    fetchCustomers();
  }

  function setTrashedFilter(withTrashed: boolean, onlyTrashed: boolean) {
    filters.value.withTrashed = withTrashed;
    filters.value.onlyTrashed = onlyTrashed;
    pagination.value.pageIndex = 0;
    fetchCustomers();
  }

  function resetFilters() {
    filters.value = {
      search: "",
      status: "all",
      withTrashed: false,
      onlyTrashed: false,
    };
    pagination.value.pageIndex = 0;
    fetchCustomers();
  }

  return {
    // État
    customers: readonly(customers),
    loading: readonly(loading),
    pagination: readonly(pagination),
    filters: readonly(filters),

    // Actions CRUD
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomers,

    // Actions avancées
    updateStatus,
    restoreCustomers,
    forceDeleteCustomers,
    exportCustomers,
    fetchStatistics,

    // Helpers
    setPage,
    setSearch,
    setStatus,
    setTrashedFilter,
    resetFilters,
  };
};
