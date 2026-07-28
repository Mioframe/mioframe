import { describe, expect, it, vi } from 'vitest';

const applySnapshotMock = vi.fn();
const installAppUpdateOnNextLaunchMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applySnapshot: applySnapshotMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  installAppUpdateOnNextLaunch: () => installAppUpdateOnNextLaunchMock(),
}));

describe('useAppUpdateInstallOnNextLaunch', () => {
  it('schedules install-on-next-launch and applies the result', async () => {
    const snapshot = {
      mode: 'manual',
      activeRelease: { releaseId: 'a', releaseSequence: 1 },
      scheduledRelease: { releaseId: 'b', releaseSequence: 2 },
    };
    installAppUpdateOnNextLaunchMock.mockResolvedValue(snapshot);
    const { useAppUpdateInstallOnNextLaunch } = await import('./useAppUpdateInstallOnNextLaunch');
    const { installOnNextLaunch, isInstalling } = useAppUpdateInstallOnNextLaunch();

    await installOnNextLaunch();

    expect(applySnapshotMock).toHaveBeenCalledWith(snapshot);
    expect(isInstalling.value).toBe(false);
  });
});
