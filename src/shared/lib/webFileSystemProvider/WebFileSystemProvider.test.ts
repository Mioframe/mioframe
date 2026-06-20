import { describe, expect, it, vi } from 'vitest';
import { createDirectoryHandleMock, createFileHandleMock } from './WebFileSystemProvider.testUtils';
import type { VfsEvent } from '../virtualFileSystem';
import { FileSystemError, FSNodeType } from '../virtualFileSystem';
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
  it('returns a minimal file stat from writeFile', async () => {
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

  it('uses the optimized create+overwrite write path without lookup, enumeration, or metadata reads', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', {
        create: true,
        overwrite: true,
      }),
    ).resolves.toEqual({
      stat: {
        type: FSNodeType.File,
      },
    });

    expect(rootHandle.getFileHandleMock).toHaveBeenCalledTimes(1);
    expect(rootHandle.getFileHandleMock).toHaveBeenCalledWith('note.txt', {
      create: true,
    });
    expect(rootHandle.entriesMock).not.toHaveBeenCalled();
    expect(rootHandle.removeEntryMock).not.toHaveBeenCalled();
    expect(fileHandle.getFileMock).not.toHaveBeenCalled();
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

  it('wraps createWritable failure in a VfsError when readwrite is still granted', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const storageError = new DOMException('Quota exceeded', 'QuotaExceededError');
    fileHandle.createWritable = vi.fn(() => Promise.reject(storageError));
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'x', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: FileSystemError.WriteStreamOpenFailed,
      cause: storageError,
      name: 'VfsError',
    });
  });

  it('wraps createWritable failure on the optimized path without rollback deletion', async () => {
    const openError = new DOMException('quota exceeded', 'QuotaExceededError');
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    createdHandle.createWritable = vi.fn(() => Promise.reject(openError));
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    const getFileHandleMock = vi.fn((fileName: string, options?: FileSystemGetFileOptions) => {
      expect(fileName).toBe('note.txt');
      expect(options).toEqual({ create: true });
      return Promise.resolve(createdHandle);
    });
    parentHandle.getFileHandle = getFileHandleMock;
    parentHandle.getFileHandleMock = getFileHandleMock;
    const onDiagnosticStep = vi.fn();
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onDiagnosticStep,
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: FileSystemError.WriteStreamOpenFailed,
      cause: openError,
      name: 'VfsError',
    });

    expect(parentHandle.getFileHandleMock).toHaveBeenCalledTimes(1);
    expect(parentHandle.getFileHandleMock).toHaveBeenCalledWith('note.txt', { create: true });
    expect(parentHandle.entriesMock).not.toHaveBeenCalled();
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
    expect(createdHandle.getFileMock).not.toHaveBeenCalled();
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).toContainEqual(
      expect.objectContaining({
        result: 'failed',
        step: 'writableOpen',
        error: openError,
      }),
    );
  });

  it('does not clean up a newly created file after a successful optimized write', async () => {
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    const getFileHandleMock = vi.fn((fileName: string, options?: FileSystemGetFileOptions) => {
      expect(fileName).toBe('note.txt');
      expect(options).toEqual({ create: true });
      return Promise.resolve(createdHandle);
    });
    parentHandle.getFileHandle = getFileHandleMock;
    parentHandle.getFileHandleMock = getFileHandleMock;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(parentHandle.getFileHandleMock).toHaveBeenCalledTimes(1);
    expect(parentHandle.getFileHandleMock).toHaveBeenCalledWith('note.txt', { create: true });
    expect(parentHandle.entriesMock).not.toHaveBeenCalled();
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
    expect(createdHandle.getFileMock).not.toHaveBeenCalled();
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
    ).rejects.toMatchObject({
      code: FileSystemError.WriteStreamOpenFailed,
      cause: openError,
      name: 'VfsError',
    });

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
    ).rejects.toMatchObject({
      code: FileSystemError.WriteStreamOpenFailed,
      cause: openError,
      name: 'VfsError',
    });

    expect(createWritableMock).toHaveBeenCalledTimes(1);
    expect(onDiagnosticStep.mock.calls.map(([event]) => event)).not.toContainEqual(
      expect.objectContaining({ step: 'writableCompatibilityOpen' }),
    );
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
  });

  it('does not clean up files after optimized-path write failures', async () => {
    const writeError = new DOMException('quota exceeded', 'QuotaExceededError');
    const createdHandle = createFileHandleMock({ name: 'new.txt', permissionState: 'granted' });
    createdHandle.createWritable = vi.fn(async () => {
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
    parentHandle.getFileHandle = vi.fn((fileName: string, options?: FileSystemGetFileOptions) => {
      expect(options).toEqual({ create: true });
      if (fileName === 'new.txt') {
        return Promise.resolve(createdHandle);
      }
      if (fileName === 'old.txt') {
        return Promise.resolve(existingHandle);
      }
      throw new Error(`Unexpected file lookup: ${fileName}`);
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
      provider.writeFile('/docs/new.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(writeError);
    await expect(
      provider.writeFile('/docs/old.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toBe(writeError);

    expect(parentHandle.entriesMock).not.toHaveBeenCalled();
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
  });

  it('preserves the original createWritable cause without attempting optimized-path cleanup', async () => {
    const writeError = new DOMException('quota exceeded', 'QuotaExceededError');
    const createdHandle = createFileHandleMock({ name: 'note.txt', permissionState: 'granted' });
    createdHandle.createWritable = vi.fn(() => Promise.reject(writeError));
    const parentHandle = createDirectoryHandleMock({
      name: 'docs',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [parentHandle],
      name: '',
      permissionState: 'granted',
    });
    parentHandle.getFileHandle = vi.fn((fileName: string, options?: FileSystemGetFileOptions) => {
      expect(fileName).toBe('note.txt');
      expect(options).toEqual({ create: true });
      return Promise.resolve(createdHandle);
    });
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/docs/note.txt', 'fresh', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: FileSystemError.WriteStreamOpenFailed,
      cause: writeError,
      name: 'VfsError',
    });
    expect(parentHandle.entriesMock).not.toHaveBeenCalled();
    expect(parentHandle.removeEntryMock).not.toHaveBeenCalled();
    expect(createdHandle.getFileMock).not.toHaveBeenCalled();
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
      error: writeError,
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
      error: closeError,
    });
  });

  it('emits the fileWrite failed diagnostic step exactly once per write failure', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const writeError = new DOMException('quota exceeded', 'QuotaExceededError');
    const onDiagnosticStep = vi.fn();
    fileHandle.createWritable = vi.fn(async () => {
      const writable = await createFileHandleMock({
        name: 'note.txt',
        permissionState: 'granted',
      }).createWritable();
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

    const fileWriteFailedCalls = onDiagnosticStep.mock.calls.filter(
      ([event]) => event.step === 'fileWrite' && event.result === 'failed',
    );
    expect(fileWriteFailedCalls).toHaveLength(1);
  });

  it('does not read file metadata after a successful overwrite write', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted');
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
    });

    await expect(
      provider.writeFile('/note.txt', 'fresh', { create: true, overwrite: true }),
    ).resolves.toMatchObject({ stat: { type: FSNodeType.File } });

    expect(rootHandle.getFileHandleMock).toHaveBeenCalledTimes(1);
    expect(fileHandle.getFileMock).not.toHaveBeenCalled();
  });

  it('does not retry non-InvalidStateError writable-open failures', async () => {
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
    ).rejects.toMatchObject({
      code: FileSystemError.WriteStreamOpenFailed,
      cause: storageError,
      name: 'VfsError',
    });
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
      message: 'Source not found.',
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

  it('resolves successfully when getFile would fail after the write stream closes', async () => {
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
    expect(fileHandle.getFileMock).not.toHaveBeenCalled();
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
