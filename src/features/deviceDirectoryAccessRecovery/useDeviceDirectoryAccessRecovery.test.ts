import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type Ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const cancelDeviceDirectoryAccessRequestMock = vi.fn();
const getDeviceDirectoryAccessRequestMock = vi.fn();
const requestDeviceDirectoryAccessPermissionMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      cancelDeviceDirectoryAccessRequest: cancelDeviceDirectoryAccessRequestMock,
      getDeviceDirectoryAccessRequest: getDeviceDirectoryAccessRequestMock,
      requestDeviceDirectoryAccessPermission: requestDeviceDirectoryAccessPermissionMock,
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
    requestDeviceDirectoryAccessPermissionMock.mockReset();
  });

  it('loads the pending request by stable access key without handle', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
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
    expect(requestDeviceDirectoryAccessPermissionMock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('ignores stale async request loads when the active recovery key changes', async () => {
    let resolveWork: ((value: unknown) => void) | undefined;
    let resolveArchive: ((value: unknown) => void) | undefined;
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

    resolveWork?.({ spaceName: 'Work', mode: 'readwrite' });
    resolveArchive?.({ spaceName: 'Archive', mode: 'readwrite' });

    await vi.waitFor(() => {
      expect(recovery.pendingRequest.value).toEqual({
        spaceName: 'Archive',
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

    resolveWork?.({ spaceName: 'Work', mode: 'readwrite' });
    await Promise.resolve();

    expect(recovery.pendingRequest.value).toBeUndefined();

    scope.stop();
  });

  it('calls requestDeviceDirectoryAccessPermission and resolves granted access', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      mode: 'readwrite',
    });
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'granted' });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'granted' });
    expect(requestDeviceDirectoryAccessPermissionMock).toHaveBeenCalledWith({
      mode: 'readwrite',
      spaceName: 'Work',
    });
    expect(recovery.message.value).toBeUndefined();

    scope.stop();
  });

  it('keeps recovery active after denial and exposes a safe message', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      mode: 'readwrite',
    });
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'denied' });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toMatchObject({ status: 'denied' });
    expect(recovery.message.value).toBe(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
    expect(recovery.recoveryState.value).toEqual({
      mode: 'readwrite',
      spaceName: 'Work',
    });

    scope.stop();
  });

  it('shows safe error message and keeps pending request when permission request returns error', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      mode: 'readwrite',
    });
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'error' });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'error' });
    expect(recovery.message.value).toBe(
      'Could not request browser permission. Try again from this action.',
    );
    expect(recovery.pendingRequest.value).toEqual({ spaceName: 'Work', mode: 'readwrite' });

    scope.stop();
  });

  it('resets loading state after permission request returns error', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      mode: 'readwrite',
    });
    requestDeviceDirectoryAccessPermissionMock.mockResolvedValue({ status: 'error' });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await recovery.grantAccess();

    expect(recovery.isGrantLoading.value).toBe(false);

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
