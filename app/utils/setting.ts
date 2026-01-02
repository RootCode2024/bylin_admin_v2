import type {
  Member,
  MemberRole,
  MemberStatus,
  Invitation,
} from "~/types/setting";
import {
  MEMBER_ROLES,
  MEMBER_STATUSES,
  ROLE_ICONS,
  STATUS_ICONS,
} from "~/types/setting";

// ============================================================================
// FORMATAGE
// ============================================================================

/**
 * Formater le rôle d'un membre
 */
export function formatMemberRole(role: MemberRole | undefined): string {
  if (!role) return "N/A";
  return MEMBER_ROLES[role] || role;
}

/**
 * Formater le statut d'un membre
 */
export function formatMemberStatus(status: MemberStatus): string {
  return MEMBER_STATUSES[status] || status;
}

/**
 * Obtenir les initiales d'un membre
 */
export function getMemberInitials(member: Member): string {
  if (!member.name) return "??";

  const parts = member.name.trim().split(" ").filter(Boolean);

  if (parts.length >= 2 && parts[0] && parts[1]) {
    const first = parts[0][0];
    const second = parts[1][0];
    if (first && second) {
      return `${first}${second}`.toUpperCase();
    }
  }

  if (parts.length > 0 && parts[0]) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return member.name.substring(0, 2).toUpperCase();
}

/**
 * Obtenir la couleur du badge de statut
 */
export type UBadgeColor =
  | "error"
  | "success"
  | "primary"
  | "secondary"
  | "info"
  | "warning"
  | "neutral";

export function getStatusColor(status: MemberStatus): UBadgeColor {
  const colorMap: Record<MemberStatus, UBadgeColor> = {
    active: "success",
    inactive: "neutral",
    invited: "warning",
    suspended: "error",
  };
  return colorMap[status];
}

export function getRoleColor(roleName: string | undefined): UBadgeColor {
  if (!roleName) return "neutral";

  const colorMap: Record<string, UBadgeColor> = {
    super_admin: "error",
    admin: "warning",
    manager: "info",
    customer: "primary",
  };
  return colorMap[roleName] || "neutral";
}

/**
 * Obtenir l'icône du rôle
 */
export function getRoleIcon(role: MemberRole): string {
  return ROLE_ICONS[role] || "i-lucide-user";
}

/**
 * Obtenir l'icône du statut
 */
export function getStatusIcon(status: MemberStatus): string {
  return STATUS_ICONS[status] || "i-lucide-circle";
}

// ============================================================================
// VALIDATIONS
// ============================================================================

/**
 * Valider un email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valider un nom d'utilisateur
 */
export function isValidUsername(username: string): boolean {
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return (
    usernameRegex.test(username) &&
    username.length >= 3 &&
    username.length <= 255
  );
}

/**
 * Valider un mot de passe
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// ============================================================================
// INVITATIONS
// ============================================================================

/**
 * Vérifier si une invitation est expirée
 */
export function isInvitationExpired(invitation: Invitation): boolean {
  if (invitation.accepted_at) return false;
  return new Date(invitation.expires_at) < new Date();
}

/**
 * Obtenir le nombre de jours avant expiration
 */
export function getDaysUntilExpiry(invitation: Invitation): number {
  if (isInvitationExpired(invitation) || invitation.accepted_at) {
    return 0;
  }

  const now = new Date();
  const expiry = new Date(invitation.expires_at);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Formater le statut d'une invitation
 */
export function formatInvitationStatus(invitation: Invitation): string {
  if (invitation.accepted_at) {
    return "Acceptée";
  }

  if (isInvitationExpired(invitation)) {
    return "Expirée";
  }

  return "En attente";
}

/**
 * Obtenir la couleur du statut d'invitation
 */
export function getInvitationStatusColor(invitation: Invitation): string {
  if (invitation.accepted_at) {
    return "success";
  }

  if (isInvitationExpired(invitation)) {
    return "error";
  }

  return "warning";
}

// ============================================================================
// TRI ET FILTRAGE
// ============================================================================

/**
 * Trier les membres par nom
 */
export function sortMembersByName(
  members: Member[],
  order: "asc" | "desc" = "asc"
): Member[] {
  return [...members].sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();
    return order === "asc"
      ? nameA.localeCompare(nameB)
      : nameB.localeCompare(nameA);
  });
}

/**
 * Trier les membres par rôle
 */
export function sortMembersByRole(
  members: Member[],
  order: "asc" | "desc" = "asc"
): Member[] {
  const roleOrder: Record<MemberRole, number> = {
    super_admin: 1,
    admin: 2,
    manager: 3,
  };

  return [...members].sort((a, b) => {
    const orderA = roleOrder[a.role];
    const orderB = roleOrder[b.role];
    return order === "asc" ? orderA - orderB : orderB - orderA;
  });
}

/**
 * Filtrer les membres par recherche
 */
export function filterMembersBySearch(
  members: Member[],
  search: string
): Member[] {
  if (!search.trim()) return members;

  const searchLower = search.toLowerCase();

  return members.filter(
    (member) =>
      member.name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower)
  );
}

/**
 * Filtrer les membres par rôle
 */
export function filterMembersByRole(
  members: Member[],
  role: MemberRole | "all"
): Member[] {
  if (role === "all") return members;
  return members.filter((member) => member.role === role);
}

/**
 * Filtrer les membres par statut
 */
export function filterMembersByStatus(
  members: Member[],
  status: MemberStatus | "all"
): Member[] {
  if (status === "all") return members;
  return members.filter((member) => member.status === status);
}

// ============================================================================
// PERMISSIONS
// ============================================================================

/**
 * Vérifier si un utilisateur peut modifier un membre
 */
export function canEditMember(
  currentUser: Member,
  targetMember: Member
): boolean {
  // On ne peut pas s'éditer soi-même pour le rôle/statut
  if (currentUser.id === targetMember.id) return false;

  // Seuls les admins peuvent modifier les autres admins
  if (targetMember.role === "admin" && currentUser.role !== "admin") {
    return false;
  }

  return true;
}

/**
 * Vérifier si un utilisateur peut supprimer un membre
 */
export function canDeleteMember(
  currentUser: Member,
  targetMember: Member
): boolean {
  // On ne peut pas se supprimer soi-même
  if (currentUser.id === targetMember.id) return false;

  // Seuls les admins peuvent supprimer
  if (currentUser.role !== "admin") return false;

  return true;
}

/**
 * Vérifier si un utilisateur peut inviter des membres
 */
export function canInviteMembers(currentUser: Member): boolean {
  return ["admin", "manager"].includes(currentUser.role);
}

// ============================================================================
// FORMATAGE DES DATES
// ============================================================================

/**
 * Formater la dernière connexion
 */
export function formatLastLogin(lastLoginAt: string | null): string {
  if (!lastLoginAt) return "Jamais connecté";

  const date = new Date(lastLoginAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;

  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

/**
 * Formater la date de création
 */
export function formatMemberSince(createdAt: string): string {
  const date = new Date(createdAt);
  return `Membre depuis ${date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  })}`;
}

// ============================================================================
// STATISTIQUES
// ============================================================================

/**
 * Calculer le pourcentage de membres actifs
 */
export function getActivePercentage(
  activeCount: number,
  totalCount: number
): number {
  if (totalCount === 0) return 0;
  return Math.round((activeCount / totalCount) * 100);
}

/**
 * Obtenir le label de croissance
 */
export function getGrowthLabel(
  newCount: number,
  period: "week" | "month"
): string {
  const periodLabel = period === "week" ? "cette semaine" : "ce mois";
  if (newCount === 0) return `Aucun nouveau ${periodLabel}`;
  if (newCount === 1) return `1 nouveau ${periodLabel}`;
  return `${newCount} nouveaux ${periodLabel}`;
}
