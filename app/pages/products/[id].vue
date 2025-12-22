<script setup lang="ts">
import type { Product, ProductFormData, VariationFormData } from '~/types/product'

definePageMeta({
  layout: 'default',
  title: 'Modifier le produit',
  description: 'Modifier les détails du produit'
})

// ========================================
// Types locaux
// ========================================
interface ImageData {
  id?: number
  url: string
  file?: File
  isNew: boolean
}

// ========================================
// Composables & Router
// ========================================
const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
  state,
  isLoading,
  fetchProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  togglePreorder,
  duplicateProduct
} = useProduct()

// ========================================
// État Local
// ========================================
const productId = route.params.id as string
const isDeleting = ref(false)
const isSaving = ref(false)
const activeTab = ref('general')
const hasUnsavedChanges = ref(false)
const isInitialLoad = ref(true) // ✅ NOUVEAU: Flag pour ignorer les premiers watchers

// Form data
const form = ref<ProductFormData>({
  brand_id: undefined,
  categories: [],
  name: '',
  slug: '',
  sku: '',
  description: '',
  short_description: '',
  price: 0,
  compare_price: undefined,
  cost_price: undefined,
  status: 'draft',
  is_featured: false,
  is_new: false,
  is_on_sale: false,
  track_inventory: true,
  stock_quantity: 0,
  low_stock_threshold: 5,
  barcode: '',
  requires_authenticity: false,
  authenticity_codes_count: 0,
  is_preorder_enabled: false,
  preorder_available_date: undefined,
  preorder_limit: undefined,
  preorder_message: '',
  preorder_terms: '',
  meta_title: '',
  meta_description: '',
  is_variable: false,
  variations: [],
  images: [],
  images_to_delete: []
})

// Gestion unifiée des images
const images = ref<ImageData[]>([])
const imagesToDelete = ref<number[]>([])

// Stock adjustment (action immédiate, séparée du form)
const stockAdjustment = ref({
  operation: 'set' as 'set' | 'add' | 'sub',
  quantity: 0
})

// ========================================
// Computed
// ========================================
const product = computed(() => state.value.currentProduct)

const tabs = computed(() => [
  { key: 'general', label: 'Informations générales', slot: 'general' },
  { key: 'pricing', label: 'Prix & Stock', slot: 'pricing' },
  {
    key: 'media',
    label: 'Images',
    slot: 'media',
    badge: images.value.length || undefined
  },
  {
    key: 'variations',
    label: 'Variations',
    slot: 'variations',
    badge: form.value.variations.length || undefined,
    disabled: !form.value.is_variable
  },
  { key: 'seo', label: 'SEO', slot: 'seo' },
  { key: 'advanced', label: 'Avancé', slot: 'advanced' }
])

const statusOptions = [
  { label: 'Brouillon', value: 'draft', color: 'neutral' },
  { label: 'Actif', value: 'active', color: 'success' },
  { label: 'Inactif', value: 'inactive', color: 'error' },
  { label: 'Rupture', value: 'out_of_stock', color: 'warning' },
  { label: 'Précommande', value: 'preorder', color: 'info' },
  { label: 'Arrêté', value: 'discontinued', color: 'neutral' }
]

// Validation du formulaire
const formErrors = computed(() => {
  const errors: string[] = []

  if (!form.value.name?.trim()) {
    errors.push('Le nom du produit est requis')
  }

  if (form.value.price <= 0) {
    errors.push('Le prix doit être supérieur à 0')
  }

  if (form.value.compare_price && form.value.compare_price <= form.value.price) {
    errors.push('Le prix de comparaison doit être supérieur au prix de vente')
  }

  if (form.value.track_inventory && form.value.stock_quantity < 0) {
    errors.push('Le stock ne peut pas être négatif')
  }

  if (form.value.is_variable && form.value.variations.length === 0) {
    errors.push('Un produit variable doit avoir au moins une variation')
  }

  // Validation des variations
  if (form.value.is_variable) {
    form.value.variations.forEach((v, idx) => {
      if (!v.variation_name?.trim()) {
        errors.push(`Variation ${idx + 1}: Le nom est requis`)
      }
      if (v.price <= 0) {
        errors.push(`Variation ${idx + 1}: Le prix doit être supérieur à 0`)
      }
    })
  }

  return errors
})

const isFormValid = computed(() => formErrors.value.length === 0)

// ========================================
// Methods - Chargement
// ========================================

/**
 * Charge le produit depuis l'API
 */
async function loadProduct() {
  const data = await fetchProduct(productId)

  if (!data) {
    toast.add({
      title: 'Erreur',
      description: 'Produit introuvable',
      color: 'error'
    })
    router.push('/products')
    return
  }

  // ✅ CORRECTION: Désactiver temporairement les watchers
  isInitialLoad.value = true

  // Populate form
  form.value = {
    brand_id: data.brand_id,
    categories: data.categories?.map(c => c.id) || [],
    name: data.name,
    slug: data.slug,
    sku: data.sku,
    description: data.description || '',
    short_description: data.short_description || '',
    price: data.price,
    compare_price: data.compare_price || undefined,
    cost_price: data.cost_price || undefined,
    status: data.status,
    is_featured: data.is_featured,
    is_new: data.is_new,
    is_on_sale: data.is_on_sale,
    track_inventory: data.track_inventory,
    stock_quantity: data.stock_quantity,
    low_stock_threshold: data.low_stock_threshold,
    barcode: data.barcode || '',
    requires_authenticity: data.requires_authenticity,
    authenticity_codes_count: data.authenticity_codes_count,
    is_preorder_enabled: data.is_preorder_enabled,
    preorder_available_date: data.preorder_available_date || undefined,
    preorder_limit: data.preorder_limit || undefined,
    preorder_message: data.preorder_message || '',
    preorder_terms: data.preorder_terms || '',
    meta_title: data.meta_title || '',
    meta_description: data.meta_description || '',
    is_variable: data.is_variable,
    variations: data.variations?.map(v => ({
      id: v.id,
      sku: v.sku,
      variation_name: v.variation_name,
      price: v.price,
      compare_price: v.compare_price || undefined,
      cost_price: v.cost_price || undefined,
      stock_quantity: v.stock_quantity,
      stock_status: v.stock_status,
      barcode: v.barcode || undefined,
      is_active: v.is_active,
      attributes: v.attributes
    })) || [],
    images: [],
    images_to_delete: []
  }

  // Charger les images existantes
  images.value = data.media?.map(m => ({
    id: m.id,
    url: m.original_url,
    isNew: false
  })) || []

  // ✅ CORRECTION: Réinitialiser les flags après un court délai
  await nextTick()
  setTimeout(() => {
    hasUnsavedChanges.value = false
    imagesToDelete.value = []
    isInitialLoad.value = false
  }, 100)
}

// ========================================
// Methods - Gestion des Images
// ========================================

/**
 * Gère l'upload de nouvelles images
 */
function handleImageUpload(files: File[]) {
  files.forEach(file => {
    // Vérifier la taille
    if (file.size > 5 * 1024 * 1024) {
      toast.add({
        title: 'Fichier trop volumineux',
        description: `${file.name} dépasse 5MB`,
        color: 'error'
      })
      return
    }

    const url = URL.createObjectURL(file)
    images.value.push({
      url,
      file,
      isNew: true
    })
  })

  // ✅ Ne marquer comme modifié que si ce n'est pas le chargement initial
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}

/**
 * Supprime une image
 */
function removeImage(index: number) {
  const img = images.value[index]

  // Si c'est une image existante, marquer pour suppression
  if (img && !img.isNew && img.id) {
    imagesToDelete.value.push(img.id)
  }

  // Retirer de la liste
  images.value.splice(index, 1)

  // ✅ Ne marquer comme modifié que si ce n'est pas le chargement initial
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}

/**
 * Réorganise les images (drag & drop)
 */
function reorderImages(oldIndex: number, newIndex: number) {
  const item = images.value[oldIndex]
  if (!item) return
  images.value.splice(oldIndex, 1)
  images.value.splice(newIndex, 0, item)

  // ✅ Ne marquer comme modifié que si ce n'est pas le chargement initial
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}

// ========================================
// Methods - Gestion des Variations
// ========================================

/**
 * Ajoute une nouvelle variation
 */
function addVariation() {
  form.value.variations.push({
    variation_name: '',
    price: form.value.price,
    compare_price: form.value.compare_price,
    cost_price: form.value.cost_price,
    stock_quantity: 0,
    stock_status: 'out_of_stock',
    is_active: true,
    attributes: {}
  })

  // ✅ Ne marquer comme modifié que si ce n'est pas le chargement initial
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}

/**
 * Supprime une variation
 */
function removeVariation(index: number) {
  const variation = form.value.variations[index]

  if (variation?.id) {
    if (!confirm('Supprimer cette variation ? Cette action est irréversible.')) {
      return
    }
  }

  form.value.variations.splice(index, 1)

  // ✅ Ne marquer comme modifié que si ce n'est pas le chargement initial
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}

/**
 * Duplique une variation
 */
function duplicateVariation(index: number) {
  const original = form.value.variations[index]
  if (!original) return

  form.value.variations.push({
    variation_name: `${original.variation_name} (copie)`,
    price: original.price,
    compare_price: original.compare_price,
    cost_price: original.cost_price,
    stock_quantity: original.stock_quantity,
    stock_status: original.stock_status,
    barcode: undefined,
    is_active: original.is_active,
    attributes: { ...original.attributes }
  })

  // ✅ Ne marquer comme modifié que si ce n'est pas le chargement initial
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}

// ========================================
// Methods - Sauvegarde & Actions
// ========================================

/**
 * Sauvegarde les modifications
 */
async function handleSave() {
  // Validation
  if (!isFormValid.value) {
    toast.add({
      title: 'Erreur de validation',
      description: formErrors.value[0],
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  isSaving.value = true

  try {
    // Préparer les nouvelles images
    const newImageFiles = images.value
      .filter(img => img.isNew && img.file)
      .map(img => img.file!)

    // Copier form.value et retirer les champs auto-générés
    const { slug, sku, barcode, ...dataToSend } = form.value

    const formData: Partial<ProductFormData> = {
      ...dataToSend,
      images: newImageFiles,
      images_to_delete: imagesToDelete.value
    }

    const updated = await updateProduct(productId, formData)

    if (updated) {
      toast.add({
        title: 'Produit mis à jour',
        description: 'Toutes les modifications ont été sauvegardées',
        color: 'success',
        icon: 'i-lucide-check-circle'
      })

      // ✅ CORRECTION: Recharger et réinitialiser les flags
      await loadProduct()
    } else {
      throw new Error('Échec de la mise à jour')
    }
  } catch (error) {
    console.error('Save error:', error)
    toast.add({
      title: 'Erreur de sauvegarde',
      description: error instanceof Error ? error.message : 'Impossible de sauvegarder le produit',
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  } finally {
    isSaving.value = false
  }
}

/**
 * Duplique le produit
 */
async function handleDuplicate() {
  try {
    const newProduct = await duplicateProduct(productId)

    if (newProduct) {
      toast.add({
        title: 'Produit dupliqué',
        description: 'Redirection vers le nouveau produit...',
        color: 'success',
        icon: 'i-lucide-copy'
      })

      setTimeout(() => {
        router.push(`/products/${newProduct.id}/edit`)
      }, 1000)
    }
  } catch (error) {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de dupliquer le produit',
      color: 'error'
    })
  }
}

/**
 * Supprime le produit
 */
async function handleDelete() {
  if (!confirm('⚠️ Êtes-vous sûr de vouloir supprimer ce produit ?\n\nCette action est irréversible et supprimera :\n- Le produit\n- Toutes ses variations\n- Toutes ses images\n- Tout son historique')) {
    return
  }

  isDeleting.value = true

  try {
    const success = await deleteProduct(productId)

    if (success) {
      toast.add({
        title: 'Produit supprimé',
        description: 'Le produit a été supprimé définitivement',
        color: 'success'
      })

      router.push('/products')
    }
  } catch (error) {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de supprimer le produit',
      color: 'error'
    })
  } finally {
    isDeleting.value = false
  }
}

/**
 * Ajuste le stock (action immédiate)
 */
async function handleStockUpdate() {
  if (stockAdjustment.value.quantity === 0) {
    toast.add({
      title: 'Quantité requise',
      description: 'Veuillez entrer une quantité',
      color: 'warning'
    })
    return
  }

  try {
    const success = await updateStock(
      productId,
      stockAdjustment.value.quantity,
      stockAdjustment.value.operation
    )

    if (success) {
      stockAdjustment.value.quantity = 0

      toast.add({
        title: 'Stock mis à jour',
        color: 'success',
        icon: 'i-lucide-check'
      })

      // Recharger pour synchroniser
      await loadProduct()
    }
  } catch (error) {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de mettre à jour le stock',
      color: 'error'
    })
  }
}

/**
 * Active/désactive la précommande
 */
async function handleTogglePreorder() {
  const enable = !form.value.is_preorder_enabled

  try {
    const success = await togglePreorder(
      productId,
      enable,
      enable ? {
        available_date: form.value.preorder_available_date || '',
        limit: form.value.preorder_limit,
        message: form.value.preorder_message || ''
      } : undefined
    )

    if (success) {
      form.value.is_preorder_enabled = enable

      toast.add({
        title: enable ? 'Précommande activée' : 'Précommande désactivée',
        color: 'success'
      })

      await loadProduct()
    }
  } catch (error) {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de modifier la précommande',
      color: 'error'
    })
  }
}

// ========================================
// Methods - Utilitaires
// ========================================

/**
 * Génère un slug depuis le nom
 */
function generateSlug() {
  if (!form.value.name) return

  form.value.slug = form.value.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Formatte un nombre en CFA
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(value)
}

/**
 * Helper pour déterminer le statut du stock
 */
function updateStockStatus(variation: VariationFormData) {
  variation.stock_status = variation.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'
}

// ========================================
// Watchers
// ========================================

// ✅ CORRECTION: Watcher avec condition sur isInitialLoad
watch(() => form.value, () => {
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}, { deep: true })

// ✅ CORRECTION: Watcher avec condition sur isInitialLoad
watch(() => images.value, () => {
  if (!isInitialLoad.value) {
    hasUnsavedChanges.value = true
  }
}, { deep: true })

// Watcher pour mettre à jour stock_status automatiquement
watch(() => form.value.variations, (variations) => {
  variations.forEach(v => {
    if (v.stock_quantity !== undefined) {
      updateStockStatus(v)
    }
  })
}, { deep: true })

// ========================================
// Lifecycle
// ========================================
onMounted(() => {
  loadProduct()
})

// Prévention de la perte de données
onBeforeRouteLeave((to, from, next) => {
  if (hasUnsavedChanges.value) {
    const answer = window.confirm(
      '⚠️ Vous avez des modifications non sauvegardées.\n\nVoulez-vous vraiment quitter sans sauvegarder ?'
    )
    if (answer) {
      next()
    } else {
      next(false)
    }
  } else {
    next()
  }
})

// Cleanup des URLs d'objets créées
onBeforeUnmount(() => {
  images.value.forEach(img => {
    if (img.isNew && img.url.startsWith('blob:')) {
      URL.revokeObjectURL(img.url)
    }
  })
})
</script>

<template>
  <UDashboardPanel>
    <!-- Header -->
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UButton icon="i-lucide-arrow-left" color="neutral" variant="ghost" to="/products" />
          <div class="ml-4">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ product?.name || 'Chargement...' }}
            </h1>
            <p class="text-sm text-gray-500">
              SKU: {{ product?.sku }}
            </p>
          </div>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <!-- Indicateur de changements non sauvegardés -->
            <UBadge v-if="hasUnsavedChanges" color="warning" variant="soft" size="sm">
              Non sauvegardé
            </UBadge>

            <!-- Actions secondaires -->
            <UDropdownMenu :items="[
              [
                {
                  label: 'Dupliquer',
                  icon: 'i-lucide-copy',
                  click: handleDuplicate
                },
                {
                  label: 'Voir sur le site',
                  icon: 'i-lucide-external-link',
                  to: `/products/${product?.slug}`,
                  target: '_blank'
                }
              ],
              [
                {
                  label: 'Supprimer',
                  icon: 'i-lucide-trash',
                  color: 'error',
                  click: handleDelete,
                  disabled: isDeleting
                }
              ]
            ]">
              <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" />
            </UDropdownMenu>

            <!-- Bouton Sauvegarder -->
            <UButton label="Sauvegarder" icon="i-lucide-save" color="primary" :loading="isSaving"
              :disabled="!hasUnsavedChanges || !isFormValid" @click="handleSave" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <!-- Body -->
    <template #body>
      <!-- Loading State -->
      <div v-if="isLoading && !product" class="p-8">
        <div class="space-y-4">
          <USkeleton class="h-8 w-64" />
          <USkeleton class="h-32 w-full" />
          <USkeleton class="h-32 w-full" />
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="product" class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar gauche -->
        <div class="lg:w-[30%] space-y-6">
          <!-- Aperçu -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-semibold">Aperçu</h3>
            </template>

            <div class="space-y-4">
              <!-- Image principale -->
              <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img v-if="images[0]?.url" :src="images[0].url" :alt="product.name"
                  class="w-full h-full object-cover">
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-image" class="w-12 h-12 text-gray-400" />
                </div>
              </div>

              <!-- Statut -->
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Statut</label>
                <USelectMenu v-model="form.status" :items="statusOptions" value-key="value" label-key="label"
                  placeholder="Sélectionner" class="w-full" />
              </div>

              <!-- Stock rapide -->
              <div v-if="form.track_inventory">
                <label class="text-xs text-gray-500 mb-1 block">Stock actuel</label>
                <UBadge :label="`${product.stock_quantity} unités`"
                  :color="product.stock_quantity > 0 ? 'success' : 'error'" variant="outline" size="lg" />

                <div class="mt-3 space-y-2">
                  <USelectMenu v-model="stockAdjustment.operation" :items="[
                    { label: 'Définir', value: 'set' },
                    { label: 'Ajouter', value: 'add' },
                    { label: 'Retirer', value: 'sub' }
                  ]" value-key="value" label-key="label" size="sm" />
                  <div class="flex gap-2">
                    <UInput class="flex-1 w-full" v-model.number="stockAdjustment.quantity" type="number" placeholder="Quantité" size="sm" />
                    <UButton icon="i-lucide-check" size="sm" @click="handleStockUpdate" />
                  </div>
                </div>
              </div>

              <!-- Actions rapides -->
              <div class="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-2">
                <UCheckbox v-model="form.is_featured" label="Produit mis en avant" />
                <UCheckbox v-model="form.is_new" label="Nouveau produit" />
                <UCheckbox v-model="form.is_on_sale" label="En promotion" />
              </div>
            </div>
          </UCard>

          <!-- Précommande -->
          <UCard v-if="form.status === 'preorder' || form.is_preorder_enabled">
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold">Précommande</h3>
                <USwitch v-model="form.is_preorder_enabled" @update:model-value="handleTogglePreorder" />
              </div>
            </template>

            <div v-if="form.is_preorder_enabled" class="space-y-3">
              <UFormField label="Date disponibilité">
                <UInput class="w-full" v-model="form.preorder_available_date" type="date" size="sm" />
              </UFormField>

              <UFormField label="Limite (optionnel)">
                <UInput class="w-full" v-model.number="form.preorder_limit" type="number" placeholder="Illimité" size="sm" />
              </UFormField>

              <div v-if="product.preorder_count > 0" class="text-sm text-gray-600 dark:text-gray-400">
                {{ product.preorder_count }} précommande(s) en cours
              </div>
            </div>
          </UCard>
        </div>

        <!-- Contenu principal -->
        <div class="flex-1">
          <UTabs v-model="activeTab" :items="tabs" class="w-full">
            <!-- Onglet: Général -->
            <template #general>
              <div class="space-y-6 p-6">
                <div class="grid grid-cols-3 gap-4">
                  <UFormField label="Nom du produit" required>
                    <UInput class="w-full" v-model="form.name" placeholder="Ex: T-shirt Nike Dri-FIT" @blur="generateSlug" />
                  </UFormField>
                  <UFormField label="Slug">
                    <UInput class="w-full" v-model="form.slug" placeholder="t-shirt-nike-dri-fit" disabled />
                  </UFormField>
                  <UFormField label="SKU">
                    <UInput class="w-full" v-model="form.sku" disabled />
                  </UFormField>
                </div>

                <UFormField label="Description courte">
                  <UTextarea v-model="form.short_description" :rows="3" placeholder="Résumé en quelques mots..." class="w-full" />
                </UFormField>

                <UFormField label="Description complète">
                  <UTextarea v-model="form.description" :rows="8" class="w-full"
                    placeholder="Description détaillée du produit..." />
                </UFormField>
              </div>
            </template>

            <!-- Onglet: Prix & Stock -->
            <template #pricing>
              <div class="space-y-6 p-6">
                <div class="grid grid-cols-3 gap-4">
                  <UFormField label="Prix de vente" required>
                    <UInput class="w-full" v-model.number="form.price" type="number" step="500" placeholder="0">
                      <template #trailing><span class="text-gray-400">CFA</span></template>
                    </UInput>
                  </UFormField>
                  <UFormField label="Prix comparaison">
                    <UInput class="w-full" v-model.number="form.compare_price" type="number" step="500" placeholder="0">
                      <template #trailing><span class="text-gray-400">CFA</span></template>
                    </UInput>
                  </UFormField>
                  <UFormField label="Prix coûtant">
                    <UInput class="w-full" v-model.number="form.cost_price" type="number" step="500" placeholder="0">
                      <template #trailing><span class="text-gray-400">CFA</span></template>
                    </UInput>
                  </UFormField>
                </div>

                <USeparator />

                <div class="space-y-4">
                  <UCheckbox v-model="form.track_inventory" label="Gérer le stock" />
                  <div v-if="form.track_inventory" class="grid grid-cols-2 gap-4 pl-6">
                    <UFormField label="Quantité en stock">
                      <UInput class="w-full" v-model.number="form.stock_quantity" type="number" />
                    </UFormField>
                    <UFormField label="Seuil stock faible">
                      <UInput class="w-full" v-model.number="form.low_stock_threshold" type="number" />
                    </UFormField>
                  </div>
                  <UFormField label="Code-barres" class="mt-5">
                    <UInput v-model="form.barcode" placeholder="Ex: 5901234123457" disabled class="w-1/2" />
                  </UFormField>
                </div>
              </div>
            </template>

            <!-- Onglet: Images -->
            <template #media>
              <div class="p-6 space-y-6">
                <!-- Upload zone -->
                <div>
                  <label class="block text-sm font-medium mb-2">Ajouter des images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    @change="(e) => {
                      const files = (e.target as HTMLInputElement).files
                      if (files) handleImageUpload(Array.from(files))
                    }"
                    class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p class="mt-1 text-xs text-gray-500">PNG, JPG, WEBP jusqu'à 5MB par fichier</p>
                </div>

                <!-- Galerie d'images -->
                <div v-if="images.length > 0">
                  <div class="flex items-center justify-between mb-3">
                    <label class="block text-sm font-medium">Images du produit ({{ images.length }})</label>
                    <p class="text-xs text-gray-500">La première image sera l'image principale</p>
                  </div>

                  <div class="grid grid-cols-3 gap-4">
                    <div
                      v-for="(image, idx) in images"
                      :key="idx"
                      class="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
                    >
                      <img
                        :src="image.url"
                        :alt="`Image ${idx + 1}`"
                        class="w-full h-full object-cover"
                      />

                      <!-- Badge "Principal" -->
                      <div v-if="idx === 0" class="absolute top-2 left-2">
                        <UBadge color="primary" variant="solid" size="xs">Principal</UBadge>
                      </div>

                      <!-- Badge "Nouveau" -->
                      <div v-if="image.isNew" class="absolute top-2 right-2">
                        <UBadge color="success" variant="solid" size="xs">Nouveau</UBadge>
                      </div>

                      <!-- Actions overlay -->
                      <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <UButton
                          v-if="idx > 0"
                          icon="i-lucide-arrow-left"
                          color="neutral"
                          variant="solid"
                          size="xs"
                          @click="reorderImages(idx, idx - 1)"
                        />
                        <UButton
                          icon="i-lucide-trash-2"
                          color="error"
                          variant="solid"
                          size="xs"
                          @click="removeImage(idx)"
                        />
                        <UButton
                          v-if="idx < images.length - 1"
                          icon="i-lucide-arrow-right"
                          color="neutral"
                          variant="solid"
                          size="xs"
                          @click="reorderImages(idx, idx + 1)"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Message si aucune image -->
                <UAlert
                  v-else
                  icon="i-lucide-image"
                  color="neutral"
                  variant="soft"
                  title="Aucune image"
                  description="Ajoutez des images pour mettre en valeur votre produit"
                />
              </div>
            </template>

            <!-- Onglet: Variations -->
            <template #variations>
              <div class="space-y-6 p-6">
                <!-- Message si produit non variable -->
                <UAlert
                  v-if="!form.is_variable"
                  icon="i-lucide-info"
                  color="secondary"
                  variant="soft"
                  title="Produit simple"
                  description="Activez 'Produit avec variations' dans l'onglet Avancé pour gérer les variations."
                />

                <!-- Gestion des variations -->
                <div v-else class="space-y-4">
                  <!-- Header -->
                  <div class="flex items-center justify-between">
                    <div>
                      <h3 class="text-lg font-semibold">Variations du produit</h3>
                      <p class="text-sm text-gray-500">{{ form.variations.length }} variation(s)</p>
                    </div>
                    <UButton
                      icon="i-lucide-plus"
                      label="Ajouter une variation"
                      color="primary"
                      @click="addVariation"
                    />
                  </div>

                  <!-- Liste des variations -->
                  <div v-if="form.variations.length > 0" class="space-y-3">
                    <UCard v-for="(variation, idx) in form.variations" :key="idx">
                      <div class="space-y-4">
                        <!-- Header de la variation -->
                        <div class="flex items-start justify-between gap-4">
                          <UFormField label="Nom de la variation" class="flex-1">
                            <UInput class="w-full"
                              v-model="variation.variation_name"
                              placeholder="Ex: Rouge / Taille L"
                            />
                          </UFormField>

                          <div class="flex gap-1 mt-6">
                            <UButton
                              icon="i-lucide-copy"
                              color="neutral"
                              variant="ghost"
                              size="sm"
                              @click="duplicateVariation(idx)"
                            />
                            <UButton
                              icon="i-lucide-trash-2"
                              color="error"
                              variant="ghost"
                              size="sm"
                              @click="removeVariation(idx)"
                            />
                          </div>
                        </div>

                        <!-- Prix et Stock -->
                        <div class="grid grid-cols-3 gap-4">
                          <UFormField label="Prix">
                            <UInput class="w-full" v-model.number="variation.price" type="number" step="500">
                              <template #trailing>
                                <span class="text-gray-400">CFA</span>
                              </template>
                            </UInput>
                          </UFormField>

                          <UFormField label="Prix comparaison">
                            <UInput class="w-full" v-model.number="variation.compare_price" type="number" step="500">
                              <template #trailing>
                                <span class="text-gray-400">CFA</span>
                              </template>
                            </UInput>
                          </UFormField>

                          <UFormField label="Stock">
                            <UInput class="w-full" v-model.number="variation.stock_quantity" type="number" />
                          </UFormField>
                        </div>

                        <!-- SKU -->
                        <UFormField label="SKU (optionnel)">
                          <UInput
                            v-model="variation.sku"
                            placeholder="Généré automatiquement si vide"
                            class="w-1/2"
                          />
                        </UFormField>

                        <!-- Statut actif -->
                        <UCheckbox v-model="variation.is_active" label="Variation active" />
                      </div>
                    </UCard>
                  </div>

                  <!-- Message si aucune variation -->
                  <UAlert
                    v-else
                    icon="i-lucide-package"
                    color="neutral"
                    variant="soft"
                    title="Aucune variation"
                    description="Cliquez sur 'Ajouter une variation' pour proposer différentes options de ce produit."
                  />
                </div>
              </div>
            </template>

            <!-- Onglet: SEO -->
            <template #seo>
              <div class="space-y-6 p-6">
                <UFormField label="Titre SEO">
                  <UInput
                    v-model="form.meta_title"
                    placeholder="Titre pour les moteurs de recherche"
                    class="w-full"
                  />
                  <template #hint>
                    <span class="text-xs">{{ form.meta_title?.length || 0 }}/60 caractères recommandés</span>
                  </template>
                </UFormField>

                <UFormField label="Description SEO">
                  <UTextarea
                    v-model="form.meta_description"
                    :rows="6"
                    placeholder="Description pour les moteurs de recherche"
                    class="w-full"
                  />
                  <template #hint>
                    <span class="text-xs">{{ form.meta_description?.length || 0 }}/160 caractères recommandés</span>
                  </template>
                </UFormField>

                <!-- Aperçu Google -->
                <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg">
                  <p class="text-xs text-gray-500 mb-2">Aperçu Google</p>
                  <div class="space-y-1">
                    <h4 class="text-blue-600 text-lg">{{ form.meta_title || form.name }}</h4>
                    <p class="text-xs text-green-700">{{ `https://votresite.com/products/${form.slug}` }}</p>
                    <p class="text-sm text-gray-600">
                      {{ form.meta_description || form.short_description || 'Aucune description' }}
                    </p>
                  </div>
                </div>
              </div>
            </template>

            <!-- Onglet: Avancé -->
            <template #advanced>
              <div class="space-y-6 p-6">
                <UFormField label="Configuration avancée">
                  <div class="space-y-3">
                    <UCheckbox
                      v-model="form.requires_authenticity"
                      label="Requiert authentification Bylin"
                    >
                      <template #description>
                        Les clients devront vérifier l'authenticité du produit
                      </template>
                    </UCheckbox>

                    <UCheckbox
                      v-model="form.is_variable"
                      label="Produit avec variations"
                    >
                      <template #description>
                        Ce produit a différentes options (taille, couleur, etc.)
                      </template>
                    </UCheckbox>
                  </div>
                </UFormField>

                <!-- Erreurs de validation -->
                <UAlert
                  v-if="formErrors.length > 0"
                  icon="i-lucide-alert-circle"
                  color="error"
                  variant="soft"
                  title="Erreurs de validation"
                >
                  <ul class="list-disc list-inside space-y-1 text-sm">
                    <li v-for="(error, idx) in formErrors" :key="idx">{{ error }}</li>
                  </ul>
                </UAlert>
              </div>
            </template>
          </UTabs>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
