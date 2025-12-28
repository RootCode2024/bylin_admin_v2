<script setup lang="ts">
import { computed, watch } from 'vue'
import type { VariationFormData } from '~/types/product'
import type { Category } from '~/types/category'
import type { SelectMenuItem } from '@nuxt/ui'
import { useProductFormStore } from '~/stores/productForm'

// Définir les types pour les attributs
interface Attribute {
  id: string
  name: string
  type?: string
  values?: AttributeValue[]
}

interface AttributeValue {
  id: string
  label: string
  color_code?: string
}

const props = defineProps<{
  attributes: Attribute[]
  categories: readonly Category[]
  mode: 'create' | 'edit'
}>()

const productFormStore = useProductFormStore()

const DETECTION_RULES = [
  {
    keywords: /chaussure|sandale|basket|botte|sneaker|escarpin/i,
    requiredAttributes: ['pointure', 'color'],
    excludedAttributes: ['taille']
  },
  {
    keywords: /vetement|veste|jean|t-shirt|chemise|pantalon|robe|jupe|pull/i,
    requiredAttributes: ['taille', 'color'],
    excludedAttributes: ['pointure']
  }
]

// Computed properties
const form = computed(() => productFormStore.formData)
const activeAttributeIds = computed({
  get: () => productFormStore.activeAttributeIds,
  set: (value) => productFormStore.setActiveAttributeIds(value)
})

// Transforme les attributs en items pour USelectMenu
const attributeItems = computed<SelectMenuItem[]>(() => {
  return props.attributes.map(attr => ({
    label: attr.name,
    value: attr.id,
    type: 'item' as const,
    icon: attr.type === 'color' ? 'i-lucide-palette' : 'i-lucide-tag',
    disabled: false
  }))
})

const filteredAttributes = computed(() => {
  return props.attributes.filter(attr => activeAttributeIds.value.includes(attr.id))
})

const attributeNameToId = computed(() => {
  const map: Record<string, string> = {}
  props.attributes.forEach(attr => {
    map[attr.name.toLowerCase()] = attr.id
  })
  return map
})

function normalizeVariationAttributes(attributes: Record<string, string | null>): Record<string, string> {
  if (!attributes) return {}

  const normalized: Record<string, string> = {}

  Object.entries(attributes).forEach(([key, value]) => {
    const val = value || ''

    if (props.attributes.some(attr => attr.id === key)) {
      normalized[key] = val
    }
    else {
      const attrId = attributeNameToId.value[key.toLowerCase()]
      if (attrId) {
        normalized[attrId] = val
      }
    }
  })

  return normalized
}

// Fonction pour récupérer les noms de catégories
function getCategoryNames(cats: readonly Category[], selectedIds: string[]): string[] {
  let names: string[] = []
  for (const cat of cats) {
    if (selectedIds.includes(cat.id)) names.push(cat.name)
    if (cat.children?.length) {
      names = [...names, ...getCategoryNames(cat.children, selectedIds)]
    }
  }
  return names
}

watch(() => form.value.categories, (newCategoryIds) => {
  if (productFormStore.isVariationsInitialized) {
    return
  }

  if (props.mode === 'edit' && form.value.variations.length > 0) {
    const usedIds = new Set<string>()

    const normalizedVariations = form.value.variations.map(v => {
      const normalizedAttrs = normalizeVariationAttributes(v.attributes || {})

      Object.keys(normalizedAttrs).forEach(attrId => usedIds.add(attrId))

      return {
        ...v,
        attributes: normalizedAttrs
      }
    })

    if (usedIds.size > 0) {
      productFormStore.setFormData({ variations: normalizedVariations })
      activeAttributeIds.value = Array.from(usedIds)
      return
    }
  }

  const categoryNames = getCategoryNames(props.categories, newCategoryIds || [])
  const suggestedIds = new Set<string>()

  props.attributes.forEach(attr => suggestedIds.add(attr.id))

  let ruleApplied = false

  for (const rule of DETECTION_RULES) {
    const match = categoryNames.some(name => rule.keywords.test(name))

    if (match) {
      ruleApplied = true
      const idsToExclude = props.attributes
        .filter(a => rule.excludedAttributes.includes(a.name.toLowerCase()))
        .map(a => a.id)
      idsToExclude.forEach(id => suggestedIds.delete(id))
    }
  }

  if (ruleApplied || activeAttributeIds.value.length === 0) {
    activeAttributeIds.value = Array.from(suggestedIds)
  }
}, { immediate: true })

function addVariation() {
  const initialAttributes = activeAttributeIds.value.reduce((acc, id) => {
    acc[id] = ''
    return acc
  }, {} as Record<string, string>) 

  const newVariations = [...productFormStore.formData.variations, {
    variation_name: '',
    price: productFormStore.formData.price || 0,
    compare_price: productFormStore.formData.compare_price,
    cost_price: productFormStore.formData.cost_price,
    stock_quantity: 0,
    stock_status: 'out_of_stock',
    is_active: true,
    attributes: initialAttributes,
    sku: '',
    barcode: ''
  } as VariationFormData]

  productFormStore.setFormData({ variations: newVariations })
}

function removeVariation(index: number) {
  const variation = productFormStore.formData.variations[index]
  if (variation?.id && !confirm('Supprimer cette variation ?')) return

  const newVariations = [...productFormStore.formData.variations]
  newVariations.splice(index, 1)
  productFormStore.setFormData({ variations: newVariations })
}

function duplicateVariation(index: number) {
  const original = productFormStore.formData.variations[index]
  if (!original) return

  const newVariations = [...productFormStore.formData.variations, {
    ...original,
    variation_name: `${original.variation_name} (copie)`,
    id: undefined,
    sku: '',
    attributes: { ...original.attributes }
  } as VariationFormData]

  productFormStore.setFormData({ variations: newVariations })
}

function updateVariation(index: number, updates: Partial<VariationFormData>) {
  const newVariations = [...productFormStore.formData.variations]

  newVariations[index] = {
    ...newVariations[index],
    ...updates
  } as VariationFormData

  if (updates.stock_quantity !== undefined) {
    newVariations[index].stock_status = updates.stock_quantity > 0 ? 'in_stock' : 'out_of_stock'
  }

  productFormStore.setFormData({ variations: newVariations })
}

function getAttributeValues(attributeId: string) {
  const attr = props.attributes.find(a => a.id === attributeId)
  return attr?.values?.map(v => ({
    label: v.label,
    value: v.id,
    color: v.color_code
  })) || []
}

function generateVariationName(index: number) {
  const variation = form.value.variations[index]
  const nameParts = activeAttributeIds.value
    .map(attrId => {
      const valId = variation?.attributes[attrId]
      if (!valId) return null
      const attr = props.attributes.find(a => a.id === attrId)
      const val = attr?.values?.find(v => v.id === valId)
      return val ? val.label : null
    })
    .filter(Boolean)

  updateVariation(index, { variation_name: nameParts.join(' / ') || 'Nouvelle variation' })
}
</script>

<template>
  <div class="space-y-6 p-6">
    <UAlert
v-if="!form.is_variable"
icon="i-lucide-info"
color="secondary"
variant="soft"
title="Produit simple"
      description="Activez 'Produit avec variations' dans l'onglet Avancé pour gérer les variations." />

    <div v-else class="space-y-6">
      <UCard :ui="{ body: 'p-4 sm:p-4' }" class="bg-gray-50/50 dark:bg-gray-800/50">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-sliders-horizontal" class="w-5 h-5 text-gray-500" />
            <div>
              <h4 class="font-medium text-sm">Configuration des attributs</h4>
              <p class="text-xs text-gray-500">Sélectionnez les attributs utilisés pour créer les variations de ce
                produit.</p>
            </div>
          </div>
        </div>

        <USelectMenu
v-model="activeAttributeIds"
:items="attributeItems"
value-key="value"
label-key="label"
multiple
          placeholder="Choisir les attributs (ex: Taille, Couleur...)"
class="w-full" />
      </UCard>

      <!-- BARRE D'ACTION -->
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">Liste des variations</h3>
          <p class="text-sm text-gray-500">{{ form.variations.length }} variation(s) générée(s)</p>
        </div>
        <UButton
icon="i-lucide-plus"
label="Ajouter une variation"
color="primary"
@click="addVariation" />
      </div>

      <!-- LISTE DES VARIATIONS -->
      <div v-if="form.variations.length > 0" class="space-y-3">
        <UCard v-for="(variation, idx) in form.variations" :key="idx" class="relative overflow-visible">
          <div class="space-y-4">
            <!-- Header -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-3">
                  <UBadge color="primary" variant="soft" size="sm">#{{ idx + 1 }}</UBadge>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {{ variation.variation_name || 'Sans nom' }}
                  </span>
                </div>
              </div>

              <div class="flex gap-1">
                <UButton
icon="i-lucide-copy"
color="neutral"
variant="ghost"
size="sm"
                  @click="duplicateVariation(idx)" />
                <UButton
icon="i-lucide-trash-2"
color="error"
variant="ghost"
size="sm"
                  @click="removeVariation(idx)" />
              </div>
            </div>

            <!-- Attributs Dynamiques -->
            <div
v-if="filteredAttributes.length > 0"
              class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="attr in filteredAttributes" :key="attr.id">
                  <UFormField :label="attr.name" class="mb-0">
                    <USelectMenu
:model-value="variation.attributes[attr.id]"
:items="getAttributeValues(attr.id)"
                      value-key="value"
label-key="label"
:placeholder="`Option`"
class="w-full"
@update:model-value="(val) => {
                        const newAttrs = { ...variation.attributes, [attr.id]: val || '' }
                        updateVariation(idx, { attributes: newAttrs })
                        generateVariationName(idx)
                      }">
                      <template v-if="attr.type === 'color' && variation.attributes[attr.id]" #leading>
                        <div
class="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                          :style="{ backgroundColor: getAttributeValues(attr.id).find(v => v.value === variation.attributes[attr.id])?.color || '#ccc' }" />
                      </template>
                      <template v-if="attr.type === 'color'" #item-leading="{ item }">
                        <div
class="w-4 h-4 rounded-full border border-gray-200"
                          :style="{ backgroundColor: item.color || '#ccc' }" />
                      </template>
                    </USelectMenu>
                  </UFormField>
                </div>
              </div>
            </div>
            <div v-else class="text-sm text-orange-500 italic p-2">
              Aucun attribut sélectionné. Configurez les attributs ci-dessus.
            </div>

            <!-- Inputs classiques (Prix, Stock...) -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <UFormField label="Prix">
                <UInput
:model-value="variation.price"
type="number"
step="500"
                  @update:model-value="updateVariation(idx, { price: Number($event) })">
                  <template #trailing><span class="text-xs text-gray-400">CFA</span></template>
                </UInput>
              </UFormField>

              <UFormField label="Prix barré">
                <UInput
:model-value="variation.compare_price"
type="number"
step="500"
                  @update:model-value="updateVariation(idx, { compare_price: $event ? Number($event) : undefined })">
                  <template #trailing><span class="text-xs text-gray-400">CFA</span></template>
                </UInput>
              </UFormField>

              <UFormField label="Stock">
                <UInput
:model-value="variation.stock_quantity"
type="number"
min="0"
class="w-full"
                  @update:model-value="updateVariation(idx, { stock_quantity: Math.max(0, Number($event)) })" />
              </UFormField>
            </div>

            <div class="flex items-center justify-between pt-2">
              <div class="flex gap-4">
                <UInput
:model-value="variation.sku"
placeholder="SKU"
size="sm"
class="w-32"
readonly
                  @update:model-value="updateVariation(idx, { sku: $event })" />
                <UInput
:model-value="variation.barcode"
placeholder="Code-barres"
size="sm"
class="w-32"
                  @update:model-value="updateVariation(idx, { barcode: $event })" />
              </div>
              <USwitch
:model-value="variation.is_active"
label="Actif"
                @update:model-value="updateVariation(idx, { is_active: $event as boolean })" />
            </div>
          </div>
        </UCard>
      </div>

      <div
v-else
        class="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-800">
        <UIcon name="i-lucide-layers" class="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <h3 class="text-base font-medium text-gray-900 dark:text-white">Aucune variation</h3>
        <p class="text-sm text-gray-500 mb-4">Commencez par configurer les attributs ci-dessus, puis ajoutez des
          variations.
        </p>
        <UButton
label="Ajouter une variation"
color="primary"
variant="soft"
@click="addVariation" />
      </div>
    </div>
  </div>
</template>