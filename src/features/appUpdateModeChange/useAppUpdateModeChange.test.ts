import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyClientResultMock = vi.fn();
const setAppUpdateModeMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applyClientResult: applyClientResultMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  setAppUpdateMode: (mode: unknown) => setAppUpdateModeMock(mode),
}));

const success = {
  status: 'success' as const,
  value: { mode: 'automatic' as const, activeRelease: { releaseNumber: 1 } },
};

describe('useAppUpdateModeChange', () => {
  beforeEach(() => {
    applyClientResultMock.mockReset();
    setAppUpdateModeMock.mockReset();
  });

  it('keeps finite busy state, suppresses duplicates, and clears a prior outcome for a new mode change', async () => {
    let resolveMode: (result: unknown) => void = () => {};
    setAppUpdateModeMock.mockReturnValue(
      new Promise((resolve) => {
        resolveMode = resolve;
      }),
    );
    const { useAppUpdateModeChange } = await import('./useAppUpdateModeChange');
    const { setMode, isChangingMode, outcome } = useAppUpdateModeChange();

    const first = setMode('automatic');
    const second = setMode('manual');
    expect(isChangingMode.value).toBe(true);
    expect(outcome.value).toBeUndefined();
    expect(setAppUpdateModeMock).toHaveBeenCalledTimes(1);
    expect(setAppUpdateModeMock).toHaveBeenCalledWith('automatic');

    resolveMode({ status: 'timeout' });
    await Promise.all([first, second]);

    expect(applyClientResultMock).toHaveBeenCalledWith({ status: 'timeout' });
    expect(outcome.value).toBe('timeout');
    expect(isChangingMode.value).toBe(false);
  });

  it.each([
    ['success', success],
    ['timeout', { status: 'timeout' as const }],
    ['unavailable', { status: 'unavailable' as const }],
  ])('applies the classified %s result and always clears busy state', async (status, result) => {
    setAppUpdateModeMock.mockResolvedValue(result);
    const { useAppUpdateModeChange } = await import('./useAppUpdateModeChange');
    const { setMode, isChangingMode, outcome } = useAppUpdateModeChange();

    await setMode('automatic');

    expect(setAppUpdateModeMock).toHaveBeenCalledWith('automatic');
    expect(applyClientResultMock).toHaveBeenCalledWith(result);
    expect(outcome.value).toBe(status);
    expect(isChangingMode.value).toBe(false);
  });
});
