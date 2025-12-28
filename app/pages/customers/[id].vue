<script setup lang="ts">
import type { z } from 'zod'
import type { Customer } from '~/types/customer'
import type { Gender } from '~/utils/validation';
import { customerFormSchema } from '~/utils/validation'
import { parseStoredPhone, formatPhoneNumber } from '~/utils/format'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'default'
})

// ========================================
// Init
// ========================================
const route = useRoute()
const router = useRouter()
const toast = useToast()

const {
  loading,
  fetchCustomer,
  updateCustomer,
  deleteCustomers,
  updateStatus,
  exportCustomers
} = useCustomers()

const customerId = computed(() => route.params.id as string)
const customer = ref<Customer | null>(null)
const safeCustomer = computed(() => {
  if (!customer.value) {
    throw new Error('Customer not loaded')
  }
  return customer.value
})

const isEditing = ref(false)
const isInitialLoading = ref(true)

// ========================================
// Schema & Form State
// ========================================
const state = reactive<{
  first_name: string
  last_name: string
  email: string
  phone: { countryCode: string, number: string } | null
  date_of_birth: string | null
  gender?: Gender
  status: 'active' | 'inactive' | 'suspended'
}>({
  first_name: '',
  last_name: '',
  email: '',
  phone: null,
  date_of_birth: null,
  gender: undefined,
  status: 'active'
})

const statusOptions = [
  { label: 'Actif', value: 'active', color: 'success' },
  { label: 'Inactif', value: 'inactive', color: 'neutral' },
  { label: 'Suspendu', value: 'suspended', color: 'warning' }
]

const genderOptions = [
  { label: 'Masculin', value: 'male' },
  { label: 'Féminin', value: 'female' },
  { label: 'Autre', value: 'other' }
]

// ========================================
// Actions
// ========================================
async function loadData() {
  isInitialLoading.value = true
  const data = await fetchCustomer(customerId.value)

  if (data) {
    customer.value = data

    const parsedPhone = parseStoredPhone(data.phone)

    Object.assign(state, {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: parsedPhone,
      date_of_birth: data.date_of_birth,
      gender: data.gender,
      status: data.status
    })
  } else {
    router.replace('/customers')
  }
  isInitialLoading.value = false
}

type CustomerForm = z.infer<typeof customerFormSchema>

async function onSubmit(event: FormSubmitEvent<CustomerForm>) {
  if (!customer.value) return

  try {
    const validatedData = await customerFormSchema.parseAsync(event.data)

    const updateData: Partial<Customer> = {
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      email: validatedData.email,
      date_of_birth: validatedData.date_of_birth,
      gender: validatedData.gender,
      status: validatedData.status,
      ...(validatedData.phone
        ? {
          phone: formatPhoneNumber(
            validatedData.phone.countryCode,
            validatedData.phone.number
          )
        }
        : {})
    }

    const success = await updateCustomer(customer.value.id, updateData)

    if (success) {
      toast.add({
        title: 'Succès',
        description: 'Les informations du client ont été mises à jour',
        color: 'success'
      })
      isEditing.value = false
      await loadData()
    }
  } catch (error: unknown) {
    const message = getErrorMessage(error)
    toast.add({
      title: 'Erreur de validation',
      description: message,
      color: 'error'
    })
  }
}

async function handleDelete() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.')) return

  const success = await deleteCustomers([customerId.value])
  if (success) {
    toast.add({
      title: 'Client supprimé',
      description: 'Le client a été supprimé avec succès',
      color: 'success'
    })
    router.push('/customers')
  }
}

async function handleStatusChange(action: 'activate' | 'deactivate' | 'suspend') {
  const success = await updateStatus(customerId.value, action)
  if (success) {
    toast.add({
      title: 'Statut mis à jour',
      description: 'Le statut du client a été modifié',
      color: 'success'
    })
    await loadData()
  }
}

async function handleExport() {
  await exportCustomers('xlsx', [customerId.value])
}

function onCancel() {
  isEditing.value = false
  if (customer.value) {
    const parsedPhone = parseStoredPhone(customer.value.phone)

    Object.assign(state, {
      first_name: customer.value.first_name,
      last_name: customer.value.last_name,
      email: customer.value.email,
      phone: parsedPhone,
      date_of_birth: customer.value.date_of_birth,
      gender: customer.value.gender,
      status: customer.value.status
    })
  }
}

// Helper pour calculer l'âge
function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

onMounted(loadData)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UButton
icon="i-lucide-arrow-left"
variant="ghost"
color="neutral"
@click="router.back()" />
          <div v-if="isInitialLoading" class="w-32">
            <USkeleton class="h-6 w-full" />
          </div>
          <span v-else class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ customer?.first_name }} {{ customer?.last_name }}
          </span>
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
v-if="!isEditing && !isInitialLoading"
icon="i-lucide-download"
variant="outline"
color="neutral"
              @click="handleExport" />

            <UButton
v-if="!isEditing && !isInitialLoading"
label="Modifier"
icon="i-lucide-pencil"
color="primary"
              @click="isEditing = true" />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Skeleton Loading -->
      <div v-if="isInitialLoading" class="max-w-4xl mx-auto w-full space-y-6">
        <div class="flex gap-6 items-center">
          <USkeleton class="h-24 w-24 rounded-full" />
          <div class="space-y-3 flex-1">
            <USkeleton class="h-8 w-1/3" />
            <USkeleton class="h-4 w-1/4" />
          </div>
        </div>
        <USkeleton class="h-96 w-full rounded-xl" />
      </div>

      <!-- Contenu -->
      <div v-else-if="customer" class="max-w-4xl mx-auto w-full space-y-6">

        <!-- En-tête Profil -->
        <div class="flex items-start justify-between gap-6">
          <div class="flex items-center gap-6">
            <UAvatar
:src="safeCustomer.avatar_url"
size="3xl"
:alt="safeCustomer.first_name"
              class="ring-4 ring-white dark:ring-gray-900 shadow-sm" />
            <div>
              <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ safeCustomer.first_name }} {{ safeCustomer.last_name }}
              </h1>
              <div class="flex items-center gap-3 mt-2 text-gray-500">
                <span class="flex items-center gap-1">
                  <UIcon name="i-lucide-mail" class="w-4 h-4" /> {{ safeCustomer.email }}
                </span>
                <span v-if="safeCustomer.phone" class="flex items-center gap-1">
                  <UIcon name="i-lucide-phone" class="w-4 h-4" /> {{ safeCustomer.phone }}
                </span>
              </div>
              <div class="mt-2">
                <UBadge :color="statusOptions.find(o => o.value === customer?.status)?.color as any" variant="subtle">
                  {{statusOptions.find(o => o.value === customer?.status)?.label}}
                </UBadge>
              </div>
            </div>
          </div>

          <!-- Actions rapides -->
          <UDropdownMenu
v-if="!isEditing"
:items="[
            [
              {
                label: 'Activer',
                icon: 'i-lucide-check-circle',
                disabled: safeCustomer.status === 'active',
                onSelect: () => handleStatusChange('activate')
              },
              {
                label: 'Désactiver',
                icon: 'i-lucide-x-circle',
                disabled: safeCustomer.status === 'inactive',
                onSelect: () => handleStatusChange('deactivate')
              },
              {
                label: 'Suspendre',
                icon: 'i-lucide-ban',
                disabled: safeCustomer.status === 'suspended',
                onSelect: () => handleStatusChange('suspend')
              }
            ],
            [
              {
                label: 'Supprimer',
                icon: 'i-lucide-trash',
                color: 'error',
                onSelect: handleDelete
              }
            ]
          ]">
            <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="ghost" />
          </UDropdownMenu>
        </div>

        <!-- Informations personnelles -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations personnelles</h2>
              <div v-if="isEditing" class="flex items-center gap-2 text-sm text-amber-600">
                <UIcon name="i-lucide-shield-alert" class="w-4 h-4" />
                <span>Mode sécurisé activé</span>
              </div>
            </div>
          </template>

          <!-- Mode Lecture -->
          <div v-if="!isEditing" class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500">Prénom</label>
                <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ safeCustomer.first_name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Email</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ safeCustomer.email }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Date de naissance</label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ safeCustomer.date_of_birth ? new Date(safeCustomer.date_of_birth).toLocaleDateString('fr-FR') :
                  'Non renseignée' }}
                  <span v-if="safeCustomer.date_of_birth" class="text-sm text-gray-500 ml-2">
                    ({{ calculateAge(safeCustomer.date_of_birth) }} ans)
                  </span>
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Email vérifié</label>
                <p class="mt-1">
                  <UBadge :color="safeCustomer.email_verified_at ? 'success' : 'neutral'" variant="subtle">
                    {{ safeCustomer.email_verified_at ? 'Oui' : 'Non' }}
                  </UBadge>
                </p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500">Nom</label>
                <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ safeCustomer.last_name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Téléphone</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ safeCustomer.phone || 'Non renseigné' }}</p>
              </div>
              <div v-if="customer">
                <label class="text-sm font-medium text-gray-500">Genre</label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{genderOptions.find(g => g.value === safeCustomer.gender)?.label || 'Non renseigné'}}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">ID Système</label>
                <p class="mt-1 font-mono text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded w-fit select-all">
                  {{ safeCustomer.id }}
                </p>
              </div>
            </div>
            <div class="md:col-span-2 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <label class="text-gray-500">Créé le</label>
                  <p class="text-gray-900 dark:text-white font-medium">
                    {{ new Date(safeCustomer.created_at).toLocaleString('fr-FR') }}
                  </p>
                </div>
                <div>
                  <label class="text-gray-500">Modifié le</label>
                  <p class="text-gray-900 dark:text-white font-medium">
                    {{ new Date(safeCustomer.updated_at).toLocaleString('fr-FR') }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Mode Édition -->
          <UForm
v-else
:schema="customerFormSchema"
:state="state"
class="space-y-5"
@submit="onSubmit">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <UFormField label="Prénom" name="first_name" required>
                <UInput v-model="state.first_name" placeholder="Jean" class="w-full" />
              </UFormField>

              <UFormField label="Nom" name="last_name" required>
                <UInput v-model="state.last_name" placeholder="Dupont" class="w-full" />
              </UFormField>

              <UFormField
label="Email"
name="email"
required
class="md:col-span-2">
                <CustomersEmailEdit v-model="state.email" :disabled="loading" />
              </UFormField>

              <UFormField label="Téléphone" name="phone" class="md:col-span-2">
                <CustomersPhoneEdit v-model="state.phone" :disabled="loading" />
              </UFormField>

              <UFormField
label="Date de naissance"
name="date_of_birth"
                help="L'utilisateur doit avoir au moins 13 ans">
                <UInput
v-model="state.date_of_birth"
type="date"
                  :max="new Date(new Date().setFullYear(new Date().getFullYear() - 13)).toISOString().split('T')[0]"
                  class="w-full" />
              </UFormField>

              <UFormField label="Genre" name="gender">
                <USelectMenu
v-model="state.gender"
:items="genderOptions"
value-key="value"
label-key="label"
                  placeholder="Sélectionner"
class="w-full" />
              </UFormField>

              <UFormField label="Statut" name="status" class="md:col-span-2">
                <USelectMenu
v-model="state.status"
:items="statusOptions"
value-key="value"
label-key="label" />
              </UFormField>
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <UButton
label="Supprimer ce client"
color="error"
variant="ghost"
icon="i-lucide-trash"
                @click="handleDelete" />

              <div class="flex gap-3">
                <UButton
label="Annuler"
color="neutral"
variant="outline"
:disabled="loading"
@click="onCancel" />
                <UButton
label="Enregistrer"
type="submit"
color="primary"
icon="i-lucide-save"
:loading="loading" />
              </div>
            </div>
          </UForm>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
