<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { generateCode } from '~/utils/attribute'
import type { AttributeType, AttributeValueFormData } from '~/types/attribute'

const emit = defineEmits<{
  created: []
}>()

const { createAttribute, loading } = useAttributes()

const open = ref(false)

// Types d'attributs disponibles
const typeOptions = [
  { label: 'Texte', value: 'text', icon: 'i-lucide-text' },
  { label: 'Sélection', value: 'select', icon: 'i-lucide-list' },
  { label: 'Couleur', value: 'color', icon: 'i-lucide-palette' },
  { label: 'Taille', value: 'size', icon: 'i-lucide-ruler' },
  { label: 'Oui/Non', value: 'boolean', icon: 'i-lucide-toggle-left' }
]

// Schéma de validation
const schema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim(),
  code: z.string()
    .min(2, 'Le code doit contenir au moins 2 caractères')
    .max(100, 'Le code ne peut pas dépasser 100 caractères')
    .regex(/^[a-z0-9_]+$/, 'Le code doit contenir uniquement des lettres minuscules, chiffres et underscores')
    .trim(),
  type: z.enum(['text', 'select', 'color', 'size', 'boolean']),
  is_filterable: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(9999).default(0),
})

type AttributeFormSchema = z.infer<typeof schema>

// État du formulaire
const state = reactive<Partial<AttributeFormSchema>>({
  name: '',
  code: '',
  type: 'select',
  is_filterable: false,
  sort_order: 0,
})

const defaultState: Partial<AttributeFormSchema> = {
  name: '',
  code: '',
  type: 'select',
  is_filterable: false,
  sort_order: 0,
}

// Gestion des valeurs
const values = ref<AttributeValueFormData[]>([])
const newValue = ref('')
const newValueLabel = ref('')
const newValueColor = ref('#000000')

// Computed
const requiresValues = computed(() => {
  return ['select', 'color', 'size'].includes(state.type || '')
})

const isColorType = computed(() => state.type === 'color')

// Auto-génération du code à partir du nom
watch(() => state.name, (newName) => {
  if (newName && !state.code) {
    state.code = generateCode(newName)
  }
})

// Gestion des valeurs
function addValue() {
  if (!newValue.value.trim()) return

  const value: AttributeValueFormData = {
    value: generateCode(newValue.value),
    label: newValueLabel.value || newValue.value,
    sort_order: values.value.length,
  }

  if (isColorType.value && newValueColor.value) {
    value.color_code = newValueColor.value.toUpperCase()
  }

  values.value.push(value)

  // Reset
  newValue.value = ''
  newValueLabel.value = ''
  newValueColor.value = '#000000'
}

function removeValue(index: number) {
  values.value.splice(index, 1)
  // Réindexer les sort_order
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
  // Réindexer
  values.value.forEach((val, idx) => {
    val.sort_order = idx
  })
}

function resetForm() {
  Object.assign(state, defaultState)
  values.value = []
  newValue.value = ''
  newValueLabel.value = ''
  newValueColor.value = '#000000'
}

// Soumission
async function onSubmit(event: FormSubmitEvent<AttributeFormSchema>) {
  try {
    // Vérification : si le type nécessite des valeurs
    if (requiresValues.value && values.value.length === 0) {
      useToast().add({
        title: 'Erreur de validation',
        description: 'Ce type d\'attribut nécessite au moins une valeur',
        color: 'error',
        icon: 'i-lucide-alert-circle'
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

    const success = await createAttribute(payload)
    if (success) {
      open.value = false
      emit('created')
      resetForm()
    }
  } catch (error) {
    console.error('Erreur lors de la création:', error)
  }
}

function handleModalClose() {
  resetForm()
}
</script>

<template>
  <UModal v-model:open="open" title="Nouvel attribut"
    description="Créer un nouvel attribut produit (Couleur, Taille, etc.)" :ui="{ content: 'min-w-[60%]' }"
    @close="handleModalClose">
    <UButton label="Nouvel attribut" icon="i-lucide-plus" color="primary" />

    <template #body>
      <UForm :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <!-- Informations de base -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Nom de l'attribut" name="name" required>
            <UInput v-model="state.name" placeholder="Couleur, Taille..." :disabled="loading" />
          </UFormField>

          <UFormField label="Code" name="code" required>
            <UInput v-model="state.code" placeholder="color, size..." :disabled="loading" />
            <template #hint>
              <span class="text-xs text-gray-500">Lettres minuscules, chiffres et underscores uniquement</span>
            </template>
          </UFormField>
        </div>

        <!-- Type et configuration -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Type d'attribut" name="type" required>
            <USelectMenu v-model="state.type" :items="typeOptions" value-key="value" label-key="label" class="w-full">
              <template #leading>
                <UIcon v-if="state.type" :name="typeOptions.find(t => t.value === state.type)?.icon || 'i-lucide-tag'"
                  class="size-4" />
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField label="Ordre de tri" name="sort_order">
            <UInput v-model.number="state.sort_order" type="number" :disabled="loading" />
          </UFormField>
        </div>

        <!-- Option filtrable -->
        <UFormField name="is_filterable">
          <USwitch v-model="state.is_filterable" label="Attribut filtrable (utilisé pour les filtres produits)" />
        </UFormField>

        <!-- Section Valeurs -->
        <div v-if="requiresValues" class="border-t pt-4 space-y-4">
          <div>
            <h4 class="text-sm font-medium mb-2">Valeurs de l'attribut</h4>
            <p class="text-xs text-gray-500 mb-3">
              Ajoutez les valeurs possibles pour cet attribut (ex: Rouge, Bleu pour Couleur)
            </p>

            <!-- Formulaire d'ajout de valeur -->
            <div class="space-y-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              <div class="grid grid-cols-12 gap-2">
                <div class="col-span-4">
                  <UInput v-model="newValue" placeholder="Valeur (ex: rouge)" @keyup.enter="addValue" />
                </div>
                <div class="col-span-4">
                  <UInput v-model="newValueLabel" placeholder="Label (ex: Rouge vif)" @keyup.enter="addValue" />
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
                  <UButton icon="i-lucide-plus" color="primary" block @click="addValue" :disabled="!newValue.trim()" />
                </div>
              </div>
            </div>

            <!-- Liste des valeurs -->
            <div v-if="values.length > 0" class="mt-3 space-y-2">
              <div v-for="(value, index) in values" :key="index"
                class="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border rounded-lg">
                <span v-if="isColorType && value.color_code" :style="{ backgroundColor: value.color_code }"
                  class="size-4 rounded-full border" />
                <div class="flex-1">
                  <p class="text-sm font-medium">{{ value.label }}</p>
                  <p class="text-xs text-gray-500">{{ value.value }}</p>
                </div>
                <div class="flex items-center gap-1">
                  <UButton icon="i-lucide-arrow-up" color="neutral" variant="ghost" size="xs" :disabled="index === 0"
                    @click="moveValue(index, 'up')" />
                  <UButton icon="i-lucide-arrow-down" color="neutral" variant="ghost" size="xs"
                    :disabled="index === values.length - 1" @click="moveValue(index, 'down')" />
                  <UButton icon="i-lucide-trash-2" color="error" variant="ghost" size="xs"
                    @click="removeValue(index)" />
                </div>
              </div>
            </div>

            <p v-else class="text-sm text-gray-500 text-center py-4">
              Aucune valeur ajoutée
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" />
          <UButton label="Créer l'attribut" color="primary" type="submit" :loading="loading" icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
