export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@vueuse/nuxt',
    '@nuxt/hints',
    '@pinia/nuxt',
    'nuxt-auth-sanctum'
  ],

  css: ['~/assets/css/main.css'],

  sanctum: {
    baseUrl: 'http://localhost:8000',
    mode: 'cookie',
    userStateKey: 'sanctum.user.identity',
    redirectIfAuthenticated: true,
    redirectIfUnauthenticated: true,

    endpoints: {
      csrf: '/sanctum/csrf-cookie',
      login: '/api/v1/auth/admin/login',
      logout: '/api/v1/admin/logout',
      user: '/api/v1/admin/me',
    },

    csrf: {
      cookie: 'XSRF-TOKEN',
      header: 'X-XSRF-TOKEN',
    },

    client: {
      retry: false,
      initialRequest: true,
    },

    redirect: {
      keepRequestedRoute: false, // Si true, renvoie l'user sur la page qu'il voulait voir après login
      onLogin: '/',             // Si connecté -> Dashboard
      onLogout: '/auth/login',  // Si déconnecté -> Login
      onAuthOnly: '/auth/login', // Si non connecté et tente d'accéder au site -> Login
      onGuestOnly: '/',         // Si connecté et tente d'aller sur login -> Dashboard
    },

    // C'EST ICI QUE LA MAGIE OPÈRE
    globalMiddleware: {
      enabled: true, // Active la protection sur TOUTES les pages par défaut
      allow404WithoutAuth: true,
    },
  },

  routeRules: {
    '/sanctum/**': { cors: true },
    '/api/**': { cors: true }
  },

  devtools: { enabled: true },
  compatibilityDate: '2024-07-11',
})
