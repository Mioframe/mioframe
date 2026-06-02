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

const createPermissionStateDriver = (
  initialReadWritePermission: PermissionState,
  initialReadPermission: PermissionState = initialReadWritePermission,
) => {
  let readwritePermission = initialReadWritePermission;
  let readPermission = initialReadPermission;

  return {
    setReadPermission(nextPermission: PermissionState) {
      readPermission = nextPermission;
    },
    setReadwritePermission(nextPermission: PermissionState) {
      readwritePermission = nextPermission;
    },
    queryPermission: vi.fn((descriptor?: FileSystemHandlePermissionDescriptor) =>
      Promise.resolve(descriptor?.mode === 'read' ? readPermission : readwritePermission),
    ),
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

  it('buffers blocked writeFile payloads and still throws until a later granted flush succeeds', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted', 'granted');
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'blocked-write', { create: true, overwrite: true }),
    ).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
    });
    expect(fileHandle.__writtenContent).toEqual(['hello']);

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await vi.waitFor(() => {
      expect(fileHandle.__writtenContent).toEqual(['blocked-write']);
    });
  });

  it('replaces same-path buffered writes with the latest payload', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted', 'granted');
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'first', { create: true, overwrite: true }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);
    await expect(
      provider.writeFile('//note.txt', 'second', { create: true, overwrite: true }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await vi.waitFor(() => {
      expect(fileHandle.__writtenContent).toEqual(['second']);
    });
  });

  it('keeps the previous same-path buffered write when the replacement exceeds the byte limit', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted', 'granted');
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'fits', { create: true, overwrite: true }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);
    await expect(
      provider.writeFile('/note.txt', new Uint8Array(33 * 1024 * 1024), {
        create: true,
        overwrite: true,
      }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await vi.waitFor(() => {
      expect(fileHandle.__writtenContent).toEqual(['fits']);
    });
  });

  it('flushes different buffered paths in insertion order', async () => {
    const alphaFileHandle = createFileHandleMock({
      fileContent: ['alpha-original'],
      name: 'alpha.txt',
      permissionState: 'granted',
    });
    const betaFileHandle = createFileHandleMock({
      fileContent: ['beta-original'],
      name: 'beta.txt',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [alphaFileHandle, betaFileHandle],
      name: '',
      permissionState: 'granted',
      readPermissionState: 'granted',
    });
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const writeOrder: string[] = [];
    alphaFileHandle.createWritable = vi.fn(() =>
      Promise.resolve({
        abort: vi.fn(),
        close: vi.fn(() => Promise.resolve(undefined)),
        getWriter: () => new WritableStream().getWriter(),
        locked: false,
        seek: vi.fn(),
        truncate: vi.fn(),
        write: vi.fn(() => {
          writeOrder.push('alpha');
          return Promise.resolve(undefined);
        }),
      }),
    );
    betaFileHandle.createWritable = vi.fn(() =>
      Promise.resolve({
        abort: vi.fn(),
        close: vi.fn(() => Promise.resolve(undefined)),
        getWriter: () => new WritableStream().getWriter(),
        locked: false,
        seek: vi.fn(),
        truncate: vi.fn(),
        write: vi.fn(() => {
          writeOrder.push('beta');
          return Promise.resolve(undefined);
        }),
      }),
    );
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/alpha.txt', 'alpha-next', { create: true, overwrite: true }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);
    await expect(
      provider.writeFile('/beta.txt', 'beta-next', { create: true, overwrite: true }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await vi.waitFor(() => {
      expect(writeOrder).toEqual(['alpha', 'beta']);
    });
  });

  it('does not buffer a new path after 64 buffered paths and keeps existing entries', async () => {
    const fileHandles = Array.from({ length: 65 }, (_, index) =>
      createFileHandleMock({
        fileContent: [`original-${index}`],
        name: `note-${index}.txt`,
        permissionState: 'granted',
      }),
    );
    const rootHandle = createDirectoryHandleMock({
      entries: fileHandles,
      name: '',
      permissionState: 'granted',
      readPermissionState: 'granted',
    });
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await Array.from({ length: 65 }, (_, index) => index).reduce<Promise<void>>(
      async (previousWrite, index) => {
        await previousWrite;
        await expect(
          provider.writeFile(`/note-${index}.txt`, `next-${index}`, {
            create: true,
            overwrite: true,
          }),
        ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);
      },
      Promise.resolve(),
    );

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await vi.waitFor(() => {
      expect(fileHandles[0]?.__writtenContent).toEqual(['next-0']);
      expect(fileHandles[63]?.__writtenContent).toEqual(['next-63']);
      expect(fileHandles[64]?.__writtenContent).toEqual(['original-64']);
    });
  });

  it('does not buffer a write exceeding the 32 MiB byte limit', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted', 'granted');
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', new Uint8Array(33 * 1024 * 1024), {
        create: true,
        overwrite: true,
      }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await Promise.resolve();
    expect(fileHandle.__writtenContent).toEqual(['hello']);
  });

  it('does not buffer a new write exceeding the remaining 32 MiB byte budget and keeps existing entries', async () => {
    const alphaFileHandle = createFileHandleMock({
      fileContent: ['alpha-original'],
      name: 'alpha.bin',
      permissionState: 'granted',
    });
    const betaFileHandle = createFileHandleMock({
      fileContent: ['beta-original'],
      name: 'beta.bin',
      permissionState: 'granted',
    });
    const rootHandle = createDirectoryHandleMock({
      entries: [alphaFileHandle, betaFileHandle],
      name: '',
      permissionState: 'granted',
      readPermissionState: 'granted',
    });
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });
    const twentyMiB = 20 * 1024 * 1024;

    await expect(
      provider.writeFile('/alpha.bin', new Uint8Array(twentyMiB), {
        create: true,
        overwrite: true,
      }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);
    await expect(
      provider.writeFile('/beta.bin', new Uint8Array(twentyMiB), {
        create: true,
        overwrite: true,
      }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await vi.waitFor(() => {
      expect(alphaFileHandle.__writtenContent).toEqual([expect.any(Uint8Array)]);
      expect(betaFileHandle.__writtenContent).toEqual(['beta-original']);
    });
  });

  it('keeps permission-blocked buffered writes for a later grant', async () => {
    const { fileHandle, rootHandle } = createRootHandle('granted', 'granted');
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(
      provider.writeFile('/note.txt', 'retry-me', { create: true, overwrite: true }),
    ).rejects.toBeInstanceOf(WebFileSystemAccessRequiredError);

    provider.notifyAccessChanged();
    await Promise.resolve();
    expect(fileHandle.__writtenContent).toEqual(['hello']);

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();

    await vi.waitFor(() => {
      expect(fileHandle.__writtenContent).toEqual(['retry-me']);
    });
  });

  it('does not buffer non-write operations after permission recovery', async () => {
    const rootHandle = createDirectoryHandleMock({
      name: '',
      permissionState: 'granted',
      readPermissionState: 'granted',
    });
    const permissionDriver = createPermissionStateDriver('prompt', 'granted');
    rootHandle.queryPermission = permissionDriver.queryPermission;
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'userSelectedDirectory',
      onAccessRequired: ({ mode }) => ({ spaceName: 'Work', mode }),
    });

    await expect(provider.createDirectory('/new')).rejects.toMatchObject({
      code: WEB_FILE_SYSTEM_ACCESS_REQUIRED_CODE,
      mode: 'readwrite',
    });

    permissionDriver.setReadwritePermission('granted');
    provider.notifyAccessChanged();
    await Promise.resolve();

    expect(rootHandle.getDirectoryHandleMock).not.toHaveBeenCalledWith('new', { create: true });
  });

  it('does not buffer originPrivateStorage writeFile calls', async () => {
    const { fileHandle, rootHandle } = createRootHandle('prompt', 'granted');
    const onAccessRequired = vi.fn(({ mode }: { mode: 'read' | 'readwrite' }) => ({
      spaceName: 'Work',
      mode,
    }));
    const provider = WebFileSystemProvider(rootHandle, {
      permissionPolicy: 'originPrivateStorage',
      onAccessRequired,
    });

    await expect(
      provider.writeFile('/note.txt', 'opfs-write', { create: true, overwrite: true }),
    ).resolves.toMatchObject({
      stat: {
        type: FSNodeType.File,
      },
    });
    provider.notifyAccessChanged();

    await Promise.resolve();
    expect(fileHandle.__writtenContent).toEqual(['opfs-write']);
    expect(onAccessRequired).not.toHaveBeenCalled();
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
