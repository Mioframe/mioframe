import pLimit from 'p-limit';
import { DomainError } from '@shared/lib/error';
import {
  FileSystemError,
  PathUtils,
  VfsError,
  type VirtualFileSystem,
} from '@shared/lib/virtualFileSystem';
import { unpackZipArchive, validateArchiveEntryPath } from '@shared/lib/zipArchive';
import { RepositoryZipErrorCode, type OnZipImportProgress } from './repositoryZipContracts';

/** Bounded concurrency for conflict checks and file writes during ZIP import. */
const IMPORT_CONCURRENCY_LIMIT = 4;

type PlannedZipImportFile = {
  targetPath: string;
  content: Uint8Array<ArrayBuffer>;
};

/**
 * Collects the ancestor directories of `path` up to (but not including) `rootPath`, ordered from
 * shallowest to deepest so each can be created before its children.
 * @param rootPath - Absolute path to the import target directory, assumed to already exist.
 * @param path - Absolute path whose ancestor directories should be collected.
 * @returns Ancestor directory paths between `rootPath` and `path`, shallowest first.
 */
const collectAncestorDirectories = (rootPath: string, path: string): string[] => {
  const ancestors: string[] = [];
  let current = PathUtils.dirname(path);

  while (current !== rootPath && PathUtils.isChildOrSame(rootPath, current)) {
    ancestors.unshift(current);
    current = PathUtils.dirname(current);
  }

  return ancestors;
};

const createDirectoryIfMissing = async (vfs: VirtualFileSystem, path: string): Promise<void> => {
  try {
    await vfs.createDirectory(path);
  } catch (error) {
    if (error instanceof VfsError && error.code === FileSystemError.FileExists) {
      return;
    }

    throw error;
  }
};

/**
 * Validates and unpacks a ZIP archive, checks the target directory for file conflicts, and only
 * then writes every file using no-overwrite semantics. Stops before any write if a conflict is
 * found. Directories (including explicit empty-directory markers) are created as needed.
 * @param vfs - Mounted virtual file system.
 * @param targetDirectoryPath - Absolute path to the directory to import into.
 * @param archiveBytes - Raw ZIP archive bytes selected by the user.
 * @param onProgress - Optional progress callback for the validate/conflict/unpack phases.
 * @returns Promise that resolves once every entry has been written.
 * @throws DomainError with code `RepositoryZipErrorCode.importConflict` when any target file
 * already exists, or with a `ZipArchiveErrorCode` when the archive itself is unsafe or damaged.
 */
export const importDirectoryZip = async (
  vfs: VirtualFileSystem,
  targetDirectoryPath: string,
  archiveBytes: Uint8Array,
  onProgress?: OnZipImportProgress,
): Promise<void> => {
  onProgress?.({ phase: 'validatingArchive' });

  const rawEntries = unpackZipArchive(archiveBytes);
  const plannedFiles: PlannedZipImportFile[] = [];
  const plannedDirectories = new Set<string>();

  for (const [rawPath, content] of Object.entries(rawEntries)) {
    const { relativePath, isDirectory } = validateArchiveEntryPath(rawPath);
    const targetPath = PathUtils.join(targetDirectoryPath, relativePath);

    collectAncestorDirectories(targetDirectoryPath, targetPath).forEach((dir) =>
      plannedDirectories.add(dir),
    );

    if (isDirectory) {
      plannedDirectories.add(targetPath);
    } else {
      plannedFiles.push({ targetPath, content });
    }
  }

  onProgress?.({ phase: 'checkingConflicts' });

  const limitConflictCheck = pLimit(IMPORT_CONCURRENCY_LIMIT);
  const conflictChecks = await Promise.all(
    plannedFiles.map(({ targetPath }) => limitConflictCheck(() => vfs.exists(targetPath))),
  );

  if (conflictChecks.some(Boolean)) {
    throw new DomainError(
      'The selected directory already has files with the same names as the archive. Import was stopped before any changes were made.',
      { code: RepositoryZipErrorCode.importConflict },
    );
  }

  onProgress?.({ phase: 'unpacking' });

  const orderedDirectories = Array.from(plannedDirectories).sort(
    (a, b) => PathUtils.split(a).length - PathUtils.split(b).length,
  );

  for (const directoryPath of orderedDirectories) {
    // eslint-disable-next-line no-await-in-loop -- parent directories must exist before child writes
    await createDirectoryIfMissing(vfs, directoryPath);
  }

  let current = 0;
  const limitWrite = pLimit(IMPORT_CONCURRENCY_LIMIT);

  await Promise.all(
    plannedFiles.map(({ targetPath, content }) =>
      limitWrite(async () => {
        await vfs.createFile(targetPath, content);
        current += 1;
        onProgress?.({ phase: 'unpacking', current, total: plannedFiles.length });
      }),
    ),
  );
};
