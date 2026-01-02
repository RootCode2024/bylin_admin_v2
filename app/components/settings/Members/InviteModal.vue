<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { MemberRole } from '~/types/setting'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'success': []
}>()

const { inviteMember, bulkInviteMembers, loading } = useSettings()

// ============================================================================
// ÉTAT
// ============================================================================

const inviteMode = ref<'single' | 'multiple'>('single')
const formRef = ref()

// Schema pour invitation simple
const singleSchema = z.object({
  email: z.email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').optional().or(z.literal('')),
  role: z.enum(['admin', 'super_admin', 'manager']),
  message: z.string().max(1000, 'Le message ne peut pas dépasser 1000 caractères').optional().or(z.literal(''))
})

type SingleInviteForm = z.infer<typeof singleSchema>

// Schema pour invitations multiples
const multipleSchema = z.object({
  emails: z.string().min(1, 'Veuillez entrer au moins un email'),
  role: z.enum(['admin', 'super_admin', 'manager']),
  message: z.string().max(1000, 'Le message ne peut pas dépasser 1000 caractères').optional().or(z.literal(''))
})

type MultipleInviteForm = z.infer<typeof multipleSchema>

// États des formulaires
const singleForm = reactive<SingleInviteForm>({
  email: '',
  name: '',
  role: 'manager',
  message: ''
})

const multipleForm = reactive<MultipleInviteForm>({
  emails: '',
  role: 'manager',
  message: ''
})

// ============================================================================
// OPTIONS
// ============================================================================

const roleOptions = [
  {
    label: 'Super Administrateur',
    value: 'super_admin',
    description: 'Accès complet au système',
    icon: 'i-lucide-shield-check'
  },
  {
    label: 'Administrateur',
    value: 'admin',
    description: 'Gestion complète',
    icon: 'i-lucide-shield'
  },
  {
    label: 'Gestionnaire',
    value: 'manager',
    description: 'Gestion quotidienne',
    icon: 'i-lucide-briefcase'
  }
]

// ============================================================================
// COMPUTED
// ============================================================================

const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

const emailCount = computed(() => {
  if (inviteMode.value === 'single') return 1

  const emails = multipleForm.emails
    .split(/[\n,;]/)
    .map(e => e.trim())
    .filter(e => e.length > 0)

  return emails.length
})

const messageLength = computed(() => {
  const msg = inviteMode.value === 'single' ? singleForm.message : multipleForm.message
  return msg?.length || 0
})

const messageRemaining = computed(() => 1000 - messageLength.value)

// ============================================================================
// MÉTHODES
// ============================================================================

function resetForms() {
  Object.assign(singleForm, {
    email: '',
    name: '',
    role: 'manager',
    message: ''
  })

  Object.assign(multipleForm, {
    emails: '',
    role: 'manager',
    message: ''
  })
}

async function handleSingleInvite(event: FormSubmitEvent<SingleInviteForm>) {
  const success = await inviteMember(event.data)

  if (success) {
    isOpen.value = false
    emit('success')
    resetForms()
  }
}

async function handleMultipleInvite(event: FormSubmitEvent<MultipleInviteForm>) {
  // Parse les emails
  const emails = event.data.emails
    .split(/[\n,;]/)
    .map(e => e.trim())
    .filter(e => e.length > 0)

  // Créer le tableau d'invitations
  const invitations = emails.map(email => ({
    email,
    role: event.data.role,
    message: event.data.message || undefined
  }))

  const success = await bulkInviteMembers({ invitations })

  if (success) {
    isOpen.value = false
    emit('success')
    resetForms()
  }
}

function handleModalClose() {
  resetForms()
  inviteMode.value = 'single'
}

async function handleSubmit() {
  if (formRef.value) {
    await formRef.value.submit()
  }
}
</script>

<template>
  <UModal
    v-model:open="isOpen"
    title="Inviter des membres"
    description="Envoyez des invitations par email pour rejoindre votre équipe."
    :ui="{ content: 'sm:max-w-5xl' }"
    @after:leave="handleModalClose"
  >
    <template #body>
      <div class="space-y-6">
        <!-- Mode d'invitation -->
        <div class="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            type="button"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              inviteMode === 'single'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
            @click="inviteMode = 'single'"
          >
            Invitation simple
          </button>
          <button
            type="button"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              inviteMode === 'multiple'
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            ]"
            @click="inviteMode = 'multiple'"
          >
            Invitations multiples
          </button>
        </div>

        <!-- Formulaire invitation simple -->
        <UForm
          v-if="inviteMode === 'single'"
          ref="formRef"
          :schema="singleSchema"
          :state="singleForm"
          class="space-y-4"
          @submit="handleSingleInvite"
        >
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Email" name="email" required>
              <UInput v-model="singleForm.email" type="email" placeholder="john@example.com" icon="i-lucide-mail" class="w-full"
                :disabled="loading" />
            </UFormField>

            <UFormField label="Nom (optionnel)" name="name">
              <UInput v-model="singleForm.name" placeholder="John Doe" icon="i-lucide-user" :disabled="loading" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Rôle" name="role" required>
            <USelectMenu
              v-model="singleForm.role"
              :items="roleOptions"
              value-key="value"
              :disabled="loading"
              class="w-1/2"
            >
              <template #leading>
                <UIcon
                  :name="roleOptions.find(r => r.value === singleForm.role)?.icon || 'i-lucide-shield'"
                  class="w-4 h-4"
                />
              </template>
              <template #item="{ item }">
                <div class="flex items-center gap-3 w-full">
                  <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ item.label }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</p>
                  </div>
                </div>
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField label="Message personnalisé (optionnel)" name="message">
            <UTextarea
              v-model="singleForm.message"
              placeholder="Ajoutez un message de bienvenue..."
              :rows="5"
              :disabled="loading"
              maxlength="1000"
              class="w-full"
            />
            <template #hint>
              <span
                class="text-xs"
                :class="messageRemaining < 100 ? 'text-orange-500' : 'text-gray-500'"
              >
                {{ messageRemaining }} caractères restants
              </span>
            </template>
          </UFormField>
        </UForm>

        <!-- Formulaire invitations multiples -->
        <UForm
          v-else
          ref="formRef"
          :schema="multipleSchema"
          :state="multipleForm"
          class="space-y-4"
          @submit="handleMultipleInvite"
        >
          <UFormField
            label="Adresses email"
            name="emails"
            required
            hint="Séparez les emails par une virgule, un point-virgule ou une nouvelle ligne"
          >
            <UTextarea
              v-model="multipleForm.emails"
              placeholder="john@example.com, jane@example.com"
              :rows="6"
              :disabled="loading"
            />
            <template #hint>
              <span class="text-xs text-gray-500">
                {{ emailCount }} email(s) détecté(s)
              </span>
            </template>
          </UFormField>

          <UFormField label="Rôle" name="role" required>
            <USelectMenu
              v-model="multipleForm.role"
              :items="roleOptions"
              value-key="value"
              :disabled="loading"
            >
              <template #leading>
                <UIcon
                  :name="roleOptions.find(r => r.value === multipleForm.role)?.icon || 'i-lucide-shield'"
                  class="w-4 h-4"
                />
              </template>
              <template #item="{ item }">
                <div class="flex items-center gap-3 w-full">
                  <UIcon :name="item.icon" class="w-4 h-4 shrink-0" />
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm">{{ item.label }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.description }}</p>
                  </div>
                </div>
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField label="Message personnalisé (optionnel)" name="message">
            <UTextarea
              v-model="multipleForm.message"
              placeholder="Ajoutez un message de bienvenue..."
              :rows="4"
              :disabled="loading"
              maxlength="1000"
            />
            <template #hint>
              <span
                class="text-xs"
                :class="messageRemaining < 100 ? 'text-orange-500' : 'text-gray-500'"
              >
                {{ messageRemaining }} caractères restants
              </span>
            </template>
          </UFormField>
        </UForm>

        <!-- Info -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex gap-3">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div class="text-sm text-blue-800 dark:text-blue-200">
              <p class="font-medium mb-1">Les invitations expirent après 7 jours</p>
              <p class="text-blue-700 dark:text-blue-300">
                Un email sera envoyé avec un lien d'activation pour créer leur compte.
              </p>
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
          :disabled="loading"
          @click="close"
        />
        <UButton
          :label="inviteMode === 'single' ? 'Envoyer l\'invitation' : `Envoyer ${emailCount} invitation(s)`"
          icon="i-lucide-send"
          color="primary"
          :loading="loading"
          @click="handleSubmit"
        />
      </div>
    </template>
  </UModal>
</template>
