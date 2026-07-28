import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReleaseDescriptor, ReleaseRef } from './contracts';

const fetchReleaseDescriptorMock = vi.fn();
const prepareReleaseMock = vi.fn();

vi.mock('./releasePreparation', () => ({
  fetchReleaseDescriptor: (...args: unknown[]) => fetchReleaseDescriptorMock(...args),
  prepareRelease: (...args: unknown[]) => prepareReleaseMock(...args),
}));

const releaseA: ReleaseRef = { releaseId: 'release-a', releaseSequence: 1 };
const releaseB: ReleaseRef = { releaseId: 'release-b', releaseSequence: 2 };

function buildDescriptor(release: ReleaseRef): ReleaseDescriptor {
  return {
    schemaVersion: 1,
    releaseId: release.releaseId,
    releaseSequence: release.releaseSequence,
    appVersion: '1.0.0',
    buildId: 'build-1',
    buildDate: '2026-07-24T00:00:00.000Z',
    indexUrl: `/updates/releases/${release.releaseId}/index.html`,
    files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
  };
}

const descriptorA = buildDescriptor(releaseA);
const descriptorB = buildDescriptor(releaseB);

describe('createPreparationCoordinator', () => {
  beforeEach(() => {
    fetchReleaseDescriptorMock.mockReset();
    prepareReleaseMock.mockReset();
  });

  it('prepares a release by fetching its descriptor then preparing it', async () => {
    fetchReleaseDescriptorMock.mockResolvedValue(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const result = await coordinator.prepare('stable', '/', releaseA);

    expect(result).toBe(descriptorA);
    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptorA);
  });

  it('deduplicates concurrent prepare calls for the same release id', async () => {
    let resolveFetch: (value: ReleaseDescriptor) => void = () => {};
    fetchReleaseDescriptorMock.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const first = coordinator.prepare('stable', '/', releaseA);
    const second = coordinator.prepare('stable', '/', releaseA);
    resolveFetch(descriptorA);
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toBe(descriptorA);
    expect(secondResult).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(1);
    expect(prepareReleaseMock).toHaveBeenCalledTimes(1);
  });

  it('does not deduplicate different release ids', async () => {
    fetchReleaseDescriptorMock.mockImplementation((_base: string, target: ReleaseRef) =>
      target.releaseId === releaseA.releaseId ? descriptorA : descriptorB,
    );
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    const [a, b] = await Promise.all([
      coordinator.prepare('stable', '/', releaseA),
      coordinator.prepare('stable', '/', releaseB),
    ]);

    expect(a).toBe(descriptorA);
    expect(b).toBe(descriptorB);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
  });

  it('allows a fresh retry after a failed preparation, rather than replaying the rejection', async () => {
    fetchReleaseDescriptorMock
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(descriptorA);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { createPreparationCoordinator } = await import('./preparationCoordinator');
    const coordinator = createPreparationCoordinator();

    await expect(coordinator.prepare('stable', '/', releaseA)).rejects.toThrow('network down');
    const retried = await coordinator.prepare('stable', '/', releaseA);

    expect(retried).toBe(descriptorA);
    expect(fetchReleaseDescriptorMock).toHaveBeenCalledTimes(2);
  });
});
