export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

/**
 * Formate une taille de fichier en octets en format lisible (brand et category)
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
 * Options de configuration pour le téléchargement d'images
 */
export interface ImageUploadConfig {
  maxFileSize: number; // en octets
  minDimensions: { width: number; height: number };
  maxDimensions: { width: number; height: number };
  acceptedTypes: string[];
}

/**
 * Configuration par défaut pour les images
 */
export const DEFAULT_IMAGE_CONFIG: ImageUploadConfig = {
  maxFileSize: 2 * 1024 * 1024, // 2MB
  minDimensions: { width: 200, height: 200 },
  maxDimensions: { width: 2048, height: 2048 },
  acceptedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
};
