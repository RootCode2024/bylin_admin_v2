<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Customer } from '~/types/customer'
import type { Table as TanstackTable } from '@tanstack/table-core'

definePageMeta({
  layout: 'default'
})

// ========================================
// Composants résolus
// ========================================
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UCheckbox = resolveComponent('UCheckbox')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')

// ========================================
// Composables
// ========================================
const toast = useToast()
const router = useRouter()

const {
  customers,
  loading,
  pagination,
  filters,
  fetchCustomers,
  setPage,
  setSearch,
  setStatus,
  setTrashedFilter,
  updateStatus,
  restoreCustomers,
  exportCustomers
} = useCustomers()

// ========================================
// État local
// ========================================
const table = useTemplateRef<{ tableApi: TanstackTable<Customer> }>('table')
const rowSelection = ref<Record<string, boolean>>({})
const localSearch = ref(filters.value.search)
const localStatus = ref(filters.value.status)
const showTrashed = ref(filters.value.onlyTrashed)

// Modales
const isDeleteModalOpen = ref(false)
const isRestoreModalOpen = ref(false)
const isExportModalOpen = ref(false)
const idsToDelete = ref<string[]>([])
const idsToRestore = ref<string[]>([])

// ========================================
// Configuration
// ========================================
const statusLabels: Record<string, string> = {
  all: 'Tous',
  active: 'Actif',
  inactive: 'Inactif',
  suspended: 'Suspendu'
}

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'neutral',
  suspended: 'warning'
}

// ========================================
// Colonnes de la table
// ========================================
const columns: TableColumn<Customer>[] = [
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
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs text-gray-500' }, row.original.id.substring(0, 8))
  },
  {
    accessorKey: 'name',
    header: 'Client',
    cell: ({ row }) => {
      const fullName = `${row.original.first_name} ${row.original.last_name}`
      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group',
        onClick: () => router.push(`/customers/${row.original.id}`)
      }, [
        h(UAvatar, {
          src: row.original.avatar_url,
          alt: fullName,
          size: 'md',
          class: 'ring-1 ring-gray-200 dark:ring-gray-800 transition-transform group-hover:scale-105'
        }),
        h('div', [
          h('p', { class: 'font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, fullName),
          h('p', { class: 'text-xs text-gray-500' }, row.original.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'phone',
    header: 'Téléphone',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-sm' },
        formatPhone(
          row.original.phone,
          getCustomerCountryCode(row.original)
        )
      )
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status
      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: statusColors[status] || 'neutral',
        size: 'sm'
      }, () => statusLabels[status] || status)
    }
  },
  {
    accessorKey: 'created_at',
    header: 'Inscrit le',
    cell: ({ row }) => h('span', { class: 'text-sm text-gray-600' },
      new Date(row.original.created_at).toLocaleDateString('fr-FR')
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
function getRowItems(customer: Customer) {
  const items: any[] = [
    [
      {
        label: 'Voir détails',
        icon: 'i-lucide-eye',
        onSelect: () => router.push(`/customers/${customer.id}`)
      },
      {
        label: 'Copier ID',
        icon: 'i-lucide-copy',
        onSelect: () => {
          navigator.clipboard.writeText(customer.id)
          toast.add({ title: 'ID copié', color: 'success', icon: 'i-lucide-check' })
        }
      }
    ]
  ]

  // Actions de statut
  if (!customer.deleted_at) {
    const statusActions = []
    if (customer.status !== 'active') {
      statusActions.push({
        label: 'Activer',
        icon: 'i-lucide-check-circle',
        onSelect: () => updateStatus(customer.id, 'activate')
      })
    }
    if (customer.status !== 'inactive') {
      statusActions.push({
        label: 'Désactiver',
        icon: 'i-lucide-x-circle',
        onSelect: () => updateStatus(customer.id, 'deactivate')
      })
    }
    if (customer.status !== 'suspended') {
      statusActions.push({
        label: 'Suspendre',
        icon: 'i-lucide-ban',
        onSelect: () => updateStatus(customer.id, 'suspend')
      })
    }
    if (statusActions.length > 0) items.push(statusActions)
  }

  // Export individuel
  items.push([{
    label: 'Exporter',
    icon: 'i-lucide-download',
    onSelect: () => {
      idsToExport.value = [customer.id]
      isExportModalOpen.value = true
    }
  }])

  // Suppression ou restauration
  if (customer.deleted_at) {
    items.push([{
      label: 'Restaurer',
      icon: 'i-lucide-rotate-ccw',
      color: 'success',
      onSelect: () => {
        idsToRestore.value = [customer.id]
        isRestoreModalOpen.value = true
      }
    }])
  } else {
    items.push([{
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error',
      onSelect: () => {
        idsToDelete.value = [customer.id]
        isDeleteModalOpen.value = true
      }
    }])
  }

  return items
}

function openDeleteModal(ids: string[]) {
  idsToDelete.value = ids
  isDeleteModalOpen.value = true
}

function openRestoreModal(ids: string[]) {
  idsToRestore.value = ids
  isRestoreModalOpen.value = true
}

function openExportModal(ids?: string[]) {
  idsToExport.value = ids || []
  isExportModalOpen.value = true
}

function onDeleteSuccess() {
  rowSelection.value = {}
}

function onRestoreSuccess() {
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

const selectedCustomersHaveDeleted = computed(() => {
  const api = table.value?.tableApi
  if (!api) return false
  return api.getSelectedRowModel().rows.some(row => !!row.original.deleted_at)
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => setPage(val - 1)
})

const visibleColumns = computed(() =>
  table.value?.tableApi?.getAllColumns().filter(c => c.getCanHide()) || []
)

const idsToExport = ref<string[]>([])

// ========================================
// Watchers
// ========================================
watchDebounced(localSearch, (val) => setSearch(val), { debounce: 400 })
watch(localStatus, (val) => setStatus(val))
watch(showTrashed, (val) => setTrashedFilter(false, val))

onMounted(() => {
  fetchCustomers()
})
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Clients" :badge="pagination.total">
        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Toolbar -->
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
        <div class="flex items-center gap-2 w-full lg:w-auto">
          <UInput v-model="localSearch" icon="i-lucide-search" placeholder="Rechercher un client..."
            class="w-full sm:w-72" :ui="{ trailing: 'pointer-events-auto' }">
            <template #trailing v-if="localSearch">
              <UButton color="neutral" variant="link" icon="i-lucide-x" :padded="false" @click="localSearch = ''" />
            </template>
          </UInput>

          <USelectMenu v-model="localStatus"
            :items="Object.entries(statusLabels).map(([v, l]) => ({ label: l, value: v }))" value-key="value"
            label-key="label" class="w-40" />

          <UCheckbox v-model="showTrashed" label="Supprimés" />
        </div>

        <div class="flex items-center gap-2">
          <!-- Actions de masse -->
          <Transition enter-active-class="transition duration-200" enter-from-class="opacity-0 translate-y-1"
            leave-active-class="transition duration-150" leave-to-class="opacity-0 translate-y-1">
            <div v-if="selectedIds.length > 0" class="flex items-center gap-2">
              <UButton v-if="!selectedCustomersHaveDeleted" color="error" variant="soft" icon="i-lucide-trash-2"
                :label="`Supprimer (${selectedIds.length})`" @click="openDeleteModal(selectedIds)" />

              <UButton v-if="selectedCustomersHaveDeleted" color="success" variant="soft" icon="i-lucide-rotate-ccw"
                :label="`Restaurer (${selectedIds.length})`" @click="openRestoreModal(selectedIds)" />

              <UButton color="primary" variant="soft" icon="i-lucide-download" label="Exporter sélection"
                @click="openExportModal(selectedIds)" />
            </div>
          </Transition>

          <!-- Export global -->
          <UButton icon="i-lucide-download" color="primary" variant="outline" label="Exporter"
            @click="openExportModal()" />

          <!-- Menu Colonnes -->
          <UDropdownMenu :items="visibleColumns.map(col => ({
            label: upperFirst(col.id === 'name' ? 'Client' : col.id),
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
        <UTable ref="table" v-model:row-selection="rowSelection" :data="customers as any" :columns="columns"
          :loading="loading" class="flex-1">
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
                <UIcon name="i-lucide-users" class="w-8 h-8 text-gray-400" />
              </div>
              <p class="text-base font-medium text-gray-900 dark:text-white">Aucun client trouvé</p>
              <p class="text-sm text-gray-500 mt-1" v-if="localSearch || localStatus !== 'all'">
                Essayez de modifier vos filtres.
              </p>
              <UButton v-if="localSearch || localStatus !== 'all'" label="Réinitialiser" variant="link" class="mt-2"
                @click="{ localSearch = ''; localStatus = 'all' }" />
            </div>
          </template>
        </UTable>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-between mt-4 border-t border-gray-200 dark:border-gray-800 pt-4">
        <span class="text-sm text-gray-500">
          Total : <span class="font-medium text-gray-900 dark:text-white">{{ pagination.total }}</span> client(s)
        </span>
        <UPagination v-model:page="currentPage" :total="pagination.total" :items-per-page="pagination.pageSize" />
      </div>

      <!-- Modales -->
      <CustomersDeleteModal v-model:open="isDeleteModalOpen" :ids="idsToDelete" @success="onDeleteSuccess" />
      <CustomersRestoreModal v-model:open="isRestoreModalOpen" :ids="idsToRestore" @success="onRestoreSuccess" />
      <CustomersExportModal v-model:open="isExportModalOpen" :selected-ids="idsToExport" />
    </template>
  </UDashboardPanel>
</template>
