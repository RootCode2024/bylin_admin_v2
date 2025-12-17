<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const store = useCustomerStore()
const open = ref(false)

const schema = z.object({
  first_name: z.string().min(2, 'Trop court'),
  last_name: z.string().min(2, 'Trop court'),
  email: z.string().email('Email invalide')
})

type Schema = z.output<typeof schema>

const state = reactive<Partial<Schema>>({
  first_name: undefined,
  last_name: undefined,
  email: undefined
})

async function onSubmit(event: FormSubmitEvent<Schema>) {
  const success = await store.createCustomer(event.data)
  if (success) {
    open.value = false
    // Reset form
    state.first_name = undefined
    state.last_name = undefined
    state.email = undefined
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Nouveau client">
    <UButton label="Nouveau client" icon="i-lucide-plus" />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Prénom" name="first_name">
              <UInput v-model="state.first_name" />
            </UFormField>
            <UFormField label="Nom" name="last_name">
              <UInput v-model="state.last_name" />
            </UFormField>
        </div>
        <UFormField label="Adresse mail" name="email">
          <UInput v-model="state.email" type="email" />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton label="Annuler" color="neutral" variant="subtle" @click="open = false" />
          <UButton
            label="Créé"
            color="primary"
            type="submit"
            :loading="store.loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
