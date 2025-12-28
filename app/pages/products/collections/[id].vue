<script setup lang="ts">
import type { Product } from '~/types/product'

definePageMeta({
  layout: 'default',
  title: 'Détails de la collection'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
  state,
  isLoading,
  fetchCollection,
  deleteCollection,
  toggleActive
} = useCollections()

const {
  removeProducts,
  getProductsStatistics
} = useCollectionProducts()

const collectionId = route.params.id as string

// ========================================
// État local
// ========================================
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isAddProductsModalOpen = ref(false)
const productStats = ref<any>(null)
const loadingStats = ref(false)
const isConfirmRemoveOpen = ref(false)
const productToRemove = ref<Product | null>(null)

const collection = computed(() => state.value.currentCollection)

// ========================================
// Computed
// ========================================
const hasProducts = computed(() => {
  return collection.value?.products && collection.value.products.length > 0
})

// ========================================
// Methods
// ========================================

async function loadCollection() {
  const data = await fetchCollection(collectionId)

  if (!data) {
    toast.add({
      title: 'Erreur',
      description: 'Collection introuvable',
      color: 'error'
    })
    router.push('/products/collections')
  } else {
    // Charger les stats des produits
    loadProductsStatistics()
  }
}

async function loadProductsStatistics() {
  loadingStats.value = true
  try {
    productStats.value = await getProductsStatistics(collectionId)
  } finally {
    loadingStats.value = false
  }
}

async function handleDelete() {
  const success = await deleteCollection(collectionId)

  if (success) {
    router.push('/products/collections')
  }
}

function handleUpdated() {
  isEditModalOpen.value = false
  loadCollection()
}

async function handleToggleActive() {
  if (!collection.value) {
    console.warn('[handleToggleActive] No collection');
    return;
  }

  const success = await toggleActive(collection.value.id);

  if (success) {
    await loadCollection();
  }
}

function handleRemoveProduct(product: Product) {
  productToRemove.value = product
  isConfirmRemoveOpen.value = true
}

async function onConfirmRemove() {
  if (!productToRemove.value) return

  const success = await removeProducts(collectionId, [productToRemove.value.id])

  if (success) {
    await loadCollection()
  }

  productToRemove.value = null
}

function handleProductsAdded() {
  isAddProductsModalOpen.value = false
  loadCollection()
}
// ========================================
// Lifecycle
// ========================================
onMounted(() => {
  loadCollection()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/products/collections"
          />
          <div v-if="collection" class="ml-4">
            <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ collection.name }}
            </h1>
            <p class="text-sm text-gray-500">
              {{ collection.products_count }} produit(s)
            </p>
          </div>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              :label="collection?.is_active ? 'Désactiver' : 'Activer'"
              :icon="collection?.is_active ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="outline"
              :loading="isLoading"
              @click="handleToggleActive"
            />

            <UDropdownMenu
              :items="[
                [
                  {
                    label: 'Modifier',
                    icon: 'i-lucide-pencil',
                    onSelect: () => isEditModalOpen = true
                  },
                  {
                    label: 'Voir les produits',
                    icon: 'i-lucide-package',
                    click: () => router.push(`/products?collection_id=${collectionId}`)
                  }
                ],
                [
                  {
                    label: 'Supprimer',
                    icon: 'i-lucide-trash',
                    color: 'error',
                    onSelect: () => isDeleteModalOpen = true
                  }
                ]
              ]"
            >
              <UButton
                icon="i-lucide-ellipsis-vertical"
                color="neutral"
                variant="ghost"
              />
            </UDropdownMenu>
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading -->
      <div v-if="isLoading" class="p-8">
        <div class="space-y-4">
          <USkeleton class="h-8 w-64" />
          <USkeleton class="h-48 w-full" />
        </div>
      </div>

      <!-- Content -->
      <div v-else-if="collection" class="space-y-6">
        <!-- Images et infos principales -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Images (Cover + Banner) -->
          <div class="lg:col-span-1 space-y-4">
            <!-- Cover Image -->
            <UCard>
              <template #header>
                <h3 class="text-sm font-semibold">Image de couverture</h3>
              </template>

              <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  v-if="collection.cover_image_url"
                  :src="collection.cover_image_url"
                  :alt="collection.name"
                  class="w-full h-full object-cover"
                >
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-image" class="w-16 h-16 text-gray-400" />
                </div>
              </div>
            </UCard>

            <!-- Banner Image (optionnelle) -->
            <UCard v-if="collection.banner_image_url">
              <template #header>
                <h3 class="text-sm font-semibold">Bannière</h3>
              </template>

              <div class="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  :src="collection.banner_image_url"
                  :alt="`${collection.name} - Bannière`"
                  class="w-full h-full object-cover"
                >
              </div>
            </UCard>
          </div>

          <!-- Infos -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Statut et stats -->
            <UCard>
              <template #header>
                <h3 class="text-sm font-semibold">Informations</h3>
              </template>

              <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <p class="text-xs text-gray-500 mb-1">Statut</p>
                    <UBadge
                      :color="collection.is_active ? 'success' : 'neutral'"
                      variant="subtle"
                    >
                      {{ collection.is_active ? 'Active' : 'Inactive' }}
                    </UBadge>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 mb-1">Produits</p>
                    <p class="font-medium">{{ collection.products_count || 0 }}</p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 mb-1">Créée le</p>
                    <p class="font-medium">
                      {{ new Date(collection.created_at).toLocaleDateString('fr-FR') }}
                    </p>
                  </div>

                  <div>
                    <p class="text-xs text-gray-500 mb-1">Mise à jour</p>
                    <p class="font-medium">
                      {{ new Date(collection.updated_at).toLocaleDateString('fr-FR') }}
                    </p>
                  </div>
                </div>

                <USeparator />

                <!-- Description -->
                <div v-if="collection.description">
                  <p class="text-xs text-gray-500 mb-1">Description</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300">
                    {{ collection.description }}
                  </p>
                </div>
              </div>
            </UCard>

            <!-- ✅ NOUVEAU: Statistiques des produits -->
            <UCard v-if="productStats && hasProducts">
              <template #header>
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold">Statistiques des produits</h3>
                  <UIcon
                    v-if="loadingStats"
                    name="i-lucide-loader-2"
                    class="w-4 h-4 animate-spin text-gray-400"
                  />
                </div>
              </template>

              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400">
                    {{ productStats.active_products }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Actifs</p>
                </div>

                <div class="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {{ productStats.out_of_stock }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Rupture</p>
                </div>

                <div class="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {{ productStats.total_stock }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Stock total</p>
                </div>

                <div class="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {{ formatPriceXOF(productStats.total_value) }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Valeur totale</p>
                </div>
              </div>
            </UCard>

            <!-- SEO -->
            <UCard v-if="collection.meta_title || collection.meta_description">
              <template #header>
                <h3 class="text-sm font-semibold">SEO</h3>
              </template>

              <div class="space-y-3">
                <div v-if="collection.meta_title">
                  <p class="text-xs text-gray-500 mb-1">Titre SEO</p>
                  <p class="text-sm">{{ collection.meta_title }}</p>
                </div>

                <div v-if="collection.meta_description">
                  <p class="text-xs text-gray-500 mb-1">Description SEO</p>
                  <p class="text-sm">{{ collection.meta_description }}</p>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- ✅ NOUVEAU: Gestion des produits -->
        <UCard v-if="hasProducts">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold">
                Produits ({{ collection?.products?.length }})
              </h3>
              <div class="flex items-center gap-2">
                <UButton
                  label="Ajouter des produits"
                  icon="i-lucide-plus"
                  color="primary"
                  variant="outline"
                  size="sm"
                  @click="isAddProductsModalOpen = true"
                />
                <UButton
                  label="Voir tous"
                  icon="i-lucide-external-link"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  @click="router.push(`/products?collection_id=${collectionId}`)"
                />
              </div>
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="product in collection.products"
              :key="product.id"
              class="relative group"
            >
              <!-- Card produit -->
              <div
                class="cursor-pointer"
                @click="router.push(`/products/${product.id}`)"
              >
                <!-- Image -->
                <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2 relative">
                  <img
                    v-if="product.thumbnail_url"
                    :src="product.thumbnail_url"
                    :alt="product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  >
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <UIcon name="i-lucide-image" class="w-8 h-8 text-gray-400" />
                  </div>

                  <!-- Badge stock -->
                  <div class="absolute top-2 left-2">
                    <UBadge
                      v-if="product.stock_quantity <= 0"
                      color="error"
                      variant="solid"
                      size="xs"
                    >
                      Rupture
                    </UBadge>
                    <UBadge
                      v-else-if="product.stock_quantity <= 5"
                      color="warning"
                      variant="solid"
                      size="xs"
                    >
                      Stock faible
                    </UBadge>
                  </div>

                  <!-- Bouton retirer (apparaît au hover) -->
                  <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <UButton
                      icon="i-lucide-x"
                      color="error"
                      variant="solid"
                      size="xs"
                      class="p-1 rounded-full cursor-pointer"
                      @click.stop="handleRemoveProduct(product)"
                    />
                  </div>
                </div>

                <!-- Info produit -->
                <p class="text-sm font-medium truncate group-hover:text-primary-500 transition-colors">
                  {{ product.name }}
                </p>
                <div class="flex items-center justify-between mt-1">
                  <p class="text-xs text-gray-500">
                    {{ formatPriceXOF(product.price) }}
                  </p>
                  <p class="text-xs text-gray-500">
                    Stock: {{ product.stock_quantity }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Message si aucun produit -->
        <UCard v-else>
          <div class="flex flex-col items-center justify-center py-16 text-center">
            <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
              <UIcon name="i-lucide-package-x" class="w-8 h-8 text-gray-400" />
            </div>
            <p class="text-base font-medium text-gray-900 dark:text-white">
              Aucun produit dans cette collection
            </p>
            <p class="text-sm text-gray-500 mt-1">
              Ajoutez des produits pour enrichir cette collection
            </p>
            <UButton
              label="Ajouter des produits"
              icon="i-lucide-plus"
              color="primary"
              class="mt-4"
              @click="isAddProductsModalOpen = true"
            />
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modales -->
  <CollectionEditModal
    v-model:open="isEditModalOpen"
    :collection="collection"
    @updated="handleUpdated"
  />

  <CollectionDeleteModal
    v-model:open="isDeleteModalOpen"
    :collection-ids="[collectionId]"
    @deleted="handleDelete"
  />

  <CollectionConfirmDialog
v-model:open="isConfirmRemoveOpen"
title="Retirer le produit"
    :description="`Êtes-vous sûr de vouloir retirer &quot;${productToRemove?.name}&quot; de cette collection ?`"
    confirm-label="Retirer"
variant="danger"
@confirm="onConfirmRemove" />

  <CollectionAddProductsModal
    v-model:open="isAddProductsModalOpen"
    :collection-id="collectionId"
    :collection-name="collection?.name || ''"
    @added="handleProductsAdded"
  />
</template>
