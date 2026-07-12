const UNSAFE_FILE_NAME_LITERAL_CHARACTERS = new Set(['/', '\\', ':', '*', '?', '"', '<', '>', '|']);

const isControlCharCode = (code: number) => code <= 0x1f;

const isUnsafeFileNameCharacter = (char: string) =>
  isControlCharCode(char.codePointAt(0) ?? 0) || UNSAFE_FILE_NAME_LITERAL_CHARACTERS.has(char);

/**
 * Sanitizes a raw name into a filesystem-portable file name stem, for building the downloaded ZIP
 * export file name.
 * @param rawName - The raw name to sanitize (e.g. the exported directory's basename).
 * @param fallback - Name used when `rawName` is empty or sanitizes to nothing (default `'export'`).
 * @returns A filesystem-portable file name stem.
 */
export const sanitizeExportFileNameStem = (rawName: string, fallback = 'export'): string => {
  const sanitized = Array.from(rawName.trim())
    .map((char) => (isUnsafeFileNameCharacter(char) ? '_' : char))
    .join('')
    .replace(/[. ]+$/, '')
    .trim();

  return sanitized || fallback;
};
