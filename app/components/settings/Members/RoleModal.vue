<script setup lang="ts">
import type { Member, MemberRole } from '~/types/setting'
import { formatMemberRole, getRoleColor } from '~/utils/setting'

const props = defineProps<{
  open: boolean
  member: Member | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:role': [role: MemberRole]
}>()

// ============================================================================
// ÉTAT
// ============================================================================

const selectedRole = ref<MemberRole>('manager')

// ============================================================================
// OPTIONS
// ============================================================================

const roleOptions = [
  {
    value: 'super_admin',
    label: 'Super Administrateur',
    description: 'Tous les droits absolus sur le système',
    icon: 'i-lucide-shield-check',
    color: 'purple',
    permissions: [
      'Gestion complète de tous les membres',
      'Configuration système avancée',
      'Accès aux données sensibles',
      'Peut supprimer d\'autres super admins'
    ]
  },
  {
    value: 'admin',
    label: 'Administrateur',
    description: 'Gestion complète du système',
    icon: 'i-lucide-shield',
    color: 'red',
    permissions: [
      'Gestion des membres (sauf super admins)',
      'Gestion des produits et commandes',
      'Accès aux statistiques',
      'Configuration de base'
    ]
  },
  {
    value: 'manager',
    label: 'Gestionnaire',
    description: 'Gestion quotidienne et invitations',
    icon: 'i-lucide-briefcase',
    color: 'orange',
    permissions: [
      'Gestion des commandes',
      'Gestion des produits',
      'Inviter des membres',
      'Accès aux rapports'
    ]
  }
]

// ============================================================================
// COMPUTED
// ============================================================================

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const selectedRoleInfo = computed(() => {
  return roleOptions.find(r => r.value === selectedRole.value)
})

const currentRoleInfo = computed(() => {
  if (!props.member) return null
  return roleOptions.find(r => r.value === props.member?.role)
})

const hasChanges = computed(() => {
  return props.member && selectedRole.value !== props.member.role
})

// ============================================================================
// MÉTHODES
// ============================================================================

function handleConfirm() {
  if (!hasChanges.value) {
    isOpen.value = false
    return
  }

  emit('update:role', selectedRole.value)
}

function handleModalOpen() {
  if (props.member) {
    selectedRole.value = props.member.role
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Modifier le rôle"
    :ui="{ content: 'sm:max-w-3xl' }"
    @after:enter="handleModalOpen"
  >
    <template #body>
      <div v-if="member" class="space-y-6">
        <!-- Info membre -->
        <div class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <UAvatar
            v-if="member.avatar_url"
            :alt="member.name"
            :src="member.avatar_url"
            size="lg"
          >
            {{ member.name.substring(0, 2).toUpperCase() }}
          </UAvatar>
          <div>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ member.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ member.email }}
            </p>
            <div class="mt-1">
              <UBadge
                :color="getRoleColor(member.role)"
                variant="subtle"
                size="xs"
              >
                Rôle actuel: {{ formatMemberRole(member.role) }}
              </UBadge>
            </div>
          </div>
        </div>

        <!-- Sélection du rôle -->
        <div class="space-y-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sélectionner un nouveau rôle
          </label>

          <div class="space-y-2">
            <button
              v-for="role in roleOptions"
              :key="role.value"
              type="button"
              :class="[
                'w-full p-4 border-2 rounded-lg text-left transition-all',
                selectedRole === role.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              ]"
              @click="selectedRole = role.value as MemberRole"
            >
              <div class="flex items-start gap-3">
                <!-- Radio -->
                <div class="shrink-0 mt-0.5">
                  <div
                    :class="[
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selectedRole === role.value
                        ? 'border-primary-500 bg-primary-500'
                        : 'border-gray-300 dark:border-gray-600'
                    ]"
                  >
                    <div
                      v-if="selectedRole === role.value"
                      class="w-2 h-2 rounded-full bg-white"
                    />
                  </div>
                </div>

                <!-- Icon -->
                <div
                  :class="[
                    'p-2 rounded-lg shrink-0',
                    selectedRole === role.value
                      ? `bg-${role.color}-100 dark:bg-${role.color}-900/30`
                      : 'bg-gray-100 dark:bg-gray-800'
                  ]"
                >
                  <UIcon
                    :name="role.icon"
                    :class="[
                      'w-5 h-5',
                      selectedRole === role.value
                        ? `text-${role.color}-600 dark:text-${role.color}-400`
                        : 'text-gray-400'
                    ]"
                  />
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-semibold text-gray-900 dark:text-white">
                      {{ role.label }}
                    </h4>
                    <UBadge
                      v-if="member.role === role.value"
                      color="primary"
                      variant="subtle"
                      size="xs"
                    >
                      Actuel
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {{ role.description }}
                  </p>

                  <!-- Permissions -->
                  <div class="space-y-1">
                    <div
                      v-for="(permission, index) in role.permissions"
                      :key="index"
                      class="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400"
                    >
                      <UIcon name="i-lucide-check" class="w-3 h-3 shrink-0 mt-0.5 text-green-600" />
                      <span>{{ permission }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Aperçu des changements -->
        <div v-if="hasChanges" class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex gap-3">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div class="text-sm">
              <p class="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Changement de rôle
              </p>
              <p class="text-blue-800 dark:text-blue-200">
                Le rôle de <strong>{{ member.name }}</strong> passera de
                <strong>{{ currentRoleInfo?.label }}</strong> à
                <strong>{{ selectedRoleInfo?.label }}</strong>.
              </p>
            </div>
          </div>
        </div>

        <!-- Avertissement -->
        <div class="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <div class="flex gap-3">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
            <div class="text-sm text-orange-800 dark:text-orange-200">
              <p class="font-medium mb-1">Important</p>
              <ul class="list-disc list-inside space-y-1 text-orange-700 dark:text-orange-300">
                <li>Le changement de rôle prend effet immédiatement</li>
                <li>Le membre devra peut-être se reconnecter</li>
                <li>Assurez-vous que le membre comprend ses nouvelles responsabilités</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer="{ close }">
      <div class="flex justify-end gap-3">
        <UButton
          label="Annuler"
          color="neutral"
          variant="ghost"
          @click="close"
        />
        <UButton
          label="Confirmer le changement"
          icon="i-lucide-check"
          color="primary"
          :disabled="!hasChanges"
          @click="handleConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
