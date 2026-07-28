import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const activeRelease = { releaseId: '11111111-1111-4111-8111-111111111111', releaseSequence: 1 };
const descriptor = { releaseId: activeRelease.releaseId, releaseSequence: 1 };

describe('runInstall', () => {
  beforeEach(() => {
    readControllerStateMock.mockReset();
    writeControllerStateMock.mockReset();
    fetchLatestReleasePointerMock.mockReset();
    fetchReleaseDescriptorMock.mockReset();
    prepareReleaseMock.mockReset();
  });

  it('rejects installation when persisted state is structurally invalid', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'invalid' });
    const { runInstall } = await import('./workerInstall');

    await expect(runInstall('stable', '/')).rejects.toThrow(
      'Persisted controller state is invalid',
    );
    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
  });

  it('preserves an existing valid installation completely unchanged: no discovery, no restoration', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'valid', state: { activeRelease } });
    const { runInstall } = await import('./workerInstall');

    await runInstall('stable', '/');

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();
    expect(prepareReleaseMock).not.toHaveBeenCalled();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('prepares and persists the very first managed release for a genuinely fresh install', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(activeRelease);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { runInstall } = await import('./workerInstall');

    await runInstall('stable', '/');

    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptor);
    expect(writeControllerStateMock).toHaveBeenCalledWith(
      'stable',
      expect.objectContaining({ activeRelease }),
    );
  });

  it('rejects installation and never persists partial state when fresh-install preparation fails', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(activeRelease);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockRejectedValue(new Error('download failed'));
    const { runInstall } = await import('./workerInstall');

    await expect(runInstall('stable', '/')).rejects.toThrow('download failed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
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
