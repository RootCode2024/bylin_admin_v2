<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { InventoryItem } from '~/types/inventory'
import type { Table as TanstackTable } from '@tanstack/table-core'

// Imports Utils
import {
  getStockStatusColor,
  getStockStatusLabel,
  calculateStockValue
} from '~/utils/inventory'

import {
  formatPriceXOF
} from "~/utils/helpers"

definePageMeta({
  layout: 'default'
})

// ========================================
// Composants résolus
// ========================================
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UIcon = resolveComponent('UIcon')

// ========================================
// Composables
// ========================================
const toast = useToast()
const router = useRouter()

const {
  inventoryItems,
  statistics,
  loading,
  pagination,
  filters,
  totalStockValue,
  lowStockCount,
  outOfStockCount,
  fetchInventoryItems,
  fetchStatistics,
  downloadExport,
  setPage,
  setSearch,
  setStatus,
  setStockStatus,
  resetFilters,
} = useInventories()

// ========================================
// État local
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<InventoryItem> }>('table')

const rowSelection = ref<Record<string, boolean>>({})

// Synchronisation bidirectionnelle avec les filtres du composable
const localSearch = computed({
  get: () => filters.value.search || '',
  set: (value) => {
    // Ne déclencher la recherche que si la valeur change vraiment
    if (filters.value.search !== value) {
      debouncedSearch(value)
    }
  }
})

const localStatus = computed({
  get: () => filters.value.status || 'all',
  set: (value) => {
    setStatus(value as any)
  }
})

const localStockStatus = ref<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all')

watch(() => [
  filters.value.in_stock_only,      // ✅ AJOUT
  filters.value.low_stock_only,
  filters.value.out_of_stock_only
], () => {
  if (filters.value.in_stock_only) {
    localStockStatus.value = 'in_stock'
  } else if (filters.value.low_stock_only) {
    localStockStatus.value = 'low_stock'
  } else if (filters.value.out_of_stock_only) {
    localStockStatus.value = 'out_of_stock'
  } else {
    localStockStatus.value = 'all'
  }
}, { immediate: true })

// Appliquer les changements au composable
watch(localStockStatus, (value) => {
  setStockStatus(value)
})

// Modales
const isAdjustModalOpen = ref(false)
const selectedItem = ref<InventoryItem | null>(null)

// ========================================
// Debounced Search
// ========================================
const debouncedSearch = useDebounceFn((value: string) => {
  setSearch(value)
}, 400)

// ========================================
// Configuration des Labels
// ========================================
const statusLabels = {
  all: 'Tous',
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé'
}

const stockStatusLabels = {
  all: 'Tous',
  in_stock: 'En stock',
  low_stock: 'Stock faible',
  out_of_stock: 'Rupture'
}

// ========================================
// Définition des Colonnes
// ========================================
const columns: TableColumn<InventoryItem>[] = [
  {
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      'modelValue': table.getIsAllPageRowsSelected(),
      'indeterminate': table.getIsSomePageRowsSelected(),
      'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Tout sélectionner'
    }),
    cell: ({ row }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value),
      'ariaLabel': 'Sélectionner la ligne'
    }),
    enableHiding: false
  },
  {
    accessorKey: 'image',
    header: '',
    cell: ({ row }) => {
      return h('div', { class: 'w-10 h-10 shrink-0' },
        row.original.image_url
          ? h('img', {
              src: row.original.image_url,
              alt: row.original.name,
              class: 'w-full h-full rounded object-cover'
            })
          : h('div', {
              class: 'w-full h-full rounded bg-gray-200 dark:bg-gray-800 flex items-center justify-center'
            }, h(UIcon, { name: 'i-heroicons-photo', class: 'text-gray-400 text-xl' }))
      )
    },
    enableSorting: false
  },
  {
    accessorKey: 'name',
    header: 'Produit',
    cell: ({ row }) => {
      return h('div', {
        class: 'cursor-pointer group',
        onClick: () => router.push(`/products/${row.original.product_id}`)
      }, [
        h('p', {
          class: 'font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors'
        }, row.original.name),
        h('p', { class: 'text-xs text-gray-500 mt-0.5' }, `SKU: ${row.original.sku}`)
      ])
    }
  },
  {
    accessorKey: 'brand',
    header: 'Marque',
    cell: ({ row }) => h('span', { class: 'text-sm text-gray-600 dark:text-gray-400' }, row.original?.brand?.name || '-')
  },
  {
    accessorKey: 'category',
    header: 'Catégorie',
    cell: ({ row }) => {
      const categories = row.original.categories || []
      const label = categories.length > 0 ? categories.map(c => c.name).join(', ') : '-'
      return h('span', {
        class: 'text-sm text-gray-600 dark:text-gray-400 truncate max-w-[150px] block',
        title: label
      }, label)
    }
  },
  {
    accessorKey: 'stock_quantity',
    header: 'Stock',
    cell: ({ row }) => {
      const color = getStockStatusColor(row.original)
      return h(UBadge, {
        variant: 'subtle',
        color,
        size: 'sm',
        class: 'font-mono'
      }, () => row.original.stock_quantity.toString())
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const label = getStockStatusLabel(row.original)
      const color = getStockStatusColor(row.original)
      return h(UBadge, {
        variant: 'subtle',
        color,
        size: 'xs'
      }, () => label)
    }
  },
  {
    accessorKey: 'price',
    header: 'Prix',
    cell: ({ row }) => h('span', { class: 'text-sm font-medium text-gray-900 dark:text-white' },
      row.original.price ? formatPriceXOF(row.original.price) : '-'
    )
  },
  {
    accessorKey: 'stock_value',
    header: 'Valeur',
    cell: ({ row }) => h('span', { class: 'text-sm text-gray-600 dark:text-gray-400' },
      formatPriceXOF(calculateStockValue(row.original))
    )
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => h(
      'div',
      { class: 'text-right' },
      h(UDropdownMenu, {
        content: { align: 'end' },
        items: getRowItems(row.original)
      }, () => h(UButton, {
        icon: 'i-heroicons-ellipsis-horizontal',
        color: 'neutral',
        variant: 'ghost',
        size: 'sm'
      }))
    )
  }
]

// ========================================
// Actions
// ========================================
function getRowItems(item: InventoryItem) {
  return [
    [
      {
        label: 'Voir détails',
        icon: 'i-heroicons-eye',
        onSelect: () => router.push(`/products/${item.product_id}`)
      },
      {
        label: 'Ajuster stock',
        icon: 'i-heroicons-adjustments-horizontal',
        onSelect: () => openAdjustModal(item)
      }
    ],
    [
      {
        label: 'Historique',
        icon: 'i-heroicons-clock',
        onSelect: () => router.push(`/inventory/movements?product_id=${item.product_id}`)
      },
      {
        label: 'Copier SKU',
        icon: 'i-heroicons-clipboard',
        onSelect: () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(item.sku)
            toast.add({
              title: 'SKU copié',
              color: 'success',
              icon: 'i-heroicons-check-circle'
            })
          }
        }
      }
    ]
  ]
}

function openAdjustModal(item: InventoryItem) {
  selectedItem.value = item
  isAdjustModalOpen.value = true
}

async function handleSuccess() {
  isAdjustModalOpen.value = false
  selectedItem.value = null
  await Promise.all([
    fetchInventoryItems(),
    fetchStatistics()
  ])
}

async function handleExport() {
  await downloadExport({ format: 'csv' })
}

// ✅ AJOUT : Fonction de réinitialisation des filtres
function handleResetFilters() {
  resetFilters()
  // Les computed vont automatiquement se mettre à jour
}

// ✅ AJOUT : Rafraîchissement complet
async function handleRefresh() {
  await Promise.all([
    fetchInventoryItems(),
    fetchStatistics()
  ])
}

// ========================================
// Computed
// ========================================
const selectedIds = computed<string[]>(() => {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getSelectedRowModel().rows.map(row => row.original.id)
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => setPage(val - 1)
})

const visibleColumns = computed(() =>
  table.value?.tableApi?.getAllColumns().filter(c => c.getCanHide()) || []
)

// Indicateur de filtres actifs
const hasActiveFilters = computed(() => {
  return !!(
    filters.value.search ||
    (filters.value.status && filters.value.status !== 'all') ||
    filters.value.in_stock_only ||
    filters.value.low_stock_only ||
    filters.value.out_of_stock_only
  )
})

// ========================================
// Lifecycle
// ========================================
onMounted(async () => {
  await Promise.all([
    fetchInventoryItems(),
    fetchStatistics()
  ])
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Inventaire" :badge="pagination.total">
        <template #right>
          <UButton
            icon="i-heroicons-arrow-path"
            color="neutral"
            variant="outline"
            :loading="loading"
            @click="handleRefresh">
            Actualiser
          </UButton>
          <UButton
            icon="i-heroicons-plus"
            to="/products/create"
            color="primary">
            Nouveau produit
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Cartes Statistiques -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <UCard :ui="{ body: 'p-4' }">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Valeur du stock
              </p>
              <p v-if="!loading" class="mt-1 text-2xl font-bold text-gray-900 dark:text-white truncate">
                {{ formatPriceXOF(totalStockValue) }}
              </p>
              <USkeleton v-else class="mt-2 h-8 w-24" />
            </div>
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-900/10 dark:text-primary-400">
              <UIcon name="i-heroicons-banknotes" class="h-6 w-6" />
            </div>
          </div>
        </UCard>

        <UCard :ui="{ body: 'p-4' }">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Produits en stock
              </p>
              <p v-if="!loading" class="mt-1 text-2xl font-bold text-gray-900 dark:text-white truncate">
                {{ statistics?.total_items_in_stock ?? 0 }}
              </p>
              <USkeleton v-else class="mt-2 h-8 w-24" />
            </div>
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 dark:bg-green-900/10 dark:text-green-400">
              <UIcon name="i-heroicons-cube" class="h-6 w-6" />
            </div>
          </div>
        </UCard>

        <UCard
          class="cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all"
          :ui="{ body: 'p-4' }"
          @click="router.push('/inventory/low-stock')">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Stock faible
              </p>
              <p v-if="!loading" class="mt-1 text-2xl font-bold text-gray-900 dark:text-white truncate">
                {{ lowStockCount }}
              </p>
              <USkeleton v-else class="mt-2 h-8 w-24" />
            </div>
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/10 dark:text-orange-400">
              <UIcon name="i-heroicons-exclamation-triangle" class="h-6 w-6" />
            </div>
          </div>
        </UCard>

        <UCard
          class="cursor-pointer hover:ring-2 hover:ring-red-500/50 transition-all"
          :ui="{ body: 'p-4' }"
          @click="router.push('/inventory/low-stock?filter=out')">
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                Ruptures
              </p>
              <p v-if="!loading" class="mt-1 text-2xl font-bold text-gray-900 dark:text-white truncate">
                {{ outOfStockCount }}
              </p>
              <USkeleton v-else class="mt-2 h-8 w-24" />
            </div>
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-900/10 dark:text-red-400">
              <UIcon name="i-heroicons-x-circle" class="h-6 w-6" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Barre d'outils -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <!-- ✅ CORRECTION : v-model direct sur le computed -->
          <UInput
            v-model="localSearch"
            icon="i-heroicons-magnifying-glass"
            placeholder="Nom, SKU, Marque..."
            class="w-full sm:w-72"
            :ui="{ trailing: 'pointer-events-auto' }">
            <template v-if="localSearch" #trailing>
              <UButton
                color="neutral"
                variant="link"
                icon="i-heroicons-x-mark"
                :padded="false"
                @click="localSearch = ''" />
            </template>
          </UInput>

          <USelectMenu
            v-model="localStatus"
            :items="Object.entries(statusLabels).map(([v, l]) => ({ label: l, value: v }))"
            value-key="value"
            label-key="label"
            class="w-40" />

          <USelectMenu
            v-model="localStockStatus"
            :items="Object.entries(stockStatusLabels).map(([v, l]) => ({ label: l, value: v }))"
            value-key="value"
            label-key="label"
            class="w-40" />

          <!-- ✅ AJOUT : Badge indicateur de filtres actifs -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 scale-90"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-90">
            <div v-if="hasActiveFilters">
              <UButton
                color="neutral"
                variant="soft"
                size="xs"
                icon="i-heroicons-x-mark"
                label="Réinitialiser"
                @click="handleResetFilters" />
            </div>
          </Transition>
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions de masse -->
          <Transition
            enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1">
            <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedIds.length }} sélectionné(s)
              </span>
              <UButton
                color="neutral"
                variant="soft"
                icon="i-heroicons-arrow-down-tray"
                label="Exporter"
                @click="handleExport" />
            </div>
          </Transition>

          <UButton
            v-if="selectedIds.length === 0"
            icon="i-heroicons-arrow-down-tray"
            color="neutral"
            variant="outline"
            label="Exporter"
            @click="handleExport" />

          <!-- Menu Colonnes -->
          <UDropdownMenu
            :items="visibleColumns.map(col => ({
              label: upperFirst(col.id),
              type: 'checkbox',
              checked: col.getIsVisible(),
              onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v)
            }))"
            :content="{ align: 'end' }">
            <UButton icon="i-heroicons-adjustments-vertical" color="neutral" variant="ghost" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau -->
      <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="inventoryItems"
          :columns="columns"
          :loading="loading"
          class="flex-1">

          <!-- Loading State -->
          <template #loading-state>
            <div class="p-4 space-y-4">
              <div v-for="i in 5" :key="i" class="flex items-center gap-4 animate-pulse">
                <div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div class="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded" />
                <div class="space-y-2 flex-1">
                  <div class="h-4 w-[30%] bg-gray-200 dark:bg-gray-700 rounded" />
                  <div class="h-3 w-[20%] bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
                <UIcon name="i-heroicons-cube" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">Aucun produit trouvé</p>
              <p v-if="hasActiveFilters" class="text-sm text-gray-500 mt-1">
                Essayez de modifier vos filtres.
              </p>
              <UButton
                v-if="hasActiveFilters"
                label="Réinitialiser les filtres"
                variant="link"
                color="neutral"
                class="mt-2"
                @click="handleResetFilters" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> résultat(s)
        </span>
        <UPagination v-model:page="currentPage" :total="pagination.total" :items-per-page="pagination.pageSize" />
      </div>

      <!-- Modale d'ajustement -->
      <InventoryAdjustStockModal
        v-if="selectedItem"
        :open="isAdjustModalOpen"
        :item="selectedItem"
        @update:open="isAdjustModalOpen = $event"
        @success="handleSuccess"
      />
    </template>
  </UDashboardPanel>
</template>
