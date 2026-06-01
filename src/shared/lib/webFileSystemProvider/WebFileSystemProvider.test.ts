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
      [
        'note.txt',
        {
          capabilities: {
            canChangePath: true,
            canDelete: true,
          },
          creationTime: 123,
          modificationTime: 123,
          size: 5,
          type: FSNodeType.File,
        },
      ],
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

    provider.notifyAccessChanged();
    unsubscribe?.();

    expect(events).toContainEqual({
      source: 'provider',
      type: 'update',
      path: '/',
    });
    expect(rootHandle.requestPermissionMock).not.toHaveBeenCalled();
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
      [
        'note.txt',
        {
          capabilities: {
            canChangePath: true,
            canDelete: true,
          },
          creationTime: 123,
          modificationTime: 123,
          size: 5,
          type: FSNodeType.File,
        },
      ],
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
