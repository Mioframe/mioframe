import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';
import type { VfsActivityState } from '@shared/lib/virtualFileSystem';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, effectScope, ref } from 'vue';

const getFileSystemAccessRequestMock = vi.fn();

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      getFileSystemAccessRequest: getFileSystemAccessRequestMock,
    },
  }),
}));

const flushMicrotasks = async () => {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
};

const makeWriteError = (): NonNullable<VfsActivityState['lastError']> => ({
  operationType: 'writeFile',
  path: '/file.txt',
  message: 'write failed',
  occurredAt: 1,
  acknowledged: false,
  cause: new WebFileSystemAccessRequiredError({ mode: 'readwrite', spaceName: 'Work' }),
});

const makeState = (lastError?: VfsActivityState['lastError']): VfsActivityState =>
  lastError ? { status: 'error', activeCount: 0, lastError } : { status: 'idle', activeCount: 0 };

describe('useWriteAccessRecoveryState', () => {
  beforeEach(() => {
    vi.resetModules();
    getFileSystemAccessRequestMock.mockReset();
  });

  afterEach(() => {
    getFileSystemAccessRequestMock.mockReset();
  });

  it('hasWriteAccessRecovery is true when a pending request is confirmed', async () => {
    getFileSystemAccessRequestMock.mockResolvedValue({ operation: 'write', spaceName: 'Work' });

    const { useWriteAccessRecoveryState } = await import('./useWriteAccessRecoveryState');
    const scope = effectScope();
    const state = ref(makeState(makeWriteError()));

    let result: ReturnType<typeof useWriteAccessRecoveryState> | undefined;
    scope.run(() => {
      result = useWriteAccessRecoveryState(computed(() => state.value));
    });

    await flushMicrotasks();

    expect(result?.hasWriteAccessRecovery.value).toBe(true);
    expect(result?.isStaleWriteAccessRequest.value).toBe(false);

    scope.stop();
  });

  it('isStaleWriteAccessRequest is true when no pending request exists', async () => {
    getFileSystemAccessRequestMock.mockResolvedValue(undefined);

    const { useWriteAccessRecoveryState } = await import('./useWriteAccessRecoveryState');
    const scope = effectScope();
    const state = ref(makeState(makeWriteError()));

    let result: ReturnType<typeof useWriteAccessRecoveryState> | undefined;
    scope.run(() => {
      result = useWriteAccessRecoveryState(computed(() => state.value));
    });

    await flushMicrotasks();

    expect(result?.isStaleWriteAccessRequest.value).toBe(true);
    expect(result?.hasWriteAccessRecovery.value).toBe(false);

    scope.stop();
  });

  it('does not apply stale check result when a newer check already resolved', async () => {
    let resolveOldCheck: ((value: undefined) => void) | undefined;
    let resolveNewCheck: ((value: { operation: string; spaceName: string }) => void) | undefined;

    getFileSystemAccessRequestMock
      .mockImplementationOnce(
        () =>
          new Promise<undefined>((resolve) => {
            resolveOldCheck = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<{ operation: string; spaceName: string }>((resolve) => {
            resolveNewCheck = resolve;
          }),
      );

    const { useWriteAccessRecoveryState } = await import('./useWriteAccessRecoveryState');
    const scope = effectScope();
    const state = ref(makeState(makeWriteError()));

    let result: ReturnType<typeof useWriteAccessRecoveryState> | undefined;
    scope.run(() => {
      result = useWriteAccessRecoveryState(computed(() => state.value));
    });

    // Yield so the watch's immediate call (old check) starts
    await Promise.resolve();

    // Trigger a second check (new check)
    void result?.checkPendingRequest();

    // Resolve the newer check first — request exists
    resolveNewCheck?.({ operation: 'write', spaceName: 'Work' });
    await flushMicrotasks();

    expect(result?.hasWriteAccessRecovery.value).toBe(true);

    // Resolve the older check second — no request (stale)
    resolveOldCheck?.(undefined);
    await flushMicrotasks();

    // The stale result must NOT overwrite the newer confirmed state
    expect(result?.hasWriteAccessRecovery.value).toBe(true);
    expect(result?.isStaleWriteAccessRequest.value).toBe(false);

    scope.stop();
  });

  it('does not apply old check result when recovery cause disappears while check is in flight', async () => {
    let resolveOldCheck: ((value: undefined) => void) | undefined;

    getFileSystemAccessRequestMock.mockImplementationOnce(
      () =>
        new Promise<undefined>((resolve) => {
          resolveOldCheck = resolve;
        }),
    );

    const { useWriteAccessRecoveryState } = await import('./useWriteAccessRecoveryState');
    const scope = effectScope();
    const state = ref(makeState(makeWriteError()));

    let result: ReturnType<typeof useWriteAccessRecoveryState> | undefined;
    scope.run(() => {
      result = useWriteAccessRecoveryState(computed(() => state.value));
    });

    // Yield so the watch's immediate call (old check) starts
    await Promise.resolve();

    // Recovery cause disappears — clears state and invalidates the in-flight check
    state.value = makeState();
    await flushMicrotasks();

    expect(result?.hasWriteAccessRecovery.value).toBe(false);
    expect(result?.isStaleWriteAccessRequest.value).toBe(false);

    // Resolve the old in-flight check — result says no request
    resolveOldCheck?.(undefined);
    await flushMicrotasks();

    // The stale result must NOT restore isStaleWriteAccessRequest
    expect(result?.isStaleWriteAccessRequest.value).toBe(false);
    expect(result?.hasWriteAccessRecovery.value).toBe(false);

    scope.stop();
  });

  it('applies the latest result when checks resolve in order', async () => {
    getFileSystemAccessRequestMock
      .mockResolvedValueOnce({ operation: 'write', spaceName: 'Work' })
      .mockResolvedValueOnce(undefined);

    const { useWriteAccessRecoveryState } = await import('./useWriteAccessRecoveryState');
    const scope = effectScope();
    const state = ref(makeState(makeWriteError()));

    let result: ReturnType<typeof useWriteAccessRecoveryState> | undefined;
    scope.run(() => {
      result = useWriteAccessRecoveryState(computed(() => state.value));
    });

    await flushMicrotasks();

    expect(result?.hasWriteAccessRecovery.value).toBe(true);

    void result?.checkPendingRequest();
    await flushMicrotasks();

    expect(result?.isStaleWriteAccessRequest.value).toBe(true);
    expect(result?.hasWriteAccessRecovery.value).toBe(false);

    scope.stop();
  });
});
