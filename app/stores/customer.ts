import { defineStore } from 'pinia'
import type { Customer, CustomerFilters, ApiResponse } from '~/types'

export const useCustomerStore = defineStore('customer', () => {
  const client = useSanctumClient()
  const toast = useToast()

  // --- State ---
  const customers = ref<Customer[]>([])
  const loading = ref(false)

  // Pagination et Filtres
  const pagination = ref({
    pageIndex: 0, // TanStack table utilise 0-index, Laravel utilise 1-index
    pageSize: 10,
    total: 0
  })

  const filters = reactive({
    search: '',
    status: 'all'
  })

  // --- Actions ---

  /**
   * Récupérer les clients avec pagination et filtres
   */
  async function fetchCustomers() {
    loading.value = true
    try {
      // Conversion des params pour Laravel
      // Note : Laravel utilise 1-index pour les pages, TanStack Table utilise 0-index
      const params = {
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        search: filters.search || undefined,
        status: filters.status !== 'all' ? filters.status : undefined
      }

      // TYPAGE CLEF ICI : On dit que la "data" de la réponse est un Paginator de Customer
      const response = await client<ApiResponse<LaravelPaginator<Customer>>>('/api/v1/admin/customers', {
        method: 'GET',
        params
      })

      // Debug pour vérifier
      // console.log('response du back ::: ', response)

      if (response.success) {
        // CORRECTION MAJEURE ICI :
        // response.data = L'objet Paginator
        // response.data.data = Le tableau des clients
        customers.value = response.data.data
        
        // response.data.total = Le nombre total d'éléments
        pagination.value.total = response.data.total
      }
    } catch (error: any) {
      toast.add({
        title: 'Error',
        description: error.response?._data?.message || 'Failed to fetch customers',
        color: 'error'
      })
    } finally {
      loading.value = false
    }
  }

  /**
   * Créer un client
   */
  async function createCustomer(data: { first_name: string; last_name: string; email: string }) {
    loading.value = true
    try {
      const response = await client<ApiResponse<Customer>>('/api/v1/customers', {
        method: 'POST',
        body: data
      })

      if (response.success) {
        toast.add({ title: 'Success', description: response.message, color: 'success' })
        await fetchCustomers() // Rafraîchir la liste
        return true
      }
    } catch (error: any) {
        // Gestion des erreurs de validation
        const errors = error.response?._data?.errors
        const description = errors
            ? Object.values(errors).flat().join('\n')
            : 'Failed to create customer'

        toast.add({ title: 'Validation Error', description, color: 'error' })
        return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprimer un ou plusieurs clients
   */
  async function deleteCustomers(ids: string[]) {
    loading.value = true
    try {
      let response;

      if (ids.length === 1) {
        // Suppression unique
        response = await client<ApiResponse<null>>(`/api/v1/customers/${ids[0]}`, {
            method: 'DELETE'
        })
      } else {
        // Suppression multiple
        response = await client<ApiResponse<null>>('/api/v1/customers/bulk', {
            method: 'POST', // Souvent POST ou DELETE avec body
            body: { ids } // Attention: DELETE avec body n'est pas standard partout, POST souvent préféré pour bulk
        })
      }

      if (response.success) {
        toast.add({ title: 'Deleted', description: response.message, color: 'success' })
        await fetchCustomers()
        return true
      }
    } catch (error: any) {
      toast.add({ title: 'Error', description: 'Failed to delete customer(s)', color: 'error' })
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    customers,
    loading,
    pagination,
    filters,
    fetchCustomers,
    createCustomer,
    deleteCustomers
  }
})
