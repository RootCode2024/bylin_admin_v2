<script setup lang="ts">
const props = defineProps<{
  ids: string[]
}>()

const emit = defineEmits<{
  success: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { deleteReviews, loading } = useReviews()

const isMultiple = computed(() => props.ids.length > 1)

const title = computed(() =>
  isMultiple.value
    ? `Supprimer ${props.ids.length} avis`
    : 'Supprimer cet avis'
)

const description = computed(() =>
  isMultiple.value
    ? `Êtes-vous sûr de vouloir supprimer ces ${props.ids.length} avis ? Cette action peut être annulée.`
    : 'Êtes-vous sûr de vouloir supprimer cet avis ? Cette action peut être annulée.'
)

async function handleDelete() {
  const success = await deleteReviews(props.ids)
  if (success) {
    open.value = false
    emit('success')
  }
}
</script>

<template>
  <UModal v-model:open="open" :title="title">
    <template #body>
      <div class="p-4 space-y-4">
        <div class="flex items-start gap-3">
          <div class="p-2 rounded-full bg-error-50 dark:bg-error-950">
            <UIcon name="i-lucide-alert-triangle" class="w-5 h-5 text-error-600" />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ description }}
            </p>
            <p class="text-xs text-gray-500 mt-2">
              Les avis supprimés peuvent être restaurés depuis la corbeille.
            </p>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton
            label="Annuler"
            color="neutral"
            variant="ghost"
            @click="open = false"
          />
          <UButton
            label="Supprimer"
            color="error"
            icon="i-lucide-trash-2"
            :loading="loading"
            @click="handleDelete"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
