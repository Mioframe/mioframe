import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakeCacheStorage } from './fakeCacheStorage.testUtils';

const readControllerStateMock = vi.fn();
const writeControllerStateMock = vi.fn();
const fetchLatestReleasePointerMock = vi.fn();
const fetchReleaseDescriptorMock = vi.fn();
const prepareReleaseMock = vi.fn();

vi.mock('./controllerState', () => ({
  readControllerState: (...args: unknown[]) => readControllerStateMock(...args),
  writeControllerState: (...args: unknown[]) => writeControllerStateMock(...args),
}));
vi.mock('./releasePreparation', () => ({
  fetchLatestReleasePointer: (...args: unknown[]) => fetchLatestReleasePointerMock(...args),
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  prepareRelease: (...args: unknown[]) => prepareReleaseMock(...args),
}));

const { caches: fakeCaches, cachesByName } = createFakeCacheStorage();
vi.stubGlobal('caches', fakeCaches);

const activeRelease = { releaseId: 'release-a', releaseSequence: 1 };
const descriptor = { releaseId: 'release-a', releaseSequence: 1 };

describe('decideInstallAction', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
  });

  it('rejects when persisted state is structurally invalid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'invalid' });
    const { decideInstallAction } = await import('./workerInstall');

    await expect(decideInstallAction('stable', false)).rejects.toThrow(
      'Persisted controller state is invalid',
    );
    await expect(decideInstallAction('stable', true)).rejects.toThrow(
      'Persisted controller state is invalid',
    );
  });

  it('confirms an existing managed install regardless of a previously-active controller', async () => {
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease },
    });
    const { decideInstallAction } = await import('./workerInstall');

    expect(await decideInstallAction('stable', true)).toBe('confirm-existing-managed-install');
    expect(await decideInstallAction('stable', false)).toBe('confirm-existing-managed-install');
  });

  it('prepares a fresh install when no state exists and no worker was previously active', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { decideInstallAction } = await import('./workerInstall');

    expect(await decideInstallAction('stable', false)).toBe('prepare-fresh-install');
  });

  it('defers to the legacy worker when no state exists but a worker was previously active', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { decideInstallAction } = await import('./workerInstall');

    expect(await decideInstallAction('stable', true)).toBe('defer-to-legacy-worker');
  });
});

describe('prepareInitialManagedRelease', () => {
  beforeEach(() => {
    fetchLatestReleasePointerMock.mockReset();
    fetchReleaseDescriptorMock.mockReset();
    prepareReleaseMock.mockReset();
    writeControllerStateMock.mockReset();
  });

  it('fetches, prepares, and persists the initial release only after preparation succeeds', async () => {
    fetchLatestReleasePointerMock.mockResolvedValue(activeRelease);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { prepareInitialManagedRelease } = await import('./workerInstall');

    await prepareInitialManagedRelease('stable', '/');

    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptor);
    expect(writeControllerStateMock).toHaveBeenCalledWith(
      'stable',
      expect.objectContaining({ activeRelease }),
    );
  });

  it('never persists partial state when preparation fails', async () => {
    fetchLatestReleasePointerMock.mockResolvedValue(activeRelease);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockRejectedValue(new Error('download failed'));
    const { prepareInitialManagedRelease } = await import('./workerInstall');

    await expect(prepareInitialManagedRelease('stable', '/')).rejects.toThrow('download failed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });
});

describe('confirmExistingManagedInstall', () => {
  beforeEach(() => {
    cachesByName.clear();
    readControllerStateMock.mockReset();
    fetchReleaseDescriptorMock.mockReset();
    prepareReleaseMock.mockReset();
  });

  it('rejects when persisted state is not valid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    const { confirmExistingManagedInstall } = await import('./workerInstall');

    await expect(confirmExistingManagedInstall('stable', '/')).rejects.toThrow(
      'Persisted controller state is invalid',
    );
  });

  it('does nothing further when the active release is already available', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: { activeRelease } });
    const { buildReleaseCacheNames, writeReleaseDescriptorMarker } = await import('./releaseCache');
    const { final } = buildReleaseCacheNames('stable', activeRelease.releaseId);
    const finalCache = await fakeCaches.open(final);
    await finalCache.put('/assets/app.js', new Response('console.log(1)'));
    await writeReleaseDescriptorMarker(finalCache, {
      schemaVersion: 1,
      releaseId: activeRelease.releaseId,
      releaseSequence: activeRelease.releaseSequence,
      appVersion: '1.0.0',
      buildId: 'b1',
      buildDate: '2026-07-24T00:00:00.000Z',
      indexUrl: '/updates/releases/release-a/index.html',
      files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 14 }],
    });
    const { confirmExistingManagedInstall } = await import('./workerInstall');

    await confirmExistingManagedInstall('stable', '/');

    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();
    expect(prepareReleaseMock).not.toHaveBeenCalled();
  });

  it('restores the active release from the server archive when not locally available', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: { activeRelease } });
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { confirmExistingManagedInstall } = await import('./workerInstall');

    await confirmExistingManagedInstall('stable', '/');

    expect(fetchReleaseDescriptorMock).toHaveBeenCalledWith('/', activeRelease);
    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptor);
  });
});
