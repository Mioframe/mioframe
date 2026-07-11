/* eslint-disable @typescript-eslint/consistent-type-assertions -- tests inspect structured partial-import error details. */
import { describe, expect, it, vi } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import {
  createZipArchiveWriter,
  packZipArchive,
  ZipArchiveErrorCode,
} from '@shared/lib/zipArchive';
import { RepositoryZipErrorCode } from './repositoryZipContracts';
import { importDirectoryZip } from './repositoryZipImport';

const createVfs = () => {
  const memoryFS = new MemoryFileSystem();
  const vfs = new VirtualFileSystem();
  vfs.mount('/', memoryFS);
  return vfs;
};

const toArchiveFile = (entries: Parameters<typeof packZipArchive>[0]) =>
  new File([packZipArchive(entries)], 'archive.zip', { type: 'application/zip' });

describe('importDirectoryZip', () => {
  it('writes files and creates nested directories, including empty-directory markers', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveFile = toArchiveFile({
      'root/file.txt': new TextEncoder().encode('hello'),
      'root/nested/deep.txt': new TextEncoder().encode('deep'),
      'root/empty/': new Uint8Array(0),
    });

    const onProgress = vi.fn();
    await importDirectoryZip(vfs, '/target', archiveFile, onProgress);

    await expect(vfs.readText('/target/root/file.txt')).resolves.toBe('hello');
    await expect(vfs.readText('/target/root/nested/deep.txt')).resolves.toBe('deep');
    await expect(vfs.exists('/target/root/empty')).resolves.toBe(true);
    expect(onProgress).toHaveBeenCalledWith({ phase: 'validatingArchive' });
    expect(onProgress).toHaveBeenCalledWith({ phase: 'checkingConflicts' });
    expect(onProgress).toHaveBeenCalledWith({ phase: 'unpacking', current: 0, total: 2 });
  });

  it('stops before writing anything when a target file already exists', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    await vfs.createDirectory('/target/root');
    await vfs.writeFile('/target/root/file.txt', 'already here');

    const archiveFile = toArchiveFile({
      'root/file.txt': new TextEncoder().encode('new content'),
      'root/other.txt': new TextEncoder().encode('other content'),
    });

    await expect(importDirectoryZip(vfs, '/target', archiveFile)).resolves.toMatchObject({
      status: 'conflicts',
      report: { total: 1, paths: ['root/file.txt'] },
    });
    await expect(vfs.readText('/target/root/file.txt')).resolves.toBe('already here');
    await expect(vfs.exists('/target/root/other.txt')).resolves.toBe(false);
  });

  it('stops before writing anything when a root-level target file already exists (contents-only archive layout)', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    await vfs.writeFile('/target/file.txt', 'already here');

    const archiveFile = toArchiveFile({
      'file.txt': new TextEncoder().encode('new content'),
      'other.txt': new TextEncoder().encode('other content'),
    });

    await expect(importDirectoryZip(vfs, '/target', archiveFile)).resolves.toMatchObject({
      status: 'conflicts',
      report: { total: 1, paths: ['file.txt'] },
    });
    await expect(vfs.readText('/target/file.txt')).resolves.toBe('already here');
    await expect(vfs.exists('/target/other.txt')).resolves.toBe(false);
  });

  it('stops before writing anything when a target file exists where the archive expects a directory', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    await vfs.writeFile('/target/root', 'this is a file, not a directory');

    const archiveFile = toArchiveFile({
      'root/nested/file.txt': new TextEncoder().encode('content'),
    });

    await expect(importDirectoryZip(vfs, '/target', archiveFile)).resolves.toMatchObject({
      status: 'conflicts',
      report: { total: 1, paths: ['root'] },
    });
    await expect(vfs.exists('/target/root/nested')).resolves.toBe(false);
  });

  it('rejects an archive that uses the same path for both a file and a directory', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveFile = toArchiveFile({
      'root/a': new TextEncoder().encode('file content'),
      'root/a/b.txt': new TextEncoder().encode('nested under a file'),
    });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importConflict });
    await expect(vfs.exists('/target/root')).resolves.toBe(false);
  });

  it('rejects an archive with duplicate entries for the same path', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    // packZipArchive can't express duplicate keys (it packs a JS object), so build this fixture
    // with the streaming writer directly, which allows writing the same entry path twice.
    const chunks: Uint8Array[] = [];
    const writer = createZipArchiveWriter((chunk) => {
      chunks.push(chunk);
    });
    await writer.writeFileEntry('root/a.txt', {
      // eslint-disable-next-line @typescript-eslint/require-await -- AsyncIterable contract requires async generator syntax even though this fixture yields synchronously
      async *[Symbol.asyncIterator]() {
        yield new TextEncoder().encode('first');
      },
    });
    await writer.writeFileEntry('root/a.txt', {
      // eslint-disable-next-line @typescript-eslint/require-await -- AsyncIterable contract requires async generator syntax even though this fixture yields synchronously
      async *[Symbol.asyncIterator]() {
        yield new TextEncoder().encode('second');
      },
    });
    await writer.end();

    const total = chunks.reduce((sum, part) => sum + part.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const part of chunks) {
      merged.set(part, offset);
      offset += part.length;
    }
    const archiveFile = new File([merged], 'archive.zip', { type: 'application/zip' });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importConflict });
    await expect(vfs.exists('/target/root/a.txt')).resolves.toBe(false);
  });

  it('rejects an archive containing an unsafe entry path before any write', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveFile = toArchiveFile({
      '../escape.txt': new TextEncoder().encode('should not be written'),
    });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.unsafeEntryPath });
  });

  it('rejects a damaged archive', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveFile = new File([new TextEncoder().encode('not a zip')], 'archive.zip', {
      type: 'application/zip',
    });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.archiveDamaged });
  });

  it('classifies a write failure after an earlier write succeeded as a partial import', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveFile = toArchiveFile({
      'root/a.txt': new TextEncoder().encode('a content'),
      'root/b.txt': new TextEncoder().encode('b content'),
    });

    const originalCreateFile = vfs.createFile.bind(vfs);
    let callCount = 0;
    vi.spyOn(vfs, 'createFile').mockImplementation(async (path, content) => {
      callCount += 1;
      if (callCount === 2) {
        throw new Error('simulated storage failure');
      }
      return originalCreateFile(path, content);
    });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
  });

  it('reclassifies a write-access-recovery error as a partial import once an earlier write succeeded', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveFile = toArchiveFile({
      'root/a.txt': new TextEncoder().encode('a content'),
      'root/b.txt': new TextEncoder().encode('b content'),
    });

    const accessError = new WebFileSystemAccessRequiredError({
      mode: 'readwrite',
      spaceName: 'Test space',
    });

    const originalCreateFile = vfs.createFile.bind(vfs);
    let callCount = 0;
    vi.spyOn(vfs, 'createFile').mockImplementation(async (path, content) => {
      callCount += 1;
      if (callCount === 2) {
        throw accessError;
      }
      return originalCreateFile(path, content);
    });

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    // The first write already succeeded, so this must not surface as a plain recoverable
    // write-access error: retrying the whole import would then hit a conflict on the file that
    // already exists from this attempt, instead of telling the user the import may be partial.
    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
    if (!(caught instanceof DomainError)) throw new Error('expected DomainError');
    expect(caught.cause).toBe(accessError);
    await expect(vfs.readText('/target/root/a.txt')).resolves.toBe('a content');
  });

  it('classifies a write-access-recovery error as partial when it happens during the very first actual mutation, even though the non-mutating preflight already succeeded', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    // A top-level entry needs no ancestor directory creation, so the file write is the very
    // first VFS mutation attempted — nothing has been written yet when it fails. The preflight
    // write-access check still ran and succeeded first (MemoryFileSystem has no permission model
    // to check), so this is permission loss during the mutation itself, not at preflight.
    const archiveFile = toArchiveFile({
      'a.txt': new TextEncoder().encode('a content'),
    });

    const accessError = new WebFileSystemAccessRequiredError({
      mode: 'readwrite',
      spaceName: 'Test space',
    });

    vi.spyOn(vfs, 'createFile').mockRejectedValue(accessError);

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
    expect((caught as DomainError).cause).toBe(accessError);
  });

  it('surfaces a pre-write conflict, not a partial-import error, when retried after a partial write', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    const archiveFile = toArchiveFile({
      'root/a.txt': new TextEncoder().encode('a content'),
      'root/b.txt': new TextEncoder().encode('b content'),
    });

    const originalCreateFile = vfs.createFile.bind(vfs);
    let callCount = 0;
    vi.spyOn(vfs, 'createFile').mockImplementation(async (path, content) => {
      callCount += 1;
      if (callCount === 2) {
        throw new Error('simulated storage failure');
      }
      return originalCreateFile(path, content);
    });

    let firstAttemptError: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      firstAttemptError = error;
    }

    expect(firstAttemptError).toMatchObject({
      code: RepositoryZipErrorCode.importWritePartiallyFailed,
    });

    // Simulates a caller retrying the same import without knowing about the partial write above
    // (e.g. after mistaking `importWritePartiallyFailed` for a recoverable access error). The
    // retry must stop at preflight with a conflict, not silently overwrite or continue the
    // partial write.
    await expect(importDirectoryZip(vfs, '/target', archiveFile)).resolves.toMatchObject({
      status: 'conflicts',
      report: { total: 1 },
    });
  });

  it('classifies a write failure as partial even when it is the very first write attempted', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');

    // A top-level entry needs no ancestor directory creation, so the file write is the very
    // first VFS mutation attempted. The write may have partially taken effect at the provider
    // before rejecting, so this is still reported as a terminal partial import, not a plain error.
    const archiveFile = toArchiveFile({
      'a.txt': new TextEncoder().encode('a content'),
    });

    vi.spyOn(vfs, 'createFile').mockRejectedValue(new Error('simulated storage failure'));

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
  });

  it('preserves the original write-access-recovery error when only an already-existing ancestor directory preceded it', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    // The archive's only ancestor directory already exists, so `createDirectoryIfMissing` is a
    // no-op and must not count as a mutation before the first (and only) file write.
    await vfs.createDirectory('/target/root');

    const archiveFile = toArchiveFile({
      'root/a.txt': new TextEncoder().encode('a content'),
    });

    const accessError = new WebFileSystemAccessRequiredError({
      mode: 'readwrite',
      spaceName: 'Test space',
    });

    vi.spyOn(vfs, 'createFile').mockRejectedValue(accessError);

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
    expect((caught as DomainError).cause).toBe(accessError);
  });

  it('preserves the original storage/VFS error when only an already-existing ancestor directory preceded it', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    await vfs.createDirectory('/target/root');

    const archiveFile = toArchiveFile({
      'root/a.txt': new TextEncoder().encode('a content'),
    });

    const storageError = new Error('simulated storage failure');
    vi.spyOn(vfs, 'createFile').mockRejectedValue(storageError);

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
    expect((caught as DomainError).cause).toBe(storageError);
  });

  it('classifies a write failure as partial when only a real new-directory mutation preceded it', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    // `/target/root` does not exist yet, so creating it is a real mutation, unlike the two tests
    // above where the ancestor directory already existed.

    const archiveFile = toArchiveFile({
      'root/a.txt': new TextEncoder().encode('a content'),
    });

    vi.spyOn(vfs, 'createFile').mockRejectedValue(new Error('simulated storage failure'));

    let caught: unknown;
    try {
      await importDirectoryZip(vfs, '/target', archiveFile);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.importWritePartiallyFailed });
    await expect(vfs.exists('/target/root')).resolves.toBe(true);
  });

  it('reads one directory snapshot for many sibling archive entries', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    const readDirectory = vi.spyOn(vfs, 'readDirectory');
    const archiveFile = toArchiveFile({
      'a.txt': new Uint8Array([1]),
      'b.txt': new Uint8Array([2]),
      'c.txt': new Uint8Array([3]),
    });

    await importDirectoryZip(vfs, '/target', archiveFile);

    expect(readDirectory.mock.calls.filter(([path]) => path === '/target')).toHaveLength(1);
  });

  it('resolves a large flat archive with bounded, non-quadratic directory reads', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    const readDirectory = vi.spyOn(vfs, 'readDirectory');

    const entryCount = 1000;
    const entries: Record<string, Uint8Array<ArrayBuffer>> = {};
    for (let index = 0; index < entryCount; index += 1) {
      entries[`dir-${index}/file.txt`] = new TextEncoder().encode('x');
    }
    const archiveFile = toArchiveFile(entries);

    const result = await importDirectoryZip(vfs, '/target', archiveFile);

    expect(result).toMatchObject({
      status: 'completed',
      summary: { importedFiles: entryCount, createdDirectories: entryCount },
    });
    // A per-entry scan over every previously-discovered directory would read the target directory
    // once per archive entry (O(entryCount) growing calls, quadratic overall work). Indexed
    // ancestor lookups mean every one of these 1000 top-level directories shares one cached
    // snapshot of their common parent, so the target directory is read exactly once regardless of
    // archive size.
    expect(readDirectory.mock.calls.filter(([path]) => path === '/target')).toHaveLength(1);
    expect(readDirectory).toHaveBeenCalledTimes(1);
  });

  it('excludes an entire blocked subtree without snapshotting any of its descendants', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/target');
    await vfs.writeFile('/target/blocked', 'this is a file, not a directory');

    const fileCount = 500;
    const entries: Record<string, Uint8Array<ArrayBuffer>> = {};
    for (let index = 0; index < fileCount; index += 1) {
      entries[`blocked/level-${index}/deep-${index}/file.txt`] = new TextEncoder().encode('x');
    }
    const archiveFile = toArchiveFile(entries);
    const readDirectory = vi.spyOn(vfs, 'readDirectory');

    const result = await importDirectoryZip(vfs, '/target', archiveFile, undefined, {
      conflictPolicy: 'skipExisting',
    });

    expect(result).toMatchObject({
      status: 'completed',
      summary: { importedFiles: 0, skippedFiles: fileCount },
    });
    // Only the target root is ever read; nothing under the blocked "blocked" entry is snapshotted,
    // since the whole subtree is excluded by one ancestor-set lookup instead of a directory read.
    expect(readDirectory).toHaveBeenCalledTimes(1);
  });

  describe('progress delivery', () => {
    it('awaits an async onProgress callback before continuing to the next entry', async () => {
      const vfs = createVfs();
      await vfs.createDirectory('/target');

      const archiveFile = toArchiveFile({
        'a.txt': new TextEncoder().encode('a'),
        'b.txt': new TextEncoder().encode('b'),
      });

      let inFlight = 0;
      let maxInFlight = 0;
      const onProgress = vi.fn(async () => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        await Promise.resolve();
        inFlight -= 1;
      });

      await importDirectoryZip(vfs, '/target', archiveFile, onProgress);

      expect(maxInFlight).toBe(1);
    });

    it('coalesces intermediate unpacking progress and always emits a non-boundary final count', async () => {
      const vfs = createVfs();
      await vfs.createDirectory('/target');

      const entryCount = 130;
      const entries: Record<string, Uint8Array<ArrayBuffer>> = {};
      for (let index = 0; index < entryCount; index += 1) {
        entries[`file-${index}.txt`] = new TextEncoder().encode('x');
      }
      const archiveFile = toArchiveFile(entries);

      const onProgress = vi.fn();
      await importDirectoryZip(vfs, '/target', archiveFile, onProgress);

      const unpackingCounts = onProgress.mock.calls
        .map(([progress]) => progress as { phase: string; current?: number; total?: number })
        .filter((progress) => progress.phase === 'unpacking')
        .map((progress) => progress.current);

      expect(unpackingCounts).toEqual([0, 50, 100, entryCount]);
    });
  });

  describe('write-access preflight', () => {
    const createVfsWithWriteAccessCheck = (checkWriteAccess: (path: string) => Promise<void>) => {
      const memoryFS = new MemoryFileSystem();
      const vfs = new VirtualFileSystem();
      vfs.mount('/', {
        stat: (path) => memoryFS.stat(path),
        readFile: (path) => memoryFS.readFile(path),
        writeFile: (path, content, options) => memoryFS.writeFile(path, content, options),
        readDirectory: (path) => memoryFS.readDirectory(path),
        createDirectory: (path) => memoryFS.createDirectory(path),
        delete: (path, recursive) => memoryFS.delete(path, recursive),
        move: (oldPath, newPath) => memoryFS.move(oldPath, newPath),
        checkWriteAccess,
      });
      return vfs;
    };

    it('surfaces the preflight write-access-recovery error before any mutation is attempted', async () => {
      const accessError = new WebFileSystemAccessRequiredError({
        mode: 'readwrite',
        spaceName: 'Test space',
      });
      const checkWriteAccess = vi.fn().mockRejectedValue(accessError);
      const vfs = createVfsWithWriteAccessCheck(checkWriteAccess);
      await vfs.createDirectory('/target');

      const archiveFile = toArchiveFile({
        'a.txt': new TextEncoder().encode('a content'),
      });

      const createFile = vi.spyOn(vfs, 'createFile');

      let caught: unknown;
      try {
        await importDirectoryZip(vfs, '/target', archiveFile);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBe(accessError);
      expect(createFile).not.toHaveBeenCalled();
      await expect(vfs.exists('/target/a.txt')).resolves.toBe(false);
    });

    it('does not run the write-access preflight when the executable plan is fully skipped', async () => {
      const checkWriteAccess = vi.fn().mockResolvedValue(undefined);
      const vfs = createVfsWithWriteAccessCheck(checkWriteAccess);
      await vfs.createDirectory('/target');
      await vfs.createDirectory('/target/root');
      await vfs.writeFile('/target/root/file.txt', 'already here');

      const archiveFile = toArchiveFile({
        'root/file.txt': new TextEncoder().encode('new content'),
      });

      await importDirectoryZip(vfs, '/target', archiveFile, undefined, {
        conflictPolicy: 'skipExisting',
      });

      expect(checkWriteAccess).not.toHaveBeenCalled();
    });

    it('does not run the write-access preflight for an archive with no entries', async () => {
      const checkWriteAccess = vi.fn().mockResolvedValue(undefined);
      const vfs = createVfsWithWriteAccessCheck(checkWriteAccess);
      await vfs.createDirectory('/target');

      const archiveFile = toArchiveFile({});

      await importDirectoryZip(vfs, '/target', archiveFile);

      expect(checkWriteAccess).not.toHaveBeenCalled();
    });

    it('runs the write-access preflight once for the target directory before writing when the plan has mutations', async () => {
      const checkWriteAccess = vi.fn().mockResolvedValue(undefined);
      const vfs = createVfsWithWriteAccessCheck(checkWriteAccess);
      await vfs.createDirectory('/target');

      const archiveFile = toArchiveFile({
        'a.txt': new TextEncoder().encode('a content'),
      });

      await importDirectoryZip(vfs, '/target', archiveFile);

      expect(checkWriteAccess).toHaveBeenCalledTimes(1);
      expect(checkWriteAccess).toHaveBeenCalledWith('/target');
    });

    it('runs the write-access preflight when the plan only creates directories', async () => {
      const checkWriteAccess = vi.fn().mockResolvedValue(undefined);
      const vfs = createVfsWithWriteAccessCheck(checkWriteAccess);
      await vfs.createDirectory('/target');

      const archiveFile = toArchiveFile({
        'empty/': new Uint8Array(0),
      });

      await importDirectoryZip(vfs, '/target', archiveFile);

      expect(checkWriteAccess).toHaveBeenCalledTimes(1);
    });
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions -- partial-error inspection ends */
