<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import { DEFAULT_IMAGE_CONFIG, formatFileSize, buildWebsiteUrl } from '~/utils/brand'

/**
 * Composant de création de marque
 *
 * Modal permettant de créer une nouvelle marque avec upload de logo
 * et validation complète des données
 */

// Événements émis par le composant
const emit = defineEmits<{
  created: []
}>()

// Composable de gestion des marques
const { createBrand, loading } = useBrands()

// État du modal
const open = ref(false)

// Domaines disponibles pour le site web
const WEBSITE_DOMAINS = ['.com', '.fr', '.dev', '.org', '.net', '.io', '.site', '.uk'] as const
type WebsiteDomain = typeof WEBSITE_DOMAINS[number]
const selectedDomain = ref<WebsiteDomain>(WEBSITE_DOMAINS[0])

// Conversion pour USelectMenu
const websiteDomainItems = computed(() => [...WEBSITE_DOMAINS])

// URLs d'objets à nettoyer
const objectUrls = new Set<string>()

/**
 * Schéma de validation Zod pour le formulaire
 */
const schema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),

  description: z.string()
    .max(2000, 'La description ne peut pas dépasser 2000 caractères')
    .trim()
    .optional()
    .or(z.literal('')),

  logo: z
    .instanceof(File, {
      message: 'Veuillez sélectionner un fichier image.'
    })
    .refine(
      (file) => file.size <= DEFAULT_IMAGE_CONFIG.maxFileSize,
      {
        message: `L'image est trop volumineuse. Taille maximale : ${formatFileSize(DEFAULT_IMAGE_CONFIG.maxFileSize)}.`
      }
    )
    .refine(
      (file) => DEFAULT_IMAGE_CONFIG.acceptedTypes.includes(file.type),
      {
        message: 'Format invalide. Formats acceptés : JPEG, PNG, WebP.'
      }
    )
    .refine(
      (file) => validateImageDimensions(file),
      {
        message: `Dimensions invalides. Attendues : entre ${DEFAULT_IMAGE_CONFIG.minDimensions.width}×${DEFAULT_IMAGE_CONFIG.minDimensions.height} et ${DEFAULT_IMAGE_CONFIG.maxDimensions.width}×${DEFAULT_IMAGE_CONFIG.maxDimensions.height} pixels.`
      }
    )
    .optional(),

  websiteDomain: z.string()
    .max(150, 'Le domaine ne peut pas dépasser 150 caractères')
    .trim()
    .regex(/^[a-zA-Z0-9-]*$/, 'Le domaine ne peut contenir que des lettres, chiffres et tirets')
    .optional()
    .or(z.literal('')),

  is_active: z.boolean().default(true),

  sort_order: z.number()
    .int('L\'ordre doit être un nombre entier')
    .min(0, 'L\'ordre ne peut pas être négatif')
    .max(9999, 'L\'ordre ne peut pas dépasser 9999')
    .default(0)
})

type BrandFormSchema = z.infer<typeof schema>

/**
 * État du formulaire
 */
const state = reactive<Partial<BrandFormSchema>>({
  name: '',
  description: '',
  logo: undefined,
  websiteDomain: '',
  is_active: true,
  sort_order: 0
})

/**
 * Valeurs par défaut pour la réinitialisation
 */
const defaultState: Partial<BrandFormSchema> = {
  name: '',
  description: '',
  logo: undefined,
  websiteDomain: '',
  is_active: true,
  sort_order: 0
}

/**
 * Valide les dimensions d'une image
 */
async function validateImageDimensions(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      const img = new Image()

      img.onload = () => {
        const { width, height } = img
        const { minDimensions, maxDimensions } = DEFAULT_IMAGE_CONFIG

        const isValid =
          width >= minDimensions.width &&
          height >= minDimensions.height &&
          width <= maxDimensions.width &&
          height <= maxDimensions.height

        resolve(isValid)
      }

      img.onerror = () => resolve(false)
      img.src = e.target?.result as string
    }

    reader.onerror = () => resolve(false)
    reader.readAsDataURL(file)
  })
}

/**
 * Crée une URL d'objet pour l'aperçu et la stocke pour nettoyage
 */
function createPreviewUrl(file: File): string {
  const url = URL.createObjectURL(file)
  objectUrls.add(url)
  return url
}

/**
 * Nettoie toutes les URLs d'objets créées
 */
function cleanupObjectUrls(): void {
  objectUrls.forEach(url => URL.revokeObjectURL(url))
  objectUrls.clear()
}

/**
 * Réinitialise le formulaire à son état initial
 */
function resetForm(): void {
  Object.assign(state, defaultState)
  selectedDomain.value = WEBSITE_DOMAINS[0] as WebsiteDomain
  cleanupObjectUrls()
}

/**
 * Gestionnaire de soumission du formulaire
 */
async function onSubmit(event: FormSubmitEvent<BrandFormSchema>): Promise<void> {
  try {
    const formData = new FormData()

    // Champs obligatoires
    formData.append('name', event.data.name)
    formData.append('is_active', event.data.is_active ? '1' : '0')
    formData.append('sort_order', String(event.data.sort_order))

    // Champs optionnels
    if (event.data.description) {
      formData.append('description', event.data.description)
    }

    if (event.data.logo) {
      formData.append('logo', event.data.logo)
    }

    // Construction de l'URL complète du site web
    if (event.data.websiteDomain) {
      const websiteUrl = buildWebsiteUrl(
        event.data.websiteDomain,
        selectedDomain.value
      )
      formData.append('website', websiteUrl)
    }

    // Tentative de création
    const success = await createBrand(formData)

    if (success) {
      open.value = false
      emit('created')
      resetForm()
    }
  } catch (error) {
    console.error('Erreur lors de la création de la marque:', error)
  }
}

/**
 * Gestionnaire de fermeture du modal
 */
function handleModalClose(): void {
  resetForm()
}

/**
 * Nettoyage lors de la destruction du composant
 */
onBeforeUnmount(() => {
  cleanupObjectUrls()
})
</script>

<template>
  <UModal v-model:open="open" title="Nouvelle marque" description="Créer une nouvelle marque de produits"
    :ui="{ body: 'min-w-xl' }" @close="handleModalClose">
    <!-- Bouton déclencheur du modal -->
    <UButton label="Nouvelle marque" icon="i-lucide-plus" color="primary" />

    <template #content>
      <UForm :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <!-- Nom de la marque -->
        <UFormField label="Nom de la marque" name="name" required description="Nom officiel de la marque">
          <UInput v-model="state.name" placeholder="Nike, Adidas, Apple..." autofocus class="w-full" maxlength="100"
            :disabled="loading" />
        </UFormField>

        <!-- Description -->
        <UFormField label="Description" name="description" description="Description détaillée de la marque (optionnel)">
          <UTextarea v-model="state.description" placeholder="Description de la marque..." :rows="4" class="w-full"
            maxlength="2000" :disabled="loading" />
        </UFormField>

        <!-- Upload du logo -->
        <UFormField label="Logo" name="logo"
          :description="`Formats acceptés : ${DEFAULT_IMAGE_CONFIG.acceptedTypes.map(t => t.split('/')[1]?.toUpperCase() || '').join(', ')}. Taille max : ${formatFileSize(DEFAULT_IMAGE_CONFIG.maxFileSize)}.`">
          <UFileUpload v-slot="{ open: openFileDialog, removeFile }" v-model="state.logo"
            :accept="DEFAULT_IMAGE_CONFIG.acceptedTypes.join(',')">
            <div class="flex flex-wrap items-center gap-3">
              <!-- Aperçu du logo -->
              <UAvatar size="lg" :src="state.logo ? createPreviewUrl(state.logo) : undefined" icon="i-lucide-image"
                alt="Aperçu du logo" />

              <!-- Bouton de téléchargement -->
              <UButton :label="state.logo ? 'Modifier le logo' : 'Télécharger un logo'" color="neutral"
                variant="outline" icon="i-lucide-upload" @click="openFileDialog()" :disabled="loading" />
            </div>

            <!-- Informations sur le fichier sélectionné -->
            <p v-if="state.logo" class="text-xs text-muted mt-1.5">
              {{ state.logo.name }} ({{ formatFileSize(state.logo.size) }})
              <UButton label="Supprimer" color="error" variant="link" size="xs" class="p-0 ml-2" @click="removeFile()"
                :disabled="loading" />
            </p>
          </UFileUpload>
        </UFormField>

        <!-- Site web avec sélecteur de domaine -->
        <UFormField label="Site web" name="websiteDomain"
          description="Nom de domaine sans le protocole ni l'extension (exemple: monsite)">
          <UFieldGroup>
            <UInput v-model="state.websiteDomain" placeholder="exemple" :ui="{
              base: 'pl-16',
              leading: 'pointer-events-none'
            }" maxlength="150" :disabled="loading">
              <template #leading>
                <p class="text-sm text-muted">
                  https://
                </p>
              </template>
            </UInput>

            <USelectMenu v-model="selectedDomain" :items="websiteDomainItems" :disabled="loading" />
          </UFieldGroup>

          <!-- Aperçu de l'URL complète -->
          <p v-if="state.websiteDomain" class="text-xs text-muted mt-1.5">
            URL finale : {{ buildWebsiteUrl(state.websiteDomain, selectedDomain) }}
          </p>
        </UFormField>

        <!-- Ordre de tri -->
        <UFormField label="Ordre de tri" name="sort_order"
          description="Détermine la position d'affichage (0 = première position)">
          <UInput v-model.number="state.sort_order" type="number" min="0" max="9999" step="1" :disabled="loading" />
        </UFormField>

        <!-- Statut actif -->
        <UFormField name="is_active">
          <USwitch v-model="state.is_active" label="Marque active" :disabled="loading" />
          <template #description>
            <p class="text-xs text-muted mt-1">
              {{ state.is_active ? 'La marque sera visible publiquement' : 'La marque sera masquée' }}
            </p>
          </template>
        </UFormField>

        <!-- Actions du formulaire -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="open = false" :disabled="loading" />
          <UButton label="Créer la marque" color="primary" type="submit" :loading="loading" icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
