import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type Ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const cancelDeviceDirectoryAccessRequestMock = vi.fn();
const getDeviceDirectoryAccessRequestMock = vi.fn();
const resolveDeviceDirectoryAccessRequestMock = vi.fn();

type MockDirectoryHandle = FileSystemDirectoryHandle & {
  requestPermissionMock: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
};

const createHandle = (permissionState: PermissionState): MockDirectoryHandle => {
  const requestPermissionMock = vi.fn(() => Promise.resolve(permissionState));

  return {
    kind: 'directory',
    name: 'Work',
    isSameEntry: vi.fn(() => Promise.resolve(false)),
    requestPermission: requestPermissionMock,
    requestPermissionMock,
    queryPermission: vi.fn(() => Promise.resolve(permissionState)),
    isFile: false,
    isDirectory: true,
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    getDirectoryHandle: vi.fn(),
    getFileHandle: vi.fn(),
    removeEntry: vi.fn(),
    resolve: vi.fn(),
    getFile(fileName: string, options?: FileSystemGetFileOptions) {
      return this.getFileHandle(fileName, options);
    },
    getDirectory(directoryName: string, options?: FileSystemGetDirectoryOptions) {
      return this.getDirectoryHandle(directoryName, options);
    },
    getEntries() {
      return this.values();
    },
    [Symbol.asyncIterator]() {
      return this.entries();
    },
  };
};

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      cancelDeviceDirectoryAccessRequest: cancelDeviceDirectoryAccessRequestMock,
      getDeviceDirectoryAccessRequest: getDeviceDirectoryAccessRequestMock,
      resolveDeviceDirectoryAccessRequest: resolveDeviceDirectoryAccessRequestMock,
    },
  }),
}));

const mountRecovery = async (errors: Ref<unknown[]>) => {
  const scope = effectScope();
  let recovery:
    | ReturnType<
        typeof import('./useDeviceDirectoryAccessRecovery').useDeviceDirectoryAccessRecovery
      >
    | undefined;
  const { useDeviceDirectoryAccessRecovery } = await import('./useDeviceDirectoryAccessRecovery');

  scope.run(() => {
    recovery = useDeviceDirectoryAccessRecovery({ errors });
  });

  await Promise.resolve();

  if (!recovery) {
    throw new Error('Expected recovery composable');
  }

  return {
    recovery,
    scope,
  };
};

describe('useDeviceDirectoryAccessRecovery', () => {
  afterEach(() => {
    cancelDeviceDirectoryAccessRequestMock.mockReset();
    getDeviceDirectoryAccessRequestMock.mockReset();
    resolveDeviceDirectoryAccessRequestMock.mockReset();
  });

  it('loads the pending request by stable access key', async () => {
    const handle = createHandle('granted');
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      handle,
      mode: 'readwrite',
    });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(getDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
        mode: 'readwrite',
        spaceName: 'Work',
      });
      expect(recovery.pendingRequest.value).toEqual({
        spaceName: 'Work',
        handle,
        mode: 'readwrite',
      });
    });

    scope.stop();
  });

  it('does not load or cancel anything when there is no recovery state', async () => {
    const errors = ref<unknown[]>([]);

    const { recovery, scope } = await mountRecovery(errors);

    expect(recovery.recoveryState.value).toBeUndefined();
    expect(recovery.recoveryMessage.value).toBe('');
    await expect(recovery.grantAccess()).resolves.toEqual({
      status: 'missing',
    });
    await expect(recovery.cancelAccess()).resolves.toBe(false);
    expect(getDeviceDirectoryAccessRequestMock).not.toHaveBeenCalled();
    expect(cancelDeviceDirectoryAccessRequestMock).not.toHaveBeenCalled();
    expect(resolveDeviceDirectoryAccessRequestMock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('ignores stale async request loads when the active recovery key changes', async () => {
    let resolveWork: ((value: unknown) => void) | undefined;
    let resolveArchive: ((value: unknown) => void) | undefined;
    const archiveHandle = createHandle('granted');
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockImplementation(
      ({ spaceName }: { spaceName: string }) =>
        new Promise((resolve) => {
          if (spaceName === 'Work') {
            resolveWork = resolve;
            return;
          }

          resolveArchive = resolve;
        }),
    );

    const { recovery, scope } = await mountRecovery(errors);

    errors.value = [
      new WebFileSystemAccessRequiredError({
        spaceName: 'Archive',
        mode: 'readwrite',
      }),
    ];
    await Promise.resolve();

    resolveWork?.({
      spaceName: 'Work',
      handle: createHandle('granted'),
      mode: 'readwrite',
    });
    resolveArchive?.({
      spaceName: 'Archive',
      handle: archiveHandle,
      mode: 'readwrite',
    });

    await vi.waitFor(() => {
      expect(recovery.pendingRequest.value).toEqual({
        spaceName: 'Archive',
        handle: archiveHandle,
        mode: 'readwrite',
      });
    });

    scope.stop();
  });

  it('ignores late request loads after the watcher cleanup runs', async () => {
    let resolveWork: ((value: unknown) => void) | undefined;
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWork = resolve;
        }),
    );

    const { recovery, scope } = await mountRecovery(errors);

    errors.value = [];
    await Promise.resolve();

    resolveWork?.({
      spaceName: 'Work',
      handle: createHandle('granted'),
      mode: 'readwrite',
    });
    await Promise.resolve();

    expect(recovery.pendingRequest.value).toBeUndefined();

    scope.stop();
  });

  it('requests permission on the loaded handle and resolves granted access', async () => {
    const handle = createHandle('granted');
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      handle,
      mode: 'readwrite',
    });
    resolveDeviceDirectoryAccessRequestMock.mockResolvedValue({
      request: {
        spaceName: 'Work',
        handle,
        mode: 'readwrite',
      },
      status: 'granted',
    });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toEqual({
      request: {
        spaceName: 'Work',
        handle,
        mode: 'readwrite',
      },
      status: 'granted',
    });
    expect(handle.requestPermissionMock).toHaveBeenCalledWith({
      mode: 'readwrite',
    });
    expect(resolveDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      permissionState: 'granted',
      spaceName: 'Work',
    });

    scope.stop();
  });

  it('keeps recovery active after denial and exposes a safe message', async () => {
    const handle = createHandle('denied');
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      handle,
      mode: 'readwrite',
    });
    resolveDeviceDirectoryAccessRequestMock.mockResolvedValue({
      request: {
        spaceName: 'Work',
        handle,
        mode: 'readwrite',
      },
      status: 'denied',
    });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toMatchObject({
      status: 'denied',
    });
    expect(recovery.message.value).toBe(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
    expect(recovery.recoveryState.value).toEqual({
      mode: 'readwrite',
      spaceName: 'Work',
    });

    scope.stop();
  });

  it('keeps the loaded request when denial returns no replacement request', async () => {
    const handle = createHandle('denied');
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      handle,
      mode: 'readwrite',
    });
    resolveDeviceDirectoryAccessRequestMock.mockResolvedValue({
      request: undefined,
      status: 'denied',
    });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.pendingRequest.value?.spaceName).toBe('Work');
    });

    await recovery.grantAccess();

    expect(recovery.pendingRequest.value).toEqual({
      spaceName: 'Work',
      handle,
      mode: 'readwrite',
    });

    scope.stop();
  });

  it('cancels the pending request with the stable access key', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    cancelDeviceDirectoryAccessRequestMock.mockResolvedValue(true);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue(undefined);

    const { recovery, scope } = await mountRecovery(errors);

    await expect(recovery.cancelAccess()).resolves.toBe(true);
    expect(cancelDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      spaceName: 'Work',
    });

    scope.stop();
  });
});
