<script setup lang="ts">
import type { Member, MemberRole, MemberStatus } from '~/types/setting'
import {
  formatMemberRole,
  formatMemberStatus,
  getRoleColor,
  getStatusColor,
  getMemberInitials,
  formatLastLogin
} from '~/utils/setting'

definePageMeta({
  layout: 'default'
})

// ============================================================================
// COMPOSABLES
// ============================================================================

const {
  members,
  statistics,
  loading,
  pagination,
  filters,
  fetchMembers,
  fetchStatistics,
  deleteMember,
  updateMemberRole,
  updateMemberStatus,
  setPage,
  setSearch,
  resetFilters
} = useSettings()

const toast = useToast()

// ============================================================================
// ÉTAT LOCAL
// ============================================================================

// Initialisez avec les valeurs des filtres existants
const searchQuery = ref(filters.value.search || '')
const selectedRole = ref<MemberRole | 'all'>(filters.value.role || 'all')
const selectedStatus = ref<MemberStatus | 'all'>(filters.value.status || 'all')

const showInviteModal = ref(false)
const showDeleteModal = ref(false)
const memberToDelete = ref<Member | null>(null)
const showRoleModal = ref(false)
const memberToEdit = ref<Member | null>(null)

// ============================================================================
// OPTIONS
// ============================================================================

const roleOptions = [
  { label: 'Tous les rôles', value: 'all' },
  { label: 'Super Administrateur', value: 'super_admin' },
  { label: 'Administrateur', value: 'admin' },
  { label: 'Gestionnaire', value: 'manager' }
]

const statusOptions = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Actif', value: 'active' },
  { label: 'Inactif', value: 'inactive' },
  { label: 'Invité', value: 'invited' },
  { label: 'Suspendu', value: 'suspended' }
]

// ============================================================================
// COMPUTED
// ============================================================================

// Supprimez le computed filteredMembers et utilisez directement members
// car les filtres sont maintenant appliqués côté serveur
const hasActiveFilters = computed(() => {
  return searchQuery.value !== '' || selectedRole.value !== 'all' || selectedStatus.value !== 'all'
})

const currentPage = computed({
  get: () => pagination.value.pageIndex + 1,
  set: (val) => setPage(val - 1)
})

// ============================================================================
// ACTIONS
// ============================================================================

async function loadData() {
  await Promise.all([
    fetchMembers(),
    fetchStatistics()
  ])
}

function handleInvite() {
  showInviteModal.value = true
}

function handleDeleteClick(member: Member) {
  memberToDelete.value = member
  showDeleteModal.value = true
}

async function confirmDelete() {
  if (!memberToDelete.value) return

  const success = await deleteMember(memberToDelete.value.id)

  if (success) {
    showDeleteModal.value = false
    memberToDelete.value = null
    await loadData()
  }
}

function handleEditRole(member: Member) {
  memberToEdit.value = member
  showRoleModal.value = true
}

async function handleRoleChange(newRole: MemberRole) {
  if (!memberToEdit.value) return

  const success = await updateMemberRole(memberToEdit.value.id, { role: newRole })

  if (success) {
    showRoleModal.value = false
    memberToEdit.value = null
    await loadData()
  }
}

async function handleStatusToggle(member: Member) {
  const newStatus: MemberStatus = member.status === 'active' ? 'inactive' : 'active'

  const success = await updateMemberStatus(member.id, {
    status: newStatus,
    reason: `Changement de statut par l'administrateur`
  })

  if (success) {
    await loadData()
  }
}

function clearAllFilters() {
  searchQuery.value = ''
  selectedRole.value = 'all'
  selectedStatus.value = 'all'
  resetFilters()
}

function getMenuItems(member: Member) {
  return [
    [{
      label: 'Voir le profil',
      icon: 'i-lucide-user',
      click: () => navigateTo(`/settings/members/${member.id}`) // Changé de onSelect à click
    }],
    [{
      label: 'Modifier le rôle',
      icon: 'i-lucide-shield',
      click: () => handleEditRole(member) // Changé de onSelect à click
    }, {
      label: member.status === 'active' ? 'Désactiver' : 'Activer',
      icon: member.status === 'active' ? 'i-lucide-user-x' : 'i-lucide-user-check',
      click: () => handleStatusToggle(member) // Changé de onSelect à click
    }],
    [{
      label: 'Supprimer',
      icon: 'i-lucide-trash-2',
      click: () => handleDeleteClick(member), // Changé de onSelect à click
      class: 'text-red-600 dark:text-red-400'
    }]
  ]
}

// ============================================================================
// WATCHERS
// ============================================================================

watch(searchQuery, (value) => {
  setSearch(value)
})

// Ajoutez des watchers pour rôle et statut
watch(selectedRole, (value) => {
  // Mettez à jour les filtres backend
  if (value === 'all') {
    filters.value.role = undefined
  } else {
    filters.value.role = value
  }
  // Réinitialisez la pagination
  pagination.value.pageIndex = 0
  fetchMembers()
})

watch(selectedStatus, (value) => {
  // Mettez à jour les filtres backend
  if (value === 'all') {
    filters.value.status = undefined
  } else {
    filters.value.status = value
  }
  // Réinitialisez la pagination
  pagination.value.pageIndex = 0
  fetchMembers()
})

// ============================================================================
// LIFECYCLE
// ============================================================================

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Membres de l'équipe</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">Gérez les membres de votre équipe et leurs permissions.</p>
      </div>
      <UButton label="Inviter des membres" icon="i-lucide-user-plus" color="primary" @click="handleInvite" />
    </div>

    <!-- Statistiques -->
    <div v-if="statistics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <!-- Total -->
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <UIcon name="i-lucide-users" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ statistics.total_members }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Total membres</p>
          </div>
        </div>
      </UCard>

      <!-- Actifs -->
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <UIcon name="i-lucide-check-circle" class="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ statistics.active_members }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Actifs</p>
          </div>
        </div>
      </UCard>

      <!-- Invitations -->
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
            <UIcon name="i-lucide-mail" class="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ statistics.pending_invitations }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Invitations</p>
          </div>
        </div>
      </UCard>

      <!-- Nouveaux -->
      <UCard>
        <div class="flex items-center gap-3">
          <div class="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <UIcon name="i-lucide-trending-up" class="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ statistics.new_this_month }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">Ce mois</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Filtres et Liste -->
    <div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <!-- Header avec filtres -->
      <div class="p-4 border-b border-gray-200 dark:border-gray-800 space-y-4">
        <!-- Barre de recherche -->
        <UInput v-model="searchQuery" icon="i-lucide-search" placeholder="Rechercher par nom ou email..." size="lg"
          class="w-full" />

        <!-- Filtres -->
        <div class="flex flex-wrap items-center gap-3">
          <USelectMenu v-model="selectedRole" :items="roleOptions" value-key="value" placeholder="Rôle" class="w-48" />

          <USelectMenu v-model="selectedStatus" :items="statusOptions" value-key="value" placeholder="Statut"
            class="w-48" />

          <UButton v-if="hasActiveFilters" icon="i-lucide-x" color="neutral" variant="ghost" size="sm"
            @click="clearAllFilters">
            Effacer les filtres
          </UButton>
        </div>
      </div>

      <!-- Liste des membres -->
      <div class="divide-y divide-gray-200 dark:divide-gray-800">
        <div v-for="member in members" :key="member.id"
          class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
          <div class="flex items-center gap-4">
            <!-- Avatar -->
            <UAvatar :alt="member.name" :src="member.avatar_url || undefined" size="lg">
              {{ getMemberInitials(member) }}
            </UAvatar>

            <!-- Informations -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white truncate">
                  {{ member.name }}
                  <span v-if="member.roles && member.roles.length > 0" class="text-sm text-gray-500">
                    ({{ member.roles.map(r => formatMemberRole(r.name as MemberRole)).join(', ') }})
                  </span>
                </h3>
                <UBadge v-if="member.roles?.[0]?.name" :color="getRoleColor(member.roles[0].name) as any"
                  variant="subtle" size="xs">
                  {{ formatMemberRole(member.roles[0].name as MemberRole) }}
                </UBadge>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                {{ member.email }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ formatLastLogin(member?.last_login_at as string) }}
              </p>
            </div>

            <!-- Statut -->
            <div class="flex items-center gap-3">
              <UBadge :color="getStatusColor(member.status) as any" variant="subtle">
                {{ formatMemberStatus(member.status) }}
              </UBadge>

              <!-- Menu Actions -->
              <UDropdownMenu :items="getMenuItems(member)">
                <UButton icon="i-lucide-more-vertical" color="neutral" variant="ghost" size="sm" />
              </UDropdownMenu>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="members.length === 0 && !loading" class="p-12 text-center">
          <div class="inline-flex p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <UIcon name="i-lucide-users" class="w-8 h-8 text-gray-400" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Aucun membre trouvé
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ hasActiveFilters ? 'Essayez de modifier vos filtres.' : 'Commencez par inviter des membres.' }}
          </p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="p-12 flex items-center justify-center">
          <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="members.length > 0 && !loading"
        class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800">
        <span class="text-sm text-gray-500 dark:text-gray-400">
          {{ members.length }} membre(s) sur {{ pagination.total }}
        </span>
        <UPagination v-model:page="currentPage" :total="pagination.total" :items-per-page="pagination.pageSize" />
      </div>
    </div>

    <!-- Modal d'invitation -->
    <SettingsMembersInviteModal v-model:open="showInviteModal" @success="loadData" />

    <!-- Modal de suppression -->
    <UModal v-model:open="showDeleteModal" title="Supprimer ce membre">
      <template #body>
        <div class="space-y-4">
          <div class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="flex gap-3">
              <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <p class="font-medium text-red-900 dark:text-red-100">
                  Action irréversible
                </p>
                <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                  Cette action ne peut pas être annulée. Le membre sera définitivement supprimé.
                </p>
              </div>
            </div>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400">
            Êtes-vous sûr de vouloir supprimer
            <strong class="text-gray-900 dark:text-white">{{ memberToDelete?.name }}</strong> ?
          </p>
        </div>
      </template>

      <template #footer="{ close }">
        <div class="flex justify-end gap-3">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="close" />
          <UButton label="Supprimer" color="error" icon="i-lucide-trash-2" :loading="loading" @click="confirmDelete" />
        </div>
      </template>
    </UModal>

    <!-- Modal de changement de rôle -->
    <SettingsMembersRoleModal v-model:open="showRoleModal" :member="memberToEdit" @update:role="handleRoleChange" />
  </div>
</template>
