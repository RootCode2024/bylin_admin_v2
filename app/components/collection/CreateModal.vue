<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { DEFAULT_IMAGE_CONFIG } from '~/utils/helpers'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': []
}>()

// ✅ CORRECTION: Utiliser isLoading au lieu de loading
const { createCollection, isLoading } = useCollections()

// ========================================
// État
// ========================================
const objectUrls = new Set<string>()

/**
 * Schéma de validation Zod
 */
const schema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(255, 'Le nom ne peut pas dépasser 255 caractères')
    .trim(),
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  image: z.instanceof(File).optional(),
  is_active: z.boolean().default(true),
  display_order: z.number().int().min(0).max(9999).default(0),
  meta_title: z.string().max(255).optional().or(z.literal('')),
  meta_description: z.string().max(500).optional().or(z.literal(''))
})

type CollectionFormSchema = z.infer<typeof schema>

const state = reactive<Partial<CollectionFormSchema>>({
  name: '',
  description: '',
  image: undefined,
  is_active: true,
  display_order: 0,
  meta_title: '',
  meta_description: ''
})

// ========================================
// Computed
// ========================================
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// ========================================
// Methods
// ========================================

function createPreviewUrl(file: File): string {
  const url = URL.createObjectURL(file)
  objectUrls.add(url)
  return url
}

function cleanupObjectUrls(): void {
  objectUrls.forEach(url => URL.revokeObjectURL(url))
  objectUrls.clear()
}

function removeImage(): void {
  state.image = undefined
  cleanupObjectUrls()
}

/**
 * Soumet le formulaire
 */
async function onSubmit(event: FormSubmitEvent<CollectionFormSchema>): Promise<void> {
  try {
    // ✅ CORRECTION: Passer un objet au lieu de FormData
    const dataToSend = {
      name: event.data.name,
      description: event.data.description,
      is_active: event.data.is_active,
      display_order: event.data.display_order,
      meta_title: event.data.meta_title,
      meta_description: event.data.meta_description,
      image: event.data.image
    }

    const collection = await createCollection(dataToSend)

    if (collection) {
      emit('created')
      handleClose()
    }
  } catch (error) {
    console.error('Erreur lors de la création:', error)
  }
}

/**
 * Réinitialise et ferme
 */
function handleClose() {
  Object.assign(state, {
    name: '',
    description: '',
    image: undefined,
    is_active: true,
    display_order: 0,
    meta_title: '',
    meta_description: ''
  })

  cleanupObjectUrls()
  isOpen.value = false
}

function handleModalClose(): void {
  cleanupObjectUrls()
}

// ========================================
// Lifecycle
// ========================================
onBeforeUnmount(() => cleanupObjectUrls())
</script>

<template>
  <UModal v-model:open="isOpen" title="Nouvelle collection" description="Créer une nouvelle collection de produits"
    :ui="{ content: 'min-w-[60%]' }" @close="handleModalClose">
    <template #body>
      <UForm :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <!-- Nom -->
        <UFormField label="Nom de la collection" name="name" required>
          <UInput v-model="state.name" placeholder="Ex: Collection Été 2024" class="w-full" :disabled="isLoading" />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" name="description">
          <UTextarea v-model="state.description" :rows="4" placeholder="Décrivez cette collection..." class="w-full"
            :disabled="isLoading" />
        </UFormField>

        <!-- Image -->
        <UFormField label="Image de la collection" name="image">
          <UFileUpload v-slot="{ open: openFileDialog, removeFile }" v-model="state.image"
            :accept="DEFAULT_IMAGE_CONFIG.acceptedTypes.join(',')">
            <div class="flex items-center gap-3">
              <UAvatar size="lg" :src="state.image ? createPreviewUrl(state.image) : undefined" icon="i-lucide-image" />
              <UButton :label="state.image ? 'Modifier l\'image' : 'Télécharger'" color="neutral" variant="outline"
                icon="i-lucide-upload" @click="openFileDialog()" :disabled="isLoading" />
            </div>
            <div v-if="state.image" class="mt-2">
              <p class="text-xs">{{ state.image.name }}</p>
              <UButton label="Supprimer l'image" color="error" variant="link" size="xs" class="p-0"
                @click="() => { removeFile(); removeImage() }" />
            </div>
          </UFileUpload>
        </UFormField>

        <!-- Options -->
        <div class="border-t pt-4 space-y-3">
          <UFormField label="Ordre d'affichage" name="display_order">
            <UInput v-model.number="state.display_order" type="number" min="0" class="w-full" />
          </UFormField>

          <USwitch v-model="state.is_active" label="Collection active" />
        </div>

        <!-- SEO (Accordion) -->
        <UAccordion :items="[{ label: 'Paramètres SEO (optionnel)', icon: 'i-lucide-search', defaultOpen: false }]">
          <template #default>
            <div class="space-y-4 pt-4">
              <UFormField label="Titre SEO" name="meta_title">
                <UInput v-model="state.meta_title" placeholder="Titre pour les moteurs de recherche" class="w-full" />
                <template #hint>
                  <span class="text-xs">{{ state.meta_title?.length || 0 }}/255 caractères</span>
                </template>
              </UFormField>

              <UFormField label="Description SEO" name="meta_description">
                <UTextarea v-model="state.meta_description" :rows="3"
                  placeholder="Description pour les moteurs de recherche" class="w-full" />
                <template #hint>
                  <span class="text-xs">{{ state.meta_description?.length || 0 }}/500 caractères</span>
                </template>
              </UFormField>
            </div>
          </template>
        </UAccordion>

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="handleClose" />
          <UButton label="Créer la collection" color="primary" type="submit" :loading="isLoading"
            icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
