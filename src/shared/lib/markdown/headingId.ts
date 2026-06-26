const NON_SLUG_CHAR_PATTERN = /[^a-z0-9\s-]/g;
const WHITESPACE_PATTERN = /\s+/g;

/**
 * Slugifies heading text into a deterministic, URL-safe id.
 * @param text - Plain heading text (already stripped of Markdown syntax).
 * @returns A lowercase, hyphen-separated slug, or `'section'` when the text has no slug-able characters.
 */
export const slugifyHeadingText = (text: string): string => {
  const slug = text
    .trim()
    .toLowerCase()
    .replace(NON_SLUG_CHAR_PATTERN, '')
    .replace(WHITESPACE_PATTERN, '-');

  return slug || 'section';
};

/**
 * Resolves a unique heading id for a given slug, appending a numeric suffix on collision.
 * @param slug - Base slug derived from the heading text.
 * @param usedIds - Mutable set of ids already assigned in the current document; updated in place.
 * @returns A unique id not present in `usedIds` before the call.
 */
export const resolveUniqueHeadingId = (slug: string, usedIds: Set<string>): string => {
  let candidate = slug;
  let suffix = 1;

  while (usedIds.has(candidate)) {
    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }

  usedIds.add(candidate);
  return candidate;
};
