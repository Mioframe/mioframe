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

const latestPointer = { releaseNumber: 1 };
const descriptor = {
  schemaVersion: 1,
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
  indexSha256: '0'.repeat(64),
  indexByteSize: 10,
  files: [{ path: 'assets/app.js', sha256: '0'.repeat(64), byteSize: 3 }],
};
const activeReleaseSummary = {
  releaseNumber: 1,
  appVersion: '1.0.0',
  buildId: 'build-1',
  buildDate: '2026-07-24T00:00:00.000Z',
};

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
    readControllerStateMock.mockResolvedValue({
      status: 'valid',
      state: { activeRelease: activeReleaseSummary },
    });
    const { runInstall } = await import('./workerInstall');

    await runInstall('stable', '/');

    expect(fetchLatestReleasePointerMock).not.toHaveBeenCalled();
    expect(fetchReleaseDescriptorMock).not.toHaveBeenCalled();
    expect(prepareReleaseMock).not.toHaveBeenCalled();
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });

  it('prepares and persists the very first managed release for a genuinely fresh install', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { runInstall } = await import('./workerInstall');

    await runInstall('stable', '/');

    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptor);
    expect(writeControllerStateMock).toHaveBeenCalledWith(
      'stable',
      expect.objectContaining({ activeRelease: activeReleaseSummary }),
    );
  });

  it('rejects installation and never persists partial state when fresh-install preparation fails', async () => {
    readControllerStateMock.mockResolvedValue({ status: 'absent' });
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
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
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockResolvedValue(undefined);
    const { prepareInitialManagedRelease } = await import('./workerInstall');

    await prepareInitialManagedRelease('stable', '/');

    expect(prepareReleaseMock).toHaveBeenCalledWith('/', 'stable', descriptor);
    expect(writeControllerStateMock).toHaveBeenCalledWith(
      'stable',
      expect.objectContaining({ activeRelease: activeReleaseSummary }),
    );
  });

  it('never persists partial state when preparation fails', async () => {
    fetchLatestReleasePointerMock.mockResolvedValue(latestPointer);
    fetchReleaseDescriptorMock.mockResolvedValue(descriptor);
    prepareReleaseMock.mockRejectedValue(new Error('download failed'));
    const { prepareInitialManagedRelease } = await import('./workerInstall');

    await expect(prepareInitialManagedRelease('stable', '/')).rejects.toThrow('download failed');
    expect(writeControllerStateMock).not.toHaveBeenCalled();
  });
});
