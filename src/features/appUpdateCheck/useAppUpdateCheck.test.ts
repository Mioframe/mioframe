import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyClientResultMock = vi.fn();
const checkForAppUpdatesMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applyClientResult: applyClientResultMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  checkForAppUpdates: () => checkForAppUpdatesMock(),
}));

const success = {
  status: 'success' as const,
  value: { mode: 'manual' as const, activeRelease: { releaseNumber: 1 } },
};

describe('useAppUpdateCheck', () => {
  beforeEach(() => {
    applyClientResultMock.mockReset();
    checkForAppUpdatesMock.mockReset();
  });

  it('keeps finite busy state, suppresses duplicates, and clears a prior outcome for a new check', async () => {
    let resolveCheck: (result: unknown) => void = () => {};
    checkForAppUpdatesMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCheck = resolve;
      }),
    );
    const { useAppUpdateCheck } = await import('./useAppUpdateCheck');
    const { checkForUpdates, isChecking, outcome } = useAppUpdateCheck();

    const first = checkForUpdates();
    const second = checkForUpdates();
    expect(isChecking.value).toBe(true);
    expect(outcome.value).toBeUndefined();
    expect(checkForAppUpdatesMock).toHaveBeenCalledTimes(1);

    resolveCheck({ status: 'timeout' });
    await Promise.all([first, second]);

    expect(applyClientResultMock).toHaveBeenCalledWith({ status: 'timeout' });
    expect(outcome.value).toBe('timeout');
    expect(isChecking.value).toBe(false);
  });

  it.each([
    ['success', success],
    ['timeout', { status: 'timeout' as const }],
    ['unavailable', { status: 'unavailable' as const }],
  ])('applies the classified %s result and always clears busy state', async (status, result) => {
    checkForAppUpdatesMock.mockResolvedValue(result);
    const { useAppUpdateCheck } = await import('./useAppUpdateCheck');
    const { checkForUpdates, isChecking, outcome } = useAppUpdateCheck();

    await checkForUpdates();

    expect(applyClientResultMock).toHaveBeenCalledWith(result);
    expect(outcome.value).toBe(status);
    expect(isChecking.value).toBe(false);
  });
});
