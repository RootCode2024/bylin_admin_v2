<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Product, ProductStatus } from '~/types/product'
import type { Table as TanstackTable } from '@tanstack/table-core'
import { getProductStatusLabel, getProductStatusColor } from '~/types/product'
import type { Collection } from '~/types/collection'

definePageMeta({
  layout: 'default',
  title: 'Produits',
  description: 'Gérer le catalogue produits'
})

// ========================================
// Composants résolus
// ========================================
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UTooltip = resolveComponent('UTooltip')
const UIcon = resolveComponent('UIcon')

// ========================================
// Composables
// ========================================
const toast = useToast()
const router = useRouter()
const route = useRoute()

const {
  state,
  isLoading,
  fetchProducts,
  deleteProducts,
  duplicateProduct,
  setSearch,
  setStatusFilter,
  setStockFilter,
  setCollectionFilter,
  resetFilters,
  setPage
} = useProduct()

const { fetchCollection } = useCollections()

// ========================================
// État local UI
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<Product> }>('table')
const rowSelection = ref<Record<string, boolean>>({})

// Filtres UI locaux
const localSearch = ref<string>(state.value.filters.search || '')
const localStatus = ref<ProductStatus | 'all'>(state.value.filters.status || 'all')
const localStock = ref<'all' | 'in_stock' | 'out_of_stock'>('all')

// État pour la collection filtrée
const filteredCollection = ref<Collection | null>(null)

// Modales
const isDeleteModalOpen = ref(false)
const idsToDelete = ref<string[]>([])

// ========================================
// Configuration
// ========================================
const statusLabels: Record<ProductStatus | 'all', string> = {
  all: 'Tous les statuts',
  active: 'Actifs',
  draft: 'Brouillons',
  out_of_stock: 'Rupture',
  preorder: 'Précommande',
  inactive: 'Inactifs',
  discontinued: 'Arrêtés'
}

const stockLabels = {
  all: 'Tout le stock',
  in_stock: 'En stock',
  out_of_stock: 'Épuisé'
}

// ========================================
// Colonnes de la table
// ========================================
const columns: TableColumn<Product>[] = [
  {
    id: 'select',
    header: ({ table }) => h(UCheckbox, {
      'modelValue': table.getIsAllPageRowsSelected(),
      'onUpdate:modelValue': (value: boolean) => table.toggleAllPageRowsSelected(!!value),
      'ariaLabel': 'Tout sélectionner'
    }),
    cell: ({ row }) => h(UCheckbox, {
      'modelValue': row.getIsSelected(),
      'onUpdate:modelValue': (value: boolean) => row.toggleSelected(!!value),
      'ariaLabel': 'Sélectionner'
    }),
    enableHiding: false
  },
  {
    accessorKey: 'name',
    header: 'Produit',
    cell: ({ row }) => {
      const product = row.original
      const image = product.media?.[0]?.original_url || product.thumbnail_url

      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group min-w-[250px]',
        onClick: () => navigateTo(`/products/${product.id}`)
      }, [
        image
          ? h(UAvatar, {
            src: image,
            alt: product.name,
            size: 'lg',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105 rounded-md'
          })
          : h(UAvatar, {
            icon: 'i-lucide-image',
            size: 'lg',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 bg-gray-100 dark:bg-gray-800 rounded-md'
          }),
        h('div', { class: 'flex-1 overflow-hidden' }, [
          h('p', {
            class: 'font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors'
          }, product.name),
          h('div', { class: 'flex items-center gap-2 text-xs text-gray-500' }, [
            h('span', { class: 'font-mono' }, product.sku),
            product.brand && h('span', { class: 'text-gray-400' }, `• ${product.brand.name}`)
          ])
        ])
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status
      return h(UBadge, {
        variant: 'subtle',
        class: `${getProductStatusColor(status)} capitalize`,
        size: 'sm'
      }, () => getProductStatusLabel(status))
    }
  },
  {
    accessorKey: 'stock',
    header: 'Stock',
    cell: ({ row }) => {
      const p = row.original
      if (!p.track_inventory) {
        return h(UTooltip, { text: 'Stock infini' }, () =>
          h(UIcon, { name: 'i-lucide-infinity', class: 'text-gray-400' })
        )
      }

      let color = 'neutral'
      if (p.stock_quantity <= 0) color = 'error'
      else if (p.stock_quantity <= p.low_stock_threshold) color = 'warning'
      else color = 'success'

      return h(UBadge, {
        variant: 'outline',
        color: color as any,
        size: 'md'
      }, () => `${p.stock_quantity} un.`)
    }
  },
  {
    accessorKey: 'price',
    header: 'Prix',
    meta: {
      class: {
        th: 'text-right font-bold text-primary'
      }
    },
    cell: ({ row }) => h('div', {
      class: 'font-bold text-right text-primary'
    }, formatPriceXOF(row.original.price))
  },
  {
    id: 'flags',
    header: 'Attributs',
    cell: ({ row }) => {
      const p = row.original
      const icons = []

      if (p.is_featured) {
        icons.push(h(UTooltip, { text: 'Mis en avant' }, () =>
          h(UIcon, { name: 'i-lucide-star', class: 'text-yellow-500 w-4 h-4' })
        ))
      }
      if (p.is_preorder_enabled) {
        icons.push(h(UTooltip, { text: 'Précommande activée' }, () =>
          h(UIcon, { name: 'i-lucide-clock', class: 'text-blue-500 w-4 h-4' })
        ))
      }
      if (p.requires_authenticity) {
        icons.push(h(UTooltip, { text: 'Certifié Bylin' }, () =>
          h(UIcon, { name: 'i-lucide-shield-check', class: 'text-purple-500 w-4 h-4' })
        ))
      }

      return h('div', { class: 'flex items-center gap-1.5' }, icons)
    }
  },
  {
    accessorKey: 'stats',
    header: 'Vues',
    cell: ({ row }) => h('span', {
      class: 'text-xs text-gray-500'
    }, row.original.views_count)
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
        icon: 'i-lucide-ellipsis-vertical',
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
function getRowItems(product: Product) {
  return [
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-pencil',
        onSelect: () => router.push(`/products/${product.id}`)
      },
      {
        label: 'Dupliquer',
        icon: 'i-lucide-copy',
        onSelect: async () => {
          const newProduct = await duplicateProduct(product.id)
          if (newProduct) {
            toast.add({
              title: 'Produit dupliqué',
              color: 'success',
              icon: 'i-lucide-copy'
            })
          }
        }
      },
      {
        label: 'Voir sur le site',
        icon: 'i-lucide-external-link',
        to: `/products/${product.slug}`,
        target: '_blank'
      }
    ],
    [
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: () => {
          idsToDelete.value = [product.id]
          isDeleteModalOpen.value = true
        }
      }
    ]
  ]
}

function openDeleteModal(ids: string[]) {
  idsToDelete.value = ids
  isDeleteModalOpen.value = true
}

function clearCollectionFilter() {
  filteredCollection.value = null
  setCollectionFilter(null)
  router.push({ query: { ...route.query, collection_id: undefined } })
}

function handleReset() {
  localSearch.value = ''
  localStatus.value = 'all'
  localStock.value = 'all'
  clearCollectionFilter()
  resetFilters()
}

// ========================================
// Computed
// ========================================
const selectedIds = computed(() => {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getSelectedRowModel().rows.map(row => row.original.id)
})

const currentPage = computed({
  get: () => state.value.pagination?.current_page || 1,
  set: (val) => setPage(val)
})

const visibleColumns = computed(() =>
  table.value?.tableApi?.getAllColumns().filter(c => c.getCanHide()) || []
)

// ========================================
// Watchers & Init
// ========================================

// Recherche avec debounce
watchDebounced(
  localSearch,
  (val) => setSearch(val),
  { debounce: 400 }
)

// Filtre statut
watch(localStatus, (val) => {
  setStatusFilter(val)
})

// Filtre stock
watch(localStock, (val) => {
  setStockFilter(val)
})

watch(
  () => route.query.collection_id,
  async (collectionId) => {
    if (collectionId && typeof collectionId === 'string') {

      const collection = await fetchCollection(collectionId)
      if (collection) {
        filteredCollection.value = collection
        setCollectionFilter(collectionId)
      }
    } else {
      filteredCollection.value = null
      setCollectionFilter(null)
    }
  },
  { immediate: true }
)

// Chargement initial
onMounted(() => {
  if (!route.query.collection_id) {
    fetchProducts()
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Produits" :badge="state.pagination?.total || 0">
        <template #right>
          <UButton label="Nouveau produit" icon="i-lucide-plus" color="primary" to="/products/create" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Badge filtre collection -->
      <UAlert v-if="filteredCollection" color="primary" variant="subtle" icon="i-lucide-filter" class="mb-4">
        <template #title>
          <div class="flex items-center justify-between">
            <span class="text-sm">
              Filtré par collection :
              <span class="font-semibold">{{ filteredCollection.name }}</span>
            </span>
            <UButton icon="i-lucide-x" color="primary" variant="ghost" size="xs" @click="clearCollectionFilter" />
          </div>
        </template>
      </UAlert>

      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <UInput v-model="localSearch" icon="i-lucide-search" placeholder="Rechercher (Nom, SKU, Tags)..."
            class="w-full sm:w-72" :ui="{ trailing: 'pointer-events-auto' }">
            <template #trailing v-if="localSearch">
              <UButton color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="localSearch = ''" />
            </template>
          </UInput>

          <USelectMenu v-model="localStatus" :items="Object.entries(statusLabels).map(([v, l]) => ({
            label: l,
            value: v
          }))" value-key="value" label-key="label" class="w-40" />

          <USelectMenu v-model="localStock" :items="Object.entries(stockLabels).map(([v, l]) => ({
            label: l,
            value: v
          }))" value-key="value" label-key="label" class="w-40" />

          <UButton v-if="localSearch || localStatus !== 'all' || localStock !== 'all' || filteredCollection"
            icon="i-lucide-filter-x" color="gray" variant="ghost" label="Reset" @click="handleReset" />
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions de masse -->
          <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-1"
            leave-active-class="transition duration-150" leave-to-class="opacity-0 translate-y-1">
            <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
              <UButton color="error" variant="soft" icon="i-lucide-trash-2" :label="`Supprimer (${selectedIds.length})`"
                @click="openDeleteModal(selectedIds)" />
            </div>
          </Transition>

          <!-- Menu Colonnes -->
          <UDropdownMenu :items="visibleColumns.map(col => ({
            label: upperFirst(col.id === 'name' ? 'Nom' : col.id === 'flags' ? 'Attributs' : col.id),
            type: 'checkbox',
            checked: col.getIsVisible(),
            onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v)
          }))" :content="{ align: 'end' }">
            <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="outline" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau -->
      <div
        class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable ref="table" v-model:row-selection="rowSelection" :data="[...state.products]" :columns="columns"
          :loading="isLoading" class="flex-1">
          <!-- Loading State -->
          <template #loading-state>
            <div class="p-4 space-y-4">
              <div v-for="i in 5" :key="i" class="flex items-center gap-4">
                <USkeleton class="h-4 w-4 rounded" />
                <USkeleton class="h-12 w-12 rounded-md" />
                <div class="space-y-2 flex-1">
                  <USkeleton class="h-4 w-[40%]" />
                  <USkeleton class="h-3 w-[25%]" />
                </div>
                <USkeleton class="h-6 w-20 rounded-full" />
                <USkeleton class="h-4 w-16" />
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
                <UIcon name="i-lucide-package-search" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">
                Aucun produit trouvé
              </p>
              <p v-if="localSearch || localStatus !== 'all' || filteredCollection" class="text-sm text-gray-500 mt-1">
                Essayez de modifier vos critères de recherche.
              </p>
              <UButton v-else label="Créer un produit" color="primary" class="mt-4" to="/products/create" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ state.pagination?.total }}</span>
          produit(s)
        </span>
        <UPagination v-model:page="currentPage" :total="state.pagination?.total"
          :items-per-page="state.pagination?.per_page" />
      </div>
    </template>
  </UDashboardPanel>
</template>
