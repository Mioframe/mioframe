/* eslint-disable @typescript-eslint/consistent-type-assertions -- DOM File System Access API mocks need structural casting in tests. */
import { describe, expect, it, vi } from 'vitest';
import { inspectMioframeSpaceDirectory } from './mioframeSpacePick.helpers';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';

const createDirectoryHandle = ({
  name,
  entries = [],
  getFileHandle,
}: {
  name: string;
  entries?: Array<[string, FileSystemHandle]>;
  getFileHandle?: FileSystemDirectoryHandle['getFileHandle'] | undefined;
}) =>
  ({
    kind: 'directory',
    name,
    isSameEntry: vi.fn(() => Promise.resolve(false)),
    requestPermission: vi.fn(() => Promise.resolve('granted')),
    queryPermission: vi.fn(() => Promise.resolve('granted')),
    isFile: false,
    isDirectory: true,
    entries: (() =>
      (async function* () {
        await Promise.resolve();
        for (const entry of entries) {
          yield entry as [string, FileSystemDirectoryHandle | FileSystemFileHandle];
        }
      })()) as FileSystemDirectoryHandle['entries'],
    keys: (() =>
      (async function* () {
        await Promise.resolve();
        for (const [entryName] of entries) {
          yield entryName;
        }
      })()) as FileSystemDirectoryHandle['keys'],
    values: (() =>
      (async function* () {
        await Promise.resolve();
        for (const [, childHandle] of entries) {
          yield childHandle as FileSystemDirectoryHandle | FileSystemFileHandle;
        }
      })()) as FileSystemDirectoryHandle['values'],
    getDirectoryHandle: vi.fn(),
    getFileHandle:
      getFileHandle ??
      vi.fn(() => Promise.reject(new DOMException('File not found', 'NotFoundError'))),
    removeEntry: vi.fn(),
    resolve: vi.fn(),
    [Symbol.asyncIterator]() {
      return this.entries();
    },
    getFile(fileName: string, options?: FileSystemGetFileOptions) {
      return this.getFileHandle(fileName, options);
    },
    getDirectory(directoryName: string, options?: FileSystemGetDirectoryOptions) {
      return this.getDirectoryHandle(directoryName, options);
    },
    getEntries() {
      return this.values();
    },
  }) as FileSystemDirectoryHandle;

describe('inspectMioframeSpaceDirectory', () => {
  it('returns immediately when the current marker file exists', async () => {
    const handle = createDirectoryHandle({
      name: 'Documents',
      getFileHandle: vi.fn(() => Promise.resolve({ kind: 'file' } as FileSystemFileHandle)),
    });

    await expect(inspectMioframeSpaceDirectory(handle)).resolves.toEqual({
      looksLikeExistingSpace: true,
    });
  });

  it('uses the Automerge adapter marker contract for existing-space detection', async () => {
    const getFileHandle = vi.fn((fileName: string) => {
      if (fileName === storageAdapterMarkerFileName) {
        return Promise.resolve({ kind: 'file' } as FileSystemFileHandle);
      }

      throw new DOMException('missing marker', 'NotFoundError');
    });
    const handle = createDirectoryHandle({
      name: 'Project Space',
      getFileHandle,
    });

    await expect(inspectMioframeSpaceDirectory(handle)).resolves.toEqual({
      looksLikeExistingSpace: true,
    });
    expect(getFileHandle).toHaveBeenCalledWith(storageAdapterMarkerFileName);
  });

  it('treats a missing marker file as not an existing Mioframe space', async () => {
    const inspection = await inspectMioframeSpaceDirectory(
      createDirectoryHandle({
        name: 'Project Space',
        entries: [['notes.txt', { kind: 'file', name: 'notes.txt' } as FileSystemFileHandle]],
      }),
    );

    expect(inspection.looksLikeExistingSpace).toBe(false);
  });

  it('treats a NotFoundError marker lookup as missing and still inspects entries', async () => {
    const handle = createDirectoryHandle({
      name: 'Project Space',
      entries: [['notes.txt', { kind: 'file', name: 'notes.txt' } as FileSystemFileHandle]],
      getFileHandle: vi.fn(() =>
        Promise.reject(new DOMException('missing marker', 'NotFoundError')),
      ),
    });

    await expect(inspectMioframeSpaceDirectory(handle)).resolves.toMatchObject({
      looksLikeExistingSpace: false,
    });
  });

  it('rethrows non-NotFound marker lookup failures', async () => {
    const handle = createDirectoryHandle({
      name: 'Protected Space',
      getFileHandle: vi.fn(() =>
        Promise.reject(new DOMException('permission denied', 'SecurityError')),
      ),
    });

    await expect(inspectMioframeSpaceDirectory(handle)).rejects.toMatchObject({
      name: 'SecurityError',
    });
  });
});
/* eslint-enable @typescript-eslint/consistent-type-assertions -- Re-enable after DOM File System Access API test mocks. */
