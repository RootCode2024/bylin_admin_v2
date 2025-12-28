<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { createCustomer, loading } = useCustomers()
const open = ref(false)

const schema = z.object({
  first_name: z.string().min(2, 'Minimum 2 caractères'),
  last_name: z.string().min(2, 'Minimum 2 caractères'),
  email: z.email('Format email invalide'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active'),
  send_credentials: z.boolean().default(false)
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  status: 'active',
  send_credentials: false
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const success = await createCustomer(event.data)
  if (success) {
    open.value = false
    // Reset
    Object.assign(state, {
      first_name: undefined,
      last_name: undefined,
      email: undefined,
      phone: undefined,
      date_of_birth: undefined,
      gender: undefined,
      status: 'active',
      send_credentials: false
    })
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Nouveau client" description="Créer un nouveau compte client">
    <UButton label="Nouveau client" icon="i-lucide-plus" color="primary" />

    <template #content>
      <UForm
:schema="schema"
:state="state"
class="p-4 space-y-4"
@submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Prénom" name="first_name" required>
            <UInput v-model="state.first_name" placeholder="Jean" autofocus />
          </UFormField>

          <UFormField label="Nom" name="last_name" required>
            <UInput v-model="state.last_name" placeholder="Dupont" />
          </UFormField>
        </div>

        <UFormField label="Adresse email" name="email" required>
          <UInput
v-model="state.email"
type="email"
placeholder="jean.dupont@example.com"
icon="i-lucide-mail" />
        </UFormField>

        <UFormField label="Téléphone" name="phone">
          <UInput v-model="state.phone" placeholder="+33 6 12 34 56 78" icon="i-lucide-phone" />
        </UFormField>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Date de naissance" name="date_of_birth">
            <UInput v-model="state.date_of_birth" type="date" />
          </UFormField>

          <UFormField label="Genre" name="gender">
            <USelectMenu
v-model="state.gender"
:items="[
              { label: 'Masculin', value: 'male' },
              { label: 'Féminin', value: 'female' },
              { label: 'Autre', value: 'other' }
            ]"
value-key="value"
label-key="label"
placeholder="Sélectionner" />
          </UFormField>
        </div>

        <UFormField label="Statut initial" name="status">
          <USelectMenu
v-model="state.status"
:items="[
            { label: 'Actif', value: 'active' },
            { label: 'Inactif', value: 'inactive' },
            { label: 'Suspendu', value: 'suspended' }
          ]"
value-key="value"
label-key="label" />
        </UFormField>

        <UFormField name="send_credentials">
          <UCheckbox
v-model="state.send_credentials"
label="Envoyer les identifiants par email"
            help="Un email sera envoyé avec les informations de connexion" />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <UButton
label="Annuler"
color="neutral"
variant="ghost"
:disabled="loading"
@click="open = false" />
          <UButton
label="Créer le client"
color="primary"
type="submit"
:loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
