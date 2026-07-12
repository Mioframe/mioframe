import { DomainError } from '@shared/lib/error';
import { PathUtils, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { createZipArchiveReader, streamBlobChunks } from '@shared/lib/zipArchive';
import {
  RepositoryZipErrorCode,
  ZIP_IMPORT_LIMITS,
  type OnZipImportProgress,
  type ZipImportPartialFailureDetails,
  type ZipImportResult,
  type ZipImportSummary,
} from './repositoryZipContracts';
import {
  createPlannedEntry,
  pathDepth,
  relativePathFromTarget,
  resolveZipImportExecutablePlan,
  type PlannedZipEntry,
  type ZipImportExecutablePlan,
  type ZipImportPlan,
} from './repositoryZipImportPlanning';
import { isZipProgressCountDue } from './repositoryZipProgress';

const resourceLimitError = (limit: keyof typeof ZIP_IMPORT_LIMITS) =>
  new DomainError('The archive exceeds an import safety limit. No files were written.', {
    cause: new Error(`ZIP import limit exceeded: ${limit}`),
    code: RepositoryZipErrorCode.importResourceLimitExceeded,
  });

const archiveConflictError = () =>
  new DomainError('The archive uses the same path inconsistently. No files were written.', {
    code: RepositoryZipErrorCode.importConflict,
  });

const streamArchiveInto = async (
  archiveFile: File,
  push: (chunk: Uint8Array, final: boolean) => Promise<void>,
): Promise<void> => {
  let buffered: Uint8Array | undefined;
  for await (const chunk of streamBlobChunks(archiveFile)) {
    if (buffered) await push(buffered, false);
    buffered = chunk;
  }
  await push(buffered ?? new Uint8Array(0), true);
};

const planZipImport = async (
  archiveFile: File,
  targetDirectoryPath: string,
): Promise<ZipImportPlan> => {
  const entries = new Map<string, PlannedZipEntry>();
  let entryCount = 0;
  let totalBytes = 0;
  let firstError: unknown;
  const reader = createZipArchiveReader((entry) => {
    if (firstError) return;
    try {
      entryCount += 1;
      if (entryCount > ZIP_IMPORT_LIMITS.maximumEntries) throw resourceLimitError('maximumEntries');
      const planned = createPlannedEntry(targetDirectoryPath, entry.rawPath);
      if (planned.relativePath.length > ZIP_IMPORT_LIMITS.maximumRelativePathLength)
        throw resourceLimitError('maximumRelativePathLength');
      if (pathDepth(planned.relativePath) > ZIP_IMPORT_LIMITS.maximumPathDepth)
        throw resourceLimitError('maximumPathDepth');
      if (entries.has(planned.targetPath)) throw archiveConflictError();
      entries.set(planned.targetPath, planned);
      let fileBytes = 0;
      entry.read((chunk) => {
        fileBytes += chunk.byteLength;
        totalBytes += chunk.byteLength;
        if (fileBytes > ZIP_IMPORT_LIMITS.maximumFileBytes)
          throw resourceLimitError('maximumFileBytes');
        if (totalBytes > ZIP_IMPORT_LIMITS.maximumTotalBytes)
          throw resourceLimitError('maximumTotalBytes');
      });
    } catch (error) {
      firstError = error;
    }
  });
  await streamArchiveInto(archiveFile, (chunk, final) => reader.push(chunk, final));
  if (firstError instanceof Error) throw firstError;

  const all = [...entries.values()];
  const files = all.filter((entry) => entry.kind === 'file');
  const directories = new Map(
    all.filter((entry) => entry.kind === 'directory').map((entry) => [entry.targetPath, entry]),
  );
  for (const file of files) {
    let current = PathUtils.dirname(file.targetPath);
    while (current !== targetDirectoryPath) {
      if (entries.get(current)?.kind === 'file') throw archiveConflictError();
      directories.set(current, {
        archivePath: `${relativePathFromTarget(targetDirectoryPath, current)}/`,
        relativePath: relativePathFromTarget(targetDirectoryPath, current),
        targetPath: current,
        kind: 'directory',
      });
      current = PathUtils.dirname(current);
    }
  }
  return {
    files,
    directories: [...directories.values()].sort(
      (left, right) => pathDepth(left.relativePath) - pathDepth(right.relativePath),
    ),
  };
};

const partialFailure = (error: unknown, summary: ZipImportSummary) =>
  Object.assign(
    new DomainError(
      'The import stopped before completion. The target directory may contain a partial import; ' +
        'import into an empty directory to retry cleanly.',
      { cause: error, code: RepositoryZipErrorCode.importWritePartiallyFailed },
    ),
    { importSummary: summary } satisfies ZipImportPartialFailureDetails,
  );

const blobPart = (chunk: Uint8Array): BlobPart => {
  if (chunk.buffer instanceof ArrayBuffer) {
    return chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength
      ? chunk.buffer
      : chunk.buffer.slice(chunk.byteOffset, chunk.byteOffset + chunk.byteLength);
  }
  return chunk.slice().buffer;
};

const executePlan = async (
  vfs: VirtualFileSystem,
  archiveFile: File,
  executable: ZipImportExecutablePlan,
  onProgress?: OnZipImportProgress,
): Promise<ZipImportSummary> => {
  const summary: ZipImportSummary = {
    importedFiles: 0,
    createdDirectories: 0,
    reusedDirectories: executable.reusedDirectories,
  };
  let mutationPhaseStarted = false;
  const mutate = async (operation: () => Promise<void>) => {
    mutationPhaseStarted = true;
    await operation();
  };
  try {
    for (const directory of executable.directoriesToCreate) {
      // eslint-disable-next-line no-await-in-loop -- parent directories precede descendants
      await mutate(() => vfs.createDirectory(directory.targetPath));
      summary.createdDirectories += 1;
    }
    const filesByArchivePath = new Map(executable.files.map((entry) => [entry.archivePath, entry]));
    const total = executable.files.length;
    const reader = createZipArchiveReader((entry) => {
      const planned = filesByArchivePath.get(entry.rawPath);
      const parts: BlobPart[] = [];
      entry.read(async (chunk, final) => {
        if (planned) parts.push(blobPart(chunk));
        if (!final || !planned) return;
        await mutate(() => vfs.createFile(planned.targetPath, new Blob(parts)));
        summary.importedFiles += 1;
        if (isZipProgressCountDue(summary.importedFiles, total)) {
          await onProgress?.({ phase: 'unpacking', current: summary.importedFiles, total });
        }
      });
    });
    await streamArchiveInto(archiveFile, (chunk, final) => reader.push(chunk, final));
    if (!isZipProgressCountDue(summary.importedFiles, total)) {
      await onProgress?.({ phase: 'unpacking', current: summary.importedFiles, total });
    }
    return summary;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- mutationPhaseStarted is reassigned inside the mutate() closure, which type narrowing can't see across this catch boundary
    if (mutationPhaseStarted) throw partialFailure(error, summary);
    throw error;
  }
};

/**
 * Imports arbitrary safe ZIP contents using complete validation, preflight, then writes. Never
 * overwrites an existing file or directory entry; any conflicting archive entry aborts the whole
 * import before any mutation. Before the mutation phase starts (the first `createDirectory` or
 * `createFile` call), any failure propagates as the original error. Once the mutation phase has
 * started, any failure — including one on the very first mutation — stops the import immediately
 * and reports a terminal partial result; it is not resumed, retried, or rolled back automatically.
 * @param vfs - Target virtual filesystem.
 * @param targetDirectoryPath - Absolute selected target directory.
 * @param archiveFile - User-selected archive, read once per required pass.
 * @param onProgress - Optional phase and entry-count callback.
 * @returns Expected import outcome after all required phases.
 */
export const importDirectoryZip = async (
  vfs: VirtualFileSystem,
  targetDirectoryPath: string,
  archiveFile: File,
  onProgress?: OnZipImportProgress,
): Promise<ZipImportResult> => {
  await onProgress?.({ phase: 'validatingArchive' });
  const plan = await planZipImport(archiveFile, targetDirectoryPath);
  await onProgress?.({ phase: 'checkingConflicts' });
  const resolved = await resolveZipImportExecutablePlan(vfs, plan);
  if ('status' in resolved) return resolved;
  await onProgress?.({ phase: 'unpacking', current: 0, total: resolved.files.length });
  return {
    status: 'completed',
    summary: await executePlan(vfs, archiveFile, resolved, onProgress),
  };
};
