<script setup lang="ts">
const props = defineProps<{
  open: boolean
  ids: string[]
}>()

const emit = defineEmits(['update:open', 'success'])

const { restoreCustomers, loading } = useCustomers()

function close() {
  emit('update:open', false)
}

async function onConfirm() {
  const success = await restoreCustomers(props.ids)
  if (success) {
    emit('success')
    close()
  }
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6">
        <div class="flex items-center gap-4 mb-5">
          <div
            class="p-3 rounded-full bg-success-50 dark:bg-success-950/50 text-success-600 dark:text-success-400 ring-1 ring-success-200 dark:ring-success-900">
            <UIcon name="i-lucide-rotate-ccw" class="w-6 h-6" />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Restaurer {{ ids.length > 1 ? 'les clients' : 'le client' }} ?
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {{ ids.length > 1 ? 'Ces clients seront réactivés' : 'Ce client sera réactivé' }} et apparaîtra de nouveau
              dans la liste principale.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3">
          <UButton
label="Annuler"
color="neutral"
variant="ghost"
:disabled="loading"
@click="close" />
          <UButton
label="Restaurer"
color="success"
variant="solid"
:loading="loading"
@click="onConfirm" />
        </div>
      </div>
    </template>
  </UModal>
</template>
