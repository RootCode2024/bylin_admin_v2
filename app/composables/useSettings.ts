import type {
  Member,
  MemberFilters,
  MemberStatistics,
  CreateMemberInput,
  UpdateMemberInput,
  InviteMemberInput,
  BulkInviteMemberInput,
  UpdateMemberRoleInput,
  UpdateMemberStatusInput,
  Invitation,
  Role,
  Permission,
  CreateRoleInput,
  UpdateRoleInput,
  UpdateRolePermissionsInput,
  MemberActivity,
  MemberActivityFilters,
  LaravelPaginator,
  ApiResponse,
  LoadingState,
} from "~/types/setting";

export const useSettings = () => {
  const client = useSanctumClient();
  const toast = useToast();

  // ============================================================================
  // ÉTAT PARTAGÉ - MEMBERS
  // ============================================================================

  const members = useState<Member[]>("settings:members", () => []);
  const currentMember = useState<Member | null>(
    "settings:currentMember",
    () => null
  );
  const statistics = useState<MemberStatistics | null>(
    "settings:statistics",
    () => null
  );

  const loading = useState<boolean>("settings:loading", () => false);
  const loadingState = useState<LoadingState>(
    "settings:loadingState",
    () => "idle"
  );
  const lastError = useState<string | null>("settings:error", () => null);

  const pagination = useState("settings:pagination", () => ({
    pageIndex: 0,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  }));

  const filters = useState<MemberFilters>("settings:filters", () => ({
    search: "",
    role: undefined,
    status: undefined,
    per_page: 15,
    page: 1,
    sort_by: "created_at",
    sort_direction: "desc",
  }));

  // ============================================================================
  // ÉTAT PARTAGÉ - INVITATIONS
  // ============================================================================

  const invitations = useState<Invitation[]>("settings:invitations", () => []);
  const pendingInvitations = useState<Invitation[]>(
    "settings:pendingInvitations",
    () => []
  );

  // ============================================================================
  // ÉTAT PARTAGÉ - ROLES & PERMISSIONS
  // ============================================================================

  const roles = useState<Role[]>("settings:roles", () => []);
  const permissions = useState<Permission[]>("settings:permissions", () => []);

  // ============================================================================
  // ÉTAT PARTAGÉ - ACTIVITY
  // ============================================================================

  const activities = useState<MemberActivity[]>(
    "settings:activities",
    () => []
  );

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const hasData = computed(() => members.value.length > 0);

  const hasActiveFilters = computed(() => {
    return Boolean(
      filters.value.search || filters.value.role || filters.value.status
    );
  });

  const totalPages = computed(() =>
    Math.ceil(pagination.value.total / pagination.value.pageSize)
  );

  const activeMembers = computed(() =>
    members.value.filter((m) => m.status === "active")
  );

  const onlineMembers = computed(() =>
    members.value.filter((m) => m.is_online)
  );

  // ============================================================================
  // ACTIONS - MEMBERS
  // ============================================================================

  async function fetchMembers(): Promise<void> {
    loading.value = true;
    loadingState.value = "loading";
    lastError.value = null;

    try {
      const params: Record<string, string | number | undefined> = {
        page: pagination.value.pageIndex + 1,
        per_page: pagination.value.pageSize,
        search: filters.value.search || undefined,
        role: filters.value.role !== "all" ? filters.value.role : undefined,
        status:
          filters.value.status !== "all" ? filters.value.status : undefined,
        sort_by: filters.value.sort_by,
        sort_direction: filters.value.sort_direction,
      };

      const response = await client<ApiResponse<LaravelPaginator<Member>>>(
        "/api/v1/admin/settings/members",
        { method: "GET", params }
      );

      if (response.success) {
        members.value = response.data.data;
        pagination.value.total = response.data.total;
        pagination.value.totalPages = response.data.last_page;
        loadingState.value = "success";
      }
    } catch (error: unknown) {
      loadingState.value = "error";
      lastError.value = getErrorMessage(error);

      toast.add({
        title: "Erreur",
        description: "Impossible de charger les membres",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loading.value = false;
    }
  }

  async function fetchMember(id: string): Promise<Member | null> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Member>>(
        `/api/v1/admin/settings/members/${id}`,
        { method: "GET" }
      );

      if (response.success) {
        currentMember.value = response.data;
        return response.data;
      }

      return null;
    } catch (error: unknown) {
      toast.add({
        title: "Erreur",
        description: "Impossible de charger le membre",
        color: "error",
      });
      return null;
    } finally {
      loading.value = false;
    }
  }

  async function createMember(data: CreateMemberInput): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Member>>(
        "/api/v1/admin/settings/members",
        { method: "POST", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Membre créé",
          description: response.message || "Le membre a été créé avec succès",
          color: "success",
          icon: "i-lucide-user-plus",
        });

        await fetchMembers();
        return true;
      }

      return false;
    } catch (error: unknown) {
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateMember(
    id: string,
    data: UpdateMemberInput
  ): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Member>>(
        `/api/v1/admin/settings/members/${id}`,
        { method: "PUT", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Membre mis à jour",
          description: "Les informations ont été mises à jour",
          color: "success",
          icon: "i-lucide-check-circle",
        });

        await fetchMembers();
        return true;
      }

      return false;
    } catch (error: unknown) {
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function deleteMember(id: string): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<null>>(
        `/api/v1/admin/settings/members/${id}`,
        { method: "DELETE" }
      );

      if (response.success) {
        toast.add({
          title: "Membre supprimé",
          description: "Le membre a été supprimé",
          color: "success",
          icon: "i-lucide-trash-2",
        });

        await fetchMembers();
        return true;
      }

      return false;
    } catch (error: unknown) {
      toast.add({
        title: "Erreur",
        description: getApiErrorMessage(error),
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateMemberRole(
    id: string,
    data: UpdateMemberRoleInput
  ): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Member>>(
        `/api/v1/admin/settings/members/${id}/role`,
        { method: "PATCH", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Rôle mis à jour",
          description: "Le rôle du membre a été modifié",
          color: "success",
        });

        await fetchMembers();
        return true;
      }

      return false;
    } catch (error: unknown) {
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function updateMemberStatus(
    id: string,
    data: UpdateMemberStatusInput
  ): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Member>>(
        `/api/v1/admin/settings/members/${id}/status`,
        { method: "PATCH", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Statut mis à jour",
          description: "Le statut du membre a été modifié",
          color: "success",
        });

        await fetchMembers();
        return true;
      }

      return false;
    } catch (error: unknown) {
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // ACTIONS - INVITATIONS
  // ============================================================================

  async function inviteMember(data: InviteMemberInput): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<Invitation>>(
        "/api/v1/admin/settings/invitations",
        { method: "POST", body: data }
      );

      if (response.success) {
        toast.add({
          title: "Invitation envoyée",
          description: `Une invitation a été envoyée à ${data.email}`,
          color: "success",
          icon: "i-lucide-mail",
        });

        await fetchInvitations();
        return true;
      }

      return false;
    } catch (error: unknown) {
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function bulkInviteMembers(
    data: BulkInviteMemberInput
  ): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<
        ApiResponse<{ success_count: number; error_count: number }>
      >("/api/v1/admin/settings/invitations/bulk", {
        method: "POST",
        body: data,
      });

      if (response.success) {
        toast.add({
          title: "Invitations envoyées",
          description: `${response.data.success_count} invitation(s) envoyée(s)`,
          color: "success",
        });

        await fetchInvitations();
        return true;
      }

      return false;
    } catch (error: unknown) {
      handleValidationErrors(error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function fetchInvitations(): Promise<void> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<LaravelPaginator<Invitation>>>(
        "/api/v1/admin/settings/invitations",
        { method: "GET" }
      );

      if (response.success) {
        invitations.value = response.data.data;
      }
    } catch (error: unknown) {
      console.error("Erreur lors du chargement des invitations:", error);
    } finally {
      loading.value = false;
    }
  }

  async function resendInvitation(id: string): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<null>>(
        `/api/v1/admin/settings/invitations/${id}/resend`,
        { method: "POST" }
      );

      if (response.success) {
        toast.add({
          title: "Invitation renvoyée",
          description: "L'invitation a été renvoyée",
          color: "success",
        });

        return true;
      }

      return false;
    } catch (error: unknown) {
      toast.add({
        title: "Erreur",
        description: getApiErrorMessage(error),
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function cancelInvitation(id: string): Promise<boolean> {
    loading.value = true;

    try {
      const response = await client<ApiResponse<null>>(
        `/api/v1/admin/settings/invitations/${id}`,
        { method: "DELETE" }
      );

      if (response.success) {
        toast.add({
          title: "Invitation annulée",
          description: "L'invitation a été annulée",
          color: "success",
        });

        await fetchInvitations();
        return true;
      }

      return false;
    } catch (error: unknown) {
      toast.add({
        title: "Erreur",
        description: getApiErrorMessage(error),
        color: "error",
      });
      return false;
    } finally {
      loading.value = false;
    }
  }

  // ============================================================================
  // ACTIONS - STATISTICS
  // ============================================================================

  async function fetchStatistics(): Promise<MemberStatistics | null> {
    try {
      const response = await client<ApiResponse<MemberStatistics>>(
        "/api/v1/admin/settings/members/statistics",
        { method: "GET" }
      );

      if (response.success) {
        statistics.value = response.data;
        return response.data;
      }

      return null;
    } catch (error: unknown) {
      console.error("Erreur stats:", error);
      return null;
    }
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    return "Une erreur inconnue est survenue";
  }

  function getApiErrorMessage(error: unknown): string {
    const apiError = error as { response?: { _data?: { message?: string } } };
    return apiError.response?._data?.message || getErrorMessage(error);
  }

  function handleValidationErrors(error: unknown): void {
    const apiError = error as {
      response?: { _data?: { errors?: Record<string, string[]> } };
    };
    const errors = apiError.response?._data?.errors;

    if (errors && typeof errors === "object") {
      const errorMessages = Object.entries(errors)
        .map(([_, messages]) => {
          const messageArray = Array.isArray(messages) ? messages : [messages];
          return messageArray.join("\n");
        })
        .join("\n");

      toast.add({
        title: "Erreur de validation",
        description: errorMessages,
        color: "error",
        icon: "i-lucide-alert-circle",
        duration: 6000,
      });
    } else {
      toast.add({
        title: "Erreur",
        description: getApiErrorMessage(error),
        color: "error",
      });
    }
  }

  function setPage(pageIndex: number): void {
    pagination.value.pageIndex = pageIndex;
    fetchMembers();
  }

  function setPageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.pageIndex = 0;
    filters.value.per_page = size;
    fetchMembers();
  }

  function setSearch(search: string): void {
    filters.value.search = search;
    pagination.value.pageIndex = 0;
    fetchMembers();
  }

  function resetFilters(): void {
    filters.value = {
      search: "",
      role: undefined,
      status: undefined,
      per_page: 15,
      page: 1,
      sort_by: "created_at",
      sort_direction: "desc",
    };
    pagination.value.pageIndex = 0;
    fetchMembers();
  }

  function reset(): void {
    members.value = [];
    currentMember.value = null;
    statistics.value = null;
    invitations.value = [];
    lastError.value = null;
    loadingState.value = "idle";
    resetFilters();
  }

  // ============================================================================
  // RETOUR PUBLIC
  // ============================================================================

  return {
    // État
    members: members,
    currentMember: readonly(currentMember),
    statistics: readonly(statistics),
    invitations: readonly(invitations),
    loading: readonly(loading),
    loadingState: readonly(loadingState),
    pagination: pagination,
    filters: filters,
    lastError: readonly(lastError),

    // Computed
    hasData,
    hasActiveFilters,
    totalPages,
    activeMembers,
    onlineMembers,

    // Actions - Members
    fetchMembers,
    fetchMember,
    createMember,
    updateMember,
    deleteMember,
    updateMemberRole,
    updateMemberStatus,

    // Actions - Invitations
    inviteMember,
    bulkInviteMembers,
    fetchInvitations,
    resendInvitation,
    cancelInvitation,

    // Actions - Statistics
    fetchStatistics,

    // Helpers
    setPage,
    setPageSize,
    setSearch,
    resetFilters,
    reset,
  };
};
