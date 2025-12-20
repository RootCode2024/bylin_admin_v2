<script setup lang="ts">
const props = defineProps<{
  ids: string[]
}>()

const emit = defineEmits<{
  success: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { deletePromotions, loading } = usePromotions()

const count = computed(() => props.ids.length)

const title = computed(() => {
  return count.value === 1
    ? 'Supprimer cette promotion ?'
    : `Supprimer ${count.value} promotions ?`
})

const description = computed(() => {
  return count.value === 1
    ? 'Cette action peut être annulée. La promotion sera placée dans la corbeille.'
    : `Ces ${count.value} promotions seront placées dans la corbeille. Cette action peut être annulée.`
})

async function handleDelete() {
  const success = await deletePromotions(props.ids)
  if (success) {
    open.value = false
    emit('success')
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="title" :description="description">
    <template #body>
      <div class="p-4 space-y-4">
        <div
          class="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <UIcon name="i-lucide-alert-triangle"
            class="size-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
          <div class="flex-1 text-sm">
            <p class="font-medium text-amber-900 dark:text-amber-100 mb-1">
              Attention
            </p>
            <p class="text-amber-700 dark:text-amber-300">
              Les codes promo déjà utilisés resteront dans l'historique des commandes,
              mais ne pourront plus être appliqués.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" :disabled="loading" />
          <UButton :label="count === 1 ? 'Supprimer' : `Supprimer (${count})`" color="error" icon="i-lucide-trash-2"
            :loading="loading" @click="handleDelete" />
        </div>
      </div>
    </template>
  </UModal>
</template>
