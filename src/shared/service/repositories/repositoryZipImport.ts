import { DomainError } from '@shared/lib/error';
import { FSNodeType, PathUtils, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import {
  createZipArchiveReader,
  resolveSafeArchiveEntryTarget,
  streamBlobChunks,
} from '@shared/lib/zipArchive';
import {
  RepositoryZipErrorCode,
  ZIP_IMPORT_LIMITS,
  type OnZipImportProgress,
  type ZipImportConflictPolicy,
  type ZipImportConflictReport,
  type ZipImportResult,
  type ZipImportSummary,
} from './repositoryZipContracts';

const CONFLICT_PATH_LIMIT = 20;

type PlannedEntry = {
  archivePath: string;
  relativePath: string;
  targetPath: string;
  isDirectory: boolean;
};

type ZipImportPlan = {
  files: PlannedEntry[];
  directories: PlannedEntry[];
};

type ExecutablePlan = {
  files: PlannedEntry[];
  directoriesToCreate: PlannedEntry[];
  reusedDirectories: number;
  skippedFiles: number;
};

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

const pathDepth = (relativePath: string) => relativePath.split('/').length;

const relativePathFromTarget = (rootPath: string, targetPath: string) =>
  targetPath.slice(rootPath === '/' ? 1 : rootPath.length + 1);

const isWithin = (ancestor: string, candidate: string) =>
  candidate === ancestor || candidate.startsWith(`${ancestor}/`);

/**
 * Fully validates and decompresses the archive before any target operation is attempted.
 * Decompressed bytes are deliberately discarded in this pass.
 */
const planZipImport = async (
  archiveFile: File,
  targetDirectoryPath: string,
): Promise<ZipImportPlan> => {
  const entries = new Map<string, PlannedEntry>();
  let entryCount = 0;
  let totalBytes = 0;
  let firstError: unknown;

  const reader = createZipArchiveReader((entry) => {
    if (firstError) return;
    try {
      entryCount += 1;
      if (entryCount > ZIP_IMPORT_LIMITS.maximumEntries) throw resourceLimitError('maximumEntries');

      const { targetPath, isDirectory } = resolveSafeArchiveEntryTarget(
        targetDirectoryPath,
        entry.rawPath,
      );
      const relativePath = relativePathFromTarget(targetDirectoryPath, targetPath);
      if (relativePath.length > ZIP_IMPORT_LIMITS.maximumRelativePathLength) {
        throw resourceLimitError('maximumRelativePathLength');
      }
      if (pathDepth(relativePath) > ZIP_IMPORT_LIMITS.maximumPathDepth) {
        throw resourceLimitError('maximumPathDepth');
      }
      if (entries.has(targetPath)) throw archiveConflictError();

      const planned: PlannedEntry = {
        archivePath: entry.rawPath,
        relativePath,
        targetPath,
        isDirectory,
      };
      entries.set(targetPath, planned);
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
  const files = all.filter((entry) => !entry.isDirectory);
  const explicitDirectories = all.filter((entry) => entry.isDirectory);
  const directories = new Map(explicitDirectories.map((entry) => [entry.targetPath, entry]));

  for (const file of files) {
    let current = PathUtils.dirname(file.targetPath);
    while (current !== targetDirectoryPath) {
      if (entries.get(current)?.isDirectory === false) throw archiveConflictError();
      directories.set(current, {
        archivePath: `${relativePathFromTarget(targetDirectoryPath, current)}/`,
        relativePath: relativePathFromTarget(targetDirectoryPath, current),
        targetPath: current,
        isDirectory: true,
      });
      current = PathUtils.dirname(current);
    }
  }
  for (const directory of directories.values()) {
    if (entries.get(directory.targetPath)?.isDirectory === false) throw archiveConflictError();
  }

  return {
    files,
    directories: [...directories.values()].sort(
      (a, b) => pathDepth(a.relativePath) - pathDepth(b.relativePath),
    ),
  };
};

const createConflictReport = (paths: string[]): ZipImportConflictReport => ({
  total: paths.length,
  paths: paths.slice(0, CONFLICT_PATH_LIMIT),
  truncated: paths.length > CONFLICT_PATH_LIMIT,
});

/** Inspects target state once and resolves the deterministic no-overwrite execution plan. */
const resolveExecutablePlan = async (
  vfs: VirtualFileSystem,
  plan: ZipImportPlan,
  policy: ZipImportConflictPolicy,
): Promise<ZipImportResult | ExecutablePlan> => {
  const existing = new Map<string, FSNodeType>();
  for (const entry of [...plan.directories, ...plan.files]) {
    // eslint-disable-next-line no-await-in-loop -- stable plan and bounded provider pressure
    if (await vfs.exists(entry.targetPath)) {
      // eslint-disable-next-line no-await-in-loop -- paired with existence check
      existing.set(entry.targetPath, (await vfs.stat(entry.targetPath)).type);
    }
  }

  const conflictPaths = [
    ...plan.directories.filter((entry) => existing.get(entry.targetPath) === FSNodeType.File),
    ...plan.files.filter((entry) => existing.has(entry.targetPath)),
  ].map((entry) => entry.relativePath);
  if (policy === 'abort' && conflictPaths.length > 0) {
    return { status: 'conflicts', report: createConflictReport(conflictPaths) };
  }

  const blockedDirectories = plan.directories
    .filter((entry) => existing.get(entry.targetPath) === FSNodeType.File)
    .map((entry) => entry.relativePath);
  const isBlocked = (entry: PlannedEntry) =>
    blockedDirectories.some((path) => isWithin(path, entry.relativePath));
  const files = plan.files.filter((entry) => !isBlocked(entry) && !existing.has(entry.targetPath));
  const directoriesToCreate = plan.directories.filter(
    (entry) => !isBlocked(entry) && !existing.has(entry.targetPath),
  );
  const reusedDirectories = plan.directories.filter(
    (entry) => !isBlocked(entry) && existing.get(entry.targetPath) === FSNodeType.Directory,
  ).length;

  return {
    files,
    directoriesToCreate,
    reusedDirectories,
    skippedFiles: plan.files.length - files.length,
  };
};

const partialFailure = (
  error: unknown,
  summary: ZipImportSummary,
  currentRelativePath: string | undefined,
) => {
  const failure = Object.assign(
    new DomainError(
      'The import stopped before completion. Some target files may already have changed.',
      { cause: error, code: RepositoryZipErrorCode.importWritePartiallyFailed },
    ),
    {
      importSummary: summary,
      ...(currentRelativePath === undefined ? {} : { currentRelativePath }),
      mutationMayHaveOccurred: true as const,
    },
  );
  return failure;
};

const executePlan = async (
  vfs: VirtualFileSystem,
  archiveFile: File,
  executable: ExecutablePlan,
  onProgress?: OnZipImportProgress,
): Promise<ZipImportSummary> => {
  const summary: ZipImportSummary = {
    importedFiles: 0,
    skippedFiles: executable.skippedFiles,
    createdDirectories: 0,
    reusedDirectories: executable.reusedDirectories,
  };
  let mutationMayHaveOccurred = false;
  let currentRelativePath: string | undefined;
  const attemptMutation = async (entry: PlannedEntry, operation: () => Promise<void>) => {
    currentRelativePath = entry.relativePath;
    mutationMayHaveOccurred = true;
    await operation();
  };
  const classify = (error: unknown): never => {
    if (mutationMayHaveOccurred) throw partialFailure(error, summary, currentRelativePath);
    throw error;
  };

  try {
    for (const directory of executable.directoriesToCreate) {
      // eslint-disable-next-line no-await-in-loop -- parent directories precede descendants
      await attemptMutation(directory, () => vfs.createDirectory(directory.targetPath));
      summary.createdDirectories += 1;
    }

    const filesByArchivePath = new Map(executable.files.map((entry) => [entry.archivePath, entry]));
    const reader = createZipArchiveReader((entry) => {
      const planned = filesByArchivePath.get(entry.rawPath);
      const chunks: Uint8Array[] = [];
      entry.read(async (decompressedChunk, final) => {
        if (planned) chunks.push(decompressedChunk);
        if (!final || !planned) return;
        const parts = chunks.map((chunk) => Uint8Array.from(chunk));
        await attemptMutation(planned, () => vfs.createFile(planned.targetPath, new Blob(parts)));
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
    return classify(error);
  }
};

/**
 * Imports arbitrary safe ZIP contents into a directory. Validation fully decompresses every entry
 * before any provider call. The operation is file-level only and performs no Mioframe validation.
 */
export const importDirectoryZip = async (
  vfs: VirtualFileSystem,
  targetDirectoryPath: string,
  archiveFile: File,
  onProgress?: OnZipImportProgress,
  conflictPolicy: ZipImportConflictPolicy = 'abort',
): Promise<ZipImportResult> => {
  onProgress?.({ phase: 'validatingArchive' });
  const plan = await planZipImport(archiveFile, targetDirectoryPath);
  onProgress?.({ phase: 'checkingConflicts' });
  const resolved = await resolveExecutablePlan(vfs, plan, conflictPolicy);
  if ('status' in resolved) return resolved;
  onProgress?.({ phase: 'unpacking', current: 0, total: resolved.files.length });
  return {
    status: 'completed',
    summary: await executePlan(vfs, archiveFile, resolved, onProgress),
  };
};
