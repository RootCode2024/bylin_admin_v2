<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { upperFirst } from 'scule'
import type { Customer } from '~/types'

// --- Imports & Composants ---
const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UCheckbox = resolveComponent('UCheckbox')

const toast = useToast()
const store = useCustomerStore()
const router = useRouter() // Pour la navigation vers les détails

// --- Configuration Table ---
const table = useTemplateRef('table')
const rowSelection = ref({})

// Liste des statuts pour le filtre (avec libellés FR)
const statusOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'Abonné', value: 'subscribed' },
  { label: 'Désabonné', value: 'unsubscribed' },
  { label: 'Rejeté', value: 'bounced' },
  { label: 'Suspendu', value: 'suspended' }
]

// Mapping des couleurs pour l'affichage
const statusColors: Record<string, string> = {
  active: 'success',
  subscribed: 'success',
  inactive: 'neutral',
  unsubscribed: 'neutral',
  suspended: 'warning',
  bounced: 'error'
}

// Fonction pour naviguer vers les détails
function navigateToDetails(id: string) {
  // Adapter selon votre route réelle, ex: /admin/customers/123
  // router.push(`/customers/${id}`)
  toast.add({ title: 'Navigation', description: `Vers la fiche client ${id}` })
}

// --- Définition des Colonnes ---
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
      'ariaLabel': 'Sélectionner la ligne'
    })
  },
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => h('span', { class: 'font-mono text-xs text-muted' }, row.original.id.substring(0, 8) + '...')
  },
  {
    accessorKey: 'name',
    header: 'Client',
    cell: ({ row }) => {
      const fullName = `${row.original.first_name} ${row.original.last_name}`

      // On rend le nom et l'avatar cliquables pour aller aux détails
      return h('div', {
        class: 'flex items-center gap-3 cursor-pointer group',
        onClick: () => navigateToDetails(row.original.id)
      }, [
        h(UAvatar, {
          src: row.original.avatar_url,
          alt: fullName,
          size: 'lg',
          class: 'group-hover:ring-2 ring-primary-500/50 transition-all'
        }),
        h('div', undefined, [
          h('p', { class: 'font-medium text-highlighted group-hover:text-primary-500 transition-colors' }, fullName),
          h('p', { class: 'text-xs text-muted' }, row.original.email)
        ])
      ])
    }
  },
  {
    accessorKey: 'status',
    header: 'Statut',
    cell: ({ row }) => {
      const status = row.original.status
      const color = statusColors[status] || 'neutral'

      // Traduction simple pour l'affichage dans le badge
      const frStatus = statusOptions.find(o => o.value === status)?.label || status

      return h(UBadge, {
        class: 'capitalize',
        variant: 'subtle',
        color: color as any
      }, () => frStatus)
    }
  },
  {
    id: 'actions',
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
        class: 'ml-auto cursor-pointer'
      }))
    )
  }
]

// Actions du menu déroulant
function getRowItems(customer: Customer) {
  return [
    [
      {
        label: 'Voir les détails',
        icon: 'i-lucide-eye',
        click: () => navigateToDetails(customer.id)
      },
      {
        label: 'Copier l\'ID',
        icon: 'i-lucide-copy',
        click: () => {
          navigator.clipboard.writeText(customer.id)
          toast.add({ title: 'Succès', description: 'ID copié dans le presse-papier' })
        }
      }
    ],
    [{
      label: 'Supprimer',
      icon: 'i-lucide-trash',
      color: 'error',
      click: () => store.deleteCustomers([customer.id])
    }]
  ]
}

// --- Logique & Watchers ---

// Computed pour gérer la pagination (1-index vers 0-index)
const currentPage = computed({
  get: () => store.pagination.pageIndex + 1,
  set: (value) => { store.pagination.pageIndex = value - 1 }
})

const selectedIds = computed(() => {
  if (!table.value?.tableApi) return []
  return table.value.tableApi.getSelectedRowModel().rows.map((row: any) => row.original.id)
})

// Chargement initial
onMounted(() => {
  store.fetchCustomers()
})

// Surveillance pour recharger les données
watch(() => store.pagination.pageIndex, () => store.fetchCustomers())
watch(() => store.pagination.pageSize, () => store.fetchCustomers())

// Recherche avec Debounce
watchDebounced(
  () => store.filters.search,
  () => { store.pagination.pageIndex = 0; store.fetchCustomers() },
  { debounce: 500, maxWait: 1000 }
)

// Filtre Statut
watch(() => store.filters.status, () => {
  store.pagination.pageIndex = 0
  store.fetchCustomers()
})
</script>

<template>
  <UDashboardPanel id="customers">
    <template #header>
      <UDashboardNavbar title="Clients">
        <template #right>
          <CustomersAddModal />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Barre d'outils -->
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <!-- Filtres à gauche -->
        <div class="flex items-center gap-2 w-full sm:w-auto">
          <UInput
            v-model="store.filters.search"
            class="w-full sm:max-w-xs"
            icon="i-lucide-search"
            placeholder="Rechercher (nom, email)..."
          />

          <USelect
            v-model="store.filters.status"
            :items="statusOptions"
            option-attribute="label"
            value-attribute="value"
            class="min-w-[140px]"
            placeholder="Statut"
          />
        </div>

        <!-- Actions de masse et affichage à droite -->
        <div class="flex items-center gap-2">
          <!-- Modal de suppression multiple -->
          <CustomersDeleteModal
            v-if="selectedIds.length > 0"
            :count="selectedIds.length"
            :ids="selectedIds"
            @success="rowSelection = {}"
          />

          <!-- Menu d'affichage des colonnes -->
          <UDropdownMenu
            :items="
              table?.tableApi
                ?.getAllColumns()
                .filter((column: any) => column.getCanHide())
                .map((column: any) => ({
                  label: upperFirst(column.id === 'name' ? 'Nom' : column.id), // Petite trad manuelle
                  type: 'checkbox' as const,
                  checked: column.getIsVisible(),
                  onUpdateChecked(checked: boolean) {
                    table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                  },
                  onSelect(e?: Event) { e?.preventDefault() }
                }))
            "
            :content="{ align: 'end' }"
          >
            <UButton
              label="Affichage"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
              class="cursor-pointer"
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Tableau de données -->
      <UTable
        ref="table"
        v-model:row-selection="rowSelection"
        :data="store.customers"
        :columns="columns"
        :loading="store.loading"
        class="flex-1"
        :ui="{
          th: 'py-3 font-semibold text-gray-900 dark:text-white',
          td: 'py-3',
          emptyState: 'flex flex-col items-center justify-center p-6 gap-3'
        }"
      >
        <template #empty-state>
           <div class="text-center text-muted">
             <div class="i-lucide-users text-4xl mb-2 mx-auto" />
             <p>Aucun client trouvé.</p>
           </div>
        </template>
      </UTable>

      <!-- Pied de page / Pagination -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
           Total : <span class="font-medium text-highlighted">{{ store.pagination.total }}</span> client(s)
        </div>

        <UPagination
          v-model="currentPage"
          :page-count="store.pagination.pageSize"
          :total="store.pagination.total"
          :max="5"
          :ui="{ wrapper: 'flex items-center gap-1' }"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
