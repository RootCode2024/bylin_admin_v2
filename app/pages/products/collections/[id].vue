<script setup lang="ts">
import type { Collection } from '~/types/collection'

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

const collectionId = route.params.id as string

// ========================================
// État local
// ========================================
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

// ✅ SOLUTION 1: Utiliser directement state.value.currentCollection
// Cela garantit la réactivité complète
const collection = computed(() => state.value.currentCollection)

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

  console.log('[handleToggleActive] Start', {
    id: collection.value.id,
    currentStatus: collection.value.is_active
  });

  const success = await toggleActive(collection.value.id);

  console.log('[handleToggleActive] Result', { success });

  if (success) {
    // Force refresh pour garantir la cohérence
    await loadCollection();
  }
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
            <!-- ✅ Utiliser la méthode wrapper -->
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
        <!-- Image et infos principales -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Image -->
          <div class="lg:col-span-1">
            <UCard>
              <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <img
                  v-if="collection.image_url"
                  :src="collection.image_url"
                  :alt="collection.name"
                  class="w-full h-full object-cover"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-folder" class="w-16 h-16 text-gray-400" />
                </div>
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
                    <!-- ✅ Le badge se met à jour automatiquement -->
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

        <!-- Liste des produits -->
        <UCard v-if="collection.products && collection.products.length > 0">
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold">
                Produits ({{ collection.products.length }})
              </h3>
              <UButton
                label="Gérer les produits"
                icon="i-lucide-package"
                color="primary"
                variant="outline"
                size="sm"
                @click="router.push(`/products?collection_id=${collectionId}`)"
              />
            </div>
          </template>

          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div
              v-for="product in collection.products"
              :key="product.id"
              class="group cursor-pointer"
              @click="router.push(`/products/${product.id}`)"
            >
              <div class="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-2">
                <img
                  v-if="product.thumbnail_url"
                  :src="product.thumbnail_url"
                  :alt="product.name"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <UIcon name="i-lucide-image" class="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <p class="text-sm font-medium truncate group-hover:text-primary-500">
                {{ product.name }}
              </p>
              <p class="text-xs text-gray-500">
                {{ formatPriceXOF(product.price) }}
              </p>
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
              color="primary"
              class="mt-4"
              @click="router.push(`/products?collection_id=${collectionId}`)"
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
</template>
