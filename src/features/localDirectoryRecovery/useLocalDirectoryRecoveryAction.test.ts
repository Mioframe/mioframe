import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, ref } from 'vue';

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

const mountAction = async (initialErrors: unknown[]) => {
  const scope = effectScope();
  const errorsRef = ref<unknown[]>(initialErrors);
  let action:
    | ReturnType<typeof import('./useLocalDirectoryRecoveryAction').useLocalDirectoryRecoveryAction>
    | undefined;

  const { useLocalDirectoryRecoveryAction } = await import('./useLocalDirectoryRecoveryAction');

  scope.run(() => {
    action = useLocalDirectoryRecoveryAction({
      errors: computed(() => errorsRef.value),
    });
  });

  if (!action) {
    throw new Error('Expected local directory recovery action');
  }

  return {
    action,
    errorsRef,
    scope,
  };
};

describe('useLocalDirectoryRecoveryAction', () => {
  afterEach(() => {
    requestAccessMock.mockReset();
  });

  it('derives read-access recovery from the supplied error candidates', async () => {
    const { action, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    ]);

    expect(action.hasLocalDirectoryRecovery.value).toBe(true);
    expect(action.localDirectoryRecoveryMessage.value).toContain('Work');

    scope.stop();
  });

  it('ignores write-mode access errors and unrelated errors', async () => {
    const { action, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'readwrite', spaceName: 'Work' }),
      new Error('unrelated failure'),
    ]);

    expect(action.hasLocalDirectoryRecovery.value).toBe(false);

    scope.stop();
  });

  it('requests read permission explicitly from the secondary action', async () => {
    requestAccessMock.mockResolvedValue({ status: 'granted' });
    const { action, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    ]);

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
    const { action, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    ]);

    await expect(action.grantFullAccess()).resolves.toEqual({ status: 'granted' });

    expect(requestAccessMock).toHaveBeenCalledWith({
      operation: 'read',
      requestedMode: 'readwrite',
      spaceName: 'Work',
    });

    scope.stop();
  });

  it('disables both actions and exposes truthful pending copy while a request is in progress', async () => {
    let resolveRequest: ((value: { status: 'granted' }) => void) | undefined;
    requestAccessMock.mockImplementation(
      () =>
        new Promise<{ status: 'granted' }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { action, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    ]);

    const requestPromise = action.grantFullAccess();
    await flushMicrotasks();

    expect(action.isGrantLocalDirectoryAccessPending.value).toBe(true);
    expect(action.isGrantLocalDirectoryAccessDisabled.value).toBe(true);
    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Waiting for browser permission. If access is granted, Mioframe will restore this space.',
    );

    await expect(action.grantReadOnlyAccess()).resolves.toEqual({ status: 'error' });
    expect(requestAccessMock).toHaveBeenCalledTimes(1);

    resolveRequest?.({ status: 'granted' });
    await requestPromise;

    expect(action.isGrantLocalDirectoryAccessPending.value).toBe(false);
    expect(action.isGrantLocalDirectoryAccessDisabled.value).toBe(false);
    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Mioframe remembers "Work", but your browser requires permission before opening it.',
    );

    scope.stop();
  });

  it('keeps a safe denied message and clears it when recovery changes', async () => {
    requestAccessMock.mockResolvedValue({ status: 'denied' });
    const { action, errorsRef, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    ]);

    await action.grantFullAccess();

    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );

    errorsRef.value = [createSerializedRecoveryError({ mode: 'read', spaceName: 'Archive' })];
    await flushMicrotasks();

    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Mioframe remembers "Archive", but your browser requires permission before opening it.',
    );

    scope.stop();
  });

  it('does not overwrite new recovery message when a stale request resolves with denied', async () => {
    let resolveRequest: ((value: { status: 'denied' }) => void) | undefined;
    requestAccessMock.mockImplementation(
      () =>
        new Promise<{ status: 'denied' }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { action, errorsRef, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    ]);

    const requestPromise = action.grantFullAccess();
    await flushMicrotasks();

    errorsRef.value = [createSerializedRecoveryError({ mode: 'read', spaceName: 'Archive' })];
    await flushMicrotasks();

    resolveRequest?.({ status: 'denied' });
    await requestPromise;

    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Mioframe remembers "Archive", but your browser requires permission before opening it.',
    );

    scope.stop();
  });

  it('does not overwrite new recovery message when a stale request resolves with error', async () => {
    let resolveRequest: ((value: { status: 'error' }) => void) | undefined;
    requestAccessMock.mockImplementation(
      () =>
        new Promise<{ status: 'error' }>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { action, errorsRef, scope } = await mountAction([
      createSerializedRecoveryError({ mode: 'read', spaceName: 'Work' }),
    ]);

    const requestPromise = action.grantFullAccess();
    await flushMicrotasks();

    errorsRef.value = [createSerializedRecoveryError({ mode: 'read', spaceName: 'Archive' })];
    await flushMicrotasks();

    resolveRequest?.({ status: 'error' });
    await requestPromise;

    expect(action.localDirectoryRecoveryMessage.value).toBe(
      'Mioframe remembers "Archive", but your browser requires permission before opening it.',
    );

    scope.stop();
  });

  it('returns error without calling the broker when recovery is missing', async () => {
    const { action, scope } = await mountAction([]);

    await expect(action.grantFullAccess()).resolves.toEqual({ status: 'error' });
    expect(requestAccessMock).not.toHaveBeenCalled();

    scope.stop();
  });
});
