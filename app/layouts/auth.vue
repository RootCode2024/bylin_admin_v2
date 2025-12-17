<script setup lang="ts">
// Layout pour l'authentification
</script>

<template>
  <div class="min-h-screen w-full flex overflow-hidden bg-white dark:bg-gray-950 font-sans">

    <!-- SECTION GAUCHE : VISUEL ARTISTIQUE (Caché sur mobile) -->
    <!-- Background ajusté pour ta couleur #0066bf -->
    <div class="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden bg-slate-900">

      <!-- Background Animé -->
      <div class="absolute inset-0">
        <!-- Bruit/Grain -->
        <div class="absolute inset-0 opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-soft-light"></div>

        <!-- Blobs animés (Tons Bleus/Bylin) -->
        <div class="absolute top-0 -left-4 w-96 h-96 bg-bylin-500 rounded-full mix-blend-screen filter blur-[128px] opacity-60 animate-blob"></div>
        <div class="absolute top-1/2 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-screen filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-32 left-20 w-96 h-96 bg-cyan-600 rounded-full mix-blend-screen filter blur-[128px] opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <!-- Header Logo -->
      <div class="relative z-10 flex items-center gap-3">
        <div class="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-bylin-400 to-bylin-600 shadow-lg shadow-bylin-500/30">
          <!-- Icône générique ou ton logo -->
          <img src="/assets/logo-blue.png" class="w-20" />
        </div>
        <span class="text-xl font-bold tracking-tight">Bylin Administration</span>
      </div>

      <!-- Citation ou Message de marque -->
      <div class="relative z-10 max-w-md mt-auto mb-12">
        <h2 class="text-3xl font-bold leading-tight mb-4 animate-fade-in-up">
          Gérez votre activité <br/> avec simplicité.
        </h2>
        <div class="h-1 w-20 bg-bylin-500 rounded-full animate-fade-in-up delay-100"></div>
      </div>

      <!-- Footer -->
      <div class="relative z-10 text-xs text-gray-400">
        &copy; {{ new Date().getFullYear() }} Bylin. Tous droits réservés.
      </div>
    </div>

    <!-- SECTION DROITE : CONTENU DU FORMULAIRE -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
      <div class="w-full max-w-[380px]">
        <slot />
      </div>
    </div>

  </div>
</template>

<style scoped>
.animation-delay-2000 { animation-delay: 2s; }
.animation-delay-4000 { animation-delay: 4s; }
</style>
