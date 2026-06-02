import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type Ref } from 'vue';

const clearPreparedRequestMock = vi.fn();
const prepareAccessRequestMock = vi.fn();
const requestPreparedAccessMock = vi.fn();
const hasPreparedRequestRef = ref(false);

vi.mock('@shared/service/fileSystem', () => ({
  useFileSystemAccessPermissionBroker: () => ({
    clearPreparedRequest: clearPreparedRequestMock,
    hasPreparedRequest: hasPreparedRequestRef,
    prepareAccessRequest: prepareAccessRequestMock,
    requestPreparedAccess: requestPreparedAccessMock,
  }),
}));

const createSerializedRecoveryError = ({
  mode,
  spaceName,
}: {
  mode: 'read' | 'readwrite';
  spaceName: string;
}) =>
  Object.assign(new Error('Permission required to open this remembered local space'), {
    code: 'web-file-system-access-required',
    mode,
    name: 'WebFileSystemAccessRequiredError',
    spaceName,
  });

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
    clearPreparedRequestMock.mockReset();
    prepareAccessRequestMock.mockReset();
    requestPreparedAccessMock.mockReset();
    hasPreparedRequestRef.value = false;
  });

  it('prepares the pending request through the main-thread broker', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    prepareAccessRequestMock.mockResolvedValue({
      operation: 'write',
      spaceName: 'Work',
    });
    hasPreparedRequestRef.value = true;

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(prepareAccessRequestMock).toHaveBeenCalledWith({
        operation: 'write',
        spaceName: 'Work',
      });
      expect(recovery.grantDisabled.value).toBe(false);
    });

    scope.stop();
  });

  it('does not prepare anything when there is no recovery state', async () => {
    const errors = ref<unknown[]>([]);

    const { recovery, scope } = await mountRecovery(errors);

    expect(recovery.recoveryState.value).toBeUndefined();
    expect(recovery.recoveryMessage.value).toBe('');
    await expect(recovery.grantAccess()).resolves.toEqual({
      status: 'missing',
    });
    expect(prepareAccessRequestMock).not.toHaveBeenCalled();
    expect(requestPreparedAccessMock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('ignores stale async prepare results when the recovery key changes', async () => {
    let resolveWork: ((value: unknown) => void) | undefined;
    let resolveArchive: ((value: unknown) => void) | undefined;
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    prepareAccessRequestMock.mockImplementation(
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
      createSerializedRecoveryError({
        spaceName: 'Archive',
        mode: 'readwrite',
      }),
    ];
    await Promise.resolve();

    hasPreparedRequestRef.value = true;
    resolveWork?.({ operation: 'write', spaceName: 'Work' });
    resolveArchive?.({ operation: 'write', spaceName: 'Archive' });

    await vi.waitFor(() => {
      expect(prepareAccessRequestMock).toHaveBeenCalledWith({
        operation: 'write',
        spaceName: 'Archive',
      });
      expect(recovery.recoveryState.value).toEqual({
        operation: 'write',
        spaceName: 'Archive',
      });
    });

    scope.stop();
  });

  it('calls requestPreparedAccess and resolves granted access', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    prepareAccessRequestMock.mockResolvedValue({
      operation: 'write',
      spaceName: 'Work',
    });
    requestPreparedAccessMock.mockResolvedValue({ status: 'granted' });
    hasPreparedRequestRef.value = true;

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'granted' });
    expect(requestPreparedAccessMock).toHaveBeenCalledWith({
      operation: 'write',
      spaceName: 'Work',
    });
    expect(recovery.message.value).toBeUndefined();

    scope.stop();
  });

  it('keeps recovery active after denial and exposes a safe message', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    prepareAccessRequestMock.mockResolvedValue({
      operation: 'write',
      spaceName: 'Work',
    });
    requestPreparedAccessMock.mockResolvedValue({ status: 'denied' });
    hasPreparedRequestRef.value = true;

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toMatchObject({ status: 'denied' });
    expect(recovery.message.value).toBe(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
    expect(prepareAccessRequestMock).toHaveBeenCalledTimes(2);

    scope.stop();
  });

  it('shows safe error message and re-primes the request when browser prompting fails', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    prepareAccessRequestMock.mockResolvedValue({
      operation: 'write',
      spaceName: 'Work',
    });
    requestPreparedAccessMock.mockResolvedValue({ status: 'error' });
    hasPreparedRequestRef.value = true;

    const { recovery, scope } = await mountRecovery(errors);

    await vi.waitFor(() => {
      expect(recovery.grantDisabled.value).toBe(false);
    });

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'error' });
    expect(recovery.message.value).toBe(
      'Could not request browser permission. Try again from this action.',
    );
    expect(prepareAccessRequestMock).toHaveBeenCalledTimes(2);

    scope.stop();
  });
});
