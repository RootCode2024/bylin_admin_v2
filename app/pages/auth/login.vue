<script setup lang="ts">
const auth = useAuthStore()
const toast = useToast()

definePageMeta({
  layout: 'auth',
})

const showPassword = ref(false)

const form = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.email || !form.password) {
    toast.add({
      title: 'Validation',
      description: 'Veuillez remplir tous les champs.',
      color: 'warning',
      icon: 'i-lucide-alert-triangle'
    })
    return
  }

  try {
    await auth.login(form)

    toast.add({
      title: 'Connexion réussie',
      description: 'Bienvenue sur Bylin.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    await navigateTo('/')

  } catch (error: unknown) {
    const message = getErrorMessage(error)

    toast.add({
      title: 'Erreur',
      description: message,
      color: 'error',
      icon: 'i-lucide-x-circle'
    })
  }
}
</script>

<template>
  <div class="space-y-8 animate-fade-in-up">

    <!-- Header Mobile & Titre -->
    <div class="text-center lg:text-left">
      <div class="lg:hidden flex justify-center mb-6">
        <div class="w-12 h-12 rounded-xl bg-primary-500 flex items-center justify-center text-white shadow-lg">
          <UIcon name="i-lucide-box" class="w-7 h-7" />
        </div>
      </div>
      <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
        Connexion
      </h1>
      <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Accédez à votre espace Bylin.
      </p>
    </div>

    <form class="space-y-5" @submit.prevent="handleLogin">

      <!-- Email -->
      <UFormField label="Email" name="email">
        <UInput
          v-model="form.email"
          icon="i-lucide-mail"
          placeholder="admin@bylin.com"
          type="email"
          autofocus
          size="lg"
          class="w-full"
        />
      </UFormField>

      <!-- Password -->
      <UFormField label="Mot de passe" name="password">
        <UInput
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          icon="i-lucide-lock"
          placeholder="••••••••"
          size="lg"
          class="w-full"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="ghost"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :padded="false"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <!-- Mot de passe oublié -->
      <div class="flex items-center justify-end">
        <NuxtLink
          to="/auth/forgot-password"
          class="text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400 transition-colors"
        >
          Mot de passe oublié ?
        </NuxtLink>
      </div>

      <!-- Bouton Submit -->
      <UButton
        type="submit"
        block
        size="lg"
        :loading="auth.loading"
        class="bg-primary-500 hover:bg-primary-600 text-white transition-all duration-200"
      >
        Se connecter
      </UButton>

    </form>
  </div>
</template>
