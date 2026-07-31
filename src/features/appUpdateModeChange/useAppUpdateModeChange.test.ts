import { describe, expect, it, vi } from 'vitest';

const applySnapshotMock = vi.fn();
const setAppUpdateModeMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applySnapshot: applySnapshotMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  setAppUpdateMode: (mode: unknown) => setAppUpdateModeMock(mode),
}));

describe('useAppUpdateModeChange', () => {
  it('sends the requested mode and applies the result', async () => {
    const snapshot = { mode: 'automatic', activeRelease: { releaseNumber: 1 } };
    setAppUpdateModeMock.mockResolvedValue(snapshot);
    const { useAppUpdateModeChange } = await import('./useAppUpdateModeChange');
    const { setMode, isChangingMode } = useAppUpdateModeChange();

    await setMode('automatic');

    expect(setAppUpdateModeMock).toHaveBeenCalledWith('automatic');
    expect(applySnapshotMock).toHaveBeenCalledWith(snapshot);
    expect(isChangingMode.value).toBe(false);
  });
});
