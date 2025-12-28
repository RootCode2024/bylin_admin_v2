<script setup lang="ts">
const props = defineProps<{
  open: boolean
  selectedIds?: string[]
}>()

const emit = defineEmits(['update:open'])

const { exportCustomers, loading } = useCustomers()

type ExportFormat = 'xlsx' | 'csv' | 'pdf'

const format = ref<ExportFormat>('xlsx')

const formatOptions: readonly {
  label: string
  value: ExportFormat
  icon: string
  description: string
}[] = [
    { label: 'Excel (XLSX)', value: 'xlsx', icon: 'i-lucide-file-spreadsheet', description: 'Recommandé pour les analyses' },
    { label: 'CSV', value: 'csv', icon: 'i-lucide-file-text', description: 'Compatible avec tous les outils' },
    { label: 'PDF', value: 'pdf', icon: 'i-lucide-file', description: 'Document imprimable' }
  ]

function close() {
  emit('update:open', false)
}

async function onExport() {
  await exportCustomers(format.value, props.selectedIds)
  close()
}
</script>

<template>
  <UModal :open="open" @update:open="emit('update:open', $event)">
    <template #content>
      <div class="p-6">
        <div class="mb-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-lucide-download" class="w-5 h-5" />
            Exporter les clients
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ selectedIds && selectedIds.length > 0
              ? `${selectedIds.length} client(s) sélectionné(s)`
              : 'Tous les clients correspondant aux filtres actuels' }}
          </p>
        </div>

        <div class="space-y-3 mb-6">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300">Format d'export</label>
          <div class="space-y-2">
            <div
v-for="option in formatOptions"
:key="option.value"
:class="[
              'flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all',
              format === option.value
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50'
                : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            ]"
@click="format = option.value">
              <UIcon
:name="option.icon"
:class="[
                'w-5 h-5 mt-0.5',
                format === option.value ? 'text-primary-600' : 'text-gray-400'
              ]" />
              <div class="flex-1">
                <p
:class="[
                  'font-medium',
                  format === option.value ? 'text-primary-700 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                ]">
                  {{ option.label }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ option.description }}
                </p>
              </div>
              <UIcon v-if="format === option.value" name="i-lucide-check-circle" class="w-5 h-5 text-primary-600" />
            </div>
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
label="Télécharger"
color="primary"
icon="i-lucide-download"
:loading="loading"
@click="onExport" />
        </div>
      </div>
    </template>
  </UModal>
</template>
