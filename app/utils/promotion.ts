import type {
  Promotion,
  PromotionType,
  PromotionStatus,
} from "~/types/promotion";

// Import des helpers communs (pas de ré-export)
import {
  formatPriceXOF,
  generateRandomCode,
  normalizeCode as normalizeHelper,
  getDaysRemaining as getDaysRemainingHelper,
  formatDateTimeFR,
} from "./helpers";

/* =========================================================================
 * 🏷️ TYPES DE PROMOTIONS - Labels, Icônes, Couleurs
 * ========================================================================= */

/**
 * Retourne le label d'un type de promotion
 */
export function getPromotionTypeLabel(type: PromotionType): string {
  const labels: Record<PromotionType, string> = {
    percentage: "Pourcentage",
    fixed_amount: "Montant fixe",
    buy_x_get_y: "Achetez X obtenez Y",
  };
  return labels[type] || type;
}

/**
 * Retourne l'icône d'un type de promotion
 */
export function getPromotionTypeIcon(type: PromotionType): string {
  const icons: Record<PromotionType, string> = {
    percentage: "i-lucide-percent",
    fixed_amount: "i-lucide-coins",
    buy_x_get_y: "i-lucide-gift",
  };
  return icons[type] || "i-lucide-tag";
}

/**
 * Retourne la couleur badge d'un type
 */
export function getPromotionTypeColor(type: PromotionType): string {
  const colors: Record<PromotionType, string> = {
    percentage: "primary",
    fixed_amount: "success",
    buy_x_get_y: "secondary",
  };
  return colors[type] || "neutral";
}

/* =========================================================================
 * 📊 STATUT DE PROMOTION - Calcul & Labels
 * ========================================================================= */

/**
 * Détermine le statut d'une promotion
 */
export function getPromotionStatus(promotion: Promotion): PromotionStatus {
  const now = new Date();

  // Vérifie si elle est épuisée
  if (promotion.usage_limit && promotion.usage_count >= promotion.usage_limit) {
    return "exhausted";
  }

  // Vérifie si elle est expirée
  if (promotion.expires_at) {
    const expiresAt = new Date(promotion.expires_at);
    if (expiresAt < now) {
      return "expired";
    }
  }

  // Vérifie si elle est à venir
  if (promotion.starts_at) {
    const startsAt = new Date(promotion.starts_at);
    if (startsAt > now) {
      return "upcoming";
    }
  }

  // Vérifie si elle est active
  if (promotion.is_active) {
    return "active";
  }

  return "inactive";
}

/**
 * Retourne le label d'un statut
 */
export function getPromotionStatusLabel(status: PromotionStatus): string {
  const labels: Record<PromotionStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    expired: "Expirée",
    upcoming: "À venir",
    exhausted: "Épuisée",
  };
  return labels[status];
}

/**
 * Retourne la couleur d'un statut
 */
export function getPromotionStatusColor(status: PromotionStatus): string {
  const colors: Record<PromotionStatus, string> = {
    active: "success",
    inactive: "neutral",
    expired: "error",
    upcoming: "info",
    exhausted: "warning",
  };
  return colors[status];
}

/**
 * Vérifie si une promotion est expirée
 */
export function isExpired(promotion: Promotion): boolean {
  if (!promotion.expires_at) return false;
  return new Date(promotion.expires_at) < new Date();
}

/**
 * Vérifie si une promotion est à venir
 */
export function isUpcoming(promotion: Promotion): boolean {
  if (!promotion.starts_at) return false;
  return new Date(promotion.starts_at) > new Date();
}

/**
 * Vérifie si une promotion est actuellement valide
 */
export function isCurrentlyValid(promotion: Promotion): boolean {
  const status = getPromotionStatus(promotion);
  return status === "active";
}

/* =========================================================================
 * 💰 CALCULS DE RÉDUCTION
 * ========================================================================= */

/**
 * Formate une valeur de promotion pour l'affichage
 */
export function formatPromotionValue(promotion: Promotion): string {
  if (promotion.type === "percentage") {
    const value = Number.isInteger(promotion.value)
      ? promotion.value.toString()
      : promotion.value
          .toString()
          .replace(/\.0+$/, "")
          .replace(/(\.\d*[1-9])0+$/, "$1");

    return `${value}%`;
  }

  if (promotion.type === "fixed_amount") {
    // Import depuis helpers au lieu de ré-exporter
    return formatPriceXOF(promotion.value);
  }

  return promotion.value.toString();
}

/**
 * Calcule le montant de la réduction
 */
export function calculateDiscount(
  promotion: Promotion,
  amount: number
): number {
  let discount = 0;

  if (promotion.type === "percentage") {
    discount = (amount * promotion.value) / 100;
  } else if (promotion.type === "fixed_amount") {
    discount = promotion.value;
  }

  // Appliquer la limite max si définie
  if (
    promotion.max_discount_amount &&
    discount > promotion.max_discount_amount
  ) {
    discount = promotion.max_discount_amount;
  }

  // La réduction ne peut pas dépasser le montant
  if (discount > amount) {
    discount = amount;
  }

  return Math.round(discount * 100) / 100;
}

/**
 * Vérifie si une promotion est applicable à un montant
 */
export function isApplicableToAmount(
  promotion: Promotion,
  amount: number
): boolean {
  if (!promotion.min_purchase_amount) {
    return true;
  }
  return amount >= promotion.min_purchase_amount;
}

/* =========================================================================
 * 📈 LIMITES D'UTILISATION
 * ========================================================================= */

/**
 * Vérifie si une promotion a atteint sa limite d'utilisation
 */
export function hasReachedLimit(promotion: Promotion): boolean {
  if (!promotion.usage_limit) {
    return false;
  }
  return promotion.usage_count >= promotion.usage_limit;
}

/**
 * Calcule le pourcentage d'utilisation
 */
export function getUsagePercentage(promotion: Promotion): number {
  if (!promotion.usage_limit) {
    return 0;
  }
  return Math.min(100, (promotion.usage_count / promotion.usage_limit) * 100);
}

/**
 * Formate la limite d'utilisation
 */
export function formatUsageLimit(promotion: Promotion): string {
  if (!promotion.usage_limit) {
    return "Illimité";
  }

  const remaining = promotion.usage_limit - promotion.usage_count;
  return `${remaining} / ${promotion.usage_limit} restants`;
}

/* =========================================================================
 * 🔧 CODES PROMO - Génération & Validation
 * ========================================================================= */

/**
 * Génère un code promo aléatoire
 */
export function generatePromotionCode(
  prefix: string = "",
  length: number = 8
): string {
  return generateRandomCode(prefix, length);
}

/**
 * Normalise un code (uppercase, trim, supprime espaces)
 */
export function normalizePromotionCode(code: string): string {
  return normalizeHelper(code);
}

/**
 * Vérifie si un code promo est valide (3-50 caractères, A-Z et 0-9 uniquement)
 */
export function isValidPromotionCode(code: string): boolean {
  const normalized = normalizePromotionCode(code);
  return /^[A-Z0-9]{3,50}$/.test(normalized);
}

/* =========================================================================
 * 📅 DATES & FORMATAGE
 * ========================================================================= */

/**
 * Formate une date pour l'affichage
 */
export function formatPromotionDate(dateString: string | null): string {
  if (!dateString) return "—";
  return formatDateTimeFR(dateString);
}

/**
 * Calcule les jours restants jusqu'à une date
 */
export function getPromotionDaysRemaining(
  dateString: string | null
): number | null {
  return getDaysRemainingHelper(dateString);
}

/* =========================================================================
 * 💵 FORMATAGE DES MONTANTS
 * ========================================================================= */

/**
 * Formate le montant minimum d'achat
 */
export function formatMinPurchase(amount: number | null): string {
  if (!amount) return "Aucun minimum";
  return `Min. ${formatPriceXOF(amount)}`;
}

/* =========================================================================
 * 📝 RÉSUMÉS & DESCRIPTIONS
 * ========================================================================= */

/**
 * Crée une description de la promotion pour l'affichage
 */
export function createPromotionSummary(promotion: Promotion): string {
  let summary = formatPromotionValue(promotion);

  if (promotion.min_purchase_amount) {
    summary += ` • ${formatMinPurchase(promotion.min_purchase_amount)}`;
  }

  if (promotion.max_discount_amount) {
    summary += ` • Max ${promotion.max_discount_amount.toLocaleString(
      "fr-FR"
    )} FCFA`;
  }

  return summary;
}
