import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyClientResultMock = vi.fn();
const cancelScheduledAppUpdateMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applyClientResult: applyClientResultMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  cancelScheduledAppUpdate: () => cancelScheduledAppUpdateMock(),
}));

const success = {
  status: 'success' as const,
  value: { mode: 'manual' as const, activeRelease: { releaseNumber: 1 } },
};

describe('useAppUpdateCancelScheduledUpdate', () => {
  beforeEach(() => {
    applyClientResultMock.mockReset();
    cancelScheduledAppUpdateMock.mockReset();
  });

  it('keeps finite busy state, suppresses duplicates, and clears a prior outcome for a new cancellation', async () => {
    let resolveCancel: (result: unknown) => void = () => {};
    cancelScheduledAppUpdateMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCancel = resolve;
      }),
    );
    const { useAppUpdateCancelScheduledUpdate } =
      await import('./useAppUpdateCancelScheduledUpdate');
    const { cancelScheduledUpdate, isCancelling, outcome } = useAppUpdateCancelScheduledUpdate();

    const first = cancelScheduledUpdate();
    const second = cancelScheduledUpdate();
    expect(isCancelling.value).toBe(true);
    expect(outcome.value).toBeUndefined();
    expect(cancelScheduledAppUpdateMock).toHaveBeenCalledTimes(1);

    resolveCancel({ status: 'timeout' });
    await Promise.all([first, second]);

    expect(applyClientResultMock).toHaveBeenCalledWith({ status: 'timeout' });
    expect(outcome.value).toBe('timeout');
    expect(isCancelling.value).toBe(false);
  });

  it.each([
    ['success', success],
    ['timeout', { status: 'timeout' as const }],
    ['unavailable', { status: 'unavailable' as const }],
  ])('applies the classified %s result and always clears busy state', async (status, result) => {
    cancelScheduledAppUpdateMock.mockResolvedValue(result);
    const { useAppUpdateCancelScheduledUpdate } =
      await import('./useAppUpdateCancelScheduledUpdate');
    const { cancelScheduledUpdate, isCancelling, outcome } = useAppUpdateCancelScheduledUpdate();

    await cancelScheduledUpdate();

    expect(applyClientResultMock).toHaveBeenCalledWith(result);
    expect(outcome.value).toBe(status);
    expect(isCancelling.value).toBe(false);
  });
});
