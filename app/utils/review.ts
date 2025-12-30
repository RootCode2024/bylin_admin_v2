/**
 * Helpers pour les reviews
 */

import type { Review, ReviewStatus } from "~/types/review";

/**
 * Obtient le label d'un statut de review
 */
export function getReviewStatusLabel(status: ReviewStatus): string {
  const labels: Record<ReviewStatus, string> = {
    pending: "En attente",
    approved: "Approuvé",
    rejected: "Rejeté",
  };
  return labels[status] || status;
}

/**
 * Obtient la couleur d'un statut de review
 */
export function getReviewStatusColor(status: ReviewStatus): 'success' | 'warning' | 'error' | 'neutral' {
  const colors: Record<ReviewStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error'
  }
  return colors[status] || 'neutral'
}

/**
 * Génère un tableau d'étoiles pour l'affichage du rating
 */
export function getStarsArray(rating: number): {
  filled: number;
  half: boolean;
  empty: number;
} {
  const filled = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  const empty = 5 - filled - (hasHalf ? 1 : 0);

  return { filled, half: hasHalf, empty };
}

/**
 * Formate un rating avec décimales
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Vérifie si une review a des médias
 */
export function hasMedia(review: Review): boolean {
  return Boolean(review.media && review.media.length > 0);
}

/**
 * Compte les images d'une review
 */
export function countImages(review: Review): number {
  return review.media?.filter((m) => m.media_type === "image").length || 0;
}

/**
 * Compte les vidéos d'une review
 */
export function countVideos(review: Review): number {
  return review.media?.filter((m) => m.media_type === "video").length || 0;
}

/**
 * Obtient le texte du badge de vérification
 */
export function getVerificationBadge(isVerified: boolean): string {
  return isVerified ? "Achat vérifié" : "Non vérifié";
}

/**
 * Formate le compteur "utile"
 */
export function formatHelpfulCount(count: number): string {
  if (count === 0) return "Aucun vote";
  if (count === 1) return "1 personne";
  return `${count} personnes`;
}

/**
 * Extrait un extrait du commentaire
 */
export function getCommentExcerpt(
  comment: string | null | undefined,
  maxLength: number = 150
): string {
  if (!comment) return "—";
  if (comment.length <= maxLength) return comment;
  return comment.substring(0, maxLength) + "...";
}

/**
 * Vérifie si une review peut être modérée
 */
export function canModerate(review: Review): boolean {
  return !review.deleted_at && review.status === "pending";
}

/**
 * Obtient l'icône d'étoile selon le rating
 */
export function getStarIcon(rating: number, position: number): string {
  if (position <= Math.floor(rating)) return "i-lucide-star";
  if (position === Math.ceil(rating) && rating % 1 >= 0.5)
    return "i-lucide-star-half";
  return "i-lucide-star";
}

/**
 * Génère les options de filtre pour les ratings
 */
export function getRatingFilterOptions(): Array<{
  value: number | "all";
  label: string;
  icon?: string;
}> {
  return [
    { value: "all", label: "Tous les avis", icon: "i-lucide-list" },
    { value: 5, label: "5 étoiles", icon: "i-lucide-star" },
    { value: 4, label: "4 étoiles", icon: "i-lucide-star" },
    { value: 3, label: "3 étoiles", icon: "i-lucide-star" },
    { value: 2, label: "2 étoiles", icon: "i-lucide-star" },
    { value: 1, label: "1 étoile", icon: "i-lucide-star" },
  ];
}

/**
 * Calcule le pourcentage pour une note donnée
 */
export function calculateRatingPercentage(
  count: number,
  total: number
): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}
