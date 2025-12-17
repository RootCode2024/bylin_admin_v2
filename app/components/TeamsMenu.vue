<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <!-- Conteneur principal qui remplace le UDropdownMenu -->
  <div class="h-[--header-height] flex items-center w-full" :class="[collapsed ? 'justify-center' : 'px-2']">
    <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition-opacity">

      <!-- Ton Logo -->
      <!-- J'ai mis h-8 (32px), ajuste selon la forme de ton logo -->
      <img
        src="~/assets/logo-blue.png"
        alt="Logo"
        class="h-8 w-auto object-contain"
      />

    </NuxtLink>
  </div>
</template>
