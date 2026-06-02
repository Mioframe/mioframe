import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type Ref } from 'vue';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const cancelFileSystemAccessRequestMock = vi.fn();
const getFileSystemAccessRequestMock = vi.fn();
const requestFileSystemAccessMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      cancelFileSystemAccessRequest: cancelFileSystemAccessRequestMock,
      getFileSystemAccessRequest: getFileSystemAccessRequestMock,
      requestFileSystemAccess: requestFileSystemAccessMock,
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
    cancelFileSystemAccessRequestMock.mockReset();
    getFileSystemAccessRequestMock.mockReset();
    requestFileSystemAccessMock.mockReset();
  });

  it('loads the pending request by stable access key without handle', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getFileSystemAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      operation: 'write',
    });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(getFileSystemAccessRequestMock).toHaveBeenCalledWith({
        operation: 'write',
        spaceName: 'Work',
      });
      expect(recovery.pendingRequest.value).toEqual({
        spaceName: 'Work',
        operation: 'write',
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
    expect(getFileSystemAccessRequestMock).not.toHaveBeenCalled();
    expect(cancelFileSystemAccessRequestMock).not.toHaveBeenCalled();
    expect(requestFileSystemAccessMock).not.toHaveBeenCalled();

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
    getFileSystemAccessRequestMock.mockImplementation(
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

    resolveWork?.({ spaceName: 'Work', operation: 'write' });
    resolveArchive?.({ spaceName: 'Archive', operation: 'write' });

    await vi.waitFor(() => {
      expect(recovery.pendingRequest.value).toEqual({
        spaceName: 'Archive',
        operation: 'write',
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
    getFileSystemAccessRequestMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveWork = resolve;
        }),
    );

    const { recovery, scope } = await mountRecovery(errors);

    errors.value = [];
    await Promise.resolve();

    resolveWork?.({ spaceName: 'Work', operation: 'write' });
    await Promise.resolve();

    expect(recovery.pendingRequest.value).toBeUndefined();

    scope.stop();
  });

  it('calls requestFileSystemAccess and resolves granted access', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getFileSystemAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      operation: 'write',
    });
    requestFileSystemAccessMock.mockResolvedValue({ status: 'granted' });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'granted' });
    expect(requestFileSystemAccessMock).toHaveBeenCalledWith({
      operation: 'write',
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
    getFileSystemAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      operation: 'write',
    });
    requestFileSystemAccessMock.mockResolvedValue({ status: 'denied' });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toMatchObject({ status: 'denied' });
    expect(recovery.message.value).toBe(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
    expect(recovery.recoveryState.value).toEqual({
      operation: 'write',
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
    getFileSystemAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      operation: 'write',
    });
    requestFileSystemAccessMock.mockResolvedValue({ status: 'error' });

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'error' });
    expect(recovery.message.value).toBe(
      'Could not request browser permission. Try again from this action.',
    );
    expect(recovery.pendingRequest.value).toEqual({ spaceName: 'Work', operation: 'write' });

    scope.stop();
  });

  it('resets loading state after permission request returns error', async () => {
    const errors = ref<unknown[]>([
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    getFileSystemAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      operation: 'write',
    });
    requestFileSystemAccessMock.mockResolvedValue({ status: 'error' });

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
    cancelFileSystemAccessRequestMock.mockResolvedValue(true);
    getFileSystemAccessRequestMock.mockResolvedValue(undefined);

    const { recovery, scope } = await mountRecovery(errors);

    await expect(recovery.cancelAccess()).resolves.toBe(true);
    expect(cancelFileSystemAccessRequestMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });

    scope.stop();
  });
});
