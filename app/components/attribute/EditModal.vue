<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Attribute, AttributeValueFormData } from '~/types/attribute'

const props = defineProps<{
  attribute: Attribute | null
}>()

const emit = defineEmits<{
  updated: []
}>()

const open = defineModel<boolean>('open', { default: false })

const { updateAttribute, loading } = useAttributes()

const typeOptions = [
  { label: 'Texte', value: 'text', icon: 'i-lucide-text' },
  { label: 'Sélection', value: 'select', icon: 'i-lucide-list' },
  { label: 'Couleur', value: 'color', icon: 'i-lucide-palette' },
  { label: 'Taille', value: 'size', icon: 'i-lucide-ruler' },
  { label: 'Oui/Non', value: 'boolean', icon: 'i-lucide-toggle-left' }
]

const schema = z.object({
  name: z.string().min(2).max(255).trim(),
  code: z.string().min(2).max(100).regex(/^[a-z0-9_]+$/).trim(),
  type: z.enum(['text', 'select', 'color', 'size', 'boolean']),
  is_filterable: z.boolean(),
  sort_order: z.number().int().min(0).max(9999),
})

type AttributeFormSchema = z.infer<typeof schema>

const state = reactive<Partial<AttributeFormSchema>>({
  name: '',
  code: '',
  type: 'select',
  is_filterable: false,
  sort_order: 0,
})

const values = ref<AttributeValueFormData[]>([])
const newValue = ref('')
const newValueLabel = ref('')
const newValueColor = ref('#000000')

const requiresValues = computed(() => ['select', 'color', 'size'].includes(state.type || ''))
const isColorType = computed(() => state.type === 'color')

// Watcher pour charger les données
watch(() => props.attribute, (attr) => {
  if (attr && open.value) {
    state.name = attr.name
    state.code = attr.code
    state.type = attr.type
    state.is_filterable = attr.is_filterable
    state.sort_order = attr.sort_order

    // Charger les valeurs
    values.value = attr.values?.map(v => ({
      id: v.id,
      value: v.value,
      label: v.label,
      color_code: v.color_code || undefined,
      sort_order: v.sort_order
    })) || []
  }
}, { immediate: true })

function addValue() {
  if (!newValue.value.trim()) return

  const value: AttributeValueFormData = {
    value: newValue.value.toLowerCase().replace(/\s+/g, '_'),
    label: newValueLabel.value || newValue.value,
    sort_order: values.value.length,
  }

  if (isColorType.value && newValueColor.value) {
    value.color_code = newValueColor.value.toUpperCase()
  }

  values.value.push(value)
  newValue.value = ''
  newValueLabel.value = ''
  newValueColor.value = '#000000'
}

function removeValue(index: number) {
  values.value.splice(index, 1)
  values.value.forEach((val, idx) => {
    val.sort_order = idx
  })
}

function moveValue(index: number, direction: 'up' | 'down') {
  if (direction === 'up' && index > 0) {
    const temp = values.value[index]
    values.value[index] = values.value[index - 1]!
    values.value[index - 1] = temp!
  } else if (direction === 'down' && index < values.value.length - 1) {
    const temp = values.value[index]
    values.value[index] = values.value[index + 1]!
    values.value[index + 1] = temp!
  }
  values.value.forEach((val, idx) => {
    val.sort_order = idx
  })
}

async function onSubmit(event: FormSubmitEvent<AttributeFormSchema>) {
  if (!props.attribute) return

  try {
    if (requiresValues.value && values.value.length === 0) {
      useToast().add({
        title: 'Erreur de validation',
        description: 'Ce type d\'attribut nécessite au moins une valeur',
        color: 'error',
      })
      return
    }

    const payload = {
      name: event.data.name,
      code: event.data.code,
      type: event.data.type,
      is_filterable: event.data.is_filterable,
      sort_order: event.data.sort_order,
      values: values.value
    }

    const success = await updateAttribute(props.attribute.id, payload)
    if (success) {
      open.value = false
      emit('updated')
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
  }
}
</script>

<template>
  <UModal
v-model:open="open"
title="Modifier l'attribut"
    :description="`Modification de l'attribut ${attribute?.name || ''}`"
:ui="{ content: 'min-w-[60%]' }">
    <template #body>
      <UForm
v-if="attribute"
:schema="schema"
:state="state"
class="p-4 space-y-4"
@submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nom de l'attribut" name="name" required>
            <UInput v-model="state.name" :disabled="loading" />
          </UFormField>

          <UFormField label="Code" name="code" required>
            <UInput v-model="state.code" :disabled="loading" />
            <template #hint>
              <span class="text-xs text-gray-500">Lettres minuscules, chiffres et underscores uniquement</span>
            </template>
          </UFormField>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type d'attribut" name="type" required>
            <USelectMenu
v-model="state.type"
:items="typeOptions"
value-key="value"
label-key="label"
class="w-full">
              <template #leading>
                <UIcon
v-if="state.type"
:name="typeOptions.find(t => t.value === state.type)?.icon || 'i-lucide-tag'"
                  class="size-4" />
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField label="Ordre de tri" name="sort_order">
            <UInput v-model.number="state.sort_order" type="number" :disabled="loading" />
          </UFormField>
        </div>

        <UFormField name="is_filterable">
          <USwitch v-model="state.is_filterable" label="Attribut filtrable" />
        </UFormField>

        <!-- Gestion des valeurs -->
        <div v-if="requiresValues" class="border-t pt-4 space-y-4">
          <div>
            <h4 class="text-sm font-medium mb-2">Valeurs de l'attribut</h4>

            <div class="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div class="grid grid-cols-12 gap-2">
                <div class="col-span-4">
                  <UInput v-model="newValue" placeholder="Valeur" @keyup.enter="addValue" />
                </div>
                <div class="col-span-4">
                  <UInput v-model="newValueLabel" placeholder="Label" @keyup.enter="addValue" />
                </div>
                <div v-if="isColorType" class="col-span-3">
                  <UPopover>
                    <UButton color="neutral" variant="outline" class="w-full">
                      <template #leading>
                        <span :style="{ backgroundColor: newValueColor }" class="size-3 rounded-full" />
                      </template>
                      Couleur
                    </UButton>
                    <template #content>
                      <UColorPicker v-model="newValueColor" class="p-2" />
                    </template>
                  </UPopover>
                </div>
                <div :class="isColorType ? 'col-span-1' : 'col-span-4'">
                  <UButton
icon="i-lucide-plus"
color="primary"
block
:disabled="!newValue.trim()"
@click="addValue" />
                </div>
              </div>
            </div>

            <div v-if="values.length > 0" class="mt-3 space-y-2">
              <div
v-for="(value, index) in values"
:key="value.id || index"
                class="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border rounded-lg">
                <span
v-if="isColorType && value.color_code"
:style="{ backgroundColor: value.color_code }"
                  class="size-4 rounded-full border" />
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ value.label }}</p>
                  <p class="text-xs text-gray-500">{{ value.value }}</p>
                </div>
                <div class="flex items-center gap-1">
                  <UButton
icon="i-lucide-arrow-up"
color="neutral"
variant="ghost"
size="xs"
:disabled="index === 0"
                    @click="moveValue(index, 'up')" />
                  <UButton
icon="i-lucide-arrow-down"
color="neutral"
variant="ghost"
size="xs"
                    :disabled="index === values.length - 1"
@click="moveValue(index, 'down')" />
                  <UButton
icon="i-lucide-trash-2"
color="error"
variant="ghost"
size="xs"
                    @click="removeValue(index)" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton
label="Annuler"
color="neutral"
variant="ghost"
@click="open = false" />
          <UButton
label="Mettre à jour"
color="primary"
type="submit"
:loading="loading"
icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
