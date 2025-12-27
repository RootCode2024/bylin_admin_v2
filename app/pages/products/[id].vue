<script setup lang="ts">
import type { ProductFormData } from '~/types/product'

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

// ✅ Modal de suppression
const deleteModal = ref({
  open: false,
  ids: [] as string[]
})

// ✅ Flag pour désactiver temporairement les watchers
const skipWatchers = ref(false)

const product = computed(() => state.value.currentProduct)

async function loadProduct() {
  const data = await fetchProduct(productId)

  if (!data) {
    toast.add({ title: 'Erreur', description: 'Produit introuvable', color: 'error' })
    router.push('/products')
    return
  }

  // ✅ Désactiver les watchers pendant l'initialisation
  skipWatchers.value = true

  // Initialiser le store avec les données du produit
  productFormStore.initializeFromProduct(data)

  // ✅ Réactiver les watchers après l'initialisation (nextTick)
  await nextTick()
  hasUnsavedChanges.value = false
  skipWatchers.value = false
}

async function handleSave() {
  isSaving.value = true

  try {
    const newImageFiles = productFormStore.images
      .filter(img => img.isNew && img.file)
      .map(img => img.file)

    // Préparer les données similaires à la création
    const dataToSend: any = {
      ...productFormStore.formData,
      images: newImageFiles,
      images_to_delete: productFormStore.imagesToDelete,
      // S'assurer des valeurs minimales
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

    // Préparer les variations si produit variable
    if (dataToSend.is_variable && dataToSend.variations.length > 0) {
      dataToSend.variations = dataToSend.variations.map((variation: any) => {
        const cleanVariation = {
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
      })
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

      // ✅ Recharger le produit pour synchroniser les données
      await loadProduct()
    }
  } catch (error: any) {
    console.error('Erreur de sauvegarde:', error)

    if (error.response?.data?.errors) {
      logValidationErrors(error.response.data.errors)

      const errors = error.response.data.errors
      Object.keys(errors).forEach(field => {
        toast.add({
          title: `Erreur: ${formatFieldName(field)}`,
          description: Array.isArray(errors[field]) ? errors[field][0] : errors[field],
          color: 'error',
          duration: 5000
        })
      })
    } else {
      toast.add({
        title: 'Erreur de sauvegarde',
        description: error.message || 'Une erreur est survenue',
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
    <ProductForm v-if="product" :product="product" :is-saving="isSaving"
      :has-unsaved-changes="hasUnsavedChanges" mode="edit" @save="handleSave" @duplicate="handleDuplicate"
      @delete="handleDelete" @cancel="router.push('/products')" />

    <div v-else-if="isLoading" class="p-8">
      <USkeleton class="h-8 w-64 mb-4" />
      <USkeleton class="h-32 w-full" />
    </div>

    <ClientOnly>
      <ProductDeleteModal v-model:open="deleteModal.open" :ids="deleteModal.ids" @success="handleDeleteSuccess" />
    </ClientOnly>
  </div>
</template>
