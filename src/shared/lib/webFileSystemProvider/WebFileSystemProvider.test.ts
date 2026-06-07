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

  it('re-looks up a newly created file, cleans it up after createWritable failure, and rethrows the original error', async () => {
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const reopenedHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const openError = new DOMException('quota exceeded', 'QuotaExceededError');
    reopenedHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const parentGetFileHandleMock =
      vi.fn<
        (fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>
      >();
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandle = parentGetFileHandleMock
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(createdHandle)
      .mockResolvedValueOnce(reopenedHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(openError);

    expect(parentGetFileHandleMock).toHaveBeenNthCalledWith(1, 'note.txt', { create: false });
    expect(parentGetFileHandleMock).toHaveBeenNthCalledWith(2, 'note.txt', { create: false });
    expect(parentGetFileHandleMock).toHaveBeenNthCalledWith(3, 'note.txt', { create: true });
    expect(parentGetFileHandleMock).toHaveBeenNthCalledWith(4, 'note.txt', { create: false });
    expect(parentHandle.removeEntryMock).toHaveBeenCalledWith('note.txt', { recursive: false });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual(
      expect.objectContaining({
        result: 'started',
        step: 'fileHandleLookupAfterCreate',
        writeStrategy: 'safeCurrent',
      }),
    );
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual(
      expect.objectContaining({
        result: 'succeeded',
        step: 'fileHandleLookupAfterCreate',
        writeStrategy: 'safeCurrent',
      }),
    );
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual(
      expect.objectContaining({
        result: 'started',
        step: 'createdFileCleanup',
        writeStrategy: 'safeCurrent',
      }),
    );
  });

  it('cleans up both created files when the first and retry createWritable attempts fail', async () => {
    const firstCreatedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const firstReopenedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const retryCreatedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const retryReopenedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const firstError = new DOMException('state changed', 'InvalidStateError');
    const retryError = new DOMException('state changed again', 'InvalidStateError');
    firstReopenedHandle.createWritable = vi.fn(() => Promise.reject(firstError));
    retryReopenedHandle.createWritable = vi.fn(() => Promise.reject(retryError));
    const firstParent = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const retryParent = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [firstParent],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getDirectoryHandle = vi
      .fn<
        (
          directoryName: string,
          options?: FileSystemGetDirectoryOptions,
        ) => Promise<FileSystemDirectoryHandle>
      >()
      .mockResolvedValueOnce(firstParent)
      .mockResolvedValueOnce(firstParent)
      .mockResolvedValueOnce(retryParent);
    firstParent.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(firstCreatedHandle)
      .mockResolvedValueOnce(firstReopenedHandle);
    retryParent.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(retryCreatedHandle)
      .mockResolvedValueOnce(retryReopenedHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(retryError);

    expect(firstParent.removeEntryMock).toHaveBeenCalledWith('note.txt', { recursive: false });
    expect(retryParent.removeEntryMock).toHaveBeenCalledWith('note.txt', { recursive: false });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'failed',
      step: 'freshHandleRetry',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
      writeStrategy: 'safeCurrent',
    });
  });

  it('uses the re-looked-up handle for a successful create-write and does not clean up the file', async () => {
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const reopenedHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(createdHandle)
      .mockResolvedValueOnce(reopenedHandle);
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({
      stat: {
        type: FSNodeType.File,
        size: 5,
      },
    });

    expect(reopenedHandle.__writtenContent).toEqual(['fresh']);
    expect(createdHandle.__writtenContent).toEqual(['hello']);
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
  });

  it('does not clean up a newly created file after close succeeds and post-write stat fails', async () => {
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const reopenedHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    reopenedHandle.getFile = vi
      .fn<() => Promise<File>>()
      .mockRejectedValueOnce(new DOMException('state changed', 'InvalidStateError'));
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(createdHandle)
      .mockResolvedValueOnce(reopenedHandle)
      .mockResolvedValueOnce(reopenedHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'failed',
      step: 'fileStat',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
  });

  it('does not clean up an existing file after createWritable fails during overwrite', async () => {
    const existingHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const openError = new DOMException('quota exceeded', 'QuotaExceededError');
    existingHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const parentHandle = createDirectoryHandleMock({
      entries: [existingHandle],
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(openError);

    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
  });

  it('does not use the compatibility writable open fallback for existing-file overwrite failures', async () => {
    const existingHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const openError = new DOMException('state changed', 'InvalidStateError');
    const createWritableMock = vi.fn(() => Promise.reject(openError));
    existingHandle.createWritable = createWritableMock;
    const parentHandle = createDirectoryHandleMock({
      entries: [existingHandle],
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(openError);

    expect(createWritableMock).toHaveBeenCalledTimes(2);
    expect(createWritableMock).toHaveBeenNthCalledWith(1);
    expect(createWritableMock).toHaveBeenNthCalledWith(2);
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).not.toContainEqual(
      expect.objectContaining({ step: 'writableCompatibilityOpen' }),
    );
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
  });

  it('uses keepExistingData compatibility open for newly created files after InvalidStateError and skips cleanup on success', async () => {
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const reopenedHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const createWritableMock = vi
      .fn<
        (_: FileSystemCreateWritableOptions | undefined) => Promise<FileSystemWritableFileStream>
      >()
      .mockImplementationOnce(() =>
        Promise.reject(new DOMException('state changed', 'InvalidStateError')),
      )
      .mockImplementationOnce(async () => {
        const writable = await createFileHandleMock({
          name: 'note.txt',
          permissionState: 'granted',
        }).createWritable();
        return writable;
      });
    reopenedHandle.createWritable = createWritableMock;
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(createdHandle)
      .mockResolvedValueOnce(reopenedHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(createWritableMock).toHaveBeenCalledTimes(2);
    expect(createWritableMock).toHaveBeenNthCalledWith(1);
    expect(createWritableMock).toHaveBeenNthCalledWith(2, { keepExistingData: true });
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'failed',
      step: 'writableOpen',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'started',
      step: 'writableCompatibilityOpen',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'succeeded',
      step: 'writableCompatibilityOpen',
      writeStrategy: 'safeCurrent',
    });
  });

  it('cleans up a newly created file when both default and compatibility writable opens fail', async () => {
    const firstCreatedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const firstReopenedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const retryCreatedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const retryReopenedHandle = createFileHandleMock({
      name: 'note.txt',
      permissionState: 'granted',
    });
    const firstError = new DOMException('state changed', 'InvalidStateError');
    const secondError = new DOMException('still blocked', 'InvalidStateError');
    const retryError = new DOMException('still blocked on retry', 'InvalidStateError');
    const firstCreateWritableMock = vi
      .fn<
        (_: FileSystemCreateWritableOptions | undefined) => Promise<FileSystemWritableFileStream>
      >()
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(secondError);
    firstReopenedHandle.createWritable = firstCreateWritableMock;
    const retryCreateWritableMock = vi
      .fn<
        (_: FileSystemCreateWritableOptions | undefined) => Promise<FileSystemWritableFileStream>
      >()
      .mockRejectedValueOnce(firstError)
      .mockRejectedValueOnce(retryError);
    retryReopenedHandle.createWritable = retryCreateWritableMock;
    const firstParentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const retryParentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [firstParentHandle],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getDirectoryHandle = vi
      .fn<
        (
          directoryName: string,
          options?: FileSystemGetDirectoryOptions,
        ) => Promise<FileSystemDirectoryHandle>
      >()
      .mockResolvedValueOnce(firstParentHandle)
      .mockResolvedValueOnce(firstParentHandle)
      .mockResolvedValueOnce(retryParentHandle);
    firstParentHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(firstCreatedHandle)
      .mockResolvedValueOnce(firstReopenedHandle);
    retryParentHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(retryCreatedHandle)
      .mockResolvedValueOnce(retryReopenedHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(retryError);

    expect(firstParentHandle.removeEntryMock).toHaveBeenCalledWith('note.txt', {
      recursive: false,
    });
    expect(retryParentHandle.removeEntryMock).toHaveBeenCalledWith('note.txt', {
      recursive: false,
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'failed',
      step: 'writableCompatibilityOpen',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
      writeStrategy: 'safeCurrent',
    });
  });

  it('cleans up a newly created file after write fails but does not clean up an existing file after write fails', async () => {
    const createdHandle = createFileHandleMock({ name: 'new.txt', permissionState: 'granted' });
    const reopenedHandle = createFileHandleMock({ name: 'new.txt', permissionState: 'granted' });
    const writeError = new DOMException('quota exceeded', 'QuotaExceededError');
    reopenedHandle.createWritable = vi.fn(async () => {
      const writable = await createFileHandleMock({
        name: 'new.txt',
        permissionState: 'granted',
      }).createWritable();
      writable.write = vi.fn(() => Promise.reject(writeError));
      return writable;
    });
    const existingHandle = createFileHandleMock({ name: 'old.txt', permissionState: 'granted' });
    existingHandle.createWritable = vi.fn(async () => {
      const writable = await createFileHandleMock({
        name: 'old.txt',
        permissionState: 'granted',
      }).createWritable();
      writable.write = vi.fn(() => Promise.reject(writeError));
      return writable;
    });
    const parentHandle = createDirectoryHandleMock({
      entries: [existingHandle],
      name: 'docs',
      permissionState: 'granted',
    });
    const parentGetFileHandleMock = vi.fn(
      (fileName: string, options?: FileSystemGetFileOptions) => {
        if (fileName === 'new.txt' && options?.create === false) {
          const createFalseCalls = parentGetFileHandleMock.mock.calls.filter(
            ([calledName, calledOptions]) =>
              calledName === 'new.txt' && calledOptions?.create === false,
          ).length;
          if (createFalseCalls <= 2) {
            return Promise.reject(new DOMException('Not found', 'NotFoundError'));
          }
          return Promise.resolve(reopenedHandle);
        }
        if (fileName === 'new.txt' && options?.create === true) {
          return Promise.resolve(createdHandle);
        }
        if (fileName === 'old.txt') {
          return Promise.resolve(existingHandle);
        }
        return Promise.reject(new DOMException('Not found', 'NotFoundError'));
      },
    );
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandle = parentGetFileHandleMock;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/docs/new.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(writeError);
    await expect(
      provider.writeFile('/docs/old.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(writeError);

    expect(parentHandle.removeEntryMock).toHaveBeenCalledTimes(1);
    expect(parentHandle.removeEntryMock).toHaveBeenCalledWith('new.txt', { recursive: false });
  });

  it('preserves the original write failure when cleanup also fails', async () => {
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const reopenedHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const writeError = new DOMException('quota exceeded', 'QuotaExceededError');
    reopenedHandle.createWritable = vi.fn(() => Promise.reject(writeError));
    const cleanupError = new DOMException('locked', 'InvalidModificationError');
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    parentHandle.removeEntry = vi.fn(() => Promise.reject(cleanupError));
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandle = vi
      .fn<(fileName: string, options?: FileSystemGetFileOptions) => Promise<FileSystemFileHandle>>()
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(createdHandle)
      .mockResolvedValueOnce(reopenedHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(writeError);

    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual(
      expect.objectContaining({
        result: 'failed',
        step: 'createdFileCleanup',
        errorClass: 'DOMException',
        domExceptionName: 'InvalidModificationError',
        writeStrategy: 'safeCurrent',
      }),
    );
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
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(getFileHandleSpy).toHaveBeenNthCalledWith(1, 'note.txt', { create: false });
    expect(getFileHandleSpy).toHaveBeenNthCalledWith(2, 'note.txt', { create: false });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'started',
      step: 'writableOpen',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'failed',
      step: 'writableOpen',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'started',
      step: 'freshHandleRetry',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'succeeded',
      step: 'freshHandleRetry',
      writeStrategy: 'safeCurrent',
    });
    expect(freshHandle.__writtenContent).toEqual(['fresh']);
  });

  it('aborts the writable and preserves the original error when write fails after createWritable succeeds', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const writeError = new DOMException('quota exceeded', 'QuotaExceededError');
    const abortMock = vi.fn(() => Promise.resolve());
    const onDiagnosticStep = vi.fn();
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
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(writeError);

    expect(abortMock).toHaveBeenCalledTimes(1);
    expect(onDiagnosticStep).not.toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'failed',
        step: 'writableOpen',
      }),
    );
    expect(onDiagnosticStep).toHaveBeenCalledWith({
      result: 'failed',
      step: 'fileWrite',
      errorClass: 'DOMException',
      domExceptionName: 'QuotaExceededError',
      writeStrategy: 'safeCurrent',
    });
  });

  it('aborts the writable and preserves the original error when close fails', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const closeError = new DOMException('quota exceeded', 'QuotaExceededError');
    const abortMock = vi.fn(() => Promise.resolve());
    const onDiagnosticStep = vi.fn();
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
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(closeError);

    expect(abortMock).toHaveBeenCalledTimes(1);
    expect(onDiagnosticStep).not.toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'failed',
        step: 'writableOpen',
      }),
    );
    expect(onDiagnosticStep).toHaveBeenCalledWith({
      result: 'failed',
      step: 'fileWrite',
      errorClass: 'DOMException',
      domExceptionName: 'QuotaExceededError',
      writeStrategy: 'safeCurrent',
    });
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
    expect(freshParentGetFileHandleMock).toHaveBeenCalledWith('note.txt', { create: false });
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
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'started',
      step: 'freshHandleRetry',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'succeeded',
      step: 'freshHandleRetry',
      writeStrategy: 'safeCurrent',
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
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'started',
      step: 'freshHandleRetry',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'succeeded',
      step: 'freshHandleRetry',
      writeStrategy: 'safeCurrent',
    });
  });

  it('returns fallback stat without retry after InvalidStateError during statAfterWrite', async () => {
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
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'failed',
      step: 'fileStat',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).not.toContainEqual(
      expect.objectContaining({ step: 'freshHandleRetry' }),
    );
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
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    const thrownError = await provider
      .writeFile('/note.txt', 'fresh', { create: true, overwrite: true })
      .catch((error: unknown) => error);

    expect(thrownError).toBeInstanceOf(DOMException);
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'started',
      step: 'freshHandleRetry',
      writeStrategy: 'safeCurrent',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual({
      result: 'failed',
      step: 'freshHandleRetry',
      errorClass: 'DOMException',
      domExceptionName: 'InvalidStateError',
      writeStrategy: 'safeCurrent',
    });
  });

  it('does not retry non-InvalidStateError write failures', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const storageError = new DOMException('quota', 'QuotaExceededError');
    fileHandle.createWritable = vi.fn(() => Promise.reject(storageError));
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(storageError);
    expect(rootHandle.getFileHandleMock).toHaveBeenCalledTimes(1);
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).not.toContainEqual(
      expect.objectContaining({ step: 'freshHandleRetry' }),
    );
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
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      name: 'WebFileSystemAccessRequiredError',
    });
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).not.toContainEqual(
      expect.objectContaining({ step: 'freshHandleRetry' }),
    );
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

  it('uses the direct create/write probe sequence without lookup-after-create or compatibility open', async () => {
    const directHandle = createFileHandleMock({
      fileContent: [''],
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const createWritableMock = vi.fn(directHandle.createWritable.bind(directHandle));
    directHandle.createWritable = createWritableMock;
    const getFileMock = directHandle.getFileMock;
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(rootHandle.getFileHandleMock.mock.calls).toEqual([
      ['probe.amrg', { create: false }],
      ['probe.amrg', { create: true }],
    ]);
    expect(createWritableMock).toHaveBeenCalledTimes(1);
    expect(createWritableMock).toHaveBeenCalledWith();
    expect(getFileMock).toHaveBeenCalled();
    expect(createWritableMock.mock.invocationCallOrder[0]).toBeLessThan(
      getFileMock.mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
    expect(onDiagnosticStep).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'directCreateWriteProbe',
        step: 'writeStrategySelected',
        writeStrategy: 'directCreateWriteProbe',
      }),
    );
    expect(onDiagnosticStep).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'started',
        step: 'directCreateWriteWritableOpen',
        writeStrategy: 'directCreateWriteProbe',
      }),
    );
    expect(onDiagnosticStep).toHaveBeenCalledWith(
      expect.objectContaining({
        result: 'succeeded',
        step: 'directCreateWrite',
        writeStrategy: 'directCreateWriteProbe',
      }),
    );
  });

  it('cleans up a newly created file when direct probe createWritable fails', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    expect(rootHandle.removeEntryMock).toHaveBeenCalledWith('probe.amrg', { recursive: false });
  });

  it('cleans up a newly created file when direct probe write fails after writable open', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const writeError = new DOMException('Quota exceeded', 'QuotaExceededError');
    directHandle.createWritable = vi.fn(() =>
      Promise.resolve({
        locked: false,
        abort: vi.fn(() => Promise.resolve()),
        close: vi.fn(() => Promise.resolve(undefined)),
        getWriter: () => new WritableStream().getWriter(),
        seek: vi.fn(() => Promise.resolve(undefined)),
        truncate: vi.fn(() => Promise.resolve(undefined)),
        write: vi.fn(() => Promise.reject(writeError)),
      }),
    );
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(writeError);

    expect(rootHandle.removeEntryMock).toHaveBeenCalledTimes(1);
  });

  it('does not clean up an existing file when direct probe write fails', async () => {
    const existingHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    existingHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const rootHandle = createDirectoryHandleMock({
      entries: [existingHandle],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    expect(rootHandle.removeEntryMock).not.toHaveBeenCalledWith('probe.amrg', expect.anything());
  });

  it('does not clean up after direct probe close succeeds even if post-write stat fails', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    directHandle.getFile = vi.fn(() =>
      Promise.reject(new DOMException('Not allowed', 'NotAllowedError')),
    );
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(rootHandle.removeEntryMock).not.toHaveBeenCalled();
  });

  it('runs the ASCII write probe after InvalidStateError at directCreateWriteWritableOpen', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    expect(onDiagnosticStep).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'asciiWriteProbe', result: 'started' }),
    );
  });

  it('does not run the ASCII write probe on successful directCreateWriteProbe write', async () => {
    const directHandle = createFileHandleMock({
      fileContent: [''],
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(onDiagnosticStep).not.toHaveBeenCalledWith(
      expect.objectContaining({ step: 'asciiWriteProbe' }),
    );
  });

  it('does not run the ASCII write probe for non-InvalidStateError failures at writable open', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
    directHandle.createWritable = vi.fn(() => Promise.reject(quotaError));
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(quotaError);

    expect(onDiagnosticStep).not.toHaveBeenCalledWith(
      expect.objectContaining({ step: 'asciiWriteProbe' }),
    );
  });

  it('does not run the ASCII write probe for OPFS (safeCurrent strategy)', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    fileHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('Invalid state', 'InvalidStateError')),
    );
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'originPrivateStorage',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toMatchObject({ name: 'InvalidStateError' });

    expect(onDiagnosticStep).not.toHaveBeenCalledWith(
      expect.objectContaining({ step: 'asciiWriteProbe' }),
    );
  });

  it('ASCII write probe uses the same parent directory handle', async () => {
    const directHandle = createFileHandleMock({
      name: 'data.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const parentHandle = createDirectoryHandleMock({
      name: 'storage',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandleMock.mockImplementation((_name, options) => {
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/storage/data.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    expect(parentHandle.getFileHandleMock).toHaveBeenCalledWith('mioframe-write-probe.tmp', {
      create: true,
    });
  });

  it('ASCII write probe creates the fixed probe filename and writes the constant payload', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const probeHandle = createFileHandleMock({
      name: 'mioframe-write-probe.tmp',
      permissionState: 'granted',
    });
    const probeWritableMock = {
      locked: false,
      abort: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve(undefined)),
      getWriter: () => new WritableStream().getWriter(),
      seek: vi.fn(() => Promise.resolve(undefined)),
      truncate: vi.fn(() => Promise.resolve(undefined)),
      write: vi.fn(() => Promise.resolve(undefined)),
    } satisfies FileSystemWritableFileStream;
    const probeCreateWritableMock = vi.fn(() => Promise.resolve(probeWritableMock));
    probeHandle.createWritable = probeCreateWritableMock;
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((name, options) => {
      if (name === 'mioframe-write-probe.tmp' && options?.create) {
        return Promise.resolve(probeHandle);
      }
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    expect(probeCreateWritableMock).toHaveBeenCalledTimes(1);
    expect(probeWritableMock.write).toHaveBeenCalledWith('ok');
    expect(probeWritableMock.close).toHaveBeenCalledTimes(1);
  });

  it('ASCII write probe deletes the temporary file after a successful probe write', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const probeHandle = createFileHandleMock({
      name: 'mioframe-write-probe.tmp',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((name, options) => {
      if (name === 'mioframe-write-probe.tmp' && options?.create) {
        return Promise.resolve(probeHandle);
      }
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    expect(rootHandle.removeEntryMock).toHaveBeenCalledWith('mioframe-write-probe.tmp', {
      recursive: false,
    });
  });

  it('ASCII write probe deletes the temporary file after a probe writable-open failure', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const probeHandle = createFileHandleMock({
      name: 'mioframe-write-probe.tmp',
      permissionState: 'granted',
    });
    probeHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('Also invalid state', 'InvalidStateError')),
    );
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((name, options) => {
      if (name === 'mioframe-write-probe.tmp' && options?.create) {
        return Promise.resolve(probeHandle);
      }
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    expect(rootHandle.removeEntryMock).toHaveBeenCalledWith('mioframe-write-probe.tmp', {
      recursive: false,
    });
  });

  it('ASCII write probe cleanup failure does not mask the original Automerge write failure', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const originalError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(originalError));
    const probeHandle = createFileHandleMock({
      name: 'mioframe-write-probe.tmp',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((name, options) => {
      if (name === 'mioframe-write-probe.tmp' && options?.create) {
        return Promise.resolve(probeHandle);
      }
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    rootHandle.removeEntryMock.mockImplementation((name) => {
      if (name === 'mioframe-write-probe.tmp') {
        return Promise.reject(new DOMException('Cleanup failed', 'NotFoundError'));
      }
      return Promise.resolve(undefined);
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toBe(originalError);
  });

  it('ASCII write probe success does not turn a failed repository save into success', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const originalError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(originalError));
    const probeHandle = createFileHandleMock({
      name: 'mioframe-write-probe.tmp',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((name, options) => {
      if (name === 'mioframe-write-probe.tmp' && options?.create) {
        return Promise.resolve(probeHandle);
      }
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toBe(originalError);
  });

  it('ASCII write probe emits breadcrumb steps for probe start, succeeded, and cleanup', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    // First two calls handle probe.amrg (lookup → not found, create → directHandle).
    // Subsequent calls use the default mock implementation, which adds mioframe-write-probe.tmp
    // to the entry map so cleanup can find and delete it.
    rootHandle.getFileHandleMock
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(directHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    const steps = onDiagnosticStep.mock.calls.map(([event]) => ({
      step: event.step,
      result: event.result,
    }));
    expect(steps).toContainEqual({ step: 'asciiWriteProbe', result: 'started' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeWritableOpen', result: 'started' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeWritableOpen', result: 'succeeded' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeWrite', result: 'succeeded' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeClose', result: 'succeeded' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbe', result: 'succeeded' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeCleanup', result: 'started' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeCleanup', result: 'succeeded' });
  });

  it('ASCII write probe emits breadcrumb steps for probe writable-open failure and cleanup', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const probeHandle = createFileHandleMock({
      name: 'mioframe-write-probe.tmp',
      permissionState: 'granted',
    });
    probeHandle.createWritable = vi.fn(() =>
      Promise.reject(new DOMException('Also invalid state', 'InvalidStateError')),
    );
    // Pre-populate the probe handle so the default mock finds it in the entry map and
    // cleanup (removeEntry) can succeed.
    const rootHandle = createDirectoryHandleMock({
      entries: [probeHandle],
      name: '',
      permissionState: 'granted',
    });
    // First two calls handle probe.amrg (lookup → not found, create → directHandle).
    // Subsequent calls use the default mock, which returns probeHandle for mioframe-write-probe.tmp.
    rootHandle.getFileHandleMock
      .mockRejectedValueOnce(new DOMException('Not found', 'NotFoundError'))
      .mockResolvedValueOnce(directHandle);
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    const steps = onDiagnosticStep.mock.calls.map(([event]) => ({
      step: event.step,
      result: event.result,
    }));
    expect(steps).toContainEqual({ step: 'asciiWriteProbe', result: 'started' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeWritableOpen', result: 'started' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeWritableOpen', result: 'failed' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbe', result: 'failed' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeCleanup', result: 'started' });
    expect(steps).toContainEqual({ step: 'asciiWriteProbeCleanup', result: 'succeeded' });
  });

  it('ASCII write probe breadcrumbs do not contain paths, filenames, document ids, or raw messages', async () => {
    const directHandle = createFileHandleMock({
      name: 'probe.amrg',
      permissionState: 'granted',
    });
    const openError = new DOMException('Invalid state', 'InvalidStateError');
    directHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const probeHandle = createFileHandleMock({
      name: 'mioframe-write-probe.tmp',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [],
      name: '',
      permissionState: 'granted',
    });
    rootHandle.getFileHandleMock.mockImplementation((name, options) => {
      if (name === 'mioframe-write-probe.tmp' && options?.create) {
        return Promise.resolve(probeHandle);
      }
      if (options?.create) {
        return Promise.resolve(directHandle);
      }
      return Promise.reject(new DOMException('Not found', 'NotFoundError'));
    });
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      writeStrategy: 'directCreateWriteProbe',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/probe.amrg', 'x', { create: true, overwrite: true }),
    ).rejects.toThrow(openError);

    const probeSteps = onDiagnosticStep.mock.calls
      .map(([event]) => event)
      .filter(
        (event) => typeof event.step === 'string' && event.step.startsWith('asciiWriteProbe'),
      );

    for (const step of probeSteps) {
      const serialized = JSON.stringify(step);
      // probeFileName when present must be only the basename (TODO(PR #85): remove after investigation)
      if (step.probeFileName !== undefined) {
        expect(step.probeFileName).toBe('mioframe-write-probe.tmp');
      }
      // real target file basename must not appear in probe steps
      expect(serialized).not.toContain('probe.amrg');
      // no full paths allowed
      expect(serialized).not.toContain('/');
      // no write content allowed
      expect(serialized).not.toContain('ok');
    }
  });
});
