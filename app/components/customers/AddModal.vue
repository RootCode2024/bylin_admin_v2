<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const { createCustomer, loading } = useCustomers()
const open = ref(false)

// Schema Zod
const schema = z.object({
  first_name: z.string().min(2, 'Minimum 2 caractères'),
  last_name: z.string().min(2, 'Minimum 2 caractères'),
  email: z.string().email('Format email invalide')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const success = await createCustomer(event.data)
  if (success) {
    open.value = false
    // Reset propre
    Object.assign(state, { first_name: undefined, last_name: undefined, email: undefined })
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Nouveau client" description="Ajouter un client manuellement à la base de données.">
    <!-- Trigger Button -->
    <UButton label="Nouveau client" icon="i-lucide-plus" color="primary" />

    <template #content>
      <UForm :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Prénom" name="first_name" required>
            <UInput v-model="state.first_name" placeholder="Jean" autofocus />
          </UFormField>
          <UFormField label="Nom" name="last_name" required>
            <UInput v-model="state.last_name" placeholder="Dupont" />
          </UFormField>
        </div>

        <UFormField label="Adresse email" name="email" required>
          <UInput v-model="state.email" type="email" placeholder="jean.dupont@example.com" icon="i-lucide-mail" />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="Créer le client" color="primary" type="submit" :loading="loading" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
