import { DomainError } from '@shared/lib/error';
import { PathUtils, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { createZipArchiveReader, streamBlobChunks } from '@shared/lib/zipArchive';
import {
  RepositoryZipErrorCode,
  ZIP_IMPORT_LIMITS,
  type OnZipImportProgress,
  type ZipImportOptions,
  type ZipImportPartialFailureDetails,
  type ZipImportRecoveryContext,
  type ZipImportResult,
  type ZipImportSummary,
  type ZipImportUncertainEntry,
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
import { resolveZipImportRecovery } from './repositoryZipImportRecovery';

const resourceLimitError = (limit: keyof typeof ZIP_IMPORT_LIMITS) =>
  new DomainError('The archive exceeds an import safety limit. No files were written.', {
    cause: new Error(`ZIP import limit exceeded: ${limit}`),
    code: RepositoryZipErrorCode.importResourceLimitExceeded,
  });

const archiveConflictError = () =>
  new DomainError('The archive uses the same path inconsistently. No files were written.', {
    code: RepositoryZipErrorCode.importConflict,
  });

const invalidRecoveryContextError = () =>
  new DomainError('The saved ZIP recovery information is no longer valid.', {
    code: RepositoryZipErrorCode.importRecoveryContextInvalid,
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

const validateRecoveryContext = (
  plan: ZipImportPlan,
  recovery: ZipImportRecoveryContext | undefined,
) => {
  const uncertain = recovery?.uncertainEntry;
  if (!uncertain) return;
  const planned = [...plan.directories, ...plan.files].find(
    (entry) => entry.relativePath === uncertain.relativePath,
  );
  if (!planned || planned.kind !== uncertain.kind) throw invalidRecoveryContextError();
};

const partialFailure = (
  error: unknown,
  summary: ZipImportSummary,
  activeMutation: ZipImportUncertainEntry | undefined,
) =>
  Object.assign(
    new DomainError(
      'The import stopped before completion. A target entry may have changed and must be verified.',
      { cause: error, code: RepositoryZipErrorCode.importWritePartiallyFailed },
    ),
    {
      importSummary: summary,
      recoveryContext: activeMutation ? { uncertainEntry: activeMutation } : {},
      mutationMayHaveOccurred: true as const,
    } satisfies ZipImportPartialFailureDetails,
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
  verifiedFiles: number,
  onProgress?: OnZipImportProgress,
): Promise<ZipImportSummary> => {
  const summary: ZipImportSummary = {
    importedFiles: 0,
    verifiedFiles,
    skippedFiles: executable.skippedFiles,
    createdDirectories: 0,
    reusedDirectories: executable.reusedDirectories,
  };
  let successfulMutations = 0;
  let activeMutation: ZipImportUncertainEntry | undefined;
  const mutate = async (entry: PlannedZipEntry, operation: () => Promise<void>) => {
    activeMutation = { relativePath: entry.relativePath, kind: entry.kind };
    await operation();
    successfulMutations += 1;
    activeMutation = undefined;
  };
  try {
    for (const directory of executable.directoriesToCreate) {
      // eslint-disable-next-line no-await-in-loop -- parent directories precede descendants
      await mutate(directory, () => vfs.createDirectory(directory.targetPath));
      summary.createdDirectories += 1;
    }
    const filesByArchivePath = new Map(executable.files.map((entry) => [entry.archivePath, entry]));
    const reader = createZipArchiveReader((entry) => {
      const planned = filesByArchivePath.get(entry.rawPath);
      const parts: BlobPart[] = [];
      entry.read(async (chunk, final) => {
        if (planned) parts.push(blobPart(chunk));
        if (!final || !planned) return;
        await mutate(planned, () => vfs.createFile(planned.targetPath, new Blob(parts)));
        summary.importedFiles += 1;
        onProgress?.({
          phase: 'unpacking',
          current: summary.importedFiles,
          total: executable.files.length,
        });
      });
    });
    await streamArchiveInto(archiveFile, (chunk, final) => reader.push(chunk, final));
    return summary;
  } catch (error) {
    if (activeMutation || successfulMutations > 0)
      throw partialFailure(error, summary, activeMutation);
    throw error;
  }
};

/**
 * Imports arbitrary safe ZIP contents using complete validation, preflight, recovery, then writes.
 * @param vfs - Target virtual filesystem.
 * @param targetDirectoryPath - Absolute selected target directory.
 * @param archiveFile - User-selected archive, read once per required pass.
 * @param onProgress - Optional phase and entry-count callback.
 * @param options - Explicit ordinary-conflict and partial-recovery options.
 * @returns Expected import outcome after all required phases.
 */
export const importDirectoryZip = async (
  vfs: VirtualFileSystem,
  targetDirectoryPath: string,
  archiveFile: File,
  onProgress?: OnZipImportProgress,
  options: ZipImportOptions = {},
): Promise<ZipImportResult> => {
  onProgress?.({ phase: 'validatingArchive' });
  const plan = await planZipImport(archiveFile, targetDirectoryPath);
  validateRecoveryContext(plan, options.recovery);
  onProgress?.({ phase: 'checkingConflicts' });
  const resolved = await resolveZipImportExecutablePlan(
    vfs,
    plan,
    options.conflictPolicy ?? 'abort',
  );
  if ('status' in resolved) return resolved;
  const recovery = await resolveZipImportRecovery(
    vfs,
    archiveFile,
    plan,
    resolved,
    options.recovery,
  );
  if ('status' in recovery) return recovery;
  onProgress?.({ phase: 'unpacking', current: 0, total: recovery.executable.files.length });
  return {
    status: 'completed',
    summary: await executePlan(
      vfs,
      archiveFile,
      recovery.executable,
      recovery.verifiedFiles,
      onProgress,
    ),
  };
};
