import { describe, expect, it, vi } from 'vitest';
import { createDirectoryHandleMock, createFileHandleMock } from './WebFileSystemProvider.testUtils';
import type { VfsEvent } from '../virtualFileSystem';
import { FSNodeType } from '../virtualFileSystem';
import { WebFileSystemProvider } from './WebFileSystemProvider';
import { WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE, WebFileSystemAccessRequiredError } from '.';

const createRootHandle = (
  permissionState: PermissionState = 'granted',
  readPermissionState?: PermissionState,
) => {
  const fileHandle = createFileHandleMock({
    fileContent: ['hello'],
    name: 'note.txt',
    permissionState,
    ...(readPermissionState !== undefined ? { readPermissionState } : {}),
  });
  const rootHandle = createDirectoryHandleMock({
    entries: [fileHandle],
    name: '',
    permissionState,
    ...(readPermissionState !== undefined ? { readPermissionState } : {}),
  });

  return {
    fileHandle,
    rootHandle,
  };
};

describe('WebFileSystemProvider', () => {
  it('returns written file stat from writeFile', async () => {
    const { rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/note.txt', 'hello', {
        create: true,
        overwrite: true,
      }),
    ).resolves.toEqual({
      stat: {
        type: FSNodeType.File,
        size: 5,
        creationTime: 123,
        modificationTime: 123,
        capabilities: {
          canDelete: true,
          canChangePath: true,
        },
      },
    });
  });

  it('throws a typed access-required DomainError with mode:read when read permission is missing', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => {
        return {
          spaceName: 'Work',
          mode,
        };
      },
    });

    await expect(provider.readDirectory('/')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'read',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
    expect(rootHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('throws a typed access-required DomainError with mode:readwrite for write operations when permission is denied', async () => {
    const { rootHandle } = createRootHandle('denied');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => {
        return {
          spaceName: 'Work',
          mode,
        };
      },
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('throws a typed access-required DomainError with mode:read when stat permission is denied', async () => {
    const { rootHandle } = createRootHandle('denied');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => {
        return {
          spaceName: 'Work',
          mode,
        };
      },
    });

    await expect(provider.stat('/folder')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'read',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('falls back to a VfsError when no access-recovery callback is configured', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.readDirectory('/')).rejects.toMatchObject({
      code: 'EACCES',
      name: 'VfsError',
    });
  });

  it('marks denied file handles as explicitly non-writable in stat capabilities', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    fileHandle.queryPermission = () => Promise.resolve('denied');

    await expect(provider.stat('/note.txt')).resolves.toMatchObject({
      capabilities: {
        canChangePath: false,
        canDelete: false,
      },
      type: FSNodeType.File,
    });
  });

  it('returns directory stat for nested directories instead of treating them as files', async () => {
    const nestedDirectoryHandle = createDirectoryHandleMock({
      name: 'child',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [nestedDirectoryHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.stat('/child')).resolves.toEqual({
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: true,
        canChangePath: true,
        canEditChildren: true,
      },
    });
  });

  it('falls back to generic queryPermission when the read descriptor is unsupported', async () => {
    const { rootHandle } = createRootHandle('granted');
    const queryPermissionMock = vi
      .fn<
        (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState | undefined>
      >()
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce('granted');
    Object.defineProperty(rootHandle, 'queryPermission', {
      configurable: true,
      value: queryPermissionMock,
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.readDirectory('/')).resolves.toEqual([
      ['note.txt', { type: FSNodeType.File }],
    ]);
    expect(queryPermissionMock).toHaveBeenNthCalledWith(1, {
      mode: 'read',
    });
    expect(queryPermissionMock).toHaveBeenNthCalledWith(2);
  });

  it('returns root directory stat without looking up child handles', async () => {
    const { rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.stat('/')).resolves.toEqual({
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: true,
      },
    });
  });

  it('reports unknown write capabilities when read is granted but readwrite is still prompt', async () => {
    const { rootHandle } = createRootHandle('prompt', 'granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.stat('/')).resolves.toEqual({
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: false,
        canChangePath: false,
        canEditChildren: undefined,
      },
    });
    await expect(provider.stat('/note.txt')).resolves.toMatchObject({
      type: FSNodeType.File,
      capabilities: {
        canDelete: undefined,
        canChangePath: undefined,
      },
    });
  });

  it('reports unknown directory write capabilities when read is granted but readwrite is still prompt', async () => {
    const nestedDirectoryHandle = createDirectoryHandleMock({
      name: 'child',
      permissionState: 'prompt',
      readPermissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [nestedDirectoryHandle],
      name: '',
      permissionState: 'prompt',
      readPermissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.stat('/child')).resolves.toEqual({
      type: FSNodeType.Directory,
      capabilities: {
        canDelete: undefined,
        canChangePath: undefined,
        canEditChildren: undefined,
      },
    });
  });

  it('emits an update for the mounted root after access state changes', () => {
    const { rootHandle } = createRootHandle('prompt', 'granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });
    const events: VfsEvent[] = [];
    const unsubscribe = provider.watch?.((event) => {
      events.push(event);
    });

    void provider.notifyAccessChanged();
    unsubscribe?.();

    expect(events).toContainEqual({
      source: 'provider',
      type: 'update',
      path: '/',
    });
    expect(rootHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('does not call getFile for file entries during readDirectory', async () => {
    const fileHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const rootHandle = createDirectoryHandleMock({
      entries: [fileHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.readDirectory('/')).resolves.toEqual([
      ['note.txt', { type: FSNodeType.File }],
    ]);
    expect(fileHandle.getFileMock).not.toHaveBeenCalled();
  });

  it('does not query permission for child entries during readDirectory', async () => {
    const childDir = createDirectoryHandleMock({ name: 'sub', permissionState: 'granted' });
    const rootHandle = createDirectoryHandleMock({
      entries: [childDir],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.readDirectory('/')).resolves.toEqual([
      ['sub', { type: FSNodeType.Directory }],
    ]);
    expect(childDir.queryPermissionMock).not.toHaveBeenCalled();
  });

  it('stat still returns precise file metadata after readDirectory skips eager stats', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await provider.readDirectory('/');
    expect(fileHandle.getFileMock).not.toHaveBeenCalled();

    await expect(provider.stat('/note.txt')).resolves.toEqual({
      type: FSNodeType.File,
      size: 5,
      creationTime: 123,
      modificationTime: 123,
      capabilities: { canDelete: true, canChangePath: true },
    });
    expect(fileHandle.getFileMock).toHaveBeenCalledTimes(1);
  });

  it('rejects writeFile when the target already exists and overwrite is false', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/note.txt', 'next', {
        create: true,
        overwrite: false,
      }),
    ).rejects.toMatchObject({
      code: 'EEXIST',
      name: 'VfsError',
    });
    expect(rootHandle.getFileHandleMock).toHaveBeenCalledWith('note.txt', {
      create: false,
    });
    expect(fileHandle.__writtenContent).toEqual(['hello']);
  });

  it('normalizes nested paths before traversing directory handles', async () => {
    const nestedFileHandle = createFileHandleMock({
      fileContent: ['nested'],
      lastModified: 321,
      name: 'note.txt',
    });
    const nestedDirectoryHandle = createDirectoryHandleMock({
      entries: [nestedFileHandle],
      name: 'child',
    });
    const { rootHandle } = createRootHandle('granted');
    const getDirectoryHandleMock = vi.fn(() => Promise.resolve(nestedDirectoryHandle));
    const originalGetFileHandle = nestedDirectoryHandle.getFileHandle.bind(nestedDirectoryHandle);
    const getFileHandleMock = vi.fn((fileName: string, options?: FileSystemGetFileOptions) =>
      originalGetFileHandle(fileName, options),
    );
    rootHandle.getDirectoryHandle = getDirectoryHandleMock;
    nestedDirectoryHandle.getFileHandle = getFileHandleMock;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.readFile('//child///note.txt')).resolves.toBeInstanceOf(File);
    expect(getDirectoryHandleMock).toHaveBeenCalledWith('child', {
      create: false,
    });
    expect(getFileHandleMock).toHaveBeenCalledWith('note.txt', {
      create: false,
    });
  });

  it('serializes only safe metadata for worker transfer', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({
        spaceName: 'Work',
        mode,
      }),
    });

    const thrownError = await provider
      .readDirectory('/')
      .catch((caughtError: unknown) => caughtError);

    expect(thrownError).toBeInstanceOf(WebFileSystemAccessRequiredError);
    if (!(thrownError instanceof WebFileSystemAccessRequiredError)) {
      throw new Error('Expected WebFileSystemAccessRequiredError');
    }

    expect(thrownError.toJSON()).toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      message: 'Permission required to open this remembered local space',
      mode: 'read',
      spaceName: 'Work',
    });
    expect(thrownError.toJSON()).not.toHaveProperty('cause');
    expect(JSON.stringify(thrownError.toJSON())).not.toContain('FileSystemDirectoryHandle');
  });

  it('converts a write-side browser failure to WebFileSystemAccessRequiredError when readwrite is no longer granted after ensureAccess', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const queryPermissionMock = vi
      .fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>()
      .mockResolvedValueOnce('granted')
      .mockResolvedValueOnce('prompt');
    Object.defineProperty(rootHandle, 'queryPermission', {
      configurable: true,
      value: queryPermissionMock,
    });
    fileHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('Not allowed', 'NotAllowedError')),
    );
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('rethrows the original error from a write-side failure when readwrite is still granted', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const storageError = new DOMException('Quota exceeded', 'QuotaExceededError');
    fileHandle.createWritable = vi.fn(() => Promise.reject(storageError));
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(storageError);
  });

  it('retries once with a fresh handle after InvalidStateError during createWritable and then succeeds', async () => {
    const staleHandle = createFileHandleMock({
      fileContent: ['hello'],
      name: 'note.txt',
      permissionState: 'granted',
    });
    const freshHandle = createFileHandleMock({
      fileContent: ['hello'],
      name: 'note.txt',
      permissionState: 'granted',
    });
    staleHandle.createWritable = vi.fn(() =>
      Promise.reject(
        new DOMException(
          'The state cached in an interface object has changed since it was read from disk.',
          'InvalidStateError',
        ),
      ),
    );
    const rootHandle = createDirectoryHandleMock({
      entries: [staleHandle],
      name: '',
      permissionState: 'granted',
    });
    const getFileHandleSpy = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockResolvedValueOnce(staleHandle)
      .mockResolvedValueOnce(freshHandle);
    rootHandle.getFileHandle = getFileHandleSpy;
    const onWriteRetry = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onWriteRetry,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(getFileHandleSpy).toHaveBeenNthCalledWith(1, 'note.txt', { create: false });
    expect(getFileHandleSpy).toHaveBeenNthCalledWith(2, 'note.txt', { create: true });
    expect(onWriteRetry).toHaveBeenNthCalledWith(1, {
      result: 'started',
      retryKind: 'freshHandle',
      writePhase: 'createWritable',
    });
    expect(onWriteRetry).toHaveBeenNthCalledWith(2, {
      result: 'succeeded',
      retryKind: 'freshHandle',
      writePhase: 'createWritable',
    });
    expect(freshHandle.__writtenContent).toEqual(['fresh']);
  });

  it('aborts the writable and preserves the original error when write fails after createWritable succeeds', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const writeError = new DOMException('quota exceeded', 'QuotaExceededError');
    const abortMock = vi.fn(() => Promise.resolve());
    fileHandle.createWritable = vi.fn(async () => {
      const writable = await createFileHandleMock({
        name: 'note.txt',
        permissionState: 'granted',
      }).createWritable();
      writable.abort = abortMock;
      writable.write = vi.fn(() => Promise.reject(writeError));
      return writable;
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(writeError);

    expect(abortMock).toHaveBeenCalledTimes(1);
  });

  it('aborts the writable and preserves the original error when close fails', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const closeError = new DOMException('quota exceeded', 'QuotaExceededError');
    const abortMock = vi.fn(() => Promise.resolve());
    fileHandle.createWritable = vi.fn(async () => {
      const writable = await createFileHandleMock({
        name: 'note.txt',
        permissionState: 'granted',
      }).createWritable();
      writable.abort = abortMock;
      writable.close = vi.fn(() => Promise.reject(closeError));
      return writable;
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(closeError);

    expect(abortMock).toHaveBeenCalledTimes(1);
  });

  it('re-resolves the parent directory before a fresh-handle retry after createWritable InvalidStateError', async () => {
    const staleHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const freshHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    staleHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('state changed', 'InvalidStateError')),
    );

    const staleParent = createDirectoryHandleMock({
      entries: [staleHandle],
      name: 'docs',
      permissionState: 'granted',
    });
    const freshParent = createDirectoryHandleMock({
      entries: [freshHandle],
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [staleParent],
      name: '',
      permissionState: 'granted',
    });
    const rootHandleGetDirectoryHandleMock = vi
      .fn<
        (
          directoryName: string,
          options?: FileSystemGetDirectoryOptions,
        ) => Promise<FileSystemDirectoryHandle>
      >()
      .mockResolvedValueOnce(staleParent)
      .mockResolvedValueOnce(freshParent);
    rootHandle.getDirectoryHandle = rootHandleGetDirectoryHandleMock;
    const staleParentGetFileHandleMock = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockResolvedValueOnce(staleHandle);
    const freshParentGetFileHandleMock = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockResolvedValueOnce(freshHandle);
    staleParent.getFileHandle = staleParentGetFileHandleMock;
    freshParent.getFileHandle = freshParentGetFileHandleMock;

    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(rootHandleGetDirectoryHandleMock).toHaveBeenNthCalledWith(1, 'docs', {
      create: false,
    });
    expect(rootHandleGetDirectoryHandleMock).toHaveBeenNthCalledWith(2, 'docs', {
      create: false,
    });
    expect(staleParentGetFileHandleMock).toHaveBeenCalledWith('note.txt', { create: false });
    expect(freshParentGetFileHandleMock).toHaveBeenCalledWith('note.txt', { create: true });
  });

  it('retries once after InvalidStateError during write and then succeeds', async () => {
    const staleHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const freshHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    staleHandle.createWritable = vi.fn(async () => {
      const writable = await createFileHandleMock({
        name: 'stale.txt',
        permissionState: 'granted',
      }).createWritable();
      writable.write = vi.fn(() =>
        Promise.reject(new DOMException('state changed', 'InvalidStateError')),
      );
      return writable;
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [staleHandle],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockResolvedValueOnce(staleHandle)
      .mockResolvedValueOnce(freshHandle);
    const onWriteRetry = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onWriteRetry,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(onWriteRetry).toHaveBeenNthCalledWith(1, {
      result: 'started',
      retryKind: 'normalRetry',
      writePhase: 'writeContent',
    });
    expect(onWriteRetry).toHaveBeenNthCalledWith(2, {
      result: 'succeeded',
      retryKind: 'normalRetry',
      writePhase: 'writeContent',
    });
    expect(freshHandle.__writtenContent).toEqual(['fresh']);
  });

  it('retries once after InvalidStateError during close and then succeeds', async () => {
    const staleHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const freshHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    staleHandle.createWritable = vi.fn(async () => {
      const writable = await createFileHandleMock({
        name: 'stale.txt',
        permissionState: 'granted',
      }).createWritable();
      writable.close = vi.fn(() =>
        Promise.reject(new DOMException('state changed', 'InvalidStateError')),
      );
      return writable;
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [staleHandle],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockResolvedValueOnce(staleHandle)
      .mockResolvedValueOnce(freshHandle);
    const onWriteRetry = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onWriteRetry,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(onWriteRetry).toHaveBeenNthCalledWith(1, {
      result: 'started',
      retryKind: 'normalRetry',
      writePhase: 'closeWritable',
    });
    expect(onWriteRetry).toHaveBeenNthCalledWith(2, {
      result: 'succeeded',
      retryKind: 'normalRetry',
      writePhase: 'closeWritable',
    });
  });

  it('retries once after InvalidStateError during statAfterWrite and then succeeds', async () => {
    const staleHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const freshHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    staleHandle.getFile = vi
      .fn<() => Promise<File>>()
      .mockRejectedValueOnce(new DOMException('state changed', 'InvalidStateError'));
    const rootHandle = createDirectoryHandleMock({
      entries: [staleHandle],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockResolvedValueOnce(staleHandle)
      .mockResolvedValueOnce(freshHandle);
    const onWriteRetry = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onWriteRetry,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(onWriteRetry).toHaveBeenNthCalledWith(1, {
      result: 'started',
      retryKind: 'normalRetry',
      writePhase: 'statAfterWrite',
    });
    expect(onWriteRetry).toHaveBeenNthCalledWith(2, {
      result: 'succeeded',
      retryKind: 'normalRetry',
      writePhase: 'statAfterWrite',
    });
  });

  it('reports retry failure metadata after InvalidStateError retry also fails', async () => {
    const staleHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const freshHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    staleHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('state changed', 'InvalidStateError')),
    );
    freshHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('state changed again', 'InvalidStateError')),
    );
    const rootHandle = createDirectoryHandleMock({
      entries: [staleHandle],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockResolvedValueOnce(staleHandle)
      .mockResolvedValueOnce(freshHandle);
    const onWriteRetry = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onWriteRetry,
    });

    const thrownError = await provider
      .writeFile('/note.txt', 'fresh', { create: true, overwrite: true })
      .catch((error: unknown) => error);

    expect(thrownError).toBeInstanceOf(DOMException);
    expect(onWriteRetry).toHaveBeenNthCalledWith(1, {
      result: 'started',
      retryKind: 'freshHandle',
      writePhase: 'createWritable',
    });
    expect(onWriteRetry).toHaveBeenNthCalledWith(2, {
      result: 'failed',
      retryKind: 'freshHandle',
      writePhase: 'createWritable',
      error: {
        errorClass: 'DOMException',
        domExceptionName: 'InvalidStateError',
        errorClassification: 'browserFileStateChanged',
      },
    });
  });

  it('does not retry non-InvalidStateError write failures', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const storageError = new DOMException('quota', 'QuotaExceededError');
    fileHandle.createWritable = vi.fn(() => Promise.reject(storageError));
    const onWriteRetry = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onWriteRetry,
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(storageError);
    expect(rootHandle.getFileHandleMock).toHaveBeenCalledTimes(1);
    expect(onWriteRetry).not.toHaveBeenCalled();
  });

  it('does not treat access-required failures as InvalidStateError retry cases', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const queryPermissionMock = vi
      .fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>()
      .mockResolvedValueOnce('granted')
      .mockResolvedValueOnce('prompt');
    Object.defineProperty(rootHandle, 'queryPermission', {
      configurable: true,
      value: queryPermissionMock,
    });
    fileHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('Not allowed', 'NotAllowedError')),
    );
    const onWriteRetry = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
      onWriteRetry,
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      name: 'WebFileSystemAccessRequiredError',
    });
    expect(onWriteRetry).not.toHaveBeenCalled();
  });

  it('converts a removeEntry browser failure to WebFileSystemAccessRequiredError when readwrite is no longer granted', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const queryPermissionMock = vi
      .fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>()
      .mockResolvedValueOnce('granted')
      .mockResolvedValueOnce('prompt');
    Object.defineProperty(rootHandle, 'queryPermission', {
      configurable: true,
      value: queryPermissionMock,
    });
    rootHandle.removeEntryMock.mockRejectedValueOnce(
      new DOMException('Not allowed', 'NotAllowedError'),
    );
    fileHandle.queryPermission = vi.fn<
      (descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>
    >(() => Promise.resolve('granted'));
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(provider.delete('/note.txt', false)).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('does not route Browser Storage providers through local access recovery', async () => {
    const { rootHandle } = createRootHandle('prompt');
    const onAccessRequired = vi.fn(() => ({
      spaceName: 'Work',
      mode: 'readwrite' as const,
    }));
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'originPrivateStorage',
      onAccessRequired,
    });

    await expect(provider.readDirectory('/')).resolves.toEqual([
      ['note.txt', { type: FSNodeType.File }],
    ]);
    expect(onAccessRequired).not.toHaveBeenCalled();
    expect(rootHandle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('preserves access-required errors from source lookup during move', async () => {
    const destinationDirectory = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [destinationDirectory],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getDirectoryHandle = vi.fn((directoryName: string) => {
      if (directoryName === 'Work') {
        return Promise.reject(
          new WebFileSystemAccessRequiredError({
            mode: 'readwrite',
            spaceName: 'Work',
          }),
        );
      }

      return Promise.resolve(destinationDirectory);
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({
        mode,
        spaceName: 'Work',
      }),
    });

    await expect(provider.move('/Work/note.txt', '/Archive/note.txt')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('keeps not-found behavior for a missing move source path', async () => {
    const destinationDirectory = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [destinationDirectory],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/missing.txt', '/Archive/missing.txt')).rejects.toMatchObject({
      code: 'ENOENT',
      message: 'Source not found: /missing.txt',
      name: 'VfsError',
    });
  });

  it('allows read operations when read is granted but readwrite is prompt', async () => {
    const { rootHandle } = createRootHandle('prompt', 'granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(provider.readDirectory('/')).resolves.toBeInstanceOf(Array);
    await expect(provider.readFile('/note.txt')).resolves.toBeInstanceOf(File);
    await expect(provider.stat('/note.txt')).resolves.toMatchObject({ type: FSNodeType.File });
  });

  it('throws mode:readwrite access error for write operations when readwrite is prompt but read is granted', async () => {
    const { rootHandle } = createRootHandle('prompt', 'granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
    });
    await expect(provider.createDirectory('/new')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
    });
  });

  it('treats moving a path onto itself as a no-op', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/note.txt', '/note.txt')).resolves.toBeUndefined();
    expect(rootHandle.getFileHandleMock).not.toHaveBeenCalled();
    expect(rootHandle.removeEntryMock).not.toHaveBeenCalled();
    expect(fileHandle.__writtenContent).toEqual(['hello']);
  });

  it('attempts removeEntry when canDelete capability is undefined', async () => {
    const fileHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'prompt',
      readPermissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [fileHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.delete('/note.txt', false)).resolves.toBeUndefined();
    expect(rootHandle.removeEntryMock).toHaveBeenCalledWith('note.txt', { recursive: false });
  });

  it('blocks remove immediately when canDelete capability is explicitly false', async () => {
    const fileHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'denied',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [fileHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.delete('/note.txt', false)).rejects.toMatchObject({
      code: 'EACCES',
      name: 'VfsError',
    });
    expect(rootHandle.removeEntryMock).not.toHaveBeenCalled();
  });

  it('attempts move when source canChangePath capability is undefined', async () => {
    const sourceFile = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'prompt',
      readPermissionState: 'granted',
    });
    const destinationDirectory = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [sourceFile, destinationDirectory],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/note.txt', '/Archive/note.txt')).resolves.toBeUndefined();
  });

  it('attempts destination write when canEditChildren capability is undefined', async () => {
    const sourceFile = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const destinationDirectory = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'prompt',
      readPermissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [sourceFile, destinationDirectory],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/note.txt', '/Archive/note.txt')).resolves.toBeUndefined();
  });

  it('resolves the destination parent path once and reuses that lookup for handle and stat', async () => {
    const sourceFile = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const destinationDirectory = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [sourceFile, destinationDirectory],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/note.txt', '/Archive/note.txt')).resolves.toBeUndefined();

    expect(
      rootHandle.getDirectoryHandleMock.mock.calls.filter(
        ([directoryName]) => directoryName === 'Archive',
      ),
    ).toHaveLength(1);
  });

  it('keeps the destination parent path error when the destination parent resolves to a file', async () => {
    const sourceFile = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const destinationParentFile = createFileHandleMock({
      name: 'Archive',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [sourceFile, destinationParentFile],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/note.txt', '/Archive/note.txt')).rejects.toMatchObject({
      code: 'ENOTDIR',
      name: 'VfsError',
    });
  });

  it('blocks move immediately when source canChangePath capability is explicitly false', async () => {
    const sourceFile = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'denied',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [sourceFile],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/note.txt', '/Archive/note.txt')).rejects.toMatchObject({
      code: 'EACCES',
      name: 'VfsError',
    });
  });

  it('converts a new-file getFileHandle failure to WebFileSystemAccessRequiredError when readwrite is no longer granted', async () => {
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    const queryPermissionMock = vi
      .fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>()
      .mockResolvedValueOnce('granted')
      .mockResolvedValueOnce('prompt');
    Object.defineProperty(rootHandle, 'queryPermission', {
      configurable: true,
      value: queryPermissionMock,
    });
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.reject(new DOMException('Not allowed', 'NotAllowedError'));
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/new.txt', 'x', { create: true, overwrite: false }),
    ).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('converts a createDirectory getDirectoryHandle failure to WebFileSystemAccessRequiredError when readwrite is no longer granted', async () => {
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    const queryPermissionMock = vi
      .fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>()
      .mockResolvedValueOnce('granted')
      .mockResolvedValueOnce('prompt');
    Object.defineProperty(rootHandle, 'queryPermission', {
      configurable: true,
      value: queryPermissionMock,
    });
    rootHandle.getDirectoryHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.reject(new DOMException('Not allowed', 'NotAllowedError'));
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(provider.createDirectory('/newdir')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
      name: 'WebFileSystemAccessRequiredError',
      spaceName: 'Work',
    });
  });

  it('rethrows original error from new-file getFileHandle failure when readwrite is still granted', async () => {
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    const storageError = new DOMException('Quota exceeded', 'QuotaExceededError');
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.reject(storageError);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/new.txt', 'x', { create: true, overwrite: false }),
    ).rejects.toThrow(storageError);
  });

  it('resolves successfully when post-write getFile metadata fails after the write stream closes', async () => {
    const fileHandle = createFileHandleMock({
      fileContent: ['hello'],
      name: 'note.txt',
      permissionState: 'granted',
    });
    const metadataError = new DOMException('Not allowed', 'NotAllowedError');
    fileHandle.getFile = vi.fn(() => Promise.reject(metadataError));
    const rootHandle = createDirectoryHandleMock({
      entries: [fileHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/note.txt', 'world', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });
  });

  it('stat still fails precisely when getFile fails even after a successful write', async () => {
    const fileHandle = createFileHandleMock({
      fileContent: ['hello'],
      name: 'note.txt',
      permissionState: 'granted',
    });
    const metadataError = new DOMException('Not allowed', 'NotAllowedError');
    fileHandle.getFile = vi.fn(() => Promise.reject(metadataError));
    const rootHandle = createDirectoryHandleMock({
      entries: [fileHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.stat('/note.txt')).rejects.toThrow(metadataError);
  });

  it('blocks move immediately when destination canEditChildren capability is explicitly false', async () => {
    const sourceFile = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const destinationDirectory = createDirectoryHandleMock({
      name: 'Archive',
      permissionState: 'denied',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [sourceFile, destinationDirectory],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(provider.move('/note.txt', '/Archive/note.txt')).rejects.toMatchObject({
      code: 'EACCES',
      name: 'VfsError',
    });
  });
});
