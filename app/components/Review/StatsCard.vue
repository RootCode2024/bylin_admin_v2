<script setup lang="ts">
import type { ReviewStatistics } from '~/types/review'
import { calculateRatingPercentage } from '~/utils/review'

const props = defineProps<{
  statistics: ReviewStatistics | null
}>()

const ratingDistribution = computed(() => {
  if (!props.statistics?.by_rating) return []

  const total = props.statistics.total
  return [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: props.statistics!.by_rating[rating] || 0,
    percentage: calculateRatingPercentage(
      props.statistics!.by_rating[rating] || 0,
      total
    )
  }))
})
</script>

<template>
  <div v-if="statistics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Total -->
    <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Total des avis</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {{ statistics.total }}
          </p>
        </div>
        <div class="p-3 bg-primary-50 dark:bg-primary-950 rounded-full">
          <UIcon name="i-lucide-message-square" class="w-6 h-6 text-primary-600" />
        </div>
      </div>
    </div>

    <!-- En attente -->
    <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">En attente</p>
          <p class="text-2xl font-bold text-warning-600 mt-1">
            {{ statistics.pending }}
          </p>
        </div>
        <div class="p-3 bg-warning-50 dark:bg-warning-950 rounded-full">
          <UIcon name="i-lucide-clock" class="w-6 h-6 text-warning-600" />
        </div>
      </div>
    </div>

    <!-- Note moyenne -->
    <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Note moyenne</p>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ statistics.average_rating }}
            </p>
            <UIcon name="i-lucide-star" class="w-5 h-5 text-yellow-500 fill-current" />
          </div>
        </div>
        <div class="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-full">
          <UIcon name="i-lucide-star" class="w-6 h-6 text-yellow-600" />
        </div>
      </div>
    </div>

    <!-- Avec média -->
    <div class="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Avec médias</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {{ statistics.with_media }}
          </p>
        </div>
        <div class="p-3 bg-blue-50 dark:bg-blue-950 rounded-full">
          <UIcon name="i-lucide-image" class="w-6 h-6 text-blue-600" />
        </div>
      </div>
    </div>

    <!-- Distribution des notes -->
    <div
      class="md:col-span-2 lg:col-span-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
        Distribution des notes
      </h3>
      <div class="space-y-2">
        <div v-for="item in ratingDistribution" :key="item.rating" class="flex items-center gap-3">
          <div class="flex items-center gap-1 w-20">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
              {{ item.rating }}
            </span>
            <UIcon name="i-lucide-star" class="w-3 h-3 text-yellow-500 fill-current" />
          </div>
          <div class="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div class="h-full bg-yellow-500 transition-all duration-300" :style="{ width: `${item.percentage}%` }" />
          </div>
          <span class="text-sm text-gray-500 w-16 text-right">
            {{ item.count }} ({{ item.percentage }}%)
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
