import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { ProductFormData } from "~/types/product";

export const useProductFormStore = defineStore("productForm", () => {
  // État principal du formulaire
  const formData = ref<ProductFormData>({
    brand_id: "",
    categories: [],
    name: "",
    slug: "",
    sku: "",
    description: "",
    short_description: "",
    price: 0,
    compare_price: undefined,
    cost_price: undefined,
    status: "draft",
    is_featured: false,
    is_new: false,
    is_on_sale: false,
    track_inventory: true,
    stock_quantity: 0,
    low_stock_threshold: 5,
    barcode: "",
    requires_authenticity: false,
    authenticity_codes_count: 0,
    is_preorder_enabled: false,
    preorder_available_date: undefined,
    preorder_limit: undefined,
    preorder_message: "",
    preorder_terms: "",
    meta_title: "",
    meta_description: "",
    is_variable: false,
    variations: [],
    images: [],
    images_to_delete: [],
  });

  // État des images
  const images = ref<any[]>([]);
  const imagesToDelete = ref<number[]>([]);

  // État pour la gestion des variations
  const variationsState = ref<{
    activeAttributeIds: string[];
    initialized: boolean;
  }>({
    activeAttributeIds: [],
    initialized: false,
  });

  // Getters
  const activeAttributeIds = computed(
    () => variationsState.value.activeAttributeIds
  );
  const isVariationsInitialized = computed(
    () => variationsState.value.initialized
  );

  // Actions
  const setFormData = (data: Partial<ProductFormData>) => {
    formData.value = { ...formData.value, ...data };
  };

  const resetFormData = () => {
    formData.value = {
      brand_id: "",
      categories: [],
      name: "",
      slug: "",
      sku: "",
      description: "",
      short_description: "",
      price: 0,
      compare_price: undefined,
      cost_price: undefined,
      status: "draft",
      is_featured: false,
      is_new: false,
      is_on_sale: false,
      track_inventory: true,
      stock_quantity: 0,
      low_stock_threshold: 5,
      barcode: "",
      requires_authenticity: false,
      authenticity_codes_count: 0,
      is_preorder_enabled: false,
      preorder_available_date: undefined,
      preorder_limit: undefined,
      preorder_message: "",
      preorder_terms: "",
      meta_title: "",
      meta_description: "",
      is_variable: false,
      variations: [],
      images: [],
      images_to_delete: [],
    };
    images.value = [];
    imagesToDelete.value = [];
    variationsState.value = {
      activeAttributeIds: [],
      initialized: false,
    };
  };

  const setActiveAttributeIds = (ids: string[], persist = true) => {
    variationsState.value.activeAttributeIds = ids;
    if (persist) {
      variationsState.value.initialized = true;
    }
  };

  const initializeFromProduct = (product: any) => {
    if (!product) return;

    formData.value = {
      ...formData.value,
      brand_id: product.brand_id,
      categories: product.categories?.map((c: any) => c.id) || [],
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description || "",
      short_description: product.short_description || "",
      price: product.price,
      compare_price: product.compare_price,
      cost_price: product.cost_price,
      status: product.status,
      is_featured: product.is_featured,
      is_new: product.is_new,
      is_on_sale: product.is_on_sale,
      track_inventory: product.track_inventory,
      stock_quantity: product.stock_quantity,
      low_stock_threshold: product.low_stock_threshold,
      barcode: product.barcode || "",
      requires_authenticity: product.requires_authenticity,
      authenticity_codes_count: product.authenticity_codes_count,
      is_preorder_enabled: product.is_preorder_enabled,
      preorder_available_date: product.preorder_available_date,
      preorder_limit: product.preorder_limit,
      preorder_message: product.preorder_message || "",
      preorder_terms: product.preorder_terms || "",
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      is_variable: product.is_variable,
      variations: product.variations || [],
    };

    images.value =
      product.media?.map((m: any) => ({
        id: m.id,
        url: m.original_url,
        isNew: false,
      })) || [];

    // Initialiser les attributs actifs depuis les variations existantes
    if (product.is_variable && product.variations?.length > 0) {
      const usedIds = new Set<string>();
      product.variations.forEach((v: any) => {
        if (v.attributes) {
          Object.keys(v.attributes).forEach((key) => usedIds.add(key));
        }
      });

      if (usedIds.size > 0) {
        setActiveAttributeIds(Array.from(usedIds), true);
      }
    }
  };

  return {
    // État
    formData,
    images,
    imagesToDelete,

    // Getters
    activeAttributeIds,
    isVariationsInitialized,

    // Actions
    setFormData,
    resetFormData,
    setActiveAttributeIds,
    initializeFromProduct,
  };
});
