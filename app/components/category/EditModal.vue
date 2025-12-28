<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Category } from '~/types/category'
import { getCategorySelectOptions } from '~/utils/category'
import { DEFAULT_IMAGE_CONFIG } from '~/utils/helpers'
import { CATEGORY_ICONS } from '~/types/category'

/**
 * Composant de modification de catégorie
 */

// Props du composant
const props = defineProps<{
  open: boolean
  category: Category | null
}>()

// Événements émis par le composant
const emit = defineEmits<{
  'update:open': [boolean]
  'updated': []
}>()

// Composable
const { updateCategory, loading, categories } = useCategories()

// État du modal
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value)
})

// URLs d'objets à nettoyer
const objectUrls = new Set<string>()

const DEFAULT_COLOR = '#0066bf'

/**
 * Schéma de validation Zod
 */
const schema = z.object({
  parent_id: z.string().optional().nullable(),
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  image: z.instanceof(File).optional(),
  icon: z.string().max(50).optional().or(z.literal('')),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Format hexadécimal requis')
    .default(DEFAULT_COLOR)
    .optional()
    .or(z.literal('')),
  is_active: z.boolean().default(true),
  is_visible_in_menu: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  sort_order: z.number().int().min(0).max(9999).default(0),
  meta_title: z.string().max(255).optional().or(z.literal('')),
  meta_description: z.string().max(500).optional().or(z.literal(''))
})

type CategoryFormSchema = z.infer<typeof schema>

/**
 * État du formulaire
 */
const state = reactive<Partial<CategoryFormSchema>>({
  parent_id: null,
  name: '',
  description: '',
  image: undefined,
  icon: 'none',
  color: DEFAULT_COLOR,
  is_active: true,
  is_visible_in_menu: false,
  is_featured: false,
  sort_order: 0,
  meta_title: '',
  meta_description: ''
})

const existingImageUrl = ref<string | null>(null)
const removeExistingImage = ref(false)

const parentOptions = computed(() => {
  return [
    { value: null, label: '— Aucun parent (racine) —' },
    ...getCategorySelectOptions(categories.value, props.category?.id, 2)
  ]
})

const iconOptions = computed(() => {
  return [
    { label: 'Aucune icône', value: 'none', icon: 'i-lucide-circle-slash' },
    ...CATEGORY_ICONS.map(icon => ({
      label: icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, ' '),
      value: icon,
      icon: `i-lucide-${icon}`
    }))
  ]
})

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
  existingImageUrl.value = null
  removeExistingImage.value = true
}

const chip = computed(() => ({
  backgroundColor: state.color || DEFAULT_COLOR
}))

function resetFormWithCategory(category: Category): void {
  Object.assign(state, {
    parent_id: category.parent_id || null,
    name: category.name,
    description: category.description ?? '',
    icon: category.icon || 'none',
    color: category.color || DEFAULT_COLOR,
    is_active: category.is_active,
    is_visible_in_menu: category.is_visible_in_menu,
    is_featured: category.is_featured,
    sort_order: category.sort_order,
    meta_title: category.meta_title ?? '',
    meta_description: category.meta_description ?? '',
    image: undefined
  })
  existingImageUrl.value = category.image_url ?? null
  removeExistingImage.value = false
  cleanupObjectUrls()
}

async function onSubmit(event: FormSubmitEvent<CategoryFormSchema>): Promise<void> {
  if (!props.category) return

  try {
    const formData = new FormData()
    formData.append('name', event.data.name)
    formData.append('is_active', event.data.is_active ? '1' : '0')
    formData.append('is_visible_in_menu', event.data.is_visible_in_menu ? '1' : '0')
    formData.append('is_featured', event.data.is_featured ? '1' : '0')
    formData.append('sort_order', String(event.data.sort_order))

    if (event.data.parent_id) formData.append('parent_id', event.data.parent_id)
    if (event.data.description) formData.append('description', event.data.description)
    if (event.data.image) formData.append('image', event.data.image)
    if (removeExistingImage.value) formData.append('remove_image', '1')

    // Correction icône 'none' -> ''
    if (event.data.icon && event.data.icon !== 'none') {
      formData.append('icon', event.data.icon)
    } else {
      formData.append('icon', '')
    }

    if (event.data.color) formData.append('color', event.data.color)
    if (event.data.meta_title) formData.append('meta_title', event.data.meta_title)
    if (event.data.meta_description) formData.append('meta_description', event.data.meta_description)

    const success = await updateCategory(props.category.id, formData)
    if (success) {
      isOpen.value = false
      emit('updated')
      cleanupObjectUrls()
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
  }
}

function handleModalClose(): void {
  cleanupObjectUrls()
}

watch(isOpen, (value) => {
  if (value && props.category) resetFormWithCategory(props.category)
})

onBeforeUnmount(() => cleanupObjectUrls())
</script>

<template>
  <UModal
v-model:open="isOpen"
title="Modifier la catégorie"
    description="Mettre à jour les informations de la catégorie"
:ui="{ content: 'min-w-[60%]' }"
    @close="handleModalClose">
    <template #body>
      <UForm
:schema="schema"
:state="state"
class="p-4 space-y-4"
@submit="onSubmit">
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Catégorie parente" name="parent_id">
            <USelectMenu
v-model="state.parent_id"
:items="parentOptions"
value-key="value"
label-key="label"
              placeholder="Sélectionner un parent..."
:disabled="loading"
class="w-full" />
          </UFormField>

          <UFormField label="Nom de la catégorie" name="name" required>
            <UInput
v-model="state.name"
placeholder="T-shirts..."
class="w-full"
:disabled="loading" />
          </UFormField>
        </div>

        <UFormField label="Description" name="description">
          <UTextarea
v-model="state.description"
:rows="3"
class="w-full"
:disabled="loading" />
        </UFormField>

        <!-- Image -->
        <UFormField label="Image bannière" name="image">
          <UFileUpload
v-slot="{ open: openFileDialog, removeFile }"
v-model="state.image"
            :accept="DEFAULT_IMAGE_CONFIG.acceptedTypes.join(',')">
            <div class="flex items-center gap-3">
              <UAvatar
size="lg"
:src="state.image ? createPreviewUrl(state.image) : existingImageUrl ?? undefined"
                icon="i-lucide-image" />
              <UButton
:label="state.image || existingImageUrl ? 'Modifier l\'image' : 'Télécharger'"
color="neutral"
                variant="outline"
icon="i-lucide-upload"
:disabled="loading"
@click="openFileDialog()" />
            </div>
            <div v-if="state.image || existingImageUrl" class="mt-2">
              <p v-if="state.image" class="text-xs">{{ state.image.name }}</p>
              <UButton
label="Supprimer l'image"
color="error"
variant="link"
size="xs"
class="p-0"
                @click="() => { removeFile(); removeImage() }" />
            </div>
          </UFileUpload>
        </UFormField>

        <!-- Icône et Couleur -->
        <div class="grid grid-cols-2 gap-4">
          <UFormField label="Icône" name="icon">
            <USelectMenu
:key="`icon-edit-${props.category?.id}`"
v-model="state.icon"
:items="iconOptions"
              value-key="value"
label-key="label"
class="w-full">
              <template #leading>
                <UIcon v-if="state.icon && state.icon !== 'none'" :name="`i-lucide-${state.icon}`" class="size-4" />
                <UIcon v-else name="i-lucide-search" class="size-4 text-gray-400" />
              </template>
            </USelectMenu>
          </UFormField>

          <UFormField label="Couleur thème" name="color">
            <UPopover>
              <UButton
label="Choisir une couleur"
color="neutral"
variant="outline"
class="w-full">
                <template #leading>
                  <span :style="chip" class="size-3 rounded-full" />
                </template>
              </UButton>
              <template #content>
                <UColorPicker v-model="state.color" class="p-2" />
              </template>
            </UPopover>
          </UFormField>
        </div>

        <!-- SEO -->
        <div class="border-t pt-4 grid grid-cols-2 gap-4">
          <UFormField label="Titre SEO" name="meta_title">
            <UInput v-model="state.meta_title" class="w-full" />
          </UFormField>
          <UFormField label="Description SEO" name="meta_description">
            <UTextarea v-model="state.meta_description" :rows="2" class="w-full" />
          </UFormField>
        </div>

        <!-- Options -->
        <div class="border-t pt-4 space-y-3">
          <UFormField label="Ordre de tri" name="sort_order">
            <UInput v-model.number="state.sort_order" type="number" />
          </UFormField>
          <div class="grid grid-cols-3 gap-4">
            <USwitch v-model="state.is_active" label="Active" />
            <USwitch v-model="state.is_visible_in_menu" label="Menu" />
            <USwitch v-model="state.is_featured" label="Mise en avant" />
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t">
          <UButton
label="Annuler"
color="neutral"
variant="ghost"
@click="isOpen = false" />
          <UButton
label="Enregistrer"
color="primary"
type="submit"
:loading="loading"
icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
