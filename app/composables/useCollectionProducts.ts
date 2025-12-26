import type { Product } from "~/types/product";
import type { ApiResponse } from "~/types/collection";

export const useCollectionProducts = () => {
  const client = useSanctumClient();
  const toast = useToast();

  /**
   * Ajouter des produits à une collection
   */
  async function addProducts(
    collectionId: string,
    productIds: string[]
  ): Promise<boolean> {
    try {
      const response = await client<ApiResponse<any>>(
        `/api/v1/admin/collections/${collectionId}/products/add`,
        {
          method: "POST",
          body: { product_ids: productIds },
        }
      );

      if (response.success) {
        toast.add({
          title: "Succès",
          description: response.message,
          color: "success",
          icon: "i-lucide-check-circle",
        });
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter les produits",
        color: "error",
        icon: "i-lucide-alert-triangle",
      });
      return false;
    }
  }

  /**
   * Retirer des produits d'une collection
   */
  async function removeProducts(
    collectionId: string,
    productIds: string[]
  ): Promise<boolean> {
    try {
      const response = await client<ApiResponse<any>>(
        `/api/v1/admin/collections/${collectionId}/products/remove`,
        {
          method: "POST",
          body: { product_ids: productIds },
        }
      );

      if (response.success) {
        toast.add({
          title: "Succès",
          description: response.message,
          color: "success",
          icon: "i-lucide-check-circle",
        });
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.message || "Impossible de retirer les produits",
        color: "error",
        icon: "i-lucide-alert-triangle",
      });
      return false;
    }
  }

  /**
   * Synchroniser les produits d'une collection
   */
  async function syncProducts(
    collectionId: string,
    productIds: string[]
  ): Promise<boolean> {
    try {
      const response = await client<ApiResponse<any>>(
        `/api/v1/admin/collections/${collectionId}/products/sync`,
        {
          method: "POST",
          body: { product_ids: productIds },
        }
      );

      if (response.success) {
        toast.add({
          title: "Succès",
          description: response.message,
          color: "success",
          icon: "i-lucide-check-circle",
        });
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.message || "Impossible de synchroniser les produits",
        color: "error",
        icon: "i-lucide-alert-triangle",
      });
      return false;
    }
  }

  /**
   * Obtenir les produits disponibles (sans collection)
   */
  async function getAvailableProducts(filters?: {
    search?: string;
    brand_id?: string;
    category_id?: string;
  }): Promise<Product[]> {
    try {
      const params: Record<string, any> = {};

      if (filters?.search) params.search = filters.search;
      if (filters?.brand_id) params.brand_id = filters.brand_id;
      if (filters?.category_id) params.category_id = filters.category_id;

      const response = await client<ApiResponse<Product[]>>(
        "/api/v1/admin/collections/products/available",
        { method: "GET", params }
      );

      return response.success ? response.data : [];
    } catch (error: any) {
      console.error("Error fetching available products:", error);
      return [];
    }
  }

  /**
   * Déplacer des produits vers une collection (bulk)
   */
  async function bulkMoveProducts(
    productIds: string[],
    collectionId: string | null
  ): Promise<boolean> {
    try {
      const response = await client<ApiResponse<any>>(
        "/api/v1/admin/collections/products/bulk-move",
        {
          method: "POST",
          body: {
            product_ids: productIds,
            collection_id: collectionId,
          },
        }
      );

      if (response.success) {
        toast.add({
          title: "Succès",
          description: response.message,
          color: "success",
          icon: "i-lucide-check-circle",
        });
        return true;
      }

      return false;
    } catch (error: any) {
      toast.add({
        title: "Erreur",
        description: error.message || "Impossible de déplacer les produits",
        color: "error",
        icon: "i-lucide-alert-triangle",
      });
      return false;
    }
  }

  /**
   * Obtenir les statistiques des produits d'une collection
   */
  async function getProductsStatistics(
    collectionId: string
  ): Promise<any | null> {
    try {
      const response = await client<ApiResponse<any>>(
        `/api/v1/admin/collections/${collectionId}/products/statistics`,
        { method: "GET" }
      );

      return response.success ? response.data : null;
    } catch (error: any) {
      console.error("Error fetching products statistics:", error);
      return null;
    }
  }

  return {
    addProducts,
    removeProducts,
    syncProducts,
    getAvailableProducts,
    bulkMoveProducts,
    getProductsStatistics,
  };
};
