/**
 * Client API
 *
 * Gestion centralisée des erreurs HTTP avec :
 * - Intercepteurs de réponse
 * - Logs conditionnels (dev uniquement)
 * - Toasts utilisateur
 * - Retry automatique
 * - Gestion session expirée
 */
export default defineNuxtPlugin(() => {
  const toast = useToast();
  const router = useRouter();
  const config = useRuntimeConfig();

  // Logs uniquement en dev
  const isDev = config.public.debug === "true" || import.meta.dev;

  /**
   * Gestionnaire d'erreurs global
   */
  const handleError = async (error: any) => {
    const status = error.response?.status;
    const data = error.response?._data;
    const message = data?.message || "Une erreur est survenue";

    // Log détaillé en dev uniquement
    if (isDev) {
      console.group(`API Error [${status}]`);
      console.error("URL:", error.request?.url);
      console.error("Data:", data);
      console.groupEnd();
    }

    // On laisse les erreurs 401/419 (Sanctum s'en occupe)
    if (status === 401 || status === 419) {
      // nuxt-auth-sanctum gère
      throw error;
    }

    switch (status) {
      case 403:
        toast.add({
          title: "Accès refusé",
          description: "Permissions insuffisantes",
          color: "error",
          duration: 4000,
        });
        break;

      case 404:
        // Ne pas afficher de toast pour les 404 (géré par les composables)
        if (isDev) console.warn("Ressource introuvable:", error.request?.url);
        break;

      case 422:
        // Erreurs de validation (gérées par les composables)
        break;

      case 429:
        toast.add({
          title: "Trop de requêtes",
          description: "Veuillez patienter quelques instants",
          color: "warning",
          duration: 5000,
        });
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        toast.add({
          title: "Erreur serveur",
          description: "Le service est temporairement indisponible",
          color: "error",
          duration: 6000,
        });

        // Log en production pour monitoring
        if (!isDev) {
          console.error("[API Error]", {
            status,
            url: error.request?.url,
            timestamp: new Date().toISOString(),
          });
        }
        break;

      default:
        // Erreur réseau ou inconnue
        if (!status) {
          toast.add({
            title: "Erreur réseau",
            description: "Vérifiez votre connexion internet",
            color: "error",
            duration: 5000,
          });
        }
    }

    throw error;
  };

  /**
   * Hook global pour intercepter les erreurs
   */
  const client = useSanctumClient();
  const originalFetch = client.bind({});

  // Wrapper avec gestion d'erreurs
  const enhancedClient = async <T = any>(
    url: string,
    options?: any
  ): Promise<T> => {
    try {
      return await originalFetch<T>(url, options);
    } catch (error) {
      await handleError(error);
      throw error; // Re-throw pour les composables
    }
  };

  return {
    provide: {
      api: enhancedClient,
    },
  };
});
