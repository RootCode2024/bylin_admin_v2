<script setup lang="ts">
import type { StockMovement, InventoryMovementFilters } from '~/types/inventory'
import {
  formatMovementType,
  formatMovementReason,
  getMovementTypeColor,
  getMovementTypeIcon,
  formatQuantityWithSign,
  groupMovementsByDate
} from '~/utils/inventory'

import { formatDateFR, formatDateTimeFR } from '~/utils/helpers'

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
const route = useRoute()
const router = useRouter()

const {
  movements,
  loading,
  pagination,
  movementFilters,
  fetchMovements,
  setPage,
  setMovementType,
  setMovementDateRange,
  resetMovementFilters
} = useInventories()

// ========================================
// État local
// ========================================
const localFilters = reactive<InventoryMovementFilters>({
  product_id: route.query.product_id as string | undefined,
  type: undefined,
  reason: undefined,
  date_from: undefined,
  date_to: undefined
})

// ========================================
// Configuration
// ========================================
const typeOptions = [
  { label: 'Tous', value: undefined },
  { label: 'Entrée', value: 'add' },
  { label: 'Sortie', value: 'sub' },
  { label: 'Ajustement', value: 'set' }
]

const reasonOptions = [
  { label: 'Toutes', value: undefined },
  { label: 'Vente', value: 'sale' },
  { label: 'Retour', value: 'return' },
  { label: 'Réassort', value: 'restock' },
  { label: 'Ajustement', value: 'adjustment' },
  { label: 'Endommagé', value: 'damaged' },
  { label: 'Perdu', value: 'lost' }
]

// ========================================
// Computed
// ========================================
const groupedMovements = computed(() => {
  const grouped = groupMovementsByDate(movements.value)
  return Object.entries(grouped).map(([date, items]) => ({
    date,
    movements: items
  }))
})

const hasActiveFilters = computed(() => {
  return !!(
    localFilters.type ||
    localFilters.reason ||
    localFilters.date_from ||
    localFilters.date_to ||
    localFilters.product_id
  )
})

const dateRangeLabel = computed(() => {
  if (localFilters.date_from && localFilters.date_to) {
    return `${formatDateFR(localFilters.date_from)} - ${formatDateFR(localFilters.date_to)}`
  }
  if (localFilters.date_from) {
    return `Du ${formatDateFR(localFilters.date_from)}`
  }
  if (localFilters.date_to) {
    return `Jusqu'au ${formatDateFR(localFilters.date_to)}`
  }
  return 'Période'
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => setPage(val - 1)
})

// ========================================
// Actions
// ========================================
function getMovementTypeClasses(type: string) {
  const classes = {
    in: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    out: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    adjustment: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[type as keyof typeof classes] || ''
}

function viewProduct(productId: string) {
  router.push(`/products/${productId}`)
}

function viewReference(movement: StockMovement) {
  if (movement.reference_type === 'Order' && movement.reference_id) {
    router.push(`/orders/${movement.reference_id}`)
  }
}

function clearFilters() {
  localFilters.type = undefined
  localFilters.reason = undefined
  localFilters.date_from = undefined
  localFilters.date_to = undefined

  if (!route.query.product_id) {
    localFilters.product_id = undefined
  }
  loadData()
}

function removeDateFromFilter() {
  localFilters.date_from = undefined
  localFilters.date_to = undefined
  loadData()
}

function removeTypeFilter() {
  localFilters.type = undefined
  loadData()
}

function removeReasonFilter() {
  localFilters.reason = undefined
  loadData()
}

function loadData() {
  // Nettoyer les paramètres vides
  const filters: InventoryMovementFilters = {}

  if (localFilters.product_id) filters.product_id = localFilters.product_id
  if (localFilters.type) filters.type = localFilters.type
  if (localFilters.reason) filters.reason = localFilters.reason
  if (localFilters.date_from) filters.date_from = localFilters.date_from
  if (localFilters.date_to) filters.date_to = localFilters.date_to

  fetchMovements(filters)
}

// ========================================
// Watchers
// ========================================
watch(() => localFilters.type, () => {
  loadData()
})

watch(() => localFilters.reason, () => {
  loadData()
})

watch(() => [localFilters.date_from, localFilters.date_to], () => {
  loadData()
})

// ========================================
// Lifecycle
// ========================================
onMounted(() => {
  loadData()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        title="Mouvements de stock"
        :badge="pagination.total">
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
          <UButton
            icon="i-heroicons-arrow-down-tray"
            color="primary"
            variant="outline">
            Exporter
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Filters -->
      <UCard class="mb-6 min-h-36">
        <div class="space-y-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <!-- Type Filter -->
            <USelectMenu
              v-model="localFilters.type"
              :items="typeOptions"
              value-key="value"
              label-key="label"
              placeholder="Type de mouvement" />

            <!-- Reason Filter -->
            <USelectMenu
              v-model="localFilters.reason"
              :items="reasonOptions"
              value-key="value"
              label-key="label"
              placeholder="Raison" />

            <!-- Date From -->
            <UInput
              v-model="localFilters.date_from"
              type="date"
              placeholder="Date de début"
              icon="i-heroicons-calendar" />

            <!-- Date To -->
            <UInput
              v-model="localFilters.date_to"
              type="date"
              placeholder="Date de fin"
              icon="i-heroicons-calendar" />
          </div>

          <!-- Active Filters -->
          <div v-if="hasActiveFilters" class="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <span class="text-sm text-gray-500">Filtres actifs:</span>

            <UBadge
              v-if="localFilters.type"
              color="primary"
              variant="subtle"
              closable
              @close="removeTypeFilter">
              Type: {{ formatMovementType(localFilters.type) }}
            </UBadge>

            <UBadge
              v-if="localFilters.reason"
              color="primary"
              variant="subtle"
              closable
              @close="removeReasonFilter">
              Raison: {{ formatMovementReason(localFilters.reason) }}
            </UBadge>

            <UBadge
              v-if="localFilters.date_from || localFilters.date_to"
              color="primary"
              variant="subtle"
              closable
              @close="removeDateFromFilter">
              {{ dateRangeLabel }}
            </UBadge>

            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              @click="clearFilters">
              Effacer tout
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- Movements Timeline -->
      <UCard v-if="!loading && movements.length > 0">
        <div class="space-y-8">
          <!-- ✅ CORRECTION : Utiliser l'array au lieu de l'objet -->
          <div
            v-for="group in groupedMovements"
            :key="group.date"
            class="space-y-4">
            <!-- Date Header -->
            <div class="flex items-center gap-3">
              <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ group.date }}
              </span>
              <div class="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
            </div>

            <!-- Movements for this date -->
            <div class="space-y-3">
              <div
                v-for="movement in group.movements"
                :key="movement.id"
                class="relative flex items-start gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
                <!-- Type Icon -->
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  :class="getMovementTypeClasses(movement.type)">
                  <UIcon
                    :name="getMovementTypeIcon(movement.type)"
                    class="h-5 w-5" />
                </div>

                <!-- Movement Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1 min-w-0">
                      <!-- Product Name -->
                      <h3
                        class="text-sm font-medium text-gray-900 dark:text-white truncate cursor-pointer hover:text-primary-500 transition-colors"
                        @click="viewProduct(movement.product_id)">
                        {{ movement.product?.name || 'Produit supprimé' }}
                      </h3>

                      <!-- Details -->
                      <div class="mt-1 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                        <UBadge
                          :color="getMovementTypeColor(movement.type)"
                          variant="subtle"
                          size="xs">
                          {{ formatMovementType(movement.type) }}
                        </UBadge>

                        <span>•</span>

                        <span>{{ formatMovementReason(movement.reason) }}</span>

                        <template v-if="movement.reference_type">
                          <span>•</span>
                          <span
                            class="text-xs cursor-pointer hover:text-primary-500 transition-colors"
                            @click="viewReference(movement)">
                            {{ movement.reference_type }} #{{ movement.reference_id?.slice(0, 8) }}
                          </span>
                        </template>
                      </div>

                      <!-- Notes -->
                      <p v-if="movement.notes" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {{ movement.notes }}
                      </p>

                      <!-- Stock Change -->
                      <div class="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <span>{{ movement.quantity_before }}</span>
                        <UIcon name="i-heroicons-arrow-right" class="h-3 w-3" />
                        <span
                          class="font-medium"
                          :class="movement.quantity_after > movement.quantity_before ? 'text-green-600' : 'text-red-600'">
                          {{ movement.quantity_after }}
                        </span>
                      </div>
                    </div>

                    <!-- Quantity Badge -->
                    <div class="shrink-0 text-right">
                      <div
                        class="text-lg font-bold"
                        :class="movement.type === 'out' ? 'text-red-600' : 'text-green-600'">
                        {{ formatQuantityWithSign(movement) }}
                      </div>
                      <div class="mt-1 text-xs text-gray-500">
                        {{ formatDateTimeFR(movement.created_at) }}
                      </div>
                    </div>
                  </div>

                  <!-- User Info -->
                  <div v-if="movement.creator" class="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <UIcon name="i-heroicons-user" class="h-3 w-3" />
                    <span>Par {{ movement.creator.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Empty State -->
      <UCard v-else-if="!loading && movements.length === 0">
        <div class="py-16 text-center">
          <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3 inline-flex">
            <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white">
            Aucun mouvement trouvé
          </h3>
          <p class="text-sm text-gray-500 mt-1">
            {{ hasActiveFilters ? 'Essayez de modifier vos filtres.' : 'Les mouvements de stock apparaîtront ici.' }}
          </p>
          <div v-if="hasActiveFilters" class="mt-6">
            <UButton @click="clearFilters">
              Effacer les filtres
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

      <!-- Pagination -->
      <div v-if="!loading && movements.length > 0" class="flex items-center justify-between mt-6 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> mouvement(s)
        </span>
        <UPagination
          v-model:page="currentPage"
          :total="pagination.total"
          :items-per-page="pagination.pageSize" />
      </div>
    </template>
  </UDashboardPanel>
</template>
