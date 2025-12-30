<template>
  <UCard :ui="{
    body: 'p-4 ring-1 ring-gray-200 dark:ring-gray-700 hover:ring-primary-500 dark:hover:ring-primary-400'
  }" class="cursor-pointer transition-all" @click="$emit('view-details')">
    <div class="space-y-3">
      <!-- Image & Badge -->
      <div class="relative">
        <img v-if="item.image_url" :src="item.image_url" :alt="item.name" class="h-48 w-full rounded-lg object-cover" />
        <div v-else class="h-48 w-full rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <UIcon name="i-heroicons-photo" class="h-12 w-12 text-gray-400" />
        </div>

        <UBadge :color="getStockStatusColor(item)" class="absolute top-2 right-2">
          {{ item.stock_quantity }}
        </UBadge>
      </div>

      <!-- Info -->
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2">
          {{ item.name }}
        </h3>
        <p class="mt-1 text-sm text-gray-500">
          SKU: {{ item.sku }}
        </p>
      </div>

      <!-- Status -->
      <div class="flex items-center justify-between">
        <UBadge :color="getStockStatusColor(item)" variant="subtle" size="xs">
          {{ getStockStatusLabel(item) }}
        </UBadge>

        <span v-if="item.price" class="text-sm font-medium text-gray-900 dark:text-white">
          {{ formatPriceXOF(item.price) }}
        </span>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-2 pt-2 border-t">
        <UButton size="xs" color="primary" variant="soft" block @click.stop="$emit('adjust')">
          Ajuster
        </UButton>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { InventoryItem } from '~/types/inventory'
import { getStockStatusColor, getStockStatusLabel } from '~/utils/inventory'
import {
  formatPriceXOF
} from "~/utils/helpers";

defineProps<{
  item: InventoryItem
}>()

defineEmits<{
  adjust: []
  'view-details': []
}>()
</script>
