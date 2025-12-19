import type { ImageUploadConfig } from "~/types/brand";

/**
 * Configuration par défaut pour les images
 */
export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  minDimensions: { width: 100, height: 100 },
  maxDimensions: { width: 2048, height: 2048 },
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};

/**
 * Formate une taille de fichier en octets en format lisible
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Octets";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${
    sizes[i]
  }`;
}

/**
 * Construit une URL complète de site web
 */
export function buildWebsiteUrl(domain: string, extension: string): string {
  return `https://${domain}${extension}`;
}
