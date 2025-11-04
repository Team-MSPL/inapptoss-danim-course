// utility to normalize image URLs from API source_content
export function buildImageUrl(src?: string | null): string | null {
  if (!src) return null;
  const trimmed = String(src).trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // remove leading slashes
  const cleaned = trimmed.replace(/^\/+/, "");
  // prefix used across the app (KKDAY CDN pattern)
  const PREFIX = "https://image.kkday.com/v2/";
  return PREFIX + cleaned;
}