import { beforeEach, describe, expect, it, vi } from 'vitest';

const applyClientResultMock = vi.fn();
const installAppUpdateOnNextLaunchMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applyClientResult: applyClientResultMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  installAppUpdateOnNextLaunch: () => installAppUpdateOnNextLaunchMock(),
}));

const success = {
  status: 'success' as const,
  value: { mode: 'manual' as const, activeRelease: { releaseNumber: 1 } },
};

describe('useAppUpdateInstallOnNextLaunch', () => {
  beforeEach(() => {
    applyClientResultMock.mockReset();
    installAppUpdateOnNextLaunchMock.mockReset();
  });

  it('keeps finite busy state, suppresses duplicates, and clears a prior outcome for a new install', async () => {
    let resolveInstall: (result: unknown) => void = () => {};
    installAppUpdateOnNextLaunchMock.mockReturnValue(
      new Promise((resolve) => {
        resolveInstall = resolve;
      }),
    );
    const { useAppUpdateInstallOnNextLaunch } = await import('./useAppUpdateInstallOnNextLaunch');
    const { installOnNextLaunch, isInstalling, outcome } = useAppUpdateInstallOnNextLaunch();

    const first = installOnNextLaunch();
    const second = installOnNextLaunch();
    expect(isInstalling.value).toBe(true);
    expect(outcome.value).toBeUndefined();
    expect(installAppUpdateOnNextLaunchMock).toHaveBeenCalledTimes(1);

    resolveInstall({ status: 'timeout' });
    await Promise.all([first, second]);

    expect(applyClientResultMock).toHaveBeenCalledWith({ status: 'timeout' });
    expect(outcome.value).toBe('timeout');
    expect(isInstalling.value).toBe(false);
  });

  it.each([
    ['success', success],
    ['timeout', { status: 'timeout' as const }],
    ['unavailable', { status: 'unavailable' as const }],
  ])('applies the classified %s result and always clears busy state', async (status, result) => {
    installAppUpdateOnNextLaunchMock.mockResolvedValue(result);
    const { useAppUpdateInstallOnNextLaunch } = await import('./useAppUpdateInstallOnNextLaunch');
    const { installOnNextLaunch, isInstalling, outcome } = useAppUpdateInstallOnNextLaunch();

    await installOnNextLaunch();

    expect(applyClientResultMock).toHaveBeenCalledWith(result);
    expect(outcome.value).toBe(status);
    expect(isInstalling.value).toBe(false);
  });
});
