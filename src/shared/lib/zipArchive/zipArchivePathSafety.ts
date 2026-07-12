import { DomainError } from '@shared/lib/error';
import { PathUtils } from '@shared/lib/virtualFileSystem';
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

/** One archive entry resolved to an absolute VFS path, confirmed to stay inside its target directory. */
export type SafeZipEntryTarget = {
  /** Absolute VFS path this entry should be written to. */
  targetPath: string;
  /** Whether the entry is an explicit (typically empty) directory marker. */
  isDirectory: boolean;
};

/**
 * Validates one raw ZIP archive entry path and resolves it to an absolute path under
 * `targetDirectoryPath`, explicitly re-checking that the normalized result stays contained inside
 * that directory. {@link validateArchiveEntryPath} already rejects `..` segments and absolute
 * paths on their own, but this containment check is kept as an independent, explicit guarantee
 * rather than relying only on that per-segment validation, so the import target boundary stays a
 * single owned, tested invariant.
 * @param targetDirectoryPath - Absolute path to the directory being imported into.
 * @param rawEntryPath - The raw path recorded for one entry inside a ZIP archive.
 * @returns The resolved absolute target path and whether the entry is a directory marker.
 * @throws DomainError with code `ZipArchiveErrorCode.unsafeEntryPath` when the path is unsafe or
 * would resolve outside `targetDirectoryPath`.
 */
export const resolveSafeArchiveEntryTarget = (
  targetDirectoryPath: string,
  rawEntryPath: string,
): SafeZipEntryTarget => {
  const { relativePath, isDirectory } = validateArchiveEntryPath(rawEntryPath);
  const targetPath = PathUtils.join(targetDirectoryPath, relativePath);

  if (
    targetPath === targetDirectoryPath ||
    !PathUtils.isChildOrSame(targetDirectoryPath, targetPath)
  ) {
    failUnsafeEntryPath();
  }

  return { targetPath, isDirectory };
};
