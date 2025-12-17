<script setup lang="ts">
const colorMode = useColorMode()

// Ajuste la couleur de la barre de statut du navigateur (mobile)
const color = computed(() => colorMode.value === 'dark' ? '#1b1718' : 'white')

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `${titleChunk} - Bylin Admin` : 'Bylin Admin'
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
    // IMPORTANT : On demande aux moteurs de recherche de ne PAS indexer l'admin
    { name: 'robots', content: 'noindex, nofollow' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'fr'
  }
})

const title = 'Bylin Administration'
const description = 'Interface de gestion et pilotage pour la boutique e-commerce Bylin.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  // Tu pourras mettre une vraie URL d'image plus tard pour les partages Slack/Teams
  // ogImage: 'https://ton-site.com/admin-cover.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <!-- Barre de chargement bleue Bylin -->
    <NuxtLoadingIndicator color="#0066bf" />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
