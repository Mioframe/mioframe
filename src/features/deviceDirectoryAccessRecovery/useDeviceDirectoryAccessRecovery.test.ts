import { afterEach, describe, expect, it, vi } from 'vitest';
import { effectScope, ref, type Ref } from 'vue';

const requestAccessMock = vi.fn();

vi.mock('@shared/service/fileSystemClient', () => ({
  useFileSystemAccessPermissionBroker: () => ({
    requestAccess: requestAccessMock,
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
    requestAccessMock.mockReset();
  });

  it('does not request permission before the user clicks grant access', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);

    const { recovery, scope } = await mountRecovery(errors);

    expect(requestAccessMock).not.toHaveBeenCalled();
    expect(recovery.grantDisabled.value).toBe(false);

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
    expect(requestAccessMock).not.toHaveBeenCalled();

    scope.stop();
  });

  it('clears the safe message when the recovery key changes', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    requestAccessMock.mockResolvedValue({ status: 'denied' });

    const { recovery, scope } = await mountRecovery(errors);

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'denied' });

    errors.value = [
      createSerializedRecoveryError({
        spaceName: 'Archive',
        mode: 'readwrite',
      }),
    ];
    await Promise.resolve();

    expect(recovery.message.value).toBeUndefined();
    expect(recovery.recoveryState.value).toEqual({
      operation: 'write',
      spaceName: 'Archive',
    });

    scope.stop();
  });

  it('calls requestAccess and resolves granted access', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    requestAccessMock.mockResolvedValue({ status: 'granted' });

    const { recovery, scope } = await mountRecovery(errors);

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'granted' });
    expect(requestAccessMock).toHaveBeenCalledWith({
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
    requestAccessMock.mockResolvedValue({ status: 'denied' });

    const { recovery, scope } = await mountRecovery(errors);

    await expect(recovery.grantAccess()).resolves.toMatchObject({ status: 'denied' });
    expect(recovery.message.value).toBe(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
    expect(requestAccessMock).toHaveBeenCalledTimes(1);

    scope.stop();
  });

  it('shows safe error message and re-primes the request when browser prompting fails', async () => {
    const errors = ref<unknown[]>([
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ]);
    requestAccessMock.mockResolvedValue({ status: 'error' });

    const { recovery, scope } = await mountRecovery(errors);

    await expect(recovery.grantAccess()).resolves.toEqual({ status: 'error' });
    expect(recovery.message.value).toBe(
      'Could not request browser permission. Try again from this action.',
    );
    expect(requestAccessMock).toHaveBeenCalledTimes(1);

    scope.stop();
  });
});
