<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Collection } from '~/types/collection'
import type { Table as TanstackTable } from '@tanstack/table-core'
import { getCollectionStatusLabel, getCollectionStatusColor } from '~/types/collection'

definePageMeta({
  layout: 'default',
  title: 'Collections',
  description: 'Gérer les collections de produits'
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

const {
  state,
  isLoading,
  fetchCollections,
  deleteCollection,
  deleteCollections,
  toggleActive,
  setSearch,
  setStatusFilter,
  resetFilters,
  setPage
} = useCollections()

// ========================================
// État local UI
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<Collection> }>('table')
const rowSelection = ref<Record<string, boolean>>({})

// Filtres UI locaux
const localSearch = ref<string>(state.value.filters.search || '')
const localStatus = ref<boolean | 'all'>(state.value.filters.is_active || 'all')

// Modales
const isCreateModalOpen = ref(false)
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const selectedCollection = ref<Collection | null>(null)
const idsToDelete = ref<string[]>([])

// ========================================
// Configuration
// ========================================
const statusOptions = [
  { label: 'Toutes', value: 'all' },
  { label: 'Actives', value: true },
  { label: 'Inactives', value: false }
]

// ========================================
// Colonnes de la table
// ========================================
const columns: TableColumn<Collection>[] = [
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
    header: 'Collection',
    cell: ({ row }) => {
      const collection = row.original
      
      const coverImage = collection.cover_image_url

      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group min-w-[250px]',
        onClick: () => navigateTo(`/products/collections/${collection.id}`)
      }, [
        coverImage
          ? h(UAvatar, {
            src: coverImage,
            alt: collection.name,
            size: 'lg',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105 rounded-md'
          })
          : h(UAvatar, {
            icon: 'i-lucide-folder',
            size: 'lg',
            class: 'ring-1 ring-gray-200 dark:ring-gray-800 bg-gray-100 dark:bg-gray-800 rounded-md'
          }),
        h('div', { class: 'flex-1 overflow-hidden' }, [
          h('p', {
            class: 'font-medium text-gray-900 dark:text-white truncate group-hover:text-primary-500 transition-colors'
          }, collection.name),
          collection.description && h('p', {
            class: 'text-xs text-gray-500 truncate'
          }, collection.description)
        ])
      ])
    }
  },
  {
    accessorKey: 'products_count',
    header: 'Produits',
    cell: ({ row }) => h('div', {
      class: 'flex items-center gap-2'
    }, [
      h(UIcon, {
        name: 'i-lucide-package',
        class: 'w-4 h-4 text-gray-400'
      }),
      h('span', {
        class: 'font-medium'
      }, row.original.products_count || 0)
    ])
  },
  {
    accessorKey: 'is_active',
    header: 'Statut',
    cell: ({ row }) => {
      const isActive = row.original.is_active
      return h(UBadge, {
        variant: 'subtle',
        color: getCollectionStatusColor(isActive),
        size: 'sm'
      }, () => getCollectionStatusLabel(isActive))
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Date création',
    cell: ({ row }) => h('span', {
      class: 'text-sm text-gray-500'
    }, new Date(row.original.created_at).toLocaleDateString('fr-FR'))
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
function getRowItems(collection: Collection) {
  return [
    [
      {
        label: 'Modifier',
        icon: 'i-lucide-pencil',
        onSelect: () => {
          selectedCollection.value = collection
          isEditModalOpen.value = true
        }
      },
      {
        label: collection.is_active ? 'Désactiver' : 'Activer',
        icon: collection.is_active ? 'i-lucide-eye-off' : 'i-lucide-eye',
        onSelect: async () => {
          await toggleActive(collection.id)
        }
      },
      {
        label: 'Voir les produits',
        icon: 'i-lucide-package',
        onSelect: () => router.push(`/products?collection_id=${collection.id}`)
      }
    ],
    [
      {
        label: 'Supprimer',
        icon: 'i-lucide-trash',
        color: 'error',
        onSelect: () => {
          idsToDelete.value = [collection.id]
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

async function handleDeleteConfirm() {
  const success = await deleteCollections(idsToDelete.value)

  if (success) {
    isDeleteModalOpen.value = false
    rowSelection.value = {}
  }
}

/**
 * Réinitialise tous les filtres
 */
function handleReset() {
  localSearch.value = ''
  localStatus.value = 'all'
  resetFilters()
}

/**
 * Gère la création réussie
 */
function handleCollectionCreated() {
  isCreateModalOpen.value = false
  fetchCollections()
}

/**
 * Gère la mise à jour réussie
 */
function handleCollectionUpdated() {
  isEditModalOpen.value = false
  selectedCollection.value = null
  fetchCollections()
}

/**
 * Gère la suppression réussie
 */
function handleCollectionDeleted() {
  isDeleteModalOpen.value = false
  idsToDelete.value = []
  rowSelection.value = {}
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

// Chargement initial
onMounted(() => {
  fetchCollections()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar
        title="Collections"
        :badge="state.pagination?.total || 0"
      >
        <template #right>
          <UButton
            label="Nouvelle collection"
            icon="i-lucide-plus"
            color="primary"
            @click="isCreateModalOpen = true"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 w-full lg:w-auto flex-wrap">
          <UInput
            v-model="localSearch"
            icon="i-lucide-search"
            placeholder="Rechercher une collection..."
            class="w-full sm:w-72"
            :ui="{ trailing: 'pointer-events-auto' }"
          >
            <template #trailing v-if="localSearch">
              <UButton
                color="neutral"
                variant="link"
                icon="i-lucide-x"
                :padded="false"
                @click="localSearch = ''"
              />
            </template>
          </UInput>

          <USelectMenu
            v-model="localStatus"
            :items="statusOptions"
            value-key="value"
            label-key="label"
            class="w-40"
          />

          <UButton
            v-if="localSearch || localStatus !== 'all'"
            icon="i-lucide-filter-x"
            color="gray"
            variant="ghost"
            label="Reset"
            @click="handleReset"
          />
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions de masse -->
          <Transition
            enter-active-class="transition duration-200"
            enter-from-class="opacity-0 translate-y-1"
            leave-active-class="transition duration-150"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
              <UButton
                color="error"
                variant="soft"
                icon="i-lucide-trash-2"
                :label="`Supprimer (${selectedIds.length})`"
                @click="openDeleteModal(selectedIds)"
              />
            </div>
          </Transition>

          <!-- Menu Colonnes -->
          <UDropdownMenu
            :items="visibleColumns.map(col => ({
              label: upperFirst(col.id === 'name' ? 'Collection' : col.id),
              type: 'checkbox',
              checked: col.getIsVisible(),
              onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v)
            }))"
            :content="{ align: 'end' }"
          >
            <UButton
              icon="i-lucide-sliders-horizontal"
              color="neutral"
              variant="outline"
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau -->
      <div class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable
          ref="table"
          v-model:row-selection="rowSelection"
          :data="[...state.collections]"
          :columns="columns"
          :loading="isLoading"
          class="flex-1"
        >
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
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
                <UIcon name="i-lucide-folder-search" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">
                Aucune collection trouvée
              </p>
              <p
                v-if="localSearch || localStatus !== 'all'"
                class="text-sm text-gray-500 mt-1"
              >
                Essayez de modifier vos critères de recherche.
              </p>
              <UButton
                v-else
                label="Créer une collection"
                color="primary"
                class="mt-4"
                @click="isCreateModalOpen = true"
              />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ state.pagination?.total }}</span> collection(s)
        </span>
        <UPagination
          v-model:page="currentPage"
          :total="state.pagination?.total"
          :items-per-page="state.pagination?.per_page"
        />
      </div>
    </template>
  </UDashboardPanel>

  <!-- Modales -->
  <CollectionCreateModal v-model:open="isCreateModalOpen" @created="handleCollectionCreated" />

  <CollectionEditModal v-model:open="isEditModalOpen" :collection="selectedCollection"
    @updated="handleCollectionUpdated" />

  <CollectionDeleteModal v-model:open="isDeleteModalOpen" :collection-ids="idsToDelete"
    @deleted="handleCollectionDeleted" />
</template>
