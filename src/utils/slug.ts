/**
 * Generates a URL-friendly slug from a string
 * @param text - The text to convert to a slug
 * @returns A lowercase, hyphenated slug
 * @example generateSlug("Akatombo") // "akatombo"
 * @example generateSlug("San'ya Sugagaki") // "sanya-sugagaki"
 */
export function generateSlug(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      // Remove apostrophes
      .replace(/'/g, '')
      // Replace spaces and special characters with hyphens
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      // Remove leading/trailing hyphens
      .replace(/^-+|-+$/g, '')
      // Collapse multiple hyphens
      .replace(/-+/g, '-')
  );
}

/**
 * Ensures a slug is unique by appending a number if needed
 * @param baseSlug - The base slug to make unique
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug
 * @example ensureUniqueSlug("akatombo", ["akatombo"]) // "akatombo-2"
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 2;
  let uniqueSlug = `${baseSlug}-${counter}`;

  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}
