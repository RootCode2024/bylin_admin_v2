<script setup lang="ts">
import type { InventoryItem, LowStockItem } from '~/types/inventory'
import { getDaysUntilOutLabel } from '~/utils/inventory'

definePageMeta({
  layout: 'default'
})

// ========================================
// Composants résolus
// ========================================
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

// ========================================
// Composables
// ========================================
const toast = useToast()
const router = useRouter()
const route = useRoute()

const {
  lowStockItems,
  outOfStockItems,
  loading,
  fetchLowStockItems,
  fetchOutOfStockItems,
  adjustStock
} = useInventories()

// ========================================
// État local
// ========================================
const activeTab = ref(0)
const activeFilter = ref<'low' | 'out'>('low')
const threshold = ref(10)
const showRestockModal = ref(false)
const selectedItem = ref<InventoryItem | null>(null)
const restockQuantity = ref(10)
const restockNotes = ref('')

// ========================================
// Configuration
// ========================================
const tabs = [
  {
    label: 'Stock faible',
    icon: 'i-heroicons-exclamation-triangle',
    value: 'low'
  },
  {
    label: 'Ruptures',
    icon: 'i-heroicons-x-circle',
    value: 'out'
  }
]

const quickQuantities = [10, 25, 50, 100]

// ========================================
// Computed
// ========================================
const displayedItems = computed(() => {
  return activeFilter.value === 'low' ? lowStockItems.value : outOfStockItems.value
})

const newStockPreview = computed(() => {
  if (!selectedItem.value) return 0
  return selectedItem.value.stock_quantity + restockQuantity.value
})

// ========================================
// Actions
// ========================================
function openRestockModal(item: InventoryItem) {
  selectedItem.value = item
  restockQuantity.value = 10
  restockNotes.value = ''
  showRestockModal.value = true
}

async function handleRestock() {
  if (!selectedItem.value || restockQuantity.value <= 0) return

  const success = await adjustStock({
    product_id: selectedItem.value.product_id,
    variation_id: selectedItem.value.variation_id ?? null,
    quantity: restockQuantity.value,
    operation: 'add',
    reason: 'purchase',
    notes: restockNotes.value || null
  })

  if (success) {
    showRestockModal.value = false
    selectedItem.value = null
    restockQuantity.value = 10
    restockNotes.value = ''
    await loadData()

    toast.add({
      title: 'Stock réapprovisionné',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  }
}

function handleTabChange(index: string | number) {
  const tabIndex = typeof index === 'string' ? parseInt(index) : index
  const tab = tabs[tabIndex]
  if (tab) {
    activeFilter.value = tab.value as 'low' | 'out'
    loadData()
  }
}

function viewProductDetails(item: InventoryItem) {
  router.push(`/products/${item.product_id}`)
}

function viewMovements(item: InventoryItem) {
  router.push(`/inventory/movements?product_id=${item.product_id}`)
}

async function loadData() {
  if (activeFilter.value === 'low') {
    await fetchLowStockItems(threshold.value)
  } else {
    await fetchOutOfStockItems()
  }
}

// ========================================
// Watchers
// ========================================
watch(threshold, () => {
  if (activeFilter.value === 'low') {
    loadData()
  }
})

// ========================================
// Lifecycle
// ========================================
onMounted(() => {
  // Check URL params
  const filterParam = route.query.filter as string
  if (filterParam === 'out') {
    activeTab.value = 1
    activeFilter.value = 'out'
  }

  loadData()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        :title="activeFilter === 'out' ? 'Ruptures de stock' : 'Stocks faibles'"
        :badge="displayedItems.length">
        <template #left>
          <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            to="/inventory" />
        </template>
        <template #right>
          <UButton
            icon="i-heroicons-arrow-path"
            color="neutral"
            variant="outline"
            :loading="loading"
            @click="loadData">
            Actualiser
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Alert Banner -->
      <div v-if="displayedItems.length > 0" class="mb-6">
        <div
          v-if="activeFilter === 'low'"
          class="rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4">
          <div class="flex gap-3">
            <UIcon name="i-heroicons-exclamation-triangle" class="h-5 w-5 text-orange-600 shrink-0" />
            <div>
              <p class="text-sm font-medium text-orange-800 dark:text-orange-200">
                Attention
              </p>
              <p class="text-sm text-orange-700 dark:text-orange-300 mt-1">
                {{ displayedItems.length }} produit(s) ont un stock faible et nécessitent un réapprovisionnement.
              </p>
            </div>
          </div>
        </div>

        <div
          v-else
          class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div class="flex gap-3">
            <UIcon name="i-heroicons-x-circle" class="h-5 w-5 text-red-600 shrink-0" />
            <div>
              <p class="text-sm font-medium text-red-800 dark:text-red-200">
                Rupture de stock
              </p>
              <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                {{ displayedItems.length }} produit(s) sont en rupture de stock.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filter Tabs -->
      <UTabs
        v-model="activeTab"
        :items="tabs"
        class="mb-6"
        @update:model-value="handleTabChange" />

      <!-- Threshold Selector (only for low stock) -->
      <UCard v-if="activeFilter === 'low'" class="mb-6">
        <div class="flex items-center justify-between">
          <div>
            <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Seuil de stock faible
            </label>
            <p class="text-xs text-gray-500 mt-1">
              Afficher les produits avec un stock inférieur à
            </p>
          </div>

          <div class="flex items-center gap-3">
            <UInput
              v-model.number="threshold"
              type="number"
              min="0"
              class="w-24" />
            <span class="text-sm text-gray-500">unités</span>
          </div>
        </div>
      </UCard>

      <!-- Items List -->
      <UCard v-if="!loading && displayedItems.length > 0">
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="item in displayedItems"
            :key="item.id"
            class="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 -mx-6 px-6 transition-colors">
            <div class="flex items-center gap-4 flex-1 min-w-0">
              <!-- Product Image -->
              <div class="relative shrink-0">
                <div v-if="item.image_url" class="h-16 w-16 rounded-lg overflow-hidden">
                  <img
                    :src="item.image_url"
                    :alt="item.name"
                    class="h-full w-full object-cover" />
                </div>
                <div v-else class="h-16 w-16 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <UIcon name="i-heroicons-photo" class="h-6 w-6 text-gray-400" />
                </div>

                <!-- Stock Badge -->
                <UBadge
                  :color="item.stock_quantity === 0 ? 'error' : 'warning'"
                  class="absolute -top-2 -right-2">
                  {{ item.stock_quantity }}
                </UBadge>
              </div>

              <!-- Product Info -->
              <div class="flex-1 min-w-0">
                <h3
                  class="text-sm font-semibold text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary-500 transition-colors"
                  @click="viewProductDetails(item)">
                  {{ item.name }}
                </h3>
                <p class="text-sm text-gray-500 truncate mt-0.5">
                  SKU: {{ item.sku }}
                </p>

                <div class="mt-2 flex items-center gap-2 flex-wrap">
                  <UBadge
                    :color="item.stock_quantity === 0 ? 'error' : 'warning'"
                    variant="subtle"
                    size="xs">
                    {{ item.stock_quantity === 0 ? 'Rupture' : 'Stock faible' }}
                  </UBadge>

                  <span v-if="item.low_stock_threshold" class="text-xs text-gray-500">
                    Seuil: {{ item.low_stock_threshold }}
                  </span>

                  <span v-if="'shortage' in item" class="text-xs text-red-600 dark:text-red-400">
                    Manque: {{ (item as any).shortage }} unités
                  </span>
                </div>
              </div>

              <!-- Stock Info (Hidden on mobile) -->
              <div class="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <div class="text-sm font-medium text-gray-900 dark:text-white">
                  Stock: {{ item.stock_quantity }}
                </div>

                <div v-if="'days_until_out' in item && (item as any).days_until_out" class="text-xs text-gray-500">
                  {{ getDaysUntilOutLabel((item as any).days_until_out) }}
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 shrink-0">
                <UButton
                  icon="i-heroicons-plus-circle"
                  color="primary"
                  size="sm"
                  @click="openRestockModal(item)">
                  Réapprovisionner
                </UButton>

                <UDropdownMenu
                  :items="[[
                    {
                      label: 'Voir détails',
                      icon: 'i-heroicons-eye',
                      onSelect: () => viewProductDetails(item)
                    },
                    {
                      label: 'Historique',
                      icon: 'i-heroicons-clock',
                      onSelect: () => viewMovements(item)
                    }
                  ]]">
                  <UButton
                    icon="i-heroicons-ellipsis-vertical"
                    color="neutral"
                    variant="ghost"
                    size="sm" />
                </UDropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Empty State -->
      <UCard v-else-if="!loading">
        <div class="py-16 text-center">
          <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3 inline-flex">
            <UIcon
              :name="activeFilter === 'out' ? 'i-heroicons-check-circle' : 'i-heroicons-check-badge'"
              class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            {{ activeFilter === 'out' ? 'Aucune rupture' : 'Tous les stocks sont OK' }}
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            {{ activeFilter === 'out'
              ? 'Tous vos produits sont en stock.'
              : 'Tous vos produits ont un stock suffisant.'
            }}
          </p>
          <div class="mt-6">
            <UButton to="/inventory">
              Retour à l'inventaire
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Loading State -->
      <UCard v-else-if="loading">
        <div class="py-12 flex items-center justify-center">
          <UIcon name="i-heroicons-arrow-path" class="h-8 w-8 animate-spin text-primary-500" />
        </div>
      </UCard>

      <!-- Quick Restock Modal -->
      <UModal v-model:open="showRestockModal">
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">
                Réapprovisionnement rapide
              </h3>
              <UButton
                icon="i-heroicons-x-mark"
                variant="ghost"
                color="neutral"
                @click="showRestockModal = false" />
            </div>
          </template>

          <div v-if="selectedItem" class="space-y-4">
            <!-- Product Info -->
            <div class="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
              <p class="font-medium text-gray-900 dark:text-white">
                {{ selectedItem.name }}
              </p>
              <div class="mt-1 flex items-center gap-2 text-sm">
                <span class="text-gray-500">Stock actuel:</span>
                <UBadge :color="selectedItem.stock_quantity === 0 ? 'error' : 'warning'">
                  {{ selectedItem.stock_quantity }}
                </UBadge>
              </div>
            </div>

            <!-- Quick Quantity Buttons -->
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Quantité rapide
              </label>
              <div class="grid grid-cols-4 gap-2">
                <UButton
                  v-for="qty in quickQuantities"
                  :key="qty"
                  color="neutral"
                  variant="outline"
                  :class="{ 'ring-2 ring-primary-500': restockQuantity === qty }"
                  @click="restockQuantity = qty">
                  +{{ qty }}
                </UButton>
              </div>
            </div>

            <!-- Custom Quantity -->
            <UFormGroup label="Quantité personnalisée" required>
              <UInput
                v-model.number="restockQuantity"
                type="number"
                min="1"
                placeholder="Entrez la quantité" />
            </UFormGroup>

            <!-- Notes -->
            <UFormGroup label="Notes (optionnel)">
              <UTextarea
                v-model="restockNotes"
                placeholder="Notes sur le réapprovisionnement..."
                :rows="2" />
            </UFormGroup>

            <!-- New Stock Preview -->
            <div class="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  Nouveau stock:
                </span>
                <span class="text-lg font-bold text-green-600 dark:text-green-400">
                  {{ newStockPreview }}
                </span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-3">
              <UButton
                variant="outline"
                @click="showRestockModal = false">
                Annuler
              </UButton>

              <UButton
                :loading="loading"
                :disabled="restockQuantity <= 0"
                @click="handleRestock">
                Réapprovisionner
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
