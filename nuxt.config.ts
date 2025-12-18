export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@vueuse/nuxt",
    "@pinia/nuxt",
    "nuxt-auth-sanctum",
  ],

  css: ["~/assets/css/main.css"],

  // ========================================
  // Configuration Sanctum
  // ========================================
  sanctum: {
    baseUrl: process.env.NUXT_SANCTUM_BASE_URL || "http://localhost:8000",
    mode: "cookie",
    userStateKey: "sanctum.user.identity",
    redirectIfAuthenticated: true,
    redirectIfUnauthenticated: true,

    endpoints: {
      csrf: "/sanctum/csrf-cookie",
      login: "/api/v1/auth/admin/login",
      logout: "/api/v1/admin/logout",
      user: "/api/v1/admin/me",
    },

    csrf: {
      cookie: "XSRF-TOKEN",
      header: "X-XSRF-TOKEN",
    },

    client: {
      retry: false,
      initialRequest: true,
    },

    redirect: {
      keepRequestedRoute: false,
      onLogin: "/",
      onLogout: "/auth/login",
      onAuthOnly: "/auth/login",
      onGuestOnly: "/",
    },

    globalMiddleware: {
      enabled: true,
      allow404WithoutAuth: true,
    },

    origin: "http://localhost:3000",
  },

  // ========================================
  // Variables d'environnement publiques
  // ========================================
  runtimeConfig: {
    public: {
      appName: process.env.NUXT_PUBLIC_APP_NAME || "Bylin Admin",
      apiUrl: process.env.NUXT_PUBLIC_API_URL || "http://localhost:8000",
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "http://localhost:3000",
      debug: process.env.NUXT_PUBLIC_DEBUG || "false",
    },
  },

  // ========================================
  // Optimisations Production
  // ========================================
  nitro: {
    compressPublicAssets: true,
    prerender: {
      crawlLinks: false,
      routes: ["/"],
    },
  },

  // ========================================
  // Build
  // ========================================
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "nuxt-ui": ["@nuxt/ui"],
            pinia: ["pinia"],
          },
        },
      },
    },
  },

  // ========================================
  // Sécurité
  // ========================================
  routeRules: {},

  // ========================================
  // Dev Tools
  // ========================================
  devtools: {
    enabled: process.env.NODE_ENV === "development",
  },

  compatibilityDate: "2024-07-11",
});
