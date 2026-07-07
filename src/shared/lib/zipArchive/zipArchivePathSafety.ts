import { DomainError } from '@shared/lib/error';
import { ZipArchiveErrorCode } from './zipArchiveErrorCode';

/** A validated, safe relative path parsed from one ZIP archive entry. */
export type SafeZipEntryPath = {
  /** Normalized relative path using `/` separators, without a leading or trailing slash. */
  relativePath: string;
  /** Whether the entry is an explicit (typically empty) directory marker. */
  isDirectory: boolean;
};

const WINDOWS_DRIVE_PATTERN = /^[a-zA-Z]:/;

const isControlCharCode = (code: number) => code <= 0x1f;

const hasControlCharacter = (value: string) =>
  Array.from(value).some((char) => isControlCharCode(char.codePointAt(0) ?? 0));

const failUnsafeEntryPath = (): never => {
  throw new DomainError('The archive contains an unsafe file path.', {
    cause: new Error('Unsafe ZIP entry path'),
    code: ZipArchiveErrorCode.unsafeEntryPath,
  });
};

/**
 * Validates one raw ZIP archive entry path and returns its normalized, safe relative form.
 * Rejects absolute paths, parent-directory traversal, backslashes, drive letters, and control
 * characters so archive import can never write outside the target directory.
 * @param rawEntryPath - The raw path recorded for one entry inside a ZIP archive.
 * @returns The validated, normalized relative path and whether it is a directory marker.
 * @throws DomainError with code `ZipArchiveErrorCode.unsafeEntryPath` when the path is unsafe.
 */
export const validateArchiveEntryPath = (rawEntryPath: string): SafeZipEntryPath => {
  if (!rawEntryPath || hasControlCharacter(rawEntryPath)) {
    failUnsafeEntryPath();
  }

  if (
    rawEntryPath.startsWith('/') ||
    rawEntryPath.includes('\\') ||
    WINDOWS_DRIVE_PATTERN.test(rawEntryPath)
  ) {
    failUnsafeEntryPath();
  }

  const isDirectory = rawEntryPath.endsWith('/');
  const segments = rawEntryPath.split('/');
  const cleanedSegments = segments.filter(
    (segment, index) => !(isDirectory && index === segments.length - 1 && segment === ''),
  );

  if (cleanedSegments.length === 0) {
    failUnsafeEntryPath();
  }

  for (const segment of cleanedSegments) {
    if (segment === '' || segment === '.' || segment === '..') {
      failUnsafeEntryPath();
    }
  }

  return { relativePath: cleanedSegments.join('/'), isDirectory };
};

const UNSAFE_ROOT_NAME_LITERAL_CHARACTERS = new Set(['/', '\\', ':', '*', '?', '"', '<', '>', '|']);

const isUnsafeRootNameCharacter = (char: string) =>
  isControlCharCode(char.codePointAt(0) ?? 0) || UNSAFE_ROOT_NAME_LITERAL_CHARACTERS.has(char);

/**
 * Sanitizes a directory name into a safe ZIP archive root folder name.
 * @param rawName - The directory name to sanitize (e.g. the exported directory's basename).
 * @param fallback - Name used when `rawName` is empty or sanitizes to nothing (default `'export'`).
 * @returns A filesystem-portable archive root folder name.
 */
export const sanitizeArchiveRootName = (rawName: string, fallback = 'export'): string => {
  const sanitized = Array.from(rawName.trim())
    .map((char) => (isUnsafeRootNameCharacter(char) ? '_' : char))
    .join('')
    .replace(/[. ]+$/, '')
    .trim();

  return sanitized || fallback;
};
