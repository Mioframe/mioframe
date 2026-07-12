import { FSNodeType, PathUtils, type VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { resolveSafeArchiveEntryTarget } from '@shared/lib/zipArchive';
import type { ZipImportConflictReport, ZipImportResult } from './repositoryZipContracts';

const CONFLICT_PATH_LIMIT = 20;

/** One validated archive entry mapped to its safe target. */
export type PlannedZipEntry = {
  /** Raw archive lookup path. */
  archivePath: string;
  /** Safe user-display path relative to the target. */
  relativePath: string;
  /** Absolute VFS target path. */
  targetPath: string;
  /** Planned filesystem node kind. */
  kind: 'file' | 'directory';
};

/** Complete validated archive plan. */
export type ZipImportPlan = {
  /** Planned file entries. */
  files: PlannedZipEntry[];
  /** Explicit and implied directories in depth order. */
  directories: PlannedZipEntry[];
};

/** No-overwrite mutations and preflight counts ready for execution. */
export type ZipImportExecutablePlan = {
  /** Files absent at preflight and eligible for creation. */
  files: PlannedZipEntry[];
  /** Directories absent at preflight and eligible for creation. */
  directoriesToCreate: PlannedZipEntry[];
  /** Existing directories safely reused. */
  reusedDirectories: number;
};

/**
 * Returns a target path relative to the selected root.
 * @param rootPath - Absolute selected import root.
 * @param targetPath - Absolute child target.
 * @returns Safe path relative to the root.
 */
export const relativePathFromTarget = (rootPath: string, targetPath: string) =>
  targetPath.slice(rootPath === '/' ? 1 : rootPath.length + 1);

/**
 * Returns the number of segments in a safe relative path.
 * @param relativePath - Safe relative path.
 * @returns Segment depth.
 */
export const pathDepth = (relativePath: string) => relativePath.split('/').length;

/**
 * Tests whether any ancestor of a path is present in a set, walking up one parent at a time.
 * Bounded by the path's own depth instead of the number of entries in `set`.
 * @param set - Candidate ancestor paths.
 * @param path - Path whose ancestors are checked, inclusive of `path` itself.
 * @returns Whether `path` or one of its ancestors is present in `set`.
 */
const hasAncestorIn = (set: ReadonlySet<string>, path: string): boolean => {
  let current: string | undefined = path;
  while (current !== undefined) {
    if (set.has(current)) return true;
    const parent = PathUtils.dirname(current);
    current = parent === current ? undefined : parent;
  }
  return false;
};

/**
 * Creates a safe planned entry from one raw archive path.
 * @param targetDirectoryPath - Absolute selected target directory.
 * @param archivePath - Raw archive entry path.
 * @returns Validated safe planned entry.
 */
export const createPlannedEntry = (
  targetDirectoryPath: string,
  archivePath: string,
): PlannedZipEntry => {
  const { targetPath, isDirectory } = resolveSafeArchiveEntryTarget(
    targetDirectoryPath,
    archivePath,
  );
  return {
    archivePath,
    relativePath: relativePathFromTarget(targetDirectoryPath, targetPath),
    targetPath,
    kind: isDirectory ? 'directory' : 'file',
  };
};

const createConflictReport = (paths: string[]): ZipImportConflictReport => ({
  total: paths.length,
  paths: paths.slice(0, CONFLICT_PATH_LIMIT),
  truncated: paths.length > CONFLICT_PATH_LIMIT,
});

/**
 * Resolves target state with one cached read per existing parent directory. Any conflicting
 * archive entry — an existing file at an archive file path, an existing file where the archive
 * requires a directory, or an existing directory where the archive requires a file — aborts the
 * whole import before any mutation; existing directories that match the archive's directory
 * entries are reused rather than treated as conflicts.
 * @param vfs - Target virtual filesystem.
 * @param plan - Complete validated archive plan.
 * @returns The bounded conflict report if any conflict exists, otherwise the complete mutation plan.
 */
export const resolveZipImportExecutablePlan = async (
  vfs: VirtualFileSystem,
  plan: ZipImportPlan,
): Promise<ZipImportResult | ZipImportExecutablePlan> => {
  const snapshots = new Map<string, Map<string, FSNodeType>>();
  const existingTypes = new Map<string, FSNodeType>();
  const plannedNewDirectories = new Set<string>();
  const blockedDirectories = new Set<string>();

  const snapshot = async (path: string) => {
    const cached = snapshots.get(path);
    if (cached) return cached;
    const entries = new Map(
      (await vfs.readDirectory(path)).map(([name, stat]) => [name, stat.type]),
    );
    snapshots.set(path, entries);
    return entries;
  };

  const classify = async (entry: PlannedZipEntry): Promise<FSNodeType | undefined> => {
    const parent = PathUtils.dirname(entry.targetPath);
    if (
      hasAncestorIn(plannedNewDirectories, entry.targetPath) ||
      hasAncestorIn(blockedDirectories, entry.targetPath)
    ) {
      return undefined;
    }
    const type = (await snapshot(parent)).get(PathUtils.basename(entry.targetPath));
    if (type !== undefined) existingTypes.set(entry.targetPath, type);
    return type;
  };

  for (const directory of plan.directories) {
    // eslint-disable-next-line no-await-in-loop -- child lookup depends on parent depth classification
    const type = await classify(directory);
    if (type === undefined) plannedNewDirectories.add(directory.targetPath);
    else if (type === FSNodeType.File) blockedDirectories.add(directory.targetPath);
  }
  for (const file of plan.files) {
    // eslint-disable-next-line no-await-in-loop -- existing parent snapshots are reused by siblings
    await classify(file);
  }

  const conflictPaths = [
    ...plan.directories.filter((entry) => existingTypes.get(entry.targetPath) === FSNodeType.File),
    ...plan.files.filter((entry) => existingTypes.has(entry.targetPath)),
  ].map((entry) => entry.relativePath);
  if (conflictPaths.length > 0) {
    return { status: 'conflicts', report: createConflictReport(conflictPaths) };
  }

  // No conflict exists at this point, so every existing type recorded above is a reusable
  // directory: a conflicting file-vs-file, file-vs-directory, or directory-vs-file entry would
  // already have triggered the early return above.
  const directoriesToCreate = plan.directories.filter(
    (entry) => !existingTypes.has(entry.targetPath),
  );

  return {
    files: plan.files,
    directoriesToCreate,
    reusedDirectories: plan.directories.length - directoriesToCreate.length,
  };
};
