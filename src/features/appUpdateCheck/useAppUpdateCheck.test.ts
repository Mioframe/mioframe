import { beforeEach, describe, expect, it, vi } from 'vitest';

const applySnapshotMock = vi.fn();
const checkForAppUpdatesMock = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ applySnapshot: applySnapshotMock }),
}));
vi.mock('@shared/serviceClient/appUpdate/client', () => ({
  checkForAppUpdates: () => checkForAppUpdatesMock(),
}));

describe('useAppUpdateCheck', () => {
  beforeEach(() => {
    applySnapshotMock.mockClear();
    checkForAppUpdatesMock.mockReset();
  });

  it('applies the check result to the entity and tracks isChecking', async () => {
    const snapshot = { mode: 'manual', activeRelease: { releaseId: 'a', releaseSequence: 1 } };
    checkForAppUpdatesMock.mockResolvedValue(snapshot);
    const { useAppUpdateCheck } = await import('./useAppUpdateCheck');
    const { checkForUpdates, isChecking } = useAppUpdateCheck();

    expect(isChecking.value).toBe(false);
    const promise = checkForUpdates();
    expect(isChecking.value).toBe(true);
    await promise;

    expect(isChecking.value).toBe(false);
    expect(applySnapshotMock).toHaveBeenCalledWith(snapshot);
  });

  it('does not start a second check while one is already in flight', async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    checkForAppUpdatesMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    const { useAppUpdateCheck } = await import('./useAppUpdateCheck');
    const { checkForUpdates } = useAppUpdateCheck();

    const first = checkForUpdates();
    const second = checkForUpdates();
    resolveFirst({ mode: 'manual', activeRelease: { releaseId: 'a', releaseSequence: 1 } });
    await Promise.all([first, second]);

    expect(checkForAppUpdatesMock).toHaveBeenCalledTimes(1);
  });
});
