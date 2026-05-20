import { describe, expect, it, vi } from 'vitest';
import { ensureStorageAdapterMarkerFile } from './ensureStorageAdapterMarkerFile';
import { partialKeyToFileName } from './partialKeyToFileName';
import { storageAdapterMarkerFileName } from './storageAdapterMarkerFileName';

const resolveGrantedPermission = () => Promise.resolve<'granted'>('granted');

const createWritableFileStream = (): FileSystemWritableFileStream => ({
  close: vi.fn(() => Promise.resolve()),
  write: vi.fn(() => Promise.resolve()),
  seek: vi.fn(() => Promise.resolve()),
  truncate: vi.fn(() => Promise.resolve()),
  locked: false,
  abort: vi.fn(),
  getWriter: vi.fn(),
});

const createFileHandle = (
  name: string,
  createWritable: () => Promise<FileSystemWritableFileStream>,
): FileSystemFileHandle => ({
  kind: 'file',
  name,
  isSameEntry: vi.fn(() => Promise.resolve(false)),
  createWritable: vi.fn(createWritable),
  createSyncAccessHandle: vi.fn(),
  getFile: vi.fn(),
  requestPermission: vi.fn(resolveGrantedPermission),
  queryPermission: vi.fn(resolveGrantedPermission),
  isFile: true,
  isDirectory: false,
});

const createDirectoryHandle = (
  getFileHandle: FileSystemDirectoryHandle['getFileHandle'],
): FileSystemDirectoryHandle => ({
  kind: 'directory',
  name: 'Project Space',
  isSameEntry: vi.fn(() => Promise.resolve(false)),
  requestPermission: vi.fn(resolveGrantedPermission),
  queryPermission: vi.fn(resolveGrantedPermission),
  isFile: false,
  isDirectory: true,
  entries: vi.fn(),
  keys: vi.fn(),
  values: vi.fn(),
  getDirectoryHandle: vi.fn(),
  getFileHandle,
  removeEntry: vi.fn(),
  resolve: vi.fn(),
  getFile(fileName: string, options?: FileSystemGetFileOptions) {
    return getFileHandle(fileName, options);
  },
  getDirectory: vi.fn(),
  getEntries: vi.fn(),
  [Symbol.asyncIterator]: vi.fn(),
});

describe('partialKeyToFileName', () => {
  it('supports the storage adapter marker partial key', () => {
    expect(partialKeyToFileName(['storage-adapter-id'])).toBe('storage-adapter-id.automerge');
  });
});

describe('storageAdapterMarkerFileName', () => {
  it('is derived from the shared partial-key conversion path', () => {
    expect(storageAdapterMarkerFileName).toBe(partialKeyToFileName(['storage-adapter-id']));
  });
});

describe('ensureStorageAdapterMarkerFile', () => {
  it('creates a missing marker file without truncating an existing marker', async () => {
    const writable = createWritableFileStream();
    const createWritableMock = vi.fn(() => Promise.resolve(writable));
    const getFileHandleMock = vi
      .fn<FileSystemDirectoryHandle['getFileHandle']>()
      .mockRejectedValueOnce(new DOMException('missing marker', 'NotFoundError'))
      .mockResolvedValueOnce(createFileHandle(storageAdapterMarkerFileName, createWritableMock))
      .mockResolvedValueOnce(createFileHandle(storageAdapterMarkerFileName, createWritableMock));
    const directoryHandle = createDirectoryHandle(getFileHandleMock);

    await ensureStorageAdapterMarkerFile(directoryHandle);
    await ensureStorageAdapterMarkerFile(directoryHandle);

    expect(getFileHandleMock).toHaveBeenNthCalledWith(1, storageAdapterMarkerFileName);
    expect(getFileHandleMock).toHaveBeenNthCalledWith(2, storageAdapterMarkerFileName, {
      create: true,
    });
    expect(getFileHandleMock).toHaveBeenNthCalledWith(3, storageAdapterMarkerFileName);
    expect(createWritableMock).toHaveBeenCalledTimes(1);
  });
});
