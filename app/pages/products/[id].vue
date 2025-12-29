<script setup lang="ts">
import type { ProductFormData, VariationFormData } from '~/types/product'

definePageMeta({
  layout: 'default',
  title: 'Modifier le produit'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const productFormStore = useProductFormStore()
const { logValidationErrors, formatFieldName } = useValidationLogger()

const {
  state,
  isLoading,
  fetchProduct,
  updateProduct,
  duplicateProduct
} = useProduct()

const productId = route.params.id as string
const isSaving = ref(false)
const hasUnsavedChanges = ref(false)

const deleteModal = ref({
  open: false,
  ids: [] as string[]
})

const skipWatchers = ref(false)

const product = computed(() => {
  const currentProduct = state.value.currentProduct
  if (!currentProduct) return null

  return {
    ...currentProduct,
    description: currentProduct.description ?? undefined,
    short_description: currentProduct.short_description ?? undefined,
    compare_price: currentProduct.compare_price ?? undefined,
    cost_price: currentProduct.cost_price ?? undefined,
    barcode: currentProduct.barcode ?? undefined,
    weight: currentProduct.weight ?? undefined,
    dimensions: currentProduct.dimensions ?? undefined,
    preorder_available_date: currentProduct.preorder_available_date ?? undefined,
    preorder_limit: currentProduct.preorder_limit ?? undefined,
    preorder_message: currentProduct.preorder_message ?? undefined,
    preorder_terms: currentProduct.preorder_terms ?? undefined,
    preorder_enabled_at: currentProduct.preorder_enabled_at ?? undefined,
    meta_title: currentProduct.meta_title ?? undefined,
    meta_description: currentProduct.meta_description ?? undefined,
    meta_data: currentProduct.meta_data ?? undefined,
    deleted_at: currentProduct.deleted_at ?? undefined
  }
})

async function loadProduct() {
  const data = await fetchProduct(productId)

  if (!data) {
    toast.add({ title: 'Erreur', description: 'Produit introuvable', color: 'error' })
    router.push('/products')
    return
  }

  skipWatchers.value = true

  // Initialiser le store avec les données du produit
  productFormStore.initializeFromProduct(data)

  await nextTick()
  hasUnsavedChanges.value = false
  skipWatchers.value = false
}

async function handleSave() {
  isSaving.value = true

  try {
    const newImageFiles: File[] = productFormStore.images
      .map(img => img.file)
      .filter((file): file is File => !!file)

    const dataToSend: Partial<ProductFormData> = {
      ...productFormStore.formData,
      images: newImageFiles,
      images_to_delete: productFormStore.imagesToDelete,
      price: Math.max(0.01, productFormStore.formData.price || 0),
      stock_quantity: Math.max(0, productFormStore.formData.stock_quantity || 0),
      low_stock_threshold: Math.max(0, productFormStore.formData.low_stock_threshold || 0)
    }

    // Nettoyer les champs optionnels
    if (!dataToSend.compare_price || dataToSend.compare_price <= 0) {
      delete dataToSend.compare_price
    }

    if (!dataToSend.cost_price || dataToSend.cost_price <= 0) {
      delete dataToSend.cost_price
    }

    if (!dataToSend.preorder_limit || dataToSend.preorder_limit <= 0) {
      delete dataToSend.preorder_limit
    }

    if (dataToSend.is_variable && dataToSend.variations &&dataToSend.variations.length > 0) {
      dataToSend.variations = dataToSend.variations.map(
        (variation: VariationFormData) => {
          const cleanVariation: VariationFormData = {
            ...variation,
            variation_name: variation.variation_name || 'Nouvelle variation',
            price: Math.max(0.01, variation.price || 0),
            stock_quantity: Math.max(0, variation.stock_quantity || 0),
            stock_status: variation.stock_status || (variation.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'),
            is_active: variation.is_active !== false,
            attributes: variation.attributes || {}
          }

          // Nettoyer
          if (!cleanVariation.compare_price || cleanVariation.compare_price <= 0) delete cleanVariation.compare_price
          if (!cleanVariation.cost_price || cleanVariation.cost_price <= 0) delete cleanVariation.cost_price
          if (!cleanVariation.sku) delete cleanVariation.sku
          if (!cleanVariation.barcode) delete cleanVariation.barcode

          return cleanVariation
        }
      )
    } else {
      dataToSend.variations = []
    }

    // Authentification Bylin
    if (dataToSend.requires_authenticity) {
      dataToSend.authenticity_codes_count = Math.max(1, dataToSend.authenticity_codes_count || 10)
    } else {
      delete dataToSend.authenticity_codes_count
    }

    const updated = await updateProduct(productId, dataToSend)

    if (updated) {
      toast.add({ title: 'Produit mis à jour', color: 'success' })

      await loadProduct()
    }
  } catch (error: unknown) {
    console.error('Erreur de sauvegarde:', error)

    const validationErrors =
      typeof error === "object" && error !== null && "response" in error && (error as any).response?._data?.errors
        ? (error as any).response._data.errors as Record<string, string[]>
        : null

    if (validationErrors) {
      logValidationErrors(validationErrors)

      Object.keys(validationErrors).forEach(field => {
        const messages = validationErrors[field]
        toast.add({
          title: `Erreur: ${formatFieldName(field)}`,
          description: Array.isArray(messages) ? messages[0] : messages,
          color: 'error',
          duration: 5000
        })
      })
    } else {
      const message = error instanceof Error ? error.message : 'Une erreur est survenue'
      toast.add({
        title: 'Erreur de sauvegarde',
        description: message,
        color: 'error'
      })
    }
  } finally {
    isSaving.value = false
  }
}

async function handleDuplicate() {
  const newProduct = await duplicateProduct(productId)
  if (newProduct) {
    toast.add({ title: 'Produit dupliqué', color: 'success' })
    setTimeout(() => router.push(`/products/${newProduct.id}`), 1000)
  }
}

function handleDelete() {
  deleteModal.value = {
    open: true,
    ids: [productId]
  }
}

function handleDeleteSuccess() {
  toast.add({ title: 'Produit supprimé', color: 'success' })
  router.push('/products')
}

watch(() => productFormStore.formData, () => {
  if (!skipWatchers.value) {
    hasUnsavedChanges.value = true
  }
}, { deep: true })

watch(() => productFormStore.images, () => {
  if (!skipWatchers.value) {
    hasUnsavedChanges.value = true
  }
}, { deep: true })

onMounted(loadProduct)

onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value && !confirm('Modifications non sauvegardées. Quitter ?')) {
    next(false)
  } else {
    next()
  }
})
</script>

<template>
  <div class="w-full">
    <ProductForm
      v-if="product"
      :product="product"
      :is-saving="isSaving"
      :has-unsaved-changes="hasUnsavedChanges"
      mode="edit"
      @save="handleSave"
      @duplicate="handleDuplicate"
      @delete="handleDelete"
      @cancel="router.push('/products')" />

    <div v-else-if="isLoading" class="p-8">
      <USkeleton class="h-8 w-64 mb-4" />
      <USkeleton class="h-32 w-full" />
    </div>

    <ClientOnly>
      <ProductDeleteModal v-model:open="deleteModal.open" :ids="deleteModal.ids" @success="handleDeleteSuccess" />
    </ClientOnly>
  </div>
</template>
