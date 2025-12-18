import type { Customer, LaravelPaginator, ApiResponse } from "~/types/customer";

/**
 * Composable de gestion des clients
 */
export const useCustomers = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // État partagé entre composants
  const customers = useState<Customer[]>("customers", () => []);
  const loading = useState<boolean>("customers:loading", () => false);
  const pagination = useState("customers:pagination", () => ({
    pageIndex: 0,
    pageSize: 10,
    total: 0,
  }));
  const filters = useState("customers:filters", () => ({
    search: "",
    status: "all",
  }));

  /**
   * Récupère la liste des clients
   */
  async function fetchCustomers() {
    loading.value = true;

    try {
      const params = {
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        search: filters.value.search || undefined,
        status:
          filters.value.status !== "all" ? filters.value.status : undefined,
      };

      const response = await client<ApiResponse<LaravelPaginator<Customer>>>(
        "/api/v1/admin/customers",
        { method: "GET", params }
      );

      if (response.success) {
        customers.value = response.data.data;
        pagination.value.total = response.data.total;
      }
    } catch (error: any) {
      // Erreur déjà gérée par le plugin api.client.ts
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
    loading.value = true;

    try {
      const response = await client<ApiResponse<Customer>>(
        `/api/v1/admin/customers/${id}`
      );

      if (response.success) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      const message =
        error.response?._data?.message || "Impossible de charger le client";

      toast.add({
        title: "Erreur",
        description: message,
        color: "error",
      });

      return null;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Crée un nouveau client
   */
  async function createCustomer(data: {
    first_name: string;
    last_name: string;
    email: string;
  }): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Customer>>(
        "/api/v1/admin/customers",
        {
          method: "POST",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Client créé",
          description: response.message,
          color: "success",
        });

        await fetchCustomers();
        return true;
      }

      return false;
    } catch (error: any) {
      // Gestion des erreurs de validation Laravel
      const errors = error.response?._data?.errors;

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
        {
          method: "PUT",
          body: data,
        }
      );

      if (response.success) {
        toast.add({
          title: "Client mis à jour",
          description: response.message,
          color: "success",
        });

        await fetchCustomers();
        return true;
      }

      return false;
    } catch (error: any) {
      const errors = error.response?._data?.errors;

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
   * Supprime un ou plusieurs clients
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
          "/api/v1/admin/customers/bulk",
          {
            method: "POST",
            body: { ids },
          }
        );
      }

      if (response.success) {
        toast.add({
          title: "Suppression réussie",
          description: `${ids.length} client(s) supprimé(s)`,
          color: "success",
        });

        await fetchCustomers();
        return true;
      }

      return false;
    } catch (error) {
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * change de page
   */
  function setPage(pageIndex: number) {
    pagination.value.pageIndex = pageIndex;
    fetchCustomers();
  }

  /**
   * Met à jour la recherche
   */
  function setSearch(search: string) {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchCustomers();
  }

  /**
   * Met à jour le filtre de statut
   */
  function setStatus(status: string) {
    filters.value.status = status;
    pagination.value.pageIndex = 0;
    fetchCustomers();
  }

  /**
   * Réinitialise les filtres
   */
  function resetFilters() {
    filters.value = { search: "", status: "all" };
    pagination.value.pageIndex = 0;
    fetchCustomers();
  }

  return {
    // État (readonly pour éviter les mutations directes)
    customers: readonly(customers),
    loading: readonly(loading),
    pagination: readonly(pagination),
    filters: readonly(filters),

    // Actions
    fetchCustomers,
    fetchCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomers,

    // Helpers
    setPage,
    setSearch,
    setStatus,
    resetFilters,
  };
};
