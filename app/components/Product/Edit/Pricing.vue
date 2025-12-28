<script setup lang="ts">
import { useProductFormStore } from '~/stores/productForm'

const productFormStore = useProductFormStore()
</script>

<template>
  <div class="space-y-6 p-6">
    <div class="grid grid-cols-3 gap-4">
      <UFormField label="Prix de vente" required>
        <UInput
:model-value="productFormStore.formData.price"
          type="number"
step="500"
placeholder="0"
          class="w-full"
@update:model-value="productFormStore.setFormData({ price: Number($event) })">
          <template #trailing>
            <span class="text-gray-400">CFA</span>
          </template>
        </UInput>
      </UFormField>

      <UFormField label="Prix comparaison">
        <UInput
:model-value="productFormStore.formData.compare_price"
          type="number"
          step="500"
placeholder="0"
class="w-full"
@update:model-value="productFormStore.setFormData({ compare_price: $event ? Number($event) : undefined })">
          <template #trailing>
            <span class="text-gray-400">CFA</span>
          </template>
        </UInput>
      </UFormField>

      <UFormField label="Prix coûtant">
        <UInput
:model-value="productFormStore.formData.cost_price"
          type="number"
          step="500"
placeholder="0"
class="w-full"
@update:model-value="productFormStore.setFormData({ cost_price: $event ? Number($event) : undefined })">
          <template #trailing>
            <span class="text-gray-400">CFA</span>
          </template>
        </UInput>
      </UFormField>
    </div>

    <USeparator />

    <div class="space-y-4">
      <UCheckbox
:model-value="productFormStore.formData.track_inventory"
        label="Gérer le stock"
@update:model-value="productFormStore.setFormData({ track_inventory: $event as any })" />

      <div v-if="productFormStore.formData.track_inventory" class="grid grid-cols-2 gap-4 pl-6">
        <UFormField label="Quantité en stock">
          <UInput
:model-value="productFormStore.formData.stock_quantity"
            type="number"
class="w-full"
            @update:model-value="productFormStore.setFormData({ stock_quantity: Number($event) })" />
        </UFormField>

        <UFormField label="Seuil stock faible">
          <UInput
:model-value="productFormStore.formData.low_stock_threshold"
            type="number"
class="w-full"
            @update:model-value="productFormStore.setFormData({ low_stock_threshold: Number($event) })" />
        </UFormField>
      </div>

      <UFormField label="Code-barres" class="mt-5">
        <UInput
:model-value="productFormStore.formData.barcode"
placeholder="Ex: 5901234123457"
disabled
          class="w-1/2" />
      </UFormField>
    </div>
  </div>
</template>
