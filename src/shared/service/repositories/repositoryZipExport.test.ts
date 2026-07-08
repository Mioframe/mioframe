import { describe, expect, it, vi } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import { DomainError } from '@shared/lib/error';
import { FSNodeType, VirtualFileSystem } from '@shared/lib/virtualFileSystem';
import { MemoryFileSystem } from '@shared/lib/virtualFileSystem/MemoryFileSystem';
import { unpackZipArchive } from '@shared/lib/zipArchive';
import { RepositoryZipErrorCode } from './repositoryZipContracts';
import type { RepositoryDirectoryEntry } from './repositoryContracts';

const getDocumentStorageFilesMock = vi.hoisted(() =>
  vi.fn<() => Promise<RepositoryDirectoryEntry[]>>(),
);

vi.mock('./repositoryStorageFiles', () => ({
  getDocumentStorageFiles: getDocumentStorageFilesMock,
}));

const { exportDirectoryZip, exportDocumentZip } = await import('./repositoryZipExport');

const createVfs = () => {
  const memoryFS = new MemoryFileSystem();
  const vfs = new VirtualFileSystem();
  vfs.mount('/', memoryFS);
  return vfs;
};

/**
 * Collects every chunk delivered to an `onChunk` callback into one archive byte array.
 * @returns An `onChunk` callback plus a `merge` function that concatenates the collected chunks.
 */
const collectChunks = () => {
  const chunks: Uint8Array[] = [];
  const onChunk = (chunk: Uint8Array) => {
    chunks.push(chunk);
  };
  const merge = () => {
    const total = chunks.reduce((sum, part) => sum + part.length, 0);
    const merged = new Uint8Array(total);
    let offset = 0;
    for (const part of chunks) {
      merged.set(part, offset);
      offset += part.length;
    }
    return merged;
  };
  return { onChunk, merge };
};

describe('exportDirectoryZip', () => {
  it('packs raw directory contents, including internal-looking files, directly at archive root', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/repo');
    await vfs.writeFile('/repo/file.txt', 'hello');
    await vfs.writeFile('/repo/.mioframe-marker', 'marker');
    await vfs.createDirectory('/repo/empty');

    const flushRepositoryPath = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();
    const { onChunk, merge } = collectChunks();

    await exportDirectoryZip(vfs, flushRepositoryPath, '/repo', onChunk, onProgress);
    const unpacked = unpackZipArchive(merge());

    expect(new TextDecoder().decode(unpacked['file.txt'])).toBe('hello');
    expect(new TextDecoder().decode(unpacked['.mioframe-marker'])).toBe('marker');
    expect(Object.keys(unpacked)).toContain('empty/');
    expect(Object.keys(unpacked).some((entryPath) => entryPath.startsWith('repo/'))).toBe(false);
    expect(flushRepositoryPath).toHaveBeenCalledWith('/repo');
    expect(onProgress).toHaveBeenCalledWith({ phase: 'preparing' });
    expect(onProgress).toHaveBeenCalledWith({ phase: 'packing' });
  });

  it('recurses into nested directories, preserving relative paths, and flushes each one before reading it', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/repo');
    await vfs.createDirectory('/repo/nested');
    await vfs.writeFile('/repo/nested/deep.txt', 'deep content');

    const flushRepositoryPath = vi.fn().mockResolvedValue(undefined);
    const { onChunk, merge } = collectChunks();

    await exportDirectoryZip(vfs, flushRepositoryPath, '/repo', onChunk);
    const unpacked = unpackZipArchive(merge());

    expect(new TextDecoder().decode(unpacked['nested/deep.txt'])).toBe('deep content');
    expect(flushRepositoryPath).toHaveBeenCalledWith('/repo');
    expect(flushRepositoryPath).toHaveBeenCalledWith('/repo/nested');
  });

  it('produces a valid, empty ZIP archive when the selected directory is empty', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/repo');
    const { onChunk, merge } = collectChunks();

    await exportDirectoryZip(vfs, vi.fn().mockResolvedValue(undefined), '/repo', onChunk);
    const unpacked = unpackZipArchive(merge());

    expect(Object.keys(unpacked)).toEqual([]);
  });

  it('never holds more than one produced chunk before delivery resolves', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/repo');
    await vfs.writeFile('/repo/large.txt', 'x'.repeat(200_000));

    let inFlight = 0;
    let maxInFlight = 0;
    const onChunk = async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await Promise.resolve();
      inFlight -= 1;
    };

    await exportDirectoryZip(vfs, vi.fn().mockResolvedValue(undefined), '/repo', onChunk);

    expect(maxInFlight).toBe(1);
  });
});

describe('exportDocumentZip', () => {
  const documentId = new Repo().create({}).documentId;

  it('packs the document storage files directly at archive root, without a documentId wrapper, and flushes just that document', async () => {
    const vfs = createVfs();
    await vfs.createDirectory('/repo');
    await vfs.writeFile('/repo/storage-file-1', 'chunk one');
    await vfs.writeFile('/repo/storage-file-2', 'chunk two');
    getDocumentStorageFilesMock.mockResolvedValue([
      ['storage-file-1', { type: FSNodeType.File }],
      ['storage-file-2', { type: FSNodeType.File }],
    ]);

    const flushRepositoryPath = vi.fn().mockResolvedValue(undefined);
    const onProgress = vi.fn();
    const { onChunk, merge } = collectChunks();

    await exportDocumentZip(vfs, flushRepositoryPath, '/repo', documentId, onChunk, onProgress);
    const unpacked = unpackZipArchive(merge());

    expect(new TextDecoder().decode(unpacked['storage-file-1'])).toBe('chunk one');
    expect(new TextDecoder().decode(unpacked['storage-file-2'])).toBe('chunk two');
    expect(Object.keys(unpacked).some((entryPath) => entryPath.startsWith(`${documentId}/`))).toBe(
      false,
    );
    expect(flushRepositoryPath).toHaveBeenCalledWith('/repo', [documentId]);
    expect(onProgress).toHaveBeenCalledWith({ phase: 'reading', current: 1, total: 2 });
    expect(onProgress).toHaveBeenCalledWith({ phase: 'reading', current: 2, total: 2 });
  });

  it('throws documentStorageFilesNotFound when the document has no storage files', async () => {
    const vfs = createVfs();
    getDocumentStorageFilesMock.mockResolvedValue([]);

    let caught: unknown;
    try {
      await exportDocumentZip(
        vfs,
        vi.fn().mockResolvedValue(undefined),
        '/repo',
        documentId,
        vi.fn(),
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: RepositoryZipErrorCode.documentStorageFilesNotFound });
  });
});
