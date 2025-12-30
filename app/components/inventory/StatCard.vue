<template>
  <UCard :ui="{ body: 'p-5' }">
    <div class="flex items-center justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ title }}
        </p>
        <p v-if="!loading" class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
          {{ value }}
        </p>
        <div v-else class="mt-2 h-9 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>

      <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="iconClasses">
        <UIcon :name="icon" class="h-6 w-6" />
      </div>
    </div>

    <slot name="footer" />
  </UCard>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string
  icon: string
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple'
  loading?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: 'blue',
  loading: false,
  clickable: false
})

const iconClasses = computed(() => {
  const classes = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  }
  return classes[props.color]
})
</script>
