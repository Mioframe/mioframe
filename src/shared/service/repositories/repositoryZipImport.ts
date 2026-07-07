import pLimit from 'p-limit';
import { DomainError } from '@shared/lib/error';
import {
  FileSystemError,
  FSNodeType,
  PathUtils,
  VfsError,
  type VirtualFileSystem,
} from '@shared/lib/virtualFileSystem';
import {
  createZipArchiveReader,
  resolveSafeArchiveEntryTarget,
  streamBlobChunks,
} from '@shared/lib/zipArchive';
import { RepositoryZipErrorCode, type OnZipImportProgress } from './repositoryZipContracts';

/** Bounded concurrency for conflict checks during ZIP import preflight. */
const IMPORT_CONCURRENCY_LIMIT = 4;

type PlannedZipImportFile = {
  /** Raw path exactly as recorded in the archive, used to match entries during the write pass. */
  archivePath: string;
  /** Resolved absolute VFS path this entry should be written to. */
  targetPath: string;
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

const importConflictError = (message: string) =>
  new DomainError(message, { code: RepositoryZipErrorCode.importConflict });

/**
 * Streams archive bytes from `archiveFile` into `reader`, awaiting each chunk's delivery before
 * reading more so decompressed content never accumulates unbounded.
 * @param archiveFile - The user-selected ZIP archive file.
 * @param push - Pushes one chunk of archive bytes; mirrors `ZipArchiveReader.push`.
 */
const streamArchiveInto = async (
  archiveFile: File,
  push: (chunk: Uint8Array, final: boolean) => Promise<void>,
): Promise<void> => {
  let buffered: Uint8Array | undefined;

  for await (const chunk of streamBlobChunks(archiveFile)) {
    if (buffered !== undefined) {
      await push(buffered, false);
    }
    buffered = chunk;
  }

  await push(buffered ?? new Uint8Array(0), true);
};

/** Result of the metadata-only (pass 1) walk over the archive. */
type ZipImportPlan = {
  plannedFiles: PlannedZipImportFile[];
  plannedDirectories: Set<string>;
};

/**
 * Pass 1: streams the archive once to discover every entry's path and type, without decompressing
 * any file content. Validates archive-internal path safety and detects duplicate/type conflicts
 * within the archive itself.
 * @param archiveFile - The user-selected ZIP archive file.
 * @param targetDirectoryPath - Absolute path to the directory to import into.
 * @returns The planned files and directories to write.
 * @throws DomainError when an entry path is unsafe, a duplicate target path is found, or an
 * archive entry conflicts with another entry's type (file vs. directory).
 */
const planZipImport = async (
  archiveFile: File,
  targetDirectoryPath: string,
): Promise<ZipImportPlan> => {
  const plannedFiles: PlannedZipImportFile[] = [];
  const plannedDirectories = new Set<string>();
  const fileTargetPaths = new Set<string>();
  let firstError: unknown;

  const reader = createZipArchiveReader((entry) => {
    if (firstError) {
      return;
    }

    try {
      const { targetPath, isDirectory } = resolveSafeArchiveEntryTarget(
        targetDirectoryPath,
        entry.rawPath,
      );

      collectAncestorDirectories(targetDirectoryPath, targetPath).forEach((dir) =>
        plannedDirectories.add(dir),
      );

      if (isDirectory) {
        plannedDirectories.add(targetPath);
        return;
      }

      if (fileTargetPaths.has(targetPath)) {
        throw importConflictError(
          'The archive contains duplicate entries for the same path. Import was stopped before any changes were made.',
        );
      }

      fileTargetPaths.add(targetPath);
      plannedFiles.push({ archivePath: entry.rawPath, targetPath });
    } catch (error) {
      firstError = error;
    }
  });

  await streamArchiveInto(archiveFile, (chunk, final) => reader.push(chunk, final));

  if (firstError) {
    // `catch` blocks only ever assign an Error/DomainError instance here (see the try above).
    throw firstError instanceof Error
      ? firstError
      : new Error('Unexpected error while planning the ZIP import', { cause: firstError });
  }

  if (plannedFiles.some(({ targetPath }) => plannedDirectories.has(targetPath))) {
    throw importConflictError(
      'The archive uses the same path for both a file and a directory. Import was stopped before any changes were made.',
    );
  }

  return { plannedFiles, plannedDirectories };
};

/**
 * Preflights every planned target against the VFS: files must not already exist, and any
 * directory path that already exists must actually be a directory. Stops before any write if any
 * conflict is found.
 * @param vfs - Mounted virtual file system.
 * @param plan - The plan produced by {@link planZipImport}.
 * @throws DomainError with code `RepositoryZipErrorCode.importConflict` when a target file already
 * exists, or an existing entry's type does not match what the archive expects.
 */
const preflightZipImportConflicts = async (
  vfs: VirtualFileSystem,
  plan: ZipImportPlan,
): Promise<void> => {
  const limit = pLimit(IMPORT_CONCURRENCY_LIMIT);

  const fileConflicts = await Promise.all(
    plan.plannedFiles.map(({ targetPath }) => limit(() => vfs.exists(targetPath))),
  );

  if (fileConflicts.some(Boolean)) {
    throw importConflictError(
      'The selected directory already has files with the same names as the archive. Import was stopped before any changes were made.',
    );
  }

  const directoryTypeConflicts = await Promise.all(
    Array.from(plan.plannedDirectories).map((directoryPath) =>
      limit(async () => {
        if (!(await vfs.exists(directoryPath))) {
          return false;
        }

        const stat = await vfs.stat(directoryPath);
        return stat.type !== FSNodeType.Directory;
      }),
    ),
  );

  if (directoryTypeConflicts.some(Boolean)) {
    throw importConflictError(
      'The selected directory already has a file where the archive expects a folder. Import was stopped before any changes were made.',
    );
  }
};

/**
 * Pass 2: streams the archive a second time, writing only the entries planned by
 * {@link planZipImport}, using no-overwrite semantics. Tracks whether any write actually
 * succeeded so callers can classify a mid-write failure as a possible partial import.
 * @param vfs - Mounted virtual file system.
 * @param archiveFile - The user-selected ZIP archive file.
 * @param plan - The plan produced by {@link planZipImport}.
 * @param onProgress - Optional progress callback.
 * @throws DomainError with code `RepositoryZipErrorCode.importWritePartiallyFailed` when a write
 * fails after at least one earlier write already succeeded; otherwise rethrows the original error.
 */
const writeZipImportPlan = async (
  vfs: VirtualFileSystem,
  archiveFile: File,
  plan: ZipImportPlan,
  onProgress?: OnZipImportProgress,
): Promise<void> => {
  let anyWriteSucceeded = false;

  const runWrite = async (write: () => Promise<void>): Promise<void> => {
    try {
      await write();
      anyWriteSucceeded = true;
    } catch (error) {
      if (!anyWriteSucceeded) {
        // Nothing has been written yet, so a write-access failure here is still safe to recover
        // from and retry: granting access and retrying the whole import cannot conflict with
        // anything this import has already written.
        throw error;
      }

      // At least one write already succeeded. Even a write-access-recovery error must not be
      // rethrown raw here, since the caller's recovery flow retries the whole import, which
      // would then hit conflicts caused by the files this attempt already wrote.
      throw new DomainError(
        'The import stopped partway through. Some files may already have been written — check the target folder before retrying.',
        { cause: error, code: RepositoryZipErrorCode.importWritePartiallyFailed },
      );
    }
  };

  const orderedDirectories = Array.from(plan.plannedDirectories).sort(
    (a, b) => PathUtils.split(a).length - PathUtils.split(b).length,
  );

  for (const directoryPath of orderedDirectories) {
    // eslint-disable-next-line no-await-in-loop -- parent directories must exist before child writes
    await runWrite(() => createDirectoryIfMissing(vfs, directoryPath));
  }

  const plannedByArchivePath = new Map(plan.plannedFiles.map((file) => [file.archivePath, file]));
  let current = 0;

  const reader = createZipArchiveReader((entry) => {
    const planned = plannedByArchivePath.get(entry.rawPath);

    if (!planned) {
      return;
    }

    const chunks: Uint8Array[] = [];

    entry.read(async (data, final) => {
      chunks.push(data);

      if (!final) {
        return;
      }

      const total = chunks.reduce((sum, part) => sum + part.length, 0);
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const part of chunks) {
        merged.set(part, offset);
        offset += part.length;
      }

      await runWrite(() => vfs.createFile(planned.targetPath, merged));
      current += 1;
      onProgress?.({ phase: 'unpacking', current, total: plan.plannedFiles.length });
    });
  });

  await streamArchiveInto(archiveFile, (chunk, final) => reader.push(chunk, final));
};

/**
 * Validates and imports a ZIP archive into a directory using a two-pass, bounded-memory strategy:
 * a metadata-only pass discovers and preflights every entry, then a second pass streams and
 * writes only the entries that passed preflight. Stops before any write if a conflict is found.
 * Directories (including explicit empty-directory markers) are created as needed.
 * @param vfs - Mounted virtual file system.
 * @param targetDirectoryPath - Absolute path to the directory to import into.
 * @param archiveFile - The user-selected ZIP archive file. Read twice: once to plan and preflight,
 * once to write, so the archive never needs to be held in memory as one flat decompressed map.
 * @param onProgress - Optional progress callback for the validate/conflict/unpack phases.
 * @returns Promise that resolves once every planned entry has been written.
 * @throws DomainError with code `RepositoryZipErrorCode.importConflict` when any target file or
 * directory conflicts with the archive, with `RepositoryZipErrorCode.importWritePartiallyFailed`
 * when a write fails after at least one earlier write already succeeded, or with a
 * `ZipArchiveErrorCode` when the archive itself is unsafe or damaged.
 */
export const importDirectoryZip = async (
  vfs: VirtualFileSystem,
  targetDirectoryPath: string,
  archiveFile: File,
  onProgress?: OnZipImportProgress,
): Promise<void> => {
  onProgress?.({ phase: 'validatingArchive' });

  const plan = await planZipImport(archiveFile, targetDirectoryPath);

  onProgress?.({ phase: 'checkingConflicts' });

  await preflightZipImportConflicts(vfs, plan);

  onProgress?.({ phase: 'unpacking' });

  await writeZipImportPlan(vfs, archiveFile, plan, onProgress);
};
