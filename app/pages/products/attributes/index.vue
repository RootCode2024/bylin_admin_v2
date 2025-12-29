<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Attribute } from '~/types/attribute'
import type { Table as TanstackTable } from '@tanstack/table-core'
import { getAttributeTypeLabel, getAttributeTypeIcon, getAttributeTypeColor, createValuesPreview } from '~/utils/attribute'

definePageMeta({
  layout: 'default',
  title: 'Attributs',
  description: 'Gérer les attributs de produits'
})

// Composants résolus
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

const toast = useToast()

const {
  attributes,
  loading,
  pagination,
  filters,
  hasActiveFilters,
  fetchAttributes,
  setPage,
  setSearch,
  setType,
  setFilterable,
  setTrashedFilter,
  resetFilters
} = useAttributes()

// États locaux
const table = useTemplateRef<{ tableApi: TanstackTable<Attribute> }>('table')
const rowSelection = ref<Record<string, boolean>>({})

const localSearch = ref<string>(filters.value.search || '')
const localType = ref<string>('all')
const localFilterable = ref<string>('all')
const showTrashed = ref<boolean>(filters.value.only_trashed || false)

// Modales
const isEditModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const attributeToEdit = ref<Attribute | null>(null)
const idsToDelete = ref<string[]>([])

// Labels
const typeLabels: Record<string, string> = {
  all: 'Tous les types',
  text: 'Texte',
  select: 'Sélection',
  color: 'Couleur',
  size: 'Taille',
  boolean: 'Oui/Non'
}

const filterableLabels: Record<string, string> = {
  all: 'Tous',
  filterable: 'Filtrables uniquement',
  non_filterable: 'Non filtrables'
}

// Colonnes
const columns: TableColumn<Attribute>[] = [
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
    header: 'Attribut',
    cell: ({ row }) => {
      const attr = row.original
      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group',
        onClick: () => openEditModal(attr)
      }, [
        h(UAvatar, {
          icon: getAttributeTypeIcon(attr.type),
          size: 'md',
          class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
        }),
        h('div', { class: 'flex-1' }, [
          h('div', { class: 'flex items-center gap-2' }, [
            h('p', {
              class: 'font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors'
            }, attr.name),
            attr.is_filterable && h(UBadge, {
              variant: 'subtle',
              color: 'info',
              size: 'xs'
            }, () => 'Filtrable')
          ]),
          h('p', { class: 'text-xs text-gray-500 font-mono' }, attr.code)
        ])
      ])
    }
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.original.type
      return h(UBadge, {
        variant: 'subtle',
        color: getAttributeTypeColor(type),
        size: 'sm'
      }, () => getAttributeTypeLabel(type))
    }
  },
  {
    accessorKey: 'values',
    header: 'Valeurs',
    cell: ({ row }) => {
      const attr = row.original
      const count = attr.values?.length || 0

      if (count === 0) {
        return h('span', { class: 'text-sm text-gray-400' }, '—')
      }

      const preview = attr.values ? createValuesPreview(attr.values, 3) : ''

      return h('div', { class: 'space-y-1' }, [
        h(UBadge, {
          variant: 'subtle',
          color: 'primary',
          size: 'sm'
        }, () => `${count} valeur${count > 1 ? 's' : ''}`),
        h('p', { class: 'text-xs text-gray-500 truncate max-w-[200px]' }, preview)
      ])
    }
  },
  {
    accessorKey: 'sort_order',
    header: 'Ordre',
    cell: ({ row }) => h('span', {
      class: 'text-sm font-mono text-gray-600'
    }, row.original.sort_order.toString())
  },
  {
    accessorKey: 'created_at',
    header: 'Créé le',
    cell: ({ row }) => {
      const date = new Date(row.original.created_at)
      return h('span', { class: 'text-sm text-gray-600' },
        date.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      )
    }
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

// Actions
function getRowItems(attribute: Attribute) {
  return [
    [{
      label: 'Modifier',
      icon: 'i-lucide-pencil',
      onSelect: () => openEditModal(attribute)
    },
    {
      label: 'Copier ID',
      icon: 'i-lucide-copy',
      onSelect: () => {
        navigator.clipboard.writeText(attribute.id)
        toast.add({
          title: 'ID copié',
          color: 'success',
          icon: 'i-lucide-check'
        })
      }
    }],
    [{
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        idsToDelete.value = [attribute.id]
        isDeleteModalOpen.value = true
      }
    }]
  ]
}

function openEditModal(attribute: Attribute) {
  attributeToEdit.value = attribute
  isEditModalOpen.value = true
}

function openDeleteModal(ids: string[]) {
  idsToDelete.value = ids
  isDeleteModalOpen.value = true
}

function handleReset() {
  localSearch.value = ''
  localType.value = 'all'
  localFilterable.value = 'all'
  showTrashed.value = false
  resetFilters()
}

function onSuccess() {
  rowSelection.value = {}
  fetchAttributes()
}

// Computed
const selectedIds = computed(() => {
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

// Watchers
watchDebounced(
  localSearch,
  (val) => {
    if (val !== undefined) {
      setSearch(val)
    }
  },
  { debounce: 400 }
)

watch(localType, (val) => setType(val))
watch(localFilterable, (val) => {
  if (val === 'all') {
    setFilterable(undefined)
  } else if (val === 'filterable') {
    setFilterable(true)
  } else {
    setFilterable(false)
  }
})
watch(showTrashed, (val) => setTrashedFilter(false, val))

onMounted(() => {
  if (localType.value === 'all' && localFilterable.value === 'all' && !localSearch.value) {
    fetchAttributes()
  }
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Attributs" :badge="pagination.total">
        <template #right>
          <AttributeCreateModal @created="onSuccess" />
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
placeholder="Rechercher un attribut..."
            class="w-full sm:w-72"
:ui="{ trailing: 'pointer-events-auto' }">
            <template v-if="localSearch" #trailing>
              <UButton
color="neutral"
variant="link"
icon="i-lucide-x"
:padded="false"
@click="localSearch = ''" />
            </template>
          </UInput>

          <USelectMenu
v-model="localType"
:items="Object.entries(typeLabels).map(([v, l]) => ({ label: l, value: v }))"
            value-key="value"
label-key="label"
class="w-48" />

          <USelectMenu
v-model="localFilterable"
            :items="Object.entries(filterableLabels).map(([v, l]) => ({ label: l, value: v }))"
value-key="value"
            label-key="label"
class="w-52" />

          <UButton
v-if="hasActiveFilters"
icon="i-lucide-filter-x"
color="gray"
variant="ghost"
label="Effacer filtres"
            @click="handleReset" />
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions de masse -->
          <Transition
enter-active-class="transition duration-200"
enter-from-class="opacity-0 translate-y-1"
            leave-active-class="transition duration-150"
leave-to-class="opacity-0 translate-y-1">
            <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
              <UButton
color="error"
variant="soft"
icon="i-lucide-trash-2"
:label="`Supprimer (${selectedIds.length})`"
                @click="openDeleteModal(selectedIds)" />
            </div>
          </Transition>

          <!-- Menu Colonnes -->
          <UDropdownMenu
:items="visibleColumns.map(col => ({
            label: upperFirst(col.id),
            type: 'checkbox',
            checked: col.getIsVisible(),
            onUpdateChecked: (v: boolean) => col.toggleVisibility(!!v)
          }))"
:content="{ align: 'end' }">
            <UButton icon="i-lucide-sliders-horizontal" color="neutral" variant="outline" />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau -->
      <div
        class="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex-1 flex flex-col">
        <UTable
ref="table"
v-model:row-selection="rowSelection"
:data="attributes as any"
:columns="columns"
          :loading="loading"
class="flex-1">
          <!-- Loading State -->
          <template #loading-state>
            <div class="p-4 space-y-4">
              <div v-for="i in 5" :key="i" class="flex items-center gap-4">
                <USkeleton class="h-4 w-4 rounded" />
                <USkeleton class="h-10 w-10 rounded-full" />
                <div class="space-y-2 flex-1">
                  <USkeleton class="h-4 w-[30%]" />
                  <USkeleton class="h-3 w-[20%]" />
                </div>
                <USkeleton class="h-6 w-20 rounded-full" />
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <template #empty-state>
            <div class="flex flex-col items-center justify-center py-16 text-center">
              <div class="p-4 rounded-full bg-gray-50 dark:bg-gray-800/50 mb-3">
                <UIcon name="i-lucide-tag" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">Aucun attribut trouvé</p>
              <p v-if="localSearch || localType !== 'all'" class="text-sm text-gray-500 mt-1">
                Essayez de modifier vos filtres.
              </p>
              <UButton
v-if="localSearch || localType !== 'all'"
label="Réinitialiser"
variant="link"
class="mt-2"
                @click="handleReset" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> attribut(s)
        </span>
        <UPagination v-model:page="currentPage" :total="pagination.total" :items-per-page="pagination.pageSize" />
      </div>

      <!-- Modales -->
      <AttributeEditModal v-model:open="isEditModalOpen" :attribute="attributeToEdit" @updated="onSuccess" />
      <AttributeDeleteModal v-model:open="isDeleteModalOpen" :ids="idsToDelete" @success="onSuccess" />
    </template>
  </UDashboardPanel>
</template>
