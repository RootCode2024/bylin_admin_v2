<script setup lang="ts">
import type { Customer } from '~/types/customer'
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

// ========================================
// Init
// ========================================
const route = useRoute()
const router = useRouter()
const toast = useToast()
const { loading, fetchCustomer, updateCustomer, deleteCustomers } = useCustomers()

const customerId = computed(() => route.params.id as string)
const customer = ref<Customer | null>(null)
const isEditing = ref(false)
const isInitialLoading = ref(true)

// ========================================
// Formulaire & Schema (Zod)
// ========================================
const schema = z.object({
  first_name: z.string().min(1, 'Requis'),
  last_name: z.string().min(1, 'Requis'),
  email: z.email('Email invalide'),
  phone: z.string().optional().nullable().transform(val => val ?? undefined),
  status: z.enum(['active', 'inactive', 'suspended', 'bounced', 'subscribed', 'unsubscribed'])
})

type Schema = z.output<typeof schema>

// État réactif du formulaire
const state = reactive<Partial<Schema>>({})

// Options de statut (avec couleurs pour SelectMenu)
const statusOptions = [
  { label: 'Actif', value: 'active', color: 'success' },
  { label: 'Inactif', value: 'inactive', color: 'neutral' },
  { label: 'Suspendu', value: 'suspended', color: 'warning' },
  { label: 'Rejeté', value: 'bounced', color: 'error' },
  { label: 'Abonné', value: 'subscribed', color: 'success' },
  { label: 'Désabonné', value: 'unsubscribed', color: 'neutral' }
]

// ========================================
// Logique
// ========================================
async function loadData() {
  isInitialLoading.value = true
  const data = await fetchCustomer(customerId.value)

  if (data) {
    customer.value = data
    // Remplir le state du formulaire
    Object.assign(state, {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone,
      status: data.status
    })
  } else {
    router.replace('/customers')
  }
  isInitialLoading.value = false
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!customer.value) return

  const success = await updateCustomer(customer.value.id, event.data)
  if (success) {
    isEditing.value = false
    await loadData() // Rafraîchir
  }
}

async function handleDelete() {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce client définitivement ?')) return
  const success = await deleteCustomers([customerId.value])
  if (success) router.push('/customers')
}

function onCancel() {
  isEditing.value = false
  // Reset form state
  if (customer.value) {
    Object.assign(state, {
      first_name: customer.value.first_name,
      last_name: customer.value.last_name,
      email: customer.value.email,
      phone: customer.value.phone,
      status: customer.value.status
    })
  }
}

onMounted(loadData)
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar>
        <template #left>
          <UButton icon="i-lucide-arrow-left" variant="ghost" color="neutral" @click="router.back()" />
          <!-- Titre avec Skeleton -->
          <div v-if="isInitialLoading" class="w-32">
            <USkeleton class="h-6 w-full" />
          </div>
          <span v-else class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ customer?.first_name }} {{ customer?.last_name }}
          </span>
        </template>

        <template #right>
          <UButton v-if="!isEditing && !isInitialLoading" label="Modifier" icon="i-lucide-pencil" color="primary"
            variant="solid" @click="isEditing = true" />
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

      <!-- Contenu Principal -->
      <div v-else-if="customer" class="max-w-4xl mx-auto w-full space-y-6">

        <!-- En-tête Profil -->
        <div class="flex items-center gap-6">
          <UAvatar :src="customer.avatar_url" size="3xl" :alt="customer.first_name"
            class="ring-4 ring-white dark:ring-gray-900 shadow-sm" />
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
              {{ customer.first_name }} {{ customer.last_name }}
            </h1>
            <div class="flex items-center gap-3 mt-2 text-gray-500">
              <span class="flex items-center gap-1">
                <UIcon name="i-lucide-mail" class="w-4 h-4" /> {{ customer.email }}
              </span>
              <span v-if="customer.location" class="flex items-center gap-1">
                <UIcon name="i-lucide-map-pin" class="w-4 h-4" /> {{ customer.location }}
              </span>
            </div>
          </div>
        </div>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Informations personnelles</h2>
              <UBadge v-if="!isEditing" :color="statusOptions.find(o => o.value === customer?.status)?.color as any"
                variant="subtle" size="md">
                {{statusOptions.find(o => o.value === customer?.status)?.label}}
              </UBadge>
            </div>
          </template>

          <!-- Mode Lecture -->
          <div v-if="!isEditing" class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500">Téléphone</label>
                <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ customer.phone || 'Non renseigné' }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500">Date d'inscription</label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ new
                  Date(customer.created_at).toLocaleDateString('fr-FR') }}</p>
              </div>
            </div>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500">ID Système</label>
                <p class="mt-1 font-mono text-xs bg-gray-100 dark:bg-gray-800 p-1.5 rounded w-fit select-all">
                  {{ customer.id }}
                </p>
              </div>
            </div>
          </div>

          <!-- Mode Édition (UForm v4) -->
          <UForm v-else :schema="schema" :state="state" @submit="onSubmit" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <UFormField label="Prénom" name="first_name" required>
                <UInput v-model="state.first_name" class="w-full" />
              </UFormField>

              <UFormField label="Nom" name="last_name" required>
                <UInput v-model="state.last_name" class="w-full" />
              </UFormField>

              <UFormField label="Email" name="email" required>
                <UInput v-model="state.email" type="email" icon="i-lucide-mail" />
              </UFormField>

              <UFormField label="Téléphone" name="phone">
                <UInput v-model="state.phone" icon="i-lucide-phone" placeholder="+33 6..." />
              </UFormField>

              <!-- 🔧 CORRECTION: value-key + label-key au lieu de value/option-attribute -->
              <UFormField label="Statut" name="status" class="md:col-span-2">
                <USelectMenu v-model="state.status" :items="statusOptions" value-key="value" label-key="label" />
              </UFormField>
            </div>

            <div class="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
              <UButton label="Supprimer ce client" color="error" variant="ghost" icon="i-lucide-trash"
                @click="handleDelete" />

              <div class="flex gap-3">
                <UButton label="Annuler" color="neutral" variant="outline" @click="onCancel" :disabled="loading" />
                <UButton label="Enregistrer" type="submit" color="primary" icon="i-lucide-save" :loading="loading" />
              </div>
            </div>
          </UForm>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
