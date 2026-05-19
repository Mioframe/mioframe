/**
 * Returns a normalized user-provided Mioframe space name.
 * @param name - Raw form value.
 * @returns Trimmed name.
 */
export const normalizeMioframeSpaceName = (name: string | undefined) => name?.trim() ?? '';

/**
 * Returns a field error for an invalid Mioframe space name.
 * @param name - Raw form value.
 * @returns Field-level validation error when the name is invalid.
 */
export const getMioframeSpaceNameError = (name: string | undefined) => {
  const normalizedName = normalizeMioframeSpaceName(name);

  if (!normalizedName) {
    return 'Enter a space name.';
  }

  const hasControlCharacter = Array.from(normalizedName).some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 0x1f;
  });

  if (
    normalizedName === '.' ||
    normalizedName === '..' ||
    hasControlCharacter ||
    normalizedName.includes('/') ||
    normalizedName.includes('\\') ||
    normalizedName.includes(':') ||
    normalizedName.includes('*') ||
    normalizedName.includes('?') ||
    normalizedName.includes('"') ||
    normalizedName.includes('<') ||
    normalizedName.includes('>') ||
    normalizedName.includes('|')
  ) {
    return 'Enter a valid folder name.';
  }

  return undefined;
};
