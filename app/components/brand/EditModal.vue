<script setup lang="ts">
  import * as z from 'zod'
  import type { FormSubmitEvent } from '@nuxt/ui'
  import type { Brand } from '~/types/brand'
  import { DEFAULT_IMAGE_CONFIG , buildWebsiteUrl, formatFileSize } from '~/utils/helpers'

  const props = defineProps<{
    open: boolean
    brand: Brand | null
  }>()

  const emit = defineEmits<{
    'update:open': [boolean]
    'updated': []
  }>()

  const { updateBrand, loading } = useBrands()

  const isOpen = computed({
    get: () => props.open,
    set: (value) => emit('update:open', value)
  })

  const WEBSITE_DOMAINS = ['.com', '.fr', '.dev', '.org', '.net', '.io', '.site', '.uk'] as const
  type WebsiteDomain = typeof WEBSITE_DOMAINS[number]
  const selectedDomain = ref<WebsiteDomain>(WEBSITE_DOMAINS[0])
  const websiteDomainItems = computed(() => [...WEBSITE_DOMAINS])
  const objectUrls = new Set<string>()

  function splitWebsite(url?: string | null): { domain: string; tld: WebsiteDomain } {
    if (!url) return { domain: '', tld: WEBSITE_DOMAINS[0] }

    const cleaned = url.replace(/^https?:\/\//, '')
    const found = WEBSITE_DOMAINS.find(d => cleaned.endsWith(d))

    return {
      domain: found ? cleaned.replace(found, '') : cleaned,
      tld: (found ?? WEBSITE_DOMAINS[0]) as WebsiteDomain
    }
  }

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
  const existingLogoUrl = ref<string | null>(null)
  const removeExistingLogo = ref(false)

  const state = reactive<Partial<BrandFormSchema>>({
    name: '',
    description: '',
    logo: undefined,
    websiteDomain: '',
    is_active: true,
    sort_order: 0
  })

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

  function createPreviewUrl(file: File): string {
    const url = URL.createObjectURL(file)
    objectUrls.add(url)
    return url
  }

  function cleanupObjectUrls(): void {
    objectUrls.forEach(url => URL.revokeObjectURL(url))
    objectUrls.clear()
  }

  function removeLogo(): void {
    state.logo = undefined
    existingLogoUrl.value = null
    removeExistingLogo.value = true
  }

  function resetFormWithBrand(brand: Brand): void {
    const website = splitWebsite(brand.website)

    Object.assign(state, {
      name: brand.name,
      description: brand.description ?? '',
      websiteDomain: website.domain,
      is_active: brand.is_active,
      sort_order: brand.sort_order,
      logo: undefined
    })

    selectedDomain.value = website.tld
    existingLogoUrl.value = brand.logo_url ?? null
    removeExistingLogo.value = false

    cleanupObjectUrls()
  }

  async function onSubmit(event: FormSubmitEvent<BrandFormSchema>): Promise<void> {
    if (!props.brand) return

    try {
      const formData = new FormData()

      formData.append('_method', 'PUT')

      formData.append('name', event.data.name)
      formData.append('is_active', event.data.is_active ? '1' : '0')
      formData.append('sort_order', String(event.data.sort_order))

      if (event.data.description) {
        formData.append('description', event.data.description)
      }

      if (event.data.logo) {
        formData.append('logo', event.data.logo)
      }

      if (event.data.websiteDomain) {
        const websiteUrl = buildWebsiteUrl(
          event.data.websiteDomain,
          selectedDomain.value
        )
        formData.append('website', websiteUrl)
      }

      if (removeExistingLogo.value) {
        formData.append('remove_logo', '1')
      }

      const success = await updateBrand(props.brand.id, formData)

      if (success) {
        isOpen.value = false
        emit('updated')
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la marque:', error)
    }
  }

  function handleModalClose(): void {
    cleanupObjectUrls()
  }

  watch(isOpen, (value) => {
    if (value && props.brand) {
      resetFormWithBrand(props.brand)
    }
  })

  onBeforeUnmount(() => {
    cleanupObjectUrls()
  })
</script>

<template>
  <UModal v-model:open="isOpen" title="Modifier la marque" description="Mettre à jour les informations de la marque"
    :ui="{ body: 'min-w-xl' }" @close="handleModalClose">
    <template #content>
      <UForm :schema="schema" :state="state" class="p-4 space-y-4" @submit="onSubmit">
        <!-- Nom de la marque -->
        <UFormField label="Nom de la marque" name="name" required description="Nom officiel de la marque">
          <UInput v-model="state.name" placeholder="Nike, Adidas, Apple..." class="w-full" maxlength="100"
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
              <UAvatar size="lg" :src="state.logo
                ? createPreviewUrl(state.logo)
                : existingLogoUrl ?? undefined" icon="i-lucide-image" alt="Aperçu du logo" />

              <!-- Bouton de téléchargement -->
              <UButton :label="state.logo || existingLogoUrl ? 'Modifier le logo' : 'Télécharger un logo'"
                color="neutral" variant="outline" icon="i-lucide-upload" @click="openFileDialog()"
                :disabled="loading" />
            </div>

            <!-- Informations et suppression -->
            <div v-if="state.logo || existingLogoUrl" class="mt-1.5 space-y-1">
              <p v-if="state.logo" class="text-xs text-muted">
                {{ state.logo.name }} ({{ formatFileSize(state.logo.size) }})
              </p>
              <UButton label="Supprimer le logo" color="error" variant="link" size="xs" class="p-0"
                @click="() => { removeFile(); removeLogo() }" :disabled="loading" />
            </div>
          </UFileUpload>
        </UFormField>

        <!-- Site web -->
        <UFormField label="Site web" name="websiteDomain"
          description="Nom de domaine">
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

        <!-- Actions -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
          <UButton label="Annuler" color="neutral" variant="ghost" @click="isOpen = false" :disabled="loading" />
          <UButton label="Enregistrer" color="primary" type="submit" :loading="loading" icon="i-lucide-check" />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
