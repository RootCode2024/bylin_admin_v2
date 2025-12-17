// 1. Définition d'un client
export interface Customer {
  id: string
  first_name: string
  last_name: string
  full_name?: string // Optionnel
  email: string
  phone?: string
  status: 'active' | 'inactive' | 'suspended' | 'bounced' | 'subscribed' | 'unsubscribed'
  avatar?: string
  avatar_url?: string
  location?: string
  created_at: string
}

// 2. Structure standard de la pagination Laravel (ce qui est DANS 'data')
export interface LaravelPaginator<T> {
  current_page: number
  data: T[] // C'est ici que se trouve ton tableau de clients
  first_page_url: string
  from: number
  last_page: number
  last_page_url: string
  links: Array<{ url: string | null; label: string; active: boolean }>
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number
  total: number
}

// 3. Réponse globale de ton API (ApiController)
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  errors?: Record<string, string[]>
}

// 4. Filtres (utilisé par le store)
export interface CustomerFilters {
  search: string
  status: string
  page: number
  per_page: number
}