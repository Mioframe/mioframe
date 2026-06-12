import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, ref } from 'vue';
import type { FileSystemAccessRecovery } from '@shared/lib/fileSystem';

const requestAccessMock = vi.fn();

vi.mock('@shared/serviceClient/fileSystem', () => ({
  useFileSystemAccessPermissionBroker: () => ({
    requestAccess: requestAccessMock,
  }),
}));

const flushMicrotasks = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

const mountAction = async (recovery: FileSystemAccessRecovery | undefined) => {
  const scope = effectScope();
  const recoveryRef = ref<FileSystemAccessRecovery | undefined>(recovery);
  let action:
    | ReturnType<typeof import('./useLocalDirectoryRecoveryAction').useLocalDirectoryRecoveryAction>
    | undefined;

  const { useLocalDirectoryRecoveryAction } = await import('./useLocalDirectoryRecoveryAction');

  scope.run(() => {
    action = useLocalDirectoryRecoveryAction({
      recovery: computed(() => recoveryRef.value),
    });
  });

  if (!action) {
    throw new Error('Expected local directory recovery action');
  }

  return {
    action,
    recoveryRef,
    scope,
  };
};

describe('useLocalDirectoryRecoveryAction', () => {
  afterEach(() => {
    requestAccessMock.mockReset();
  });

  it('requests read permission explicitly from the secondary action', async () => {
    requestAccessMock.mockResolvedValue({ status: 'granted' });
    const { action, scope } = await mountAction({
      operation: 'read',
      spaceName: 'Work',
    });

    await expect(action.grantReadOnlyAccess()).resolves.toEqual({ status: 'granted' });

    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'read',
      requestedMode: 'read',
      spaceName: 'Work',
    });

    scope.stop();
  });

  it('requests readwrite permission explicitly from the primary action', async () => {
    requestAccessMock.mockResolvedValue({ status: 'granted' });
    const { action, scope } = await mountAction({
      operation: 'read',
      spaceName: 'Work',
    });

    await expect(action.grantFullAccess()).resolves.toEqual({ status: 'granted' });

    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'read',
      requestedMode: 'readwrite',
      spaceName: 'Work',
    });

    scope.stop();
  });

  it('shows loading only on the clicked action while a request is in progress', async () => {
    let resolveRequest: ((value: { status: 'granted' }) => void) | undefined;
    requestAccessMock.mockImplementation(
      () =>
        new Promise<{ status: 'granted' }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { action, scope } = await mountAction({
      operation: 'read',
      spaceName: 'Work',
    });

    const requestPromise = action.grantFullAccess();
    await flushMicrotasks();

    expect(action.isGrantFullAccessLoading.value).toBe(true);
    expect(action.isGrantReadOnlyAccessLoading.value).toBe(false);
    expect(action.isGrantLocalDirectoryAccessDisabled.value).toBe(true);

    resolveRequest?.({ status: 'granted' });
    await requestPromise;

    expect(action.isGrantFullAccessLoading.value).toBe(false);
    expect(action.isGrantReadOnlyAccessLoading.value).toBe(false);

    scope.stop();
  });

  it('keeps a safe denied message and clears it when recovery changes', async () => {
    requestAccessMock.mockResolvedValue({ status: 'denied' });
    const { action, recoveryRef, scope } = await mountAction({
      operation: 'read',
      spaceName: 'Work',
    });

    await action.grantFullAccess();

    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );

    recoveryRef.value = {
      operation: 'read',
      spaceName: 'Archive',
    };
    await flushMicrotasks();

    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Mioframe remembers "Archive", but your browser requires permission before opening it.',
    );

    scope.stop();
  });

  it('returns error without calling the broker when recovery is missing', async () => {
    const { action, scope } = await mountAction(undefined);

    await expect(action.grantFullAccess()).resolves.toEqual({ status: 'error' });
    expect(requestAccessMock).not.toHaveBeenCalled();

    scope.stop();
  });
});
