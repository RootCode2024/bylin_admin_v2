<script setup lang="ts">
const props = withDefaults(defineProps<{
  count?: number,
  ids: string[] // Liste des IDs à supprimer
}>(), {
  count: 0
})

const emit = defineEmits(['success'])
const store = useCustomerStore()
const open = ref(false)

async function onSubmit() {
  const success = await store.deleteCustomers(props.ids)
  if (success) {
    emit('success')
    open.value = false
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <!-- Slot pour le bouton déclencheur -->
    <slot>
        <UButton
          label="Delete"
          color="error"
          variant="subtle"
          icon="i-lucide-trash"
        >
          <template #trailing>
            <UKbd>{{ count }}</UKbd>
          </template>
        </UButton>
    </slot>

    <template #content>
        <div class="p-6">
            <h3 class="text-lg font-semibold">Supprimer {{ count }} client(s)?</h3>
            <p class="text-muted mt-2">Êtes vous sûre ? Cette action est irreversible.</p>

            <div class="flex justify-end gap-2 mt-6">
                <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
                <UButton
                label="Supprimer"
                color="error"
                variant="solid"
                :loading="store.loading"
                @click="onSubmit"
                />
            </div>
        </div>
    </template>
  </UModal>
</template>
