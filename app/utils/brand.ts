/**
 * Construit une URL complète de site web
 */
export function buildWebsiteUrl(domain: string, extension: string): string {
  return `https://${domain}${extension}`;
}
