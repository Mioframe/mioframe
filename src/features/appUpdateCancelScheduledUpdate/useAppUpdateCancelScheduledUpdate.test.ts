import { describe, expect, it, vi } from 'vitest';

const applySnapshotMock = vi.fn();
const cancelScheduledAppUpdateMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applySnapshot: applySnapshotMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  cancelScheduledAppUpdate: () => cancelScheduledAppUpdateMock(),
}));

describe('useAppUpdateCancelScheduledUpdate', () => {
  it('cancels the scheduled update and applies the result', async () => {
    const snapshot = { mode: 'manual', activeRelease: { releaseId: 'a', releaseSequence: 1 } };
    cancelScheduledAppUpdateMock.mockResolvedValue(snapshot);
    const { useAppUpdateCancelScheduledUpdate } =
      await import('./useAppUpdateCancelScheduledUpdate');
    const { cancelScheduledUpdate, isCancelling } = useAppUpdateCancelScheduledUpdate();

    await cancelScheduledUpdate();

    expect(applySnapshotMock).toHaveBeenCalledWith(snapshot);
    expect(isCancelling.value).toBe(false);
  });
});
