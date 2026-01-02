<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserStatus, UserRole } from '~/stores/auth'
import type { MemberStatus, MemberRole } from '~/types/setting'
import { getStatusColor, getRoleColor, formatMemberRole } from '~/utils/setting'

const fileRef = ref<HTMLInputElement>()
const authStore = useAuthStore()
const toast = useToast()
const showAllPermissions = ref(false)
const isUploading = ref(false)
const config = useRuntimeConfig()

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom est trop court'),
  email: z.email('Email invalide'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio trop longue (500 caractères max)').optional()
})

type ProfileSchema = z.output<typeof profileSchema>

// État du profil avec optimistic update
const profile = reactive<Partial<ProfileSchema>>({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  phone: authStore.user?.phone || undefined,
  bio: authStore.user?.bio || undefined
})

// Avatar séparé pour preview
const avatarPreview = ref<string | null>(null)

// Synchronisation avec les changements du user
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    profile.name = newUser.name
    profile.email = newUser.email
    profile.phone = newUser.phone || undefined
    profile.bio = newUser.bio || undefined
    avatarPreview.value = newUser.avatar_url || null
  }
}, { immediate: true })

const client = useSanctumClient();

// Mise à jour du profil
async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  try {
    const response = await client('/api/v1/admin/profile', {
      method: 'PUT',
      body: event.data
    })

    // Rafraîchir l'identité de l'utilisateur
    await authStore.refreshIdentity()

    toast.add({
      title: 'Succès',
      description: 'Votre profil a été mis à jour avec succès.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Erreur',
      description: error?.data?.message || 'Une erreur est survenue lors de la mise à jour.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    console.error(error)
  }
}

// Gestion de l'upload d'avatar
async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) return

  const file = input.files[0]!

  // Validation côté client
  if (file.size > 1024 * 1024) {
    toast.add({
      title: 'Erreur',
      description: 'Le fichier est trop volumineux (1MB max).',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  // Preview optimiste
  avatarPreview.value = URL.createObjectURL(file)
  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('avatar', file)

    await client('/api/v1/admin/profile/avatar', {
      method: 'POST',
      body: formData
    })

    // Rafraîchir l'utilisateur
    await authStore.refreshIdentity()

    toast.add({
      title: 'Succès',
      description: 'Avatar mis à jour avec succès.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error: any) {
    // Annuler le preview en cas d'erreur
    avatarPreview.value = authStore.user?.avatar_url || null

    toast.add({
      title: 'Erreur',
      description: error?.data?.message || "Impossible de mettre à jour l'avatar.",
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isUploading.value = false
    // Réinitialiser l'input
    if (input) input.value = ''
  }
}

// Supprimer l'avatar
async function deleteAvatar() {
  if (!confirm('Voulez-vous vraiment supprimer votre avatar ?')) return

  // Optimistic update
  const previousAvatar = avatarPreview.value
  avatarPreview.value = null

  try {
    await client('/api/v1/admin/profile/avatar', {
      method: 'DELETE'
    })

    await authStore.refreshIdentity()

    toast.add({
      title: 'Succès',
      description: 'Avatar supprimé avec succès.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error: any) {
    // Restaurer en cas d'erreur
    avatarPreview.value = previousAvatar

    toast.add({
      title: 'Erreur',
      description: error?.data?.message || "Impossible de supprimer l'avatar.",
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  }
}

function onFileClick() {
  fileRef.value?.click()
}

const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
  banned: "Banni"
}

const accountInfo = computed(() => {
  const user = authStore.user
  if (!user) return null

  return {
    status: user.status,
    statusLabel: USER_STATUS_LABELS[user.status] || user.status,
    emailVerified: !!user.email_verified_at,
    lastLogin: user.last_login_at,
    createdAt: user.created_at,
    roles: user.roles || [],
    permissions: user.roles?.[0]?.permissions || user.permissions || []
  }
})

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Non disponible'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

function formatDateTime(dateString: string | null | undefined) {
  if (!dateString) return 'Jamais'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatPermissionName(name: string): string {
  const parts = name.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return name

  const modules: Record<string, string> = {
    users: 'Utilisateurs',
    customers: 'Clients',
    catalogue: 'Catalogue',
    inventory: 'Inventaire',
    orders: 'Commandes',
    promotions: 'Promotions',
    reviews: 'Avis',
    settings: 'Paramètres',
    authenticity: 'Authenticité',
    reports: 'Rapports'
  }

  const actions: Record<string, string> = {
    view: 'Voir',
    create: 'Créer',
    update: 'Modifier',
    delete: 'Supprimer',
    manage: 'Gérer',
    cancel: 'Annuler'
  }

  const moduleName = parts[0]
  const actionName = parts[1]

  const module = modules[moduleName] || moduleName
  const action = actions[actionName] || actionName

  return `${module} : ${action}`
}
</script>

<template>
  <div v-if="!accountInfo" class="flex items-center justify-center min-h-screen">
    <div class="text-center">
      <UIcon name="i-lucide-loader-2" class="w-8 h-8 animate-spin text-gray-400 mb-2" />
      <p class="text-gray-500">Chargement du profil...</p>
    </div>
  </div>

  <UForm v-else id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
    <UPageCard
      title="Profil"
      description="Ces informations seront affichées publiquement."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Enregistrer les modifications"
        color="neutral"
        type="submit"
        :loading="authStore.loading"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <!-- Avatar -->
      <UFormField
        name="avatar"
        label="Avatar"
        description="JPG, GIF ou PNG. 1MB Max."
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative">
            <UAvatar
              :src="avatarPreview || undefined"
              :alt="profile.name"
              size="lg"
            />
            <div
              v-if="isUploading"
              class="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full"
            >
              <UIcon name="i-lucide-loader-2" class="w-6 h-6 animate-spin text-white" />
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              label="Choisir"
              color="neutral"
              :disabled="isUploading"
              @click="onFileClick"
            />
            <UButton
              v-if="avatarPreview"
              label="Supprimer"
              color="error"
              variant="ghost"
              :disabled="isUploading"
              @click="deleteAvatar"
            />
          </div>
          <input
            ref="fileRef"
            type="file"
            class="hidden"
            accept=".jpg, .jpeg, .png, .gif"
            @change="onFileChange"
          >
        </div>
      </UFormField>

      <USeparator />

      <!-- Nom -->
      <UFormField
        name="name"
        label="Nom complet"
        description="Ceci sera affiché sur votre profil public."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.name" autocomplete="off" placeholder="Votre nom complet" />
      </UFormField>

      <USeparator />

      <!-- Email -->
      <UFormField
        name="email"
        label="Email"
        description="Votre adresse email pour vous connecter et recevoir des notifications."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.email" type="email" autocomplete="off" placeholder="votre@email.com" />
      </UFormField>

      <USeparator />

      <!-- Téléphone -->
      <UFormField
        name="phone"
        label="Téléphone"
        description="Votre numéro de téléphone (optionnel)."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.phone" type="tel" autocomplete="off" placeholder="+229 XX XX XX XX" />
      </UFormField>

      <USeparator />

      <!-- Bio -->
      <UFormField
        name="bio"
        label="Bio"
        description="Une brève description pour votre profil (500 caractères max)."
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="profile.bio"
          :rows="5"
          autoresize
          placeholder="Parlez-nous de vous..."
          class="w-full"
        />
      </UFormField>

      <!-- Informations du compte -->
      <template v-if="accountInfo">
        <USeparator />

        <div class="space-y-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
            Informations du compte
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <!-- Statut -->
            <div class="flex items-center justify-between sm:justify-start gap-2">
              <span class="text-gray-500 dark:text-gray-400">Statut :</span>
              <UBadge :color="getStatusColor(accountInfo.status as MemberStatus)" variant="subtle">
                {{ accountInfo.statusLabel }}
              </UBadge>
            </div>

            <!-- Email vérifié -->
            <div class="flex items-center justify-between sm:justify-start gap-2">
              <span class="text-gray-500 dark:text-gray-400">Email :</span>
              <div class="flex items-center gap-1">
                <UIcon
                  :name="accountInfo.emailVerified ? 'i-lucide-check-circle' : 'i-lucide-x-circle'"
                  :class="accountInfo.emailVerified ? 'text-green-500' : 'text-gray-400'"
                />
                <span class="text-xs">
                  {{ accountInfo.emailVerified ? 'Vérifié' : 'Non vérifié' }}
                </span>
              </div>
            </div>

            <!-- Dernière connexion -->
            <div class="flex flex-col sm:col-span-2">
              <span class="text-gray-500 dark:text-gray-400 mb-1">Dernière connexion :</span>
              <span class="text-gray-900 dark:text-gray-100">
                {{ formatDateTime(accountInfo.lastLogin) }}
              </span>
            </div>

            <!-- Membre depuis -->
            <div class="flex flex-col sm:col-span-2">
              <span class="text-gray-500 dark:text-gray-400 mb-1">Membre depuis :</span>
              <span class="text-gray-900 dark:text-gray-100">
                {{ formatDate(accountInfo.createdAt) }}
              </span>
            </div>
          </div>

          <!-- Rôles -->
          <div v-if="accountInfo.roles && accountInfo.roles.length > 0" class="flex flex-wrap items-center gap-2">
            <span class="text-gray-500 dark:text-gray-400 text-sm">Rôles :</span>
            <UBadge
              v-for="role in accountInfo.roles"
              :key="role.id"
              :color="getRoleColor(role.name)"
              variant="subtle"
            >
              {{ formatMemberRole(role.name as MemberRole) }}
            </UBadge>
          </div>

          <!-- Permissions -->
          <div v-if="accountInfo.permissions && accountInfo.permissions.length > 0" class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-gray-500 dark:text-gray-400 text-sm">
                Permissions ({{ accountInfo.permissions.length }}) :
              </span>
              <UButton
                v-if="accountInfo.permissions.length > 5"
                :label="showAllPermissions ? 'Voir moins' : 'Voir tout'"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="showAllPermissions = !showAllPermissions"
              />
            </div>
            <div class="flex flex-wrap gap-2">
              <UBadge
                v-for="permission in showAllPermissions ? accountInfo.permissions : accountInfo.permissions.slice(0, 5)"
                :key="permission.id"
                color="neutral"
                variant="subtle"
                size="xs"
                :title="permission.name"
              >
                {{ formatPermissionName(permission.name) }}
              </UBadge>
            </div>
          </div>
        </div>
      </template>
    </UPageCard>
  </UForm>
</template>
