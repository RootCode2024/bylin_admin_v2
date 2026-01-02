<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent, FormError } from '@nuxt/ui'

const authStore = useAuthStore()
const toast = useToast()
const client = useSanctumClient()
const router = useRouter()

// États
const isChangingPassword = ref(false)
const isDeletingAccount = ref(false)
const showDeleteModal = ref(false)
const deleteConfirmation = ref('')

// Schema de validation du mot de passe
const passwordSchema = z.object({
  current_password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  new_password: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  new_password_confirmation: z.string().min(8, 'Confirmez le nouveau mot de passe')
})

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<PasswordSchema>({
  current_password: '',
  new_password: '',
  new_password_confirmation: ''
})

// Validation personnalisée
const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const errors: FormError[] = []

  if (state.current_password && state.new_password && state.current_password === state.new_password) {
    errors.push({
      name: 'new_password',
      message: 'Le nouveau mot de passe doit être différent de l\'ancien'
    })
  }

  if (state.new_password && state.new_password_confirmation && state.new_password !== state.new_password_confirmation) {
    errors.push({
      name: 'new_password_confirmation',
      message: 'Les mots de passe ne correspondent pas'
    })
  }

  return errors
}

// Vérifier si l'utilisateur est super admin
const isSuperAdmin = computed(() => {
  return authStore.user?.roles?.some(role => role.name === 'super_admin')
})

// Vérifier s'il y a d'autres super admins
const hasOtherSuperAdmins = ref<boolean | null>(null)
const isCheckingSuperAdmins = ref(false)

async function checkOtherSuperAdmins() {
  if (!isSuperAdmin.value) {
    hasOtherSuperAdmins.value = true
    return
  }

  isCheckingSuperAdmins.value = true
  try {
    const response = await client<{ count: number }>('/api/v1/admin/users/super-admins/count')
    hasOtherSuperAdmins.value = response.count > 1
  } catch (error) {
    console.error('Erreur lors de la vérification des super admins:', error)
    hasOtherSuperAdmins.value = null
  } finally {
    isCheckingSuperAdmins.value = false
  }
}

// Charger au montage
onMounted(() => {
  checkOtherSuperAdmins()
})

// Changer le mot de passe
async function onChangePassword(event: FormSubmitEvent<PasswordSchema>) {
  isChangingPassword.value = true

  try {
    await client('/api/v1/admin/profile/change-password', {
      method: 'POST',
      body: event.data
    })

    toast.add({
      title: 'Succès',
      description: 'Votre mot de passe a été modifié avec succès.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Réinitialiser le formulaire
    password.current_password = ''
    password.new_password = ''
    password.new_password_confirmation = ''
  } catch (error: any) {
    toast.add({
      title: 'Erreur',
      description: error?.data?.message || 'Impossible de modifier le mot de passe.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isChangingPassword.value = false
  }
}

// Ouvrir le modal de suppression
function openDeleteModal() {
  if (isSuperAdmin.value && !hasOtherSuperAdmins.value) {
    toast.add({
      title: 'Action impossible',
      description: 'Vous devez nommer un autre super administrateur avant de supprimer votre compte.',
      icon: 'i-lucide-alert-triangle',
      color: 'warning',
      duration: 5000
    })
    router.push('/settings/members')
    return
  }

  showDeleteModal.value = true
  deleteConfirmation.value = ''
}

// Supprimer le compte
async function deleteAccount() {
  if (deleteConfirmation.value !== 'SUPPRIMER') {
    toast.add({
      title: 'Erreur',
      description: 'Veuillez taper "SUPPRIMER" pour confirmer.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
    return
  }

  isDeletingAccount.value = true

  try {
    await client('/api/v1/admin/profile', {
      method: 'DELETE'
    })

    toast.add({
      title: 'Compte supprimé',
      description: 'Votre compte a été supprimé avec succès.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Déconnexion et redirection
    await authStore.logout()
    router.push('/auth/login')
  } catch (error: any) {
    toast.add({
      title: 'Erreur',
      description: error?.data?.message || 'Impossible de supprimer le compte.',
      icon: 'i-lucide-alert-circle',
      color: 'error'
    })
  } finally {
    isDeletingAccount.value = false
    showDeleteModal.value = false
  }
}

// Couleur de la force du mot de passe
function getPasswordStrength(password: string): { strength: string; color: string } {
  if (password.length === 0) return { strength: '', color: 'neutral' }
  if (password.length < 8) return { strength: 'Faible', color: 'error' }

  const hasNumber = /\d/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasLower = /[a-z]/.test(password)
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  const score = [hasNumber, hasUpper, hasLower, hasSpecial].filter(Boolean).length

  if (score <= 2) return { strength: 'Moyen', color: 'warning' }
  if (score === 3) return { strength: 'Bon', color: 'info' }
  return { strength: 'Excellent', color: 'success' }
}

const passwordStrength = computed(() => getPasswordStrength(password.new_password))
</script>

<template>
  <div class="space-y-4">

    <div class="grid grid-cols-2 gap-4">
      <!-- Changement de mot de passe -->
      <UPageCard title="Mot de passe"
        description="Modifiez votre mot de passe régulièrement pour assurer la sécurité de votre compte."
        variant="subtle">
        <UForm :schema="passwordSchema" :state="password" :validate="validate" class="space-y-4 max-w-md"
          @submit="onChangePassword">
          <UFormField label="Mot de passe actuel" name="current_password" required>
            <UInput v-model="password.current_password" type="password" placeholder="••••••••" icon="i-lucide-lock"
              autocomplete="current-password" class="w-full" />
          </UFormField>

          <UFormField label="Nouveau mot de passe" name="new_password" required :hint="passwordStrength.strength">
            <UInput v-model="password.new_password" type="password" placeholder="••••••••" icon="i-lucide-key"
              autocomplete="new-password" class="w-full" />
            <template v-if="password.new_password" #hint>
              <UBadge :color="passwordStrength.color as UBadgeColor" variant="subtle" size="xs">
                {{ passwordStrength.strength }}
              </UBadge>
            </template>
          </UFormField>

          <UFormField label="Confirmer le nouveau mot de passe" name="new_password_confirmation" required>
            <UInput v-model="password.new_password_confirmation" type="password" placeholder="••••••••"
              icon="i-lucide-check-circle" autocomplete="new-password" class="w-full" />
          </UFormField>

          <div class="flex items-center gap-3">
            <UButton type="submit" label="Modifier le mot de passe" :loading="isChangingPassword" icon="i-lucide-save" />
            <UButton v-if="password.current_password || password.new_password" label="Annuler" color="neutral"
              variant="ghost" @click="() => {
                password.current_password = ''
                password.new_password = ''
                password.new_password_confirmation = ''
              }" />
          </div>
        </UForm>

        <template #footer>
          <div class="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <p class="font-medium mb-1">Conseils pour un mot de passe fort :</p>
              <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                <li>Au moins 8 caractères</li>
                <li>Majuscules et minuscules</li>
                <li>Chiffres et caractères spéciaux</li>
                <li>Évitez les informations personnelles</li>
              </ul>
            </div>
          </div>
        </template>
      </UPageCard>

      <!-- Sessions actives (optionnel - à implémenter plus tard) -->
      <UPageCard title="Sessions actives" description="Gérez les appareils connectés à votre compte." variant="subtle">
        <div class="space-y-3">
          <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-monitor" class="w-5 h-5 text-gray-500" />
              <div>
                <p class="font-medium text-sm">Session actuelle</p>
                <p class="text-xs text-gray-500">Cotonou, Bénin</p>
              </div>
            </div>
            <UBadge color="success" variant="subtle" size="xs">
              Actif
            </UBadge>
          </div>
        </div>
      </UPageCard>
    </div>

    <!-- Suppression de compte -->
    <UPageCard title="Zone dangereuse"
      description="La suppression de votre compte est une action irréversible. Toutes vos données seront supprimées définitivement."
      class="border-2 border-red-200 dark:border-red-900 w-1/2">
      <!-- Avertissement super admin -->
      <div v-if="isSuperAdmin && !isCheckingSuperAdmins"
        class="mb-4 flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
        <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div class="text-sm">
          <p class="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Attention : Vous êtes Super Administrateur
          </p>
          <p v-if="!hasOtherSuperAdmins" class="text-yellow-700 dark:text-yellow-300">
            Vous devez nommer un autre super administrateur avant de supprimer votre compte.
            <NuxtLink to="/settings/members" class="underline font-medium">
              Gérer les membres →
            </NuxtLink>
          </p>
          <p v-else class="text-yellow-700 dark:text-yellow-300">
            Un autre super administrateur est déjà en place. Vous pouvez supprimer votre compte.
          </p>
        </div>
      </div>

      <div class="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg mb-4">
        <UIcon name="i-lucide-alert-octagon" class="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div class="text-sm text-gray-700 dark:text-gray-300">
          <p class="font-medium mb-1">Cette action entraînera :</p>
          <ul class="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
            <li>La suppression définitive de toutes vos données</li>
            <li>La perte d'accès à tous vos projets</li>
            <li>La déconnexion immédiate de tous vos appareils</li>
            <li>L'impossibilité de récupérer votre compte</li>
          </ul>
        </div>
      </div>

      <UButton label="Supprimer mon compte" color="error" icon="i-lucide-trash-2"
        :disabled="isCheckingSuperAdmins || (isSuperAdmin && !hasOtherSuperAdmins)" @click="openDeleteModal" />
    </UPageCard>

    <!-- Modal de confirmation de suppression -->
    <UModal v-model:open="showDeleteModal" title="Confirmer la suppression" description="Cette action est irréversible">
      <template #content>
        <div class="p-4 space-y-4">
          <div class="flex items-center gap-3 mb-4">
            <div class="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <UIcon name="i-lucide-alert-triangle" class="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 class="text-lg font-semibold">Confirmer la suppression</h3>
              <p class="text-sm text-gray-500">Cette action est irréversible</p>
            </div>
          </div>

          <p class="text-sm text-gray-600 dark:text-gray-400">
            Pour confirmer la suppression de votre compte, veuillez taper
            <strong class="text-red-600 dark:text-red-400">SUPPRIMER</strong>
            dans le champ ci-dessous.
          </p>

          <UFormField label="Confirmation" required>
            <UInput v-model="deleteConfirmation" placeholder="Tapez SUPPRIMER" autocomplete="off" />
          </UFormField>

          <div class="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <UIcon name="i-lucide-info" class="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Vous recevrez un email de confirmation une fois votre compte supprimé.
            </p>
          </div>

          <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
            <UButton label="Annuler" color="neutral" variant="ghost" @click="showDeleteModal = false" />
            <UButton label="Supprimer définitivement" color="error" icon="i-lucide-trash-2" :loading="isDeletingAccount"
              :disabled="deleteConfirmation !== 'SUPPRIMER'" @click="deleteAccount" />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
